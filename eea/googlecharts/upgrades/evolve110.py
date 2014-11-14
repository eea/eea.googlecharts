""" Migrate notes
"""
import logging
import uuid
from zope.component import queryAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts.evolve110')


def create_version(pr, visualization, url):
    """ New version
    """
    try:
        logger.info('Attempting to create version for %s', url)
        commit_msg = u'Migrating to eea.googlecharts 11.0'
        pr.save(obj=visualization, comment=commit_msg)
    except Exception:
        logger.info('Cannot create version for %s', url)


def migrate_notes(context):
    """ Migrate notes"""
    ctool = getToolByName(context, 'portal_catalog')
    pr = getToolByName(context, 'portal_repository')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')
    view_name = 'googlechart.googlecharts'
    config_name = 'chartsconfig'

    logger.info('Migrating %s Visualizations ...', len(brains))
    for brain in brains:
        visualization = brain.getObject()
        mutator = queryAdapter(visualization, IVisualizationConfig)

        view = mutator.view(view_name, {})
        config = view.get(config_name, None)

        if config:
            url = brain.getURL()
            logger.info('Migrating %s', url)
            create_version(pr, visualization, url)

            extracted_notes = []

            for chart in config.get('charts', []):
                chart_id = chart.get('id')
                for idx, note in enumerate(chart.get('notes', [])):
                    note.setdefault('charts', []).append(chart_id)
                    note['id'] = str(uuid.uuid4())
                    note.setdefault('order', {})[chart_id] = idx
                    extracted_notes.append(note)

                chart.pop('notes', None)

            data = {}

            if config.get('notes', None) is None:
                config['notes'] = extracted_notes

            data[config_name] = config

            mutator.edit_view(view_name, **data)

    logger.info('Migrating Visualizations ... DONE')
