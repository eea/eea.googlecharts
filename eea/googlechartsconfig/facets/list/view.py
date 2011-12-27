# -*- coding: utf-8 -*-
""" List facets view module
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.interface import implements
from eea.googlechartsconfig.facets.list.interfaces import IGoogleChartListFacet
from Products.Five.browser import BrowserView

class View(BrowserView):
    """ list facets BrowserView
    """
    implements(IGoogleChartListFacet)

    label = 'List'

    def __init__(self, context, request):
        """ List facets BrowserView init
        """
        self.context = context
        self.request = request
        self._data = {}

    def set_data(self, data):
        """ Set facets data
        """
        self._data = data

    def get_data(self):
        """ Get facets data
        """
        return self._data

    data = property(get_data, set_data)

    def gett(self, key, default=None):
        """ Getter facets data
        """
        return self.data.get(key, default)
