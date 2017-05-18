""" GoogleCharts View
"""
import hashlib
import json
import logging
import re
from cStringIO import StringIO
from copy import deepcopy
from PIL import Image

import lxml.etree

from Products.CMFCore.utils import getToolByName
from Products.Five.browser import BrowserView
from eventlet.green import urllib2
from zope.component import getUtility
from zope.component import queryAdapter, getMultiAdapter
from zope.component import queryUtility
from zope.event import notify
from zope.schema.interfaces import IVocabularyFactory
from eea.app.visualization.controlpanel.interfaces import IDavizSettings
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.app.visualization.views.view import ViewForm
from eea.app.visualization.zopera import IFolderish
from eea.converter.interfaces import IConvert, IWatermark
from eea.googlecharts.cache import InvalidateCacheEvent
from eea.googlecharts.config import EEAMessageFactory as _

logger = logging.getLogger('eea.googlecharts')


class View(ViewForm):
    """ GoogleChartsView
    """
    label = _('Charts')
    view_name = "googlechart.googlecharts"

    @property
    def jquery_src(self):
        """ returns available jquery source href
        """
        src = '++resource++eea.jquery.js'

        possible_resources = (
            'jquery.js',
            '++resource++plone.app.jquery.js',
        )

        for res in possible_resources:
            try:
                self.context.restrictedTraverse(res)
                return res
            except Exception, err:
                logger.debug(err)
                continue
        return src

    @property
    def siteProperties(self):
        """ Persistent utility for site_properties
        """
        ds = queryUtility(IDavizSettings)
        return ds.settings if ds else {}

    def qr_position(self):
        """ Position of QR Code
        """
        sp = self.siteProperties
        return sp.get('googlechart.qrcode_position', 'Disabled')

    def qr_size(self):
        """ Size of QR Code
        """
        sp = self.siteProperties
        size = sp.get('googlechart.qrcode_size', '70')
        if size == '0':
            size = '70'
        return size

    def wm_position(self):
        """ Position of Watermark
        """
        sp = self.siteProperties
        return sp.get('googlechart.watermark_position', 'Disabled')

    def wm_path(self):
        """ Path to Watermark Image
        """
        sp = self.siteProperties
        return sp.get('googlechart.watermark_image', '')

    def qr_iframe_settings(self):
        """ iframe settings of qrcode
        """
        sp = self.siteProperties
        return json.dumps({
            'hide':sp.get('googlechart.qrcode_hide_on_iframe', False),
            'resize':sp.get('googlechart.qrcode_resize_on_iframe', False),
            'size':sp.get('googlechart.qrcode_size_on_iframe', '0')
        })

    def wm_iframe_settings(self):
        """ watermark settings of qrcode
        """
        sp = self.siteProperties
        return json.dumps({
            'hide':sp.get('googlechart.watermark_hide_on_iframe', False),
            'resize':sp.get('googlechart.watermark_resize_on_iframe', False),
            'size':sp.get('googlechart.watermark_size_on_iframe', '0')
        })

    def get_maintitle(self):
        """ Main title of visualization
        """
        return re.escape(self.context.title)

    def get_named_data(self, config_name, key='', default=None):
        """ Named data
        """
        if default is None:
            default = []

        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googlecharts')

        config = view.get(config_name, None)
        if config is None:
            return default

        if key:
            return config.get(key, default)

        return config

    def get_all_notes(self):
        """ Retrieve all notes
        """
        return self.get_named_data('chartsconfig', 'notes')

    def get_all_notes_json(self):
        """ Retrieve all notes in json format
        """
        return json.dumps(self.get_all_notes())

    def get_charts(self):
        """ Charts
        """
        return self.get_named_data('chartsconfig', 'charts')

    def get_charts_json(self):
        """ Charts as JSON
        """
        return json.dumps(self.get_charts())

    def get_visible_charts(self):
        """ Return only visible charts
        """
        return [chart for chart in self.get_charts()
                if not chart.get('hidden', False)]

    def get_columns(self):
        """ Columns
        """
        vocab = getUtility(IVocabularyFactory,
                               name="eea.daviz.vocabularies.FacetsVocabulary")
        terms = [[term.token, term.title] for term in vocab(self.context)]
        return json.dumps(dict(terms))

    def skipDavizTitle(self):
        """ Return if should skip the daviz title
        """
        skipDavizTitle = self.request.get("skipdaviztitle", 'false')
        return skipDavizTitle

    def skipChartTitle(self):
        """ Return if should skip the chart title
        """
        skipChartTitle = self.request.get("skipcharttitle", 'false')
        return skipChartTitle

    def get_rows(self):
        """ Rows
        """
        result = getMultiAdapter((self.context, self.request),
                                 name="daviz.json")()
        return result

    def get_full_chart(self):
        """ Full chart
        """
        chart = {}
        chart['json'] = self.request['json']
        chart['options'] = self.request['options']
        chart['name'] = self.request['name']
        chart['width'] = self.request['width']
        chart['height'] = self.request['height']
        chart['columns'] = self.request['columns']
        chart['data'] = self.get_rows()
        chart['available_columns'] = self.get_columns()
        chart['filters'] = self.request.get("filters", {})
        chart['filterposition'] = self.request.get("filterposition", 0)
        return chart

    def get_chart_settings(self, chart_settings, padding):
        """ Return processed chart_settings
        """
        if padding == 'auto':
            return chart_settings

        new_settings = deepcopy(chart_settings)
        options = new_settings.get('options')
        c_height = int(new_settings.get('height'))
        c_width = int(new_settings.get('width'))
        req_width = int(new_settings.get('chartWidth'))
        req_height = int(new_settings.get('chartHeight'))
        if options:
            options = json.loads(options)
            ca_options = options.get('chartArea', {})
            ca_width = 0.0
            ca_height = 0.0
            if ca_options:
                if padding == 'fixed':
                    # get original dimensions of the chartArea and padding in %
                    ca_height = float(ca_options.get('height').split('%')[0])
                    ca_width = float(ca_options.get('width').split('%')[0])
                    top_p = float(ca_options.get('top').split('%')[0])
                    left_p = float(ca_options.get('left').split('%')[0])

                    # convert to px
                    ca_height = (c_height * ca_height) / 100
                    ca_width = (c_width * ca_width) / 100
                    top_p = (c_height * top_p) / 100
                    left_p = (c_width * left_p) / 100

                    # substract right padding and bottom padding
                    right_p = c_width - ca_width - left_p
                    bottom_p = c_height - ca_height - top_p
                    ca_width = req_width - right_p - left_p
                    ca_height = req_height - bottom_p - top_p

            if padding != 'fixed':
                try:
                    top_p, right_p, bottom_p, left_p = padding.split(',')
                except ValueError:
                    top_p, right_p, bottom_p, left_p = [0, 0, 0, 0]
                ca_height = req_height - float(top_p) - float(bottom_p)
                ca_width = req_width - float(right_p) - float(left_p)
                left_p = float(left_p)
                top_p = float(top_p)

            if ca_width + ca_height > 0:
                if ca_height < 100:
                    ca_height = 100.0
                if ca_width < 100:
                    ca_width = 100.0

                # convert new dimensions in % for the required width/height
                width = (100 * ca_width) / req_width
                height = (100 * ca_height) / req_height
                left = (100 * left_p) / req_width
                top = (100 * top_p) / req_height

                ca_options['width'] = unicode(width) + u'%'
                ca_options['height'] = unicode(height) + u'%'
                ca_options['top'] = unicode(top) + u'%'
                ca_options['left'] = unicode(left) + u'%'

                options['chartArea'] = ca_options
            new_settings['options'] = json.dumps(options)

            return new_settings

        return chart_settings

    def get_chart(self):
        """ Get chart
        """
        chart_id = self.request.get('chart')
        charts = self.get_charts()
        chart_settings = {}
        for chart in charts:
            if chart['id'] == chart_id:
                chart_settings = chart
                chart_settings['chart_id'] = chart_id

        # on empty chart id or wrong chart id, return first chart
        if not chart_settings:
            chart = charts[0]
            chart_settings = chart
            chart_settings['chart_id'] = chart['id']
            self.request.set('chart', chart['id'])  # it is used in template

        if chart_settings:
            chart_settings['data'] = self.get_rows()
            chart_settings['available_columns'] = self.get_columns()

        chartWidth = self.request.get("chartWidth", chart_settings["width"])
        chartHeight = self.request.get("chartHeight", chart_settings["height"])
        skipDavizTitle = self.request.get("skipdaviztitle", 'false')
        skipChartTitle = self.request.get("skipcharttitle", 'false')

        chart_settings['chartWidth'] = chartWidth
        chart_settings['chartHeight'] = chartHeight
        chart_settings['skipDavizTitle'] = skipDavizTitle
        chart_settings['skipChartTitle'] = skipChartTitle

        padding = self.request.get("padding", "fixed")
        if not self.isInline():
            return self.get_chart_settings(chart_settings, padding)
        return chart_settings

    def get_chart_json(self):
        """Chart as JSON
        """
        chart_id = self.request['chart']
        charts = self.get_charts()
        for chart in charts:
            if chart.get('id') == chart_id:
                return json.dumps([chart])

    def get_chart_png_or_svg(self, chart_type):
        """Chart as JSON
        """
        tag = self.request.get('tag', False)
        safe = self.request.get('safe', True)
        chart_id = self.request.get('chart', '')

        scale = None
        if '/image_' in chart_id:
            chart_id, scale = chart_id.split('/')
            chart_type = '.png'

        charts = self.get_charts()

        for chart in charts:
            if chart.get('id') != chart_id:
                continue

            if chart.get('hasPNG', False):
                name = chart.get('id', '')
                img = self.context.get(name + chart_type, None)
                if not img:
                    chart_type = '.png'
                    img = self.context.get(name + chart_type, None)

                if scale is not None:
                    scale = img.restrictedTraverse(scale, None)
                    if scale:
                        return scale.index_html(
                            self.request, self.request.response)


                if chart_type == '.svg':
                    svg_str = img.get_data()
                    svg_obj = lxml.etree.fromstring(svg_str)
                    svg_obj.set("xmlns", "http://www.w3.org/2000/svg")
                    svg_str = lxml.etree.tostring(svg_obj)
                    self.request.response.setHeader('content-type',
                                                    'image/svg+xml')
                    return svg_str

            else:
                if not safe:
                    return ''
                config = json.loads(chart.get('config', '{}'))
                chartType = config.get('chartType', '')
                img = "googlechart." + chartType.lower() + ".preview.png"
                img = self.context.restrictedTraverse(img)

                if scale is not None:
                    scale = img.restrictedTraverse(scale, None)
                    if scale:
                        return scale.index_html(
                            self.request, self.request.response)

            if tag:
                return img.tag(width='100%', height="auto")

            self.request.response.setHeader('content-type', 'image/png')
            return img.index_html(self.request, self.request.response)

        return ''

    def get_chart_png(self):
        """ get the png version of the chart
        """
        return self.get_chart_png_or_svg(".png")

    def get_chart_svg(self):
        """ get the svg version of the chart
        """
        return self.get_chart_png_or_svg(".svg")

    def get_dashboard_png(self):
        """ Dashboard png
        """
        tag = self.request.get('tag', False)
        safe = self.request.get('safe', True)

        if not safe:
            return ''

        png = self.context["googlechart.googledashboard.preview.png"]
        if tag:
            return png.tag(width="100%", height="auto")

        self.request.response.setHeader('content-type', 'image/png')
        return png.index_html(self.request, self.request.response)

    def get_customstyle(self):
        """ Get custom style for embed
        """
        return self.request.get("customStyle", "")

    def get_dashboards(self):
        """ Dashboards
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        config = ''
        for view in mutator.views:
            if view.get('name') == 'googlechart.googledashboards':
                config = view.get('dashboards')
        return json.dumps(config)

    def get_dashboard(self):
        """ Dashboard
        """
        dashboard_id = \
            self.request.get('dashboard', 'googlechart.googledashboard')
        dashboards = json.loads(self.get_dashboards())
        for dashboard in dashboards:
            if dashboard.get('name') == dashboard_id:
                return json.dumps(dashboard)

    def get_dashboard_embed(self):
        """
        :return: dashboard settings as python dict
        :rtype:  dict
        """
        return json.loads(self.get_dashboard())

    def get_dashboard_js(self, chart):
        """ Dashboard
        """
        return json.dumps(chart.get('dashboard', {}))

    def get_columnfilters_js(self, chart):
        """ column filters
        """
        return json.dumps(chart.get('columnfilters', []))

    def get_sortFilter(self, chart):
        """ Sort filter settings
        """
        return chart.get('sortFilter', '__disabled__')

    def get_unpivotSettings(self, chart):
        """ Settings for unpivot
        """
        return json.dumps(chart.get('unpivotsettings', {}))

    @property
    def tabs(self):
        """ Tabs in view mode
        """
        tabs = []
        for chart in self.get_visible_charts():
            name = chart.get('id', '')
            title = chart.get('name', '')
            config = json.loads(chart.get('config', '{}'))
            chartType = config.get('chartType', '')
            tab = {
                'name': name,
                'title': title,
                'css': 'googlechart_class_%s' % chartType,
                'tabname': 'tab-%s' % name.replace('.', '-'),
            }
            qr_url = '%s?cht=qr&chld=H|0&chs=%sx%s&chl=%s%s%s' \
                % ("https://chart.apis.google.com/chart",
                    self.qr_size(),
                    self.qr_size(),
                    self.context.absolute_url(),
                    "%23",
                    name)
            qr_img = {"position": self.qr_position(),
                    "img" : qr_url}

            wm_img = {"position": self.wm_position(),
                    "img" : self.wm_path()}
            tab['extra_images'] = []
            if qr_img['position'] != 'Disabled':
                tab['extra_images'].append(qr_img)
            if wm_img['position'] != 'Disabled':
                tab['extra_images'].append(wm_img)
            for img in tab['extra_images']:
                if img['position'].find("Right") != -1:
                    img['alignment'] = 'Right'
                else:
                    img['alignment'] = 'Left'
                if img['position'].find("Bottom") != -1:
                    img['position'] = 'Bottom'
                else:
                    img['position'] = 'Top'
            if chart.get('hasPNG', False):
                tab['fallback-image'] = \
                    self.context.absolute_url() + "/" + name + ".png"
                hasSVG = self.context.get(name + ".svg", False)
                if hasSVG:
                    tab['fallback-image'] = \
                        self.context.absolute_url() + \
                            "/embed-chart.svg?chart=" + name
                tab['realchart'] = True
            else:
                tab['fallback-image'] = \
                    self.context.absolute_url() + \
                    "/googlechart." + chartType.lower() + \
                    ".preview.png"
            tabs.append(tab)
        return tabs

    def get_iframe_chart(self):
        """ Get chart for iframe
        """
        chart_id = self.request.get("chart", '')

        tmp_id = self.request.get("preview_id", "")
        chart_preview_interactive = self.request.get('interactive', 'true')
        chart_preview_columns = self.request.get('columns', '[]')
        chart_preview_options = self.request.get('options', '{}')
        chart_preview_filters = self.request.get('filters', '{}')
        chart_preview_possibleLabels = self.request.get('possibleLabels', '{}')
        if tmp_id:
            mutator = queryAdapter(self.context, IVisualizationConfig)
            data = mutator.view('googlechart.googlecharts')
            config = data['chart_previews'][tmp_id]
            config['data'] = self.get_rows()
            config['available_columns'] = self.get_columns()
            config['preview_width'] = config['width']
            config['preview_height'] = config['height']
            config['preview_interactive'] = chart_preview_interactive
            config['preview_columns'] = chart_preview_columns
            config['preview_options'] = chart_preview_options
            config['preview_filters'] = chart_preview_filters
            config['preview_possibleLabels'] = chart_preview_possibleLabels
            return config

        else:
            chart_width = self.request.get('width', 800)
            chart_height = self.request.get('height', 600)
            config = {}

            charts = self.get_charts()
            found = False
            for chart in charts:
                if chart['id'] == chart_id:
                    found = True
                    config = chart
                    config['chart_id'] = chart_id
                    config['json'] = config.get('config', '{}')
                    config['row_filters_str'] = config.get('row_filters', '{}')
                    config['sortAsc_str'] = config.get('sortAsc', '')
            if not found:
                config = {}
                config['name'] = ""
                config['chart_id'] = ""
                config['json'] = ""
                config['columns'] = ""
                config['options'] = ""
            config['preview_width'] = chart_width
            config['preview_height'] = chart_height
            config['data'] = self.get_rows()
            config['available_columns'] = self.get_columns()
            config['preview_interactive'] = chart_preview_interactive
            config['preview_columns'] = chart_preview_columns
            config['preview_options'] = chart_preview_options
            config['preview_filters'] = chart_preview_filters
            config['preview_possibleLabels'] = chart_preview_possibleLabels
            return config

    def get_visualization_hash(self):
        """ unique hash of a chart or dashboard
        """
        v_id = self.request.get("chart", "")
        if v_id == "":
            v_id = self.request.get("dashboard", "dashboard")
        path = self.context.absolute_url()+"/"+v_id
        return hashlib.md5(path).hexdigest()

    def isInline(self):
        """ iframe embed or inline embed
        """
        inline = self.request.get("inline", "")
        if inline == "inline":
            return True
        return False

    def embed_inline(self, chart):
        """ inline embed for charts and dashboards
        """
        if chart == "":
            return ""
        view = ""

        if "dashboard" in chart:
            self.request['chart'] = ''
            self.request['dashboard'] = chart
            self.request['inline'] = 'inline'
            view = "embed-dashboard"
        else:
            self.request['chart'] = chart
            self.request['dashboard'] = ""
            self.request['inline'] = 'inline'
            view = "embed-chart"
        return getMultiAdapter((self.context, self.request), name=view)()

    def get_backward_relation(self, ptype):
        """
        :param ptype: Name of Portal Type to search for backward relations
        :type ptype:  string
        :return: First found relation that matched the Portal Type
        :rtype: object
        """
        relation_view = self.context.unrestrictedTraverse(
            '@@eea.relations.macro', None)
        if not relation_view:
            return None
        backword_relations = relation_view.backward()
        for relation in backword_relations:
            obj = relation[1][0]
            if obj.portal_type == ptype:
                return obj
        return None


    # it appears that this method is not used anywhere
    #def get_notes(self, chart_id):
    #    """ get the notes for charts or dashboards
    #    """
    #    if 'dashboard' in chart_id:
    #        dashboards = json.loads(self.get_dashboards())
    #        for dashboard in dashboards:
    #            if dashboard['name'] == chart_id:
    #                notes = []
    #                for widget in dashboard.get('widgets', []):
    #                    if widget.get('wtype','') == \
    #                        'googlecharts.widgets.textarea' and \
    #                        not widget.get('dashboard',{}).get('hidden', True):

    #                        note = {}
    #                        note['title'] = widget.get('title', '')
    #                        note['text']  = widget.get('text', '')
    #                        notes.append(note)
    #                return notes
    #    else:
    #        charts = self.get_charts()
    #        for chart in charts:
    #            if chart.get('id') == chart_id:
    #                return chart.get('notes', [])
    #    return []

