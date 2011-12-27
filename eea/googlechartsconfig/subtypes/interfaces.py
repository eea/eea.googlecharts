# -*- coding: utf-8 -*-
""" Subtypes googlechart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.annotation.interfaces import IAnnotations
from zope.annotation.attribute import AttributeAnnotations
from zope import schema
from zope.interface import Interface

class IPossibleGoogleChartJson(Interface):
    """ Objects which can have GoogleChart Json exported data.
    """

class IGoogleChartJson(Interface):
    """ Objects which have GoogleChart Json exported data.
    """

class IGoogleChartSubtyper(Interface):
    """ Support for subtyping objects
    """

    can_enable = schema.Bool(u'Can enable googlechart view',
                             readonly=True)
    can_disable = schema.Bool(u'Can disable disable googlechart view',
                              readonly=True)
    is_googlechart = schema.Bool(u'Is current object googlechart enabled',
                             readonly=True)

    def enable():
        """ Enable googlechart view
        """

    def disable():
        """ Disable googlechart view
        """

__all__ = [
    IAnnotations,
    AttributeAnnotations
]


