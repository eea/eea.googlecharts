""" Create the generic image charts for dashboards in all visualizations
"""
import logging
from zope.component import queryMultiAdapter
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.zopera import IFolderish
logger = logging.getLogger('eea.googlecharts.evolve63')

def migrate_imagecharts(context):
    """ Migrate dashboard image charts"""
    ctool = getToolByName(context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')
    for brain in brains:
        visualization = brain.getObject()
        if IFolderish.providedBy(visualization):
            tabs = queryMultiAdapter((visualization, context.REQUEST),
                                     name='daviz-view.html').tabs

            for tab in tabs:
                if tab['name'] == 'googlechart.googledashboard':
                    previewname = tab['name'] + '.preview.png'
                    if not visualization.get(previewname, None):
                        img = context.restrictedTraverse('++resource++' +
                            str(previewname))
                        visualization.invokeFactory('Image',
                            id=previewname,
                            title=previewname,
                            image=img.GET())

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
