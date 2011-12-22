from zope.interface import implements

from Products.Archetypes import atapi
from Products.ATContentTypes.content import schemata, base

from eea.googlechartsconfig.interfaces import IGoogleChart
from eea.googlechartsconfig.config import PROJECTNAME

from Products.Archetypes.atapi import TextField, TextAreaWidget, \
                                    IntegerField, IntegerWidget, \
                                    StringField, StringWidget
#GoogleChartSchema = schemata.ATContentTypeSchema.copy()

GoogleChartSchema = schemata.ATContentTypeSchema.copy() + \
            atapi.Schema((
    StringField(
        name='chart_title',
        widget=StringWidget(
            label="Chart Title",
        ),
        required=1
    ),

    IntegerField(
        name='width',
        widget=IntegerWidget(
            label="Width",
        ),
        required=0
    ),
    
    IntegerField(
        name='height',
        widget=IntegerWidget(
            label="Height",
        ),
        required=0
    ),

    TextField(
        name='data',
        default_content_type = 'text/plain',
        allowable_content_types = ('text/plain',),

        widget=TextAreaWidget(
            label="Data",
        ),
        required=1
    ),
))



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
