""" Create the generic image charts for dashboards in all visualizations
"""
from Products.CMFCore.utils import getToolByName
from zope.component import getMultiAdapter
from eea.app.visualization.zopera import IFolderish

def migrate_imagecharts(context):
    """ Migrate dashboard image charts"""
    ctool = getToolByName (context, 'portal_catalog')
    brains = ctool.unrestrictedSearchResults(portal_type='DavizVisualization')
    for brain in brains:
        visualization = brain.getObject()
        if IFolderish.providedBy(visualization):
            tabs = getMultiAdapter((visualization, context.REQUEST),
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
