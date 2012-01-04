# -*- coding: utf-8 -*-
""" piechart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from eea.daviz.views.interfaces import IExhibitView
from eea.googlechartsconfig.views.interfaces import IGoogleChartEdit

class IGoogleChartPieChart(IExhibitView):
    """ GoogleChart PieChart
    """

class IGoogleChartPieChartEdit(IGoogleChartEdit):
    """ GoogleChart PieChart edit
    """
    labels = schema.Choice(
        title=u'Slice labels',
        description=u'Select column to be used as slice labels',
        required=False,
        vocabulary="eea.daviz.vocabularies.FacetsVocabulary"
    )

    values = schema.Choice(
        title=u'Slice values',
        description=u'Select column to be used as slice values',
        required=True,
        vocabulary="eea.daviz.vocabularies.FacetsVocabulary"
    )

