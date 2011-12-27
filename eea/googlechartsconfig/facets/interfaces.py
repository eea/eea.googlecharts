# -*- coding: utf-8 -*-
""" Facets googlechart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.interface import Interface

class IGoogleChartFacet(Interface):
    """ Access / update one googlechart facet configuration
    """

class IGoogleChartAddFacet(Interface):
    """ Add googlechart facet
    """
    name = schema.TextLine(
        title=u'Id',
        description=(u"Facet id. Same as the key id in your GoogleChart JSON. "
                     "(e.g. publishDate)"))
    label = schema.TextLine(
        title=u'Friendly name',
        description=u"Label for googlechart facet (e.g. Effective Date)",
        required=False
    )
