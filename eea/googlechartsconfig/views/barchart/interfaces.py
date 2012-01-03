# -*- coding: utf-8 -*-
""" barchart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from eea.daviz.views.interfaces import IExhibitView
from eea.googlechartsconfig.views.interfaces import IGoogleChartEdit

class IGoogleChartBarChart(IExhibitView):
    """ GoogleChart BarChart
    """

class IGoogleChartBarChartEdit(IGoogleChartEdit):
    """ GoogleChart BarChart edit
    """
    columns = schema.List(
        title=u'Columns',
        description=u'Select columns to be shown in table view',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary="eea.daviz.vocabularies.FacetsVocabulary")
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
