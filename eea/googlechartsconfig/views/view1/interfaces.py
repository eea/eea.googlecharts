# -*- coding: utf-8 -*-
""" view1 interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.interface import Interface
from eea.googlechartsconfig.views.interfaces import IGoogleChartView

class IGoogleChartView1(IGoogleChartView):
    """ GoogleChart view1
    """

class IGoogleChartView1Edit(Interface):
    """ GoogleChart view1 edit
    """
    columns = schema.List(
        title=u'Columns',
        description=u'Select columns to be shown in table view',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary="eea.googlechartsconfig.vocabularies.FacetsVocabulary")
    )
    details = schema.Bool(
        title=u'Display details column',
        description=(u"Select this if you want to display a column with "
                     "a 'more' link to item details"),
        required=False
    )