def applyWatermark(img, wm, position, verticalSpace, horizontalSpace, opacity):
    """ Calculate position of watermark and place it over the original image
    """
    watermark = getUtility(IWatermark)
    pilImg = Image.open(StringIO(img))
    pilWM = Image.open(StringIO(wm))
    pos = (0, 0)
    if position == 'Top Left':
        pos = (horizontalSpace, verticalSpace)
    if position == 'Top Right':
        pos = (pilImg.size[0] - pilWM.size[0] - horizontalSpace,
                verticalSpace)
    if position == 'Bottom Left':
        pos = (horizontalSpace,
                pilImg.size[1] - pilWM.size[1] - verticalSpace)
    if position == 'Bottom Right':
        pos = (pilImg.size[0] - pilWM.size[0] - horizontalSpace,
                pilImg.size[1] - pilWM.size[1] - verticalSpace)
    pilImg = watermark.placeWatermark(pilImg, pilWM, pos, opacity)

    op = StringIO()
    pilImg.save(op, 'png')
    img = op.getvalue()
    op.close()
    return img


class Export(BrowserView):
    """ Export chart to png
    """
    @property
    def siteProperties(self):
        """ Persistent utility for site_properties
        """
        ds = queryUtility(IDavizSettings)
        return ds.settings

    def __call__(self, **kwargs):
        form = getattr(self.request, 'form', {})
        kwargs.update(form)

        convert = getUtility(IConvert)
        svg = kwargs.get('svg', '')
        # Fix for IE inserting double " in some svg attributes"
        svg = re.sub(r"url\(&quot;(.*?)&quot;\)", r'url(\1)', svg)
        filename = kwargs.get('filename', 'export')
        img = None

        if kwargs.get('export_fmt') == 'svg' and svg != '':
            return self.export_svg(svg, filename)

        if svg != '':
            img = convert(
                data=svg,
                data_from='svg',
                data_to='png'
            )
        if kwargs.get('imageChart_url', '') != '':
            try:
                img_con = urllib2.urlopen(
                    kwargs.get('imageChart_url'), timeout=10
                )
                img = img_con.read()
                img_con.close()
            except Exception:
                img = None

        if not img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")

        sp = self.siteProperties
        qrPosition = sp.get(
                    'googlechart.qrcode_position', 'Disabled')
        qrVertical = int(sp.get(
                    'googlechart.qrcode_vertical_space_for_png_export', 0))
        qrHorizontal = int(sp.get(
                    'googlechart.qrcode_horizontal_space_for_png_export', 0))
        wmPath = sp.get(
                    'googlechart.watermark_image', '')
        wmPosition = sp.get(
                    'googlechart.watermark_position', 'Disabled')
        wmVertical = int(sp.get(
                    'googlechart.watermark_vertical_space_for_png_export', 0))
        wmHorizontal = int(sp.get(
                    'googlechart.watermark_horizontal_space_for_png_export', 0))

        shiftSecondImg = False
        hShift = 0
        if qrPosition == wmPosition:
            shiftSecondImg = True

        if qrPosition != 'Disabled':
            qr_con = urllib2.urlopen(kwargs.get('qr_url'), timeout=10)
            qr_img = qr_con.read()
            qr_con.close()
            img = applyWatermark(img,
                                qr_img,
                                qrPosition,
                                qrVertical,
                                qrHorizontal,
                                0.7)
            if shiftSecondImg:
                hShift = Image.open(StringIO(qr_img)).size[0] + qrHorizontal

        if wmPosition != 'Disabled':
            try:
                wm_con = urllib2.urlopen(wmPath, timeout=10)
                wm_img = wm_con.read()
                wm_con.close()
                img = applyWatermark(img,
                                wm_img,
                                wmPosition,
                                wmVertical,
                                wmHorizontal + hShift,
                                0.7)
            except ValueError, err:
                logger.exception(err)
            except Exception, err:
                logger.exception(err)

        ctype = kwargs.get('type', 'image/png')

        self.request.response.setHeader('content-type', ctype)
        self.request.response.setHeader(
            'content-disposition',
            'attachment; filename="%s.png"' % filename
        )
        return img

    def export_svg(self, svg, filename):
        """export to svg
        """
        ctype = 'image/svg+xml'

        self.request.response.setHeader('content-type', ctype)
        self.request.response.setHeader(
            'content-disposition',
            'attachment; filename="%s.svg"' % filename
        )
        return svg

    def cleanup_thumbs(self):
        """remove old thumbnails
        """
        form = getattr(self.request, 'form', {})
        charts = form.get("charts_assets", [])
        if charts:
            charts = charts.split(",")

        thumbs_to_delete = self.context.objectIds()
        # 68199 remove images only if they are no longer
        # referenced which happens only if you delete a chart
        old_thumbs = list(set(thumbs_to_delete).difference(charts))

        if old_thumbs:
            self.context.manage_delObjects(old_thumbs)
            notify(InvalidateCacheEvent(self.context))


