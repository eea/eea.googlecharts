from zope import schema

from zope.interface import Interface

class IGoogleChartEdit(Interface):
    """ GoogleChartedit
    """
    chartTitle = schema.TextLine(
        title=u'Chart Title',
        description=u'The title of the chart',
        required=False
    )

    chartType = schema.Choice(
        title=u'Chart Type',
        description=u'Select type of chart',
        required=True,
        values=(u"ImageChart", u"HTMLChart")
    )

    chartWidth = schema.Int(
        title=u'Width',
        description=u'The width of the chart',
        required=False
    )

    chartHeight = schema.Int(
        title=u'Height',
        description=u'The height of the chart',
        required=False
    )

