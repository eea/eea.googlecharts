""" Migrate sort filters
"""
import logging
from zope.component import queryAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts.evolve85')

def migrate_sortfilter(context):
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
                shouldUpgrade = False
                for chart in config.get('charts', []):
                    if chart.get('showSort', False):
                        shouldUpgrade = True
                        chart['sortFilter'] = '__default__'
                if shouldUpgrade:
                    data = {}
                    data['chartsconfig'] = config
                    mutator.edit_view('googlechart.googlecharts', **data)

    logger.info('Migrating Visualizations ... DONE')
