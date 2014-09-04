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
    ctool = getToolByName(context, 'portal_catalog')
    pr = getToolByName(context, 'portal_repository')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')

    logger.info('Migrating %s Visualizations ...', len(brains))
    for brain in brains:

        visualization = brain.getObject()
        mutator = queryAdapter(visualization, IVisualizationConfig)
        url = brain.getURL()

        extracted_notes = []

        try:
            logger.info('Attempting to create version for %s', url)
            commit_msg = u'Migrating to eea.googlecharts 11.0'
            pr.save(obj=visualization, comment=commit_msg)
        except Exception:
            logger.info('Cannot create version for %s', url)

        for view in mutator.views:
            if view.get('chartsconfig'):
                logger.info('Migrating %s', url)
                config = view.get('chartsconfig')
                for chart in config.get('charts', []):
                    chart_id = chart.get('id')
                    for idx, note in enumerate(chart.get('notes', [])):
                        note.setdefault('charts', []).append(chart_id)
                        note['id'] = str(uuid.uuid4())
                        note.setdefault('order', {})[chart_id] = idx
                        extracted_notes.append(note)

                    chart.pop('notes', None)

                data = {}
                data['chartsconfig'] = config
                mutator.edit_view('googlechart.googlecharts', **data)


        try:
            mutator.edit_view('googlechart.googlecharts', notes=extracted_notes)
        except KeyError:
            logger.info('Skipping Visualization without Google Charts')


    logger.info('Migrating Visualizations ... DONE')
