""" Cleanup
"""
import logging
import transaction
from zope.component.interface import interfaceToName
from Products.CMFCore.utils import getToolByName
from eea.app.visualization.interfaces import IVisualizationEnabled
logger = logging.getLogger('eea.googlecharts')

CLEANUP = [
    "googlechart.googledashboard.preview.png",
    "googlechart.motionchart.preview.png",
    "googlechart.organizational.preview.png",
    "googlechart.imagechart.preview.png",
    "googlechart.sparkline.preview.png",
    "googlechart.table.preview.png",
    "googlechart.annotatedtimeline.preview.png",
    "googlechart.treemap.preview.png"
]

def cleanup_fallback_images(context):
    """ Migrate exhibit image charts"""
    ctool = getToolByName(context, 'portal_catalog')
    iface = interfaceToName(context, IVisualizationEnabled)
    brains = ctool(
        object_provides=iface,
        show_inactive=True, Language='all'
    )

    count = 0
    nbrains = len(brains)
    logger.info("Start removing aprox. %s Google Charts images", nbrains*8)
    for idx, brain in enumerate(brains):
        doc = brain.getObject()
        clean = []
        for item in CLEANUP:
            if item in doc.objectIds():
                clean.append(item)

        if not clean:
            continue

        length = len(clean)
        logger.info('Removing %s Google Charts fallback images from %s',
                    length, doc.absolute_url())
        doc.manage_delObjects(clean)
        count += length

        if idx % 100 == 0:
            logger.info("Cleanup: Transaction commit: %s/%s", idx, nbrains)
            transaction.commit()

    logger.info('Done removing %s Google Charts fallback images', count)
