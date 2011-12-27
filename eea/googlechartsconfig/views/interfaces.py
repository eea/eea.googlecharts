# -*- coding: utf-8 -*-
""" Views googlechart configuration interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.interface import Interface
from zope.schema import TextLine

class IGoogleChartView(Interface):
    """ Access / update googlechart view configuration
    """
    label = TextLine(title=u'Label for googlechart view')

class IViewDirective(Interface):
    """
    Register a daviz view
    """
    name = TextLine(
        title=u"The name of the view.",
        description=u"The name shows up in URLs/paths. For example 'googlechart.map'",
        required=True,
        default=u'',
        )

class IGoogleChartViews(Interface):
    """ Utility to get available googlechart views
    """
