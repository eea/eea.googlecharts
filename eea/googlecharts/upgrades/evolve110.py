""" Migrate notes
"""
import logging
import uuid
from zope.component import queryAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts.evolve110')


def migrate_notes(context):
    """ Migrate notes"""
    ctool = getToolByName (context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')

    logger.info('Migrating %s Visualizations ...', len(brains))
    for brain in brains:

        visualization = brain.getObject()
        mutator = queryAdapter(visualization, IVisualizationConfig)

        extracted_notes = []

        for view in mutator.views:
            if view.get('chartsconfig'):
                logger.info('Migrating %s', brain.getURL())
                config = view.get('chartsconfig')
                for chart in config.get('charts', []):
                    chart_id = chart.get('id')
                    for idx, note in enumerate(chart.get('notes', [])):
                        note.setdefault('charts', []).append(chart_id)
                        note['id'] = str(uuid.uuid4())
                        note.setdefault('order', {})[chart_id] = idx
                        extracted_notes.append(note)

                    del chart['notes']

                data = {}
                data['chartsconfig'] = config
                mutator.edit_view('googlechart.googlecharts', **data)


        notes_view = 'googlechart.notes'

        if not mutator.view(notes_view):
            mutator.add_view(notes_view)

        mutator.edit_view(notes_view, notes=extracted_notes)


    logger.info('Migrating Visualizations ... DONE')
