""" Handle events
"""
import logging
import json
from zope.component import queryUtility, queryAdapter, getMultiAdapter
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.app.visualization.interfaces import IDavizSettings
from eea.app.visualization.views.events import facet_deleted
from zope.schema.interfaces import IVocabularyFactory
logger = logging.getLogger('eea.googlecharts')

def googlechart_facet_deleted(obj, evt):
    """ Cleanup removed facet from view properties
    """
    return facet_deleted(obj, evt, 'googlechart.googlecharts')

def create_default_views(obj, evt):
    """ Create default views
    """
    settings = queryUtility(IDavizSettings)
    if settings and settings.disabled('googlechart.googlecharts', obj):
        return

    mutator = queryAdapter(obj, IVisualizationConfig)
    if not mutator:
        logger.warn("Couldn't find any IVisualizationConfig adapter for %s",
                    obj.absolute_url(1))
        return

    # Views already configure, do nothing
    if mutator.view('googlechart.googlecharts'):
        return

    vocab = queryUtility(IVocabularyFactory,
                         name="eea.daviz.vocabularies.FacetsVocabulary")
    columns = vocab(obj)

    # If the table is empty, do nothing
    if not len(columns):
        return

    mutator.add_view('googlechart.googlecharts', order=0)

    request = getattr(obj, 'REQUEST', None)
    if not request:
        return

    # Add default charts
    chart = {
        'id': 'chart_1',
        'name': 'Chart',
        'width': "800",
        'height': "600",
        'filters': "{}",
        'filterposition': "0",
        'isThumb': False,
        'dashboard': {},
        'config': {
            u'chartType': u'Table',
            u'options': {u'legend': u'none', u'title': u'Chart'},
            u'dataTable': []
            },
        'options': {
            u'showChartButtons': False,
            u'fontName': u'Verdana',
            u'fontSize': 12,
            u'state': u'{"showTrails":false}'
        },
        'columns': {'original': [], 'prepared': []},
    }

    # Config to JSON
    chart['config'] = json.dumps(chart['config'])

    # Options to JSON
    chart['options'] = json.dumps(chart['options'])

    # Add table columns
    for term in columns:
        original = {
            "name": term.value,
            "status": 1
        }
        chart['columns']['original'].append(original)
        prepared = {
            'name': term.value,
            'status': 1,
            'fullname': term.title
        }
        chart['columns']['prepared'].append(prepared)

    chart['columns'] = json.dumps(chart['columns'])

    # Add chart
    query = {'charts': [chart], 'notes': []}
    str_query = json.dumps(query)

    request.form['chartsconfig'] = str_query
    submit_data = getMultiAdapter((obj, request),
                                    name=u'googlechart.submit_data')
    submit_data()
    request.form.pop('chartsconfig')
