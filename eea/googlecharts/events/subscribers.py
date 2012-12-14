""" Handle events
"""
from zope.component import queryAdapter, queryUtility
from zope.schema.interfaces import IVocabularyFactory
from eea.app.visualization.interfaces import IVisualizationConfig

def update_dashboards(context, evt):
    """ Update dashboard charts properties
    """
    mutator = queryAdapter(context, IVisualizationConfig)
    view = mutator.view('googlechart.googledashboards', {})

    dashboards = view.get('dashboards', [])
    if not dashboards:
        return

    voc = queryUtility(IVocabularyFactory,
                       name=u'eea.googlecharts.vocabularies.charts')
    settings = dict((term.value, term.title) for term in voc(context))

    changed = False
    for dashboard in dashboards:
        widgets = dashboard.get('widgets', [])
        if not widgets:
            continue

        for widget in widgets[:]:
            if widget.get('wtype', '') != u'googlecharts.widgets.chart':
                continue
            name = widget.get('name', '')
            if name not in settings:
                widgets.remove(widget)
                changed = True
                continue

            title = widget.get('title', '')
            newTitle = settings.get(name)
            if title != newTitle:
                widget['title'] = newTitle
                changed = True

    if changed:
        mutator.edit_view('googlechart.googledashboards', **view)
