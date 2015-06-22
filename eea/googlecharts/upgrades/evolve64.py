""" Create the generic image charts for dashboards in all visualizations
"""
import logging
from eea.app.visualization.zopera import getToolByName
from eea.app.visualization.zopera import IFolderish
logger = logging.getLogger('eea.googlecharts.evolve64')

def migrate_imagecharts(context):
    """ Migrate dashboard image charts"""
    ctool = getToolByName(context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')
    previews = [
        "googlechart.motionchart.preview.png",
        "googlechart.organizational.preview.png",
        "googlechart.imagechart.preview.png",
        "googlechart.sparkline.preview.png",
        "googlechart.table.preview.png",
        "googlechart.annotatedtimeline.preview.png",
        "googlechart.treemap.preview.png"
    ]

    logger.info('Migrating %s Visualizations ...', len(brains))

    for brain in brains:
        logger.info('Migrating %s', brain.getURL())

        visualization = brain.getObject()
        if IFolderish.providedBy(visualization):
            for previewname in previews:
                if not visualization.get(previewname, None):
                    logger.info('Create img: %s', previewname)

                    img = context.restrictedTraverse(
                        '++resource++' + previewname)
                    visualization.invokeFactory('Image',
                        id=previewname,
                        title=previewname,
                        image=img.GET())
                else:
                    logger.info('Img: %s already exists', previewname)

    logger.info('Migrating Visualizations ... DONE')
