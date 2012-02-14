""" GoogleCharts View
"""
import json
from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from Products.Five.browser import BrowserView

from eea.daviz.interfaces import IDavizConfig
from eea.daviz.views.view import ViewForm
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
        mutator = queryAdapter(self.context, IDavizConfig)
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
        chart['available_columns'] = self.get_columns
        chart['filters'] = self.request.get("filters", {})
        chart['filterposition'] = self.request.get("filterposition", 0)
        return chart

    def has_dashboard(self):
        """ Dashboard is configured """
        views = queryAdapter(self.context, IDavizConfig).views
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
        mutator = queryAdapter(self.context, IDavizConfig)
        #config = ''
        filters = []
        filtersposition = 0
        filter_settings = {}
        for view in mutator.views:
            if view.get('name') == 'googlechart.googledashboard':
                if view.get('filters'):
                    filters = view.get('filters')
                if view.get('filtersposition'):
                    filtersposition = view.get('filtersposition')
        filter_settings['filterposition'] = filtersposition
        filter_settings['filters'] = filters

#        filter_settings = {}
#        filter_settings['filterposition'] = 3;
#        filters = {}
#        filters['sector'] = "3"
#        filters['count'] = "0"
#        filters['size'] = "1"
#        filter_settings['filters'] = filters

        return filter_settings

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
