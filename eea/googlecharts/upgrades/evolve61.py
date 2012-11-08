"""Settings upgrade
"""
import logging
from zope.component import queryMultiAdapter
from Products.CMFCore.utils import getToolByName
logger = logging.getLogger('eea.googlecharts.evolve61')

def migrate_dashboards(context):
    """ Migrate single dashboard settings to multiple-dashboards
    """
    ctool = getToolByName(context, 'portal_catalog')
    brains = ctool(object_provides=('eea.app.visualization.subtypes.interfaces.'
                                    'IVisualizationEnabled'))

    logger.info('Migrating %s Google Dashboards ...', len(brains))
    for brain in brains:
        doc = brain.getObject()
        migrate = queryMultiAdapter(
            (doc, doc.REQUEST), name=u'migrate-dashboards')
        if not migrate:
            continue

        info = migrate()
        if info:
            logger.info(info)
        else:
            logger.info('Skipping %s', brain.getURL())

    logger.info('Migrating Google Dashboards ... DONE')
