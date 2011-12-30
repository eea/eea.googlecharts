# -*- coding: utf-8 -*-
""" Edit BarChart
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.formlib.form import Fields
from eea.googlechartsconfig.views.charts.interfaces import IGoogleChartsEdit
from eea.daviz.views.edit import EditForm

class Edit(EditForm):
    """ Edit Charts form
    """
    label = u"Charts settings"
    form_fields = Fields(IGoogleChartsEdit)
