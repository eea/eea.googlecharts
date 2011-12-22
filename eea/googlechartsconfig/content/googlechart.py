from zope.interface import implements

from Products.Archetypes import atapi
from Products.ATContentTypes.content import schemata, base

from eea.googlechartsconfig.interfaces import IGoogleChart
from eea.googlechartsconfig.config import PROJECTNAME

GoogleChartSchema = schemata.ATContentTypeSchema.copy()

GoogleChartSchema['title'].storage = atapi.AnnotationStorage()
GoogleChartSchema['description'].storage = atapi.AnnotationStorage()

schemata.finalizeATCTSchema(GoogleChartSchema, moveDiscussion=False)

class GoogleChart(base.ATCTContent):
    """GoogleChart"""
    implements(IGoogleChart)

    meta_type = "GoogleChart"
    schema = GoogleChartSchema

    title = atapi.ATFieldProperty('title')
    description = atapi.ATFieldProperty('description')

atapi.registerType(GoogleChart, PROJECTNAME)
