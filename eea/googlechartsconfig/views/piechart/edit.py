# -*- coding: utf-8 -*-
""" Edit PieChart
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.formlib import form

from zope.formlib.form import Fields
from eea.googlechartsconfig.views.piechart.interfaces import IGoogleChartPieChartEdit
from eea.daviz.views.edit import EditForm

from eea.daviz.interfaces import IDavizConfig
from zope.component import queryAdapter

class Edit(EditForm):
    """ Edit PieChart form
    """
    label = u"PieChart settings"
    form_fields = Fields(IGoogleChartPieChartEdit)
