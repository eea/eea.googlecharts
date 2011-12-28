# -*- coding: utf-8 -*-
""" barchart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.interface import Interface
from eea.googlechartsconfig.views.interfaces import IGoogleChartView


class IGoogleChartBarChart(IGoogleChartView):
    """ GoogleChart BarChart
    """

class IGoogleChartBarChartEdit(Interface):
    """ GoogleChart BarChart edit
    """
    columns = schema.List(
        title=u'Columns',
        description=u'Select columns to be shown in table view',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary="eea.googlechartsconfig.vocabularies.FacetsVocabulary")
    )

    chartTitle = schema.TextLine(
        title=u'Chart Title',
        description=u'Select Title for the chart',
        required=True
    )

    horizontalTitle = schema.TextLine(
        title=u'Horizontal Title',
        description=u'Select Title for horizontal axis',
        required=True
    )

    verticalTitle = schema.TextLine(
        title=u'Vertical Title',
        description=u'Select Title for vertical axis',
        required=True
    )

    chartType = schema.List(
        title=u'Chart Type',
        description=u'Select type of chart',
        required=True, unique=True,
        value_type=schema.Choice(
            vocabulary = "eea.googlechartsconfig.vocabularies.ChartTypesVocabulary")
    )
