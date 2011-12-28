# -*- coding: utf-8 -*-
""" Edit BarChart
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.formlib.form import Fields
from eea.googlechartsconfig.views.barchart.interfaces import IGoogleChartBarChartEdit
from eea.googlechartsconfig.views.edit import EditForm

class Edit(EditForm):
    """ Edit BarChart form
    """
    label = u"BarChart settings"
    form_fields = Fields(IGoogleChartBarChartEdit)
