import StringIO
from zope.interface import implements

from Products.Archetypes import atapi
from Products.ATContentTypes.content import schemata, base

from eea.googlechartsconfig.interfaces import IGoogleChart
from eea.googlechartsconfig.config import PROJECTNAME

from Products.Archetypes.atapi import TextField, TextAreaWidget, \
                                    IntegerField, IntegerWidget, \
                                    StringField, StringWidget

from eea.googlechartsconfig.converter import converter

GoogleChartSchema = schemata.ATContentTypeSchema.copy() + \
            atapi.Schema((
    TextField(
        name='csvdata',
        default_content_type = 'text/plain',
        allowable_content_types = ('text/plain',),

        widget=TextAreaWidget(
            label="CSV Data",
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

def handle_object_initialized(obj, event):
    data = converter.csv2json(StringIO.StringIO(obj.csvdata()))
    obj.jsondata = data[1]
    obj.columns = data[0]