class SavePNGChart(Export):
    """ Save png version of chart, including qr code and watermark
    """

    def save_svg_and_png(self, kwargs):
        """ Save png out of the svg version of the chart
        """
        if not IFolderish.providedBy(self.context):
            return _("Can't save png chart on a non-folderish object !")
        form = getattr(self.request, 'form', {})
        kwargs.update(form)
        filename = kwargs.get('filename', 'img')
        chart_url = self.context.absolute_url() + "#" + "tab-" + filename
        svg_filename = filename + ".svg"
        filename += ".png"
        sp = self.siteProperties
        qr_size = sp.get('googlechart.qrcode_size', '70')
        object_ids = self.context.objectIds()
        if qr_size == '0':
            qr_size = '70'
        qr_url = (
            u"https://chart.apis.google.com"
            "/chart?cht=qr&chld=H|0&chs=%sx%s&chl=%s" % (
                qr_size, qr_size, urllib2.quote(chart_url)))
        self.request.form['qr_url'] = qr_url
        svg_data = kwargs.get('svg', '')
        if not svg_data:
            return _("Success")
        new_svg = False
        if svg_filename not in object_ids:
            new_svg = True
            svg_filename = self.context.invokeFactory('File', id=svg_filename)
        svg_obj = self.context._getOb(svg_filename)
        svg_file_field = svg_obj.getField('file')
        svg_field_data = svg_file_field.getRaw(svg_obj).getIterator().read()
        if svg_field_data and svg_data == svg_field_data:
            return _("Success")
        elif svg_field_data:
            # 21894 svg_data from the form and the data saved within the current
            # svg files sometimes has the clipPath id number changed, otherwise
            # the files are identical in which case we no longer need to perform
            # any svg and image generation
            pattern = re.compile(r'_ABSTRACT_RENDERER_ID_\d+')
            # 79908 check if we have a result for pattern search
            pattern_match = pattern.search(svg_data)
            if pattern_match:
                svg_data_match = pattern_match.group()
                svg_field_data_matched = pattern.sub(svg_data_match,
                                                     svg_field_data)
                if svg_data == svg_field_data_matched:
                    return _("Success")
        # create image from the current svg
        img = super(SavePNGChart, self).__call__()
        # 79908 check if img return has PNG within the string
        # as img can contain ERROR message in case of an error
        # which means the image will contain a string instead of actual
        # image data
        if not img or img and 'PNG' not in img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")
        new_file = False
        if filename not in object_ids:
            new_file = True
            filename = self.context.invokeFactory('Image', id=filename)
        img_obj = self.context._getOb(filename)
        if new_file:
            img_obj.setExcludeFromNav(True)
        image_field = img_obj.getField('image')
        image_field.getMutator(img_obj)(img)
        if new_svg:
            svg_obj.setExcludeFromNav(True)
        svg_file_field.getMutator(svg_obj)(svg_data)

        wftool = getToolByName(svg_obj, "portal_workflow")
        state = wftool.getInfoFor(svg_obj, 'review_state', None)
        if state:
            if state != 'visible':
                workflows = wftool.getWorkflowsFor(svg_obj)
                workflow = workflows[0]
                transitions = workflow.transitions
                available_transitions = [transitions[i['id']] for i in
                                    wftool.getTransitionsFor(svg_obj)]

                to_do = [k for k in available_transitions
                         if k.new_state_id == 'published']

                self.request.form['_no_emails_'] = True
                for item in to_do:
                    workflow.doActionFor(svg_obj, item.id)
                    break
                # then make it public draft
                available_transitions = [transitions[i['id']] for i in
                                        wftool.getTransitionsFor(svg_obj)]

                to_do = [k for k in available_transitions
                         if k.new_state_id == 'visible']

                for item in to_do:
                    workflow.doActionFor(svg_obj, item.id)
                    break
                svg_obj.reindexObject()
        if not new_svg:
            notify(InvalidateCacheEvent(svg_obj))
        return _("Success")

    def __call__(self, **kwargs):
        return self.save_svg_and_png(kwargs)


