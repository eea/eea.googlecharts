""" Create the generic image charts for dashboards in all visualizations
"""
import logging
import json
from zope.component import queryAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts.evolve64')

def migrate_rowfilters(context):
    """ Migrate dashboard image charts"""
    ctool = getToolByName(context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')

    logger.info('Migrating %s Visualizations ...', len(brains))

    for brain in brains:
        logger.info('Migrating %s', brain.getURL())

        visualization = brain.getObject()
        mutator = queryAdapter(visualization, IVisualizationConfig)

        for view in mutator.views:
            if view.get('chartsconfig'):
                config = view.get('chartsconfig')
                for chart in config.get('charts', []):
                    if chart.get('row_filters'):
                        row_filters_str = chart.get('row_filters')
                        row_filters = json.loads(row_filters_str)
                        migrated_rf = {}
                        for row in row_filters.keys():
                            filters = row_filters.get(row)
                            if isinstance(filters, list):
                                migrated_rf[row] = {}
                                migrated_rf[row]['values'] = filters
                                migrated_rf[row]['type'] = 'hidden'
                            else:
                                migrated_rf[row] = filters
                        migrated_rf_str = json.dumps(migrated_rf)
                        chart['row_filters'] = migrated_rf_str
                data = {}
                data['chartsconfig'] = config
                mutator.edit_view('googlechart.googlecharts', **data)

    logger.info('Migrating Visualizations ... DONE')
