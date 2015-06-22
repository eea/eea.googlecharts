""" Migrate sort filters
"""
import json
import logging
from zope.component import queryAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts.evolve87')

def migrate_filters(context):
    """ Migrate sort filters"""
    ctool = getToolByName(context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')

    logger.info('Migrating %s Visualizations ...', len(brains))
    for brain in brains:

        visualization = brain.getObject()
        mutator = queryAdapter(visualization, IVisualizationConfig)

        for view in mutator.views:
            if view.get('chartsconfig'):
                logger.info('Migrating %s', brain.getURL())
                config = view.get('chartsconfig')
                for chart in config.get('charts', []):
                    filters_str = chart.get('filters', '{}')
                    filters = json.loads(filters_str)
                    migrated_filters = {}
                    for filter_key in filters.keys():
                        if not isinstance(filters[filter_key], dict):
                            migrated_filters[filter_key] = {}
                            migrated_filters[filter_key]['type'] = \
                                filters[filter_key]
                            migrated_filters[filter_key]['defaults'] = []
                            migrated_filters_str = json.dumps(migrated_filters)
                            chart['filters'] = migrated_filters_str
                data = {}
                data['chartsconfig'] = config
                mutator.edit_view('googlechart.googlecharts', **data)

    logger.info('Migrating Visualizations ... DONE')