class SetThumb(BrowserView):
    """ Set thumbnail
    """
    def __call__(self, **kwargs):
        if not IFolderish.providedBy(self.context):
            return _("Can't set thumbnail on a non-folderish object !")

        form = getattr(self.request, 'form', {})
        kwargs.update(form)

        filename = kwargs.get('filename', 'cover.png')
        img = None
        convert = getUtility(IConvert)
        if kwargs.get('svg', '') != '':
            img = convert(
                data=kwargs.get('svg', ''),
                data_from='svg',
                data_to='png'
            )
        if kwargs.get('imageChart_url', '') != '':
            try:
                img_con = urllib2.urlopen(
                    kwargs.get('imageChart_url'), timeout=10
                )
                img = img_con.read()
                img_con.close()
            except Exception:
                img = None

        if not img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")

        if filename not in self.context.objectIds():
            filename = self.context.invokeFactory('Image', id=filename)
        obj = self.context._getOb(filename)
        obj.setExcludeFromNav(True)
        obj.getField('image').getMutator(obj)(img)
        self.context.getOrdering().moveObjectsToTop(ids=[obj.getId()])
        notify(InvalidateCacheEvent(obj))
        return _("Success")


class DashboardView(ViewForm):
    """ Google dashboard view
    """
    label = 'Charts Dashboard'

    @property
    def tabs(self):
        """ View tabs
        """
        png_url = self.context.absolute_url() + \
            "/googlechart.googledashboard.preview.png"
        return [
            {
            'name': self.__name__,
            'title': 'Dashboard',
            'css': 'googlechart_class_Dashboard',
            'tabname': 'tab-%s' % self.__name__.replace('.', '-'),
            'fallback-image': png_url
            },
        ]

    def charts(self):
        """ Charts config
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        charts = dict(mutator.view('googlechart.googlecharts', {}))
        return json.dumps(charts)

    def dashboard(self):
        """ Dashboard config
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = dict(mutator.view('googlechart.googledashboard', {}))
        return json.dumps(view)


class DashboardsView(ViewForm):
    """ Google dashboards view
    """
    label = _('Dashboards')

    @property
    def tabs(self):
        """ View tabs
        """
        png_url = self.context.absolute_url() + \
            "/googlechart.googledashboard.preview.png"

        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = dict(mutator.view(self.__name__, {}))

        tabs = []
        for dashboard in view.get('dashboards', []):
            name = dashboard.get('name', '')
            tab = {
                'name': name,
                'title': dashboard.get('title', name),
                'css': 'googlechart_class_Dashboard',
                'tabname': 'tab-%s' % name.replace('.', '-'),
                'fallback-image': png_url
            }
            tabs.append(tab)
        return tabs
