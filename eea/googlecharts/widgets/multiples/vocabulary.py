""" Vocabularies
"""
from zope.interface import implements
from zope.component import queryAdapter
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary
from zope.schema.vocabulary import SimpleTerm
from eea.app.visualization.interfaces import IVisualizationConfig

class Charts(object):
    """ Charts vocabulary
    """
    implements(IVocabularyFactory)

    def existing(self, context):
        """ Get existing charts in dashboard
        """
        return []

    def __call__(self, context=None):
        existing = self.existing(context)

        accessor = queryAdapter(context, IVisualizationConfig)
        charts = accessor.view('googlechart.googlecharts', {})

        charts = charts.get('chartsconfig', {}).get('charts', [])

        items = []
        for chart in charts:
            name = chart.get('id')
            if name in existing:
                continue

            title = chart.get('name', name)
            path = u'googlechart.googlecharts/chartsconfig/charts/%s' % name
            items.append(SimpleTerm(name, path, title))
        return SimpleVocabulary(items)

class Add(Charts):
    """ Vocabulary to be used within add form
    """

    def existing(self, context):
        """ Get existing charts in dashboard
        """
        request = getattr(context, 'REQUEST', None)
        form = getattr(request, 'form', {})
        name = form.get('dashboard', None)
        if not name:
            return []

        existing = set()
        accessor = queryAdapter(context, IVisualizationConfig)
        dashboards = accessor.view('googlechart.googledashboards', {})
        dashboard = {}
        for dashboard in dashboards.get('dashboards', []):
            if dashboard.get('name') == name:
                break
        for widget in dashboard.get('widgets'):
            if widget.get('wtype') == 'googlecharts.widgets.multiples':
                #remove the "multiples_" prefix from name
                existing.add(widget.get('name')[10:])
        return existing

class Edit(Charts):
    """ Vocabulary to be used within edit form
    """
    implements(IVocabularyFactory)

    def existing(self, context):
        """ Existing charts
        """
        request = getattr(context, 'REQUEST', None)
        form = getattr(request, 'form', {})
        #remove the "multiples_" prefix from name
        name = form.get('name', '')[10:]

        accessor = queryAdapter(context, IVisualizationConfig)
        charts = accessor.view('googlechart.googlecharts', {})

        charts = charts.get('chartsconfig', {}).get('charts', [])

        existing = set()
        for chart in charts:
            chart_name = chart.get('id')
            if name == chart_name:
                continue
            existing.add(chart_name)

        return existing
