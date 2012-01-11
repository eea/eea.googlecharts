# -*- coding: utf-8 -*-
""" googlecharts interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from eea.daviz.views.interfaces import IExhibitView
from eea.googlechartsconfig.views.interfaces import IGoogleChartEdit

class IGoogleCharts(IExhibitView):
    """ GoogleCharts
    """

class IGoogleChartsEdit(IGoogleChartEdit):
    """ GoogleCharts edit
    """
    columns = schema.List(
        title=u'Columns',
        description=u'Select columns to be shown in table view',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary="eea.daviz.vocabularies.FacetsVocabulary")
    )

