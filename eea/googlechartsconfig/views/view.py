# -*- coding: utf-8 -*-
""" Basic layer for googlechart views
"""

__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.component import queryAdapter
from Products.Five.browser import BrowserView
from eea.daviz.app.interfaces import IDavizConfig

class ViewForm(BrowserView):
    """ Basic layer for googlechart views. For more details on how to use this,
    see implementation in eea.googlechartsconfig.views.view1.view.View.
    """
    label = ''
    _data = {}

    @property
    def data(self):
        """ Return saved configuration
        """
        if self._data:
            return self._data

        accessor = queryAdapter(self.context, IDavizConfig)
        self._data = accessor.view(self.__name__, {})
        return self._data
