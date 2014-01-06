""" GoogleCharts View
"""
import json
import logging
import urllib2
import hashlib
import re
from PIL import Image
from cStringIO import StringIO
from zope.component import queryAdapter, getMultiAdapter
from zope.component import getUtility
from zope.schema.interfaces import IVocabularyFactory
from Products.Five.browser import BrowserView
from eea.app.visualization.zopera import IFolderish
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.app.visualization.views.view import ViewForm
from eea.converter.interfaces import IConvert, IWatermark
from eea.googlecharts.config import EEAMessageFactory as _
from eea.app.visualization.controlpanel.interfaces import IDavizSettings
from zope.component import queryUtility

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

    def get_maintitle(self):
        """ Main title of visualization
        """
        return re.escape(self.context.title)

    def get_charts(self):
        """ Charts
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        config = ''
        for view in mutator.views:
            if (view.get('chartsconfig')):
                config = view.get('chartsconfig')
        if config == "":
            return []
        return config['charts']

    def get_charts_json(self):
        """ Charts as JSON
        """
        charts = self.get_charts()
        return json.dumps(charts)

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

    def get_chart(self):
        """ Get chart
        """
        chart_id = self.request['chart']
        charts = self.get_charts()
        chart_settings = {}
        for chart in charts:
            if chart['id'] == chart_id:
                chart_settings = chart
                chart_settings['chart_id'] = chart_id

        if chart_settings:
            chart_settings['data'] = self.get_rows()
            chart_settings['available_columns'] = self.get_columns()

        chart_settings['chartWidth'] = \
            self.request.get("chartWidth",chart_settings["width"])
        chart_settings['chartHeight'] = \
            self.request.get("chartHeight",chart_settings["height"])
        return chart_settings

    def get_chart_json(self):
        """Chart as JSON
        """
        chart_id = self.request['chart']
        charts = self.get_charts()
        for chart in charts:
            if chart.get('id') == chart_id:
                return json.dumps([chart])

    def get_chart_png(self):
        """Chart as JSON
        """
        tag = self.request.get('tag', False)
        safe = self.request.get('safe', True)
        chart_id = self.request.get('chart', '')
        charts = self.get_charts()

        for chart in charts:
            if chart.get('id') != chart_id:
                continue

            if chart.get('hasPNG', False):
                name = chart.get('id', '')
                png = self.context[name + '.png']
            else:
                if not safe:
                    return ''
                config = json.loads(chart.get('config', '{}'))
                chartType = config.get('chartType', '')
                png = "googlechart." + chartType.lower() + ".preview.png"
                png = self.context[png]

            if tag:
                return png.tag(width='100%', height="auto")

            self.request.response.setHeader('content-type', 'image/png')
            return png.index_html(self.request, self.request.response)

        return ''

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
            if chart.get('hasPNG', False):
                tab['fallback-image'] = \
                    self.context.absolute_url() + "/" + name + ".png"
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
        if tmp_id:
            mutator = queryAdapter(self.context, IVisualizationConfig)
            data = mutator.view('googlechart.googlecharts')
            config = data['chart_previews'][tmp_id]
            config['data'] = self.get_rows()
            config['available_columns'] = self.get_columns()
            config['preview_width'] = config['width']
            config['preview_height'] = config['height']
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

    def get_notes(self, chart_id):
        """ get the notes for charts or dashboards
        """
        if 'dashboard' in chart_id:
            dashboards = json.loads(self.get_dashboards())
            for dashboard in dashboards:
                if dashboard['name'] == chart_id:
                    notes = []
                    for widget in dashboard.get('widgets', []):
                        if widget.get('wtype','') == \
                            'googlecharts.widgets.textarea' and \
                            not widget.get('dashboard',{}).get('hidden', True):

                            note = {}
                            note['title'] = widget.get('title', '')
                            note['text']  = widget.get('text', '')
                            notes.append(note)
                    return notes
        else:
            charts = self.get_charts()
            for chart in charts:
                if chart.get('id') == chart_id:
                    return chart.get('notes', [])
        return []

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
        img = convert(
            data=kwargs.get('svg', ''),
            data_from='svg',
            data_to='png'
        )

        if not img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")

        sp = self.siteProperties
        qrPosition =  sp.get(
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
            qr_con = urllib2.urlopen(kwargs.get('qr_url'))
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
                wm_con = urllib2.urlopen(wmPath)
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

        ctype = kwargs.get('type', 'image/png')
        filename = kwargs.get('filename', 'export')

        self.request.response.setHeader('content-type', ctype)
        self.request.response.setHeader(
            'content-disposition',
            'attachment; filename="%s.png"' % filename
        )
        return img

class SavePNGChart(Export):
    """ Save png version of chart, including qr code and watermark
    """
    def __call__(self, **kwargs):
        if not IFolderish.providedBy(self.context):
            return _("Can't save png chart on a non-folderish object !")
        form = getattr(self.request, 'form', {})
        kwargs.update(form)
        filename = kwargs.get('filename', 'img')
        chart_url = self.context.absolute_url() + "#" + "tab-" + filename
        filename = filename + ".png"
        sp = self.siteProperties
        qr_size = sp.get('googlechart.qrcode_size', '70')
        if qr_size == '0':
            qr_size = '70'
        qr_url = (
            u"http://chart.apis.google.com"
            "/chart?cht=qr&chld=H|0&chs=%sx%s&chl=%s" % (
                qr_size, qr_size, urllib2.quote(chart_url)))
        self.request.form['qr_url'] = qr_url
        img = super(SavePNGChart, self).__call__()

        if not img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")

        if filename not in self.context.objectIds():
            filename = self.context.invokeFactory('Image', id=filename)
        obj = self.context._getOb(filename)
        obj.setExcludeFromNav(True)
        obj.getField('image').getMutator(obj)(img)
        return _("Success")

class SetThumb(BrowserView):
    """ Set thumbnail
    """
    def __call__(self, **kwargs):
        if not IFolderish.providedBy(self.context):
            return _("Can't set thumbnail on a non-folderish object !")

        form = getattr(self.request, 'form', {})
        kwargs.update(form)

        filename = kwargs.get('filename', 'cover.png')

        convert = getUtility(IConvert)
        img = convert(
            data=kwargs.get('svg', ''),
            data_from='svg',
            data_to='png'
        )

        if not img:
            return _("ERROR: An error occured while exporting your image. "
                     "Please try again later.")


        if filename not in self.context.objectIds():
            filename = self.context.invokeFactory('Image', id=filename)
        obj = self.context._getOb(filename)
        obj.setExcludeFromNav(True)
        obj.getField('image').getMutator(obj)(img)
        self.context.getOrdering().moveObjectsToTop(ids=[obj.getId()])
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
