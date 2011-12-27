# -*- coding: utf-8 -*-
""" Converter googlechart interfaces
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.interface import Interface #, Attribute

class IGoogleChartJsonConverter(Interface):
    """ Converts CSV to JSON
    """
