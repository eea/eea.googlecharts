# -*- coding: utf-8 -*-
""" charts interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.schema import TextLine
from zope.interface import Interface
from eea.daviz.views.interfaces import IExhibitView

class IViewDirective(Interface):
    """
    Register a charts view
    """
    name = TextLine(
        title=u"The name of the view.",
        description=u"The name shows up in URLs/paths. For example 'googlechart.barchart'",
        required=True,
        default=u'',
        )

class IGoogleChartsView(IExhibitView):
    """ Generic charts interface
    """

class IChartViews(Interface):
    """ Utility to get available chart iews
    """

class IGoogleChartsEdit(Interface):
    """ Charts Edit
    """
    views = schema.List(
        title=u'Chart Types',
        description=u'Select type of chart to implement',
        required=False, unique=True,
        value_type=schema.Choice(
            vocabulary = "eea.googlechartsconfig.vocabularies.ChartsVocabulary")
    )

