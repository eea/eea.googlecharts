""" GoogleCharts View
"""
import json
from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from Products.Five.browser import BrowserView
from Products.CMFCore.interfaces import IFolderish
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.app.visualization.views.view import ViewForm
from eea.converter.interfaces import IConvert
from eea.googlecharts.config import EEAMessageFactory as _

class View(ViewForm):
    """ GoogleChartsView
    """
    label = 'Charts'
    view_name = "googlechart.googlecharts"
    section = "Charts"

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
                                 name="daviz-relateditems.json")()
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
        if chart_settings:
            chart_settings['data'] = self.get_rows()
            chart_settings['available_columns'] = self.get_columns()
        chart_settings['chartWidth'] = \
            self.request.get("chartWidth",chart_settings["width"])
        chart_settings['chartHeight'] = \
            self.request.get("chartHeight",chart_settings["height"])
        return chart_settings


    def has_dashboard(self):
        """ Dashboard is configured """
        views = queryAdapter(self.context, IVisualizationConfig).views
        hasDashboard = False
        for view in views:
            if view.get('name') == 'googlechart.googledashboard':
                hasDashboard = True
        return hasDashboard

    def get_dashboard_js(self, chart):
        """ Dashboard
        """
        return json.dumps(chart.get('dashboard', {}))

    def get_dashboard_filters(self):
        """ Dashboard filters
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = dict(mutator.view('googlechart.googledashboard', {}))
        return json.dumps(view)

    @property
    def tabs(self):
        """ Tabs in view mode
        """
        tabs = []
        for chart in self.get_charts():
            name = chart.get('id', '')
            title = chart.get('name', '')
            config = json.loads(chart.get('config', '{}'))
            chartType = config.get('chartType', '')
            tabs.append({
                'name': name,
                'title': title,
                'css': 'googlechart_class_%s' % chartType,
                'tabname': 'tab-%s' % name.replace('.', '-')
            })
        return tabs

class Export(BrowserView):
    """ Export chart to png
    """
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

        ctype = kwargs.get('type', 'image/png')
        filename = kwargs.get('filename', 'export')

        self.request.response.setHeader('content-type', ctype)
        self.request.response.setHeader(
            'content-disposition',
            'attachment; filename="%s.png"' % filename
        )
        return img

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
        return _("Success")

class DashboardView(ViewForm):
    """ Google dashboard view
    """
    label = 'Charts Dashboard'
    section = "Charts"

    @property
    def tabs(self):
        """ View tabs
        """
        return [
            {
            'name': self.__name__,
            'title': 'Dashboard',
            'css': 'googlechart_class_Dashboard',
            'tabname': 'tab-%s' % self.__name__.replace('.', '-')
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
