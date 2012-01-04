# -*- coding: utf-8 -*-
""" BarChart View
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json
import urllib

from zope.interface import implements
from zope.component import queryAdapter

from eea.daviz.interfaces import IDavizConfig
from eea.daviz.views.view import ViewForm

from eea.googlechartsconfig.views.charts.interfaces import IGoogleChartsView
from eea.googlechartsconfig.converter.exhibit2googlechart import exhibit2googlechart

class View(ViewForm):
    """ ChartsView
    """
    label = 'Charts'
    implements(IGoogleChartsView)

    def settingsAndData(self):
        """ filler """
        pass
