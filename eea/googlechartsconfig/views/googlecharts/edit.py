# -*- coding: utf-8 -*-
""" Edit GoogleCharts
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from Products.Five import BrowserView

from zope.component import queryAdapter
from eea.daviz.interfaces import IDavizConfig

class Edit(BrowserView):
    """ Edit GoogleCharts form
    """

    def submit_charts(self):
        mutator = queryAdapter(self.context, IDavizConfig)
        data = {}
        data['chartsconfig'] = self.request['charts']
        mutator.edit_view('googlechart.googlecharts', **data)

        return 'Changes saved'

    def get_charts(self):
        mutator = queryAdapter(self.context, IDavizConfig)
        config = ''
        for view in mutator.views:
            if (view.get('chartsconfig')):
                config = view.get('chartsconfig')
        return config
