# -*- coding: utf-8 -*-
""" barchart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.interface import Interface
from eea.daviz.views.interfaces import IExhibitView

class IGoogleCharts(IExhibitView):
    """ GoogleChart BarChart
    """

class IGoogleChartsEdit(Interface):
    """ GoogleChart BarChart edit
    """
    columns = schema.List(
        title=u'Chart Types',
        description=u'Select type of chart to implement',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary="eea.daviz.vocabularies.FacetsVocabulary")
    )

