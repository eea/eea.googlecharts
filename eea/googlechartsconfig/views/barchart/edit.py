# -*- coding: utf-8 -*-
""" Edit view1
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.formlib.form import Fields
from eea.googlechartsconfig.views.view1.interfaces import IGoogleChartView1Edit
from eea.googlechartsconfig.views.edit import EditForm

class Edit(EditForm):
    """ Edit view1
    """
    label = u"view1 settings"
    form_fields = Fields(IGoogleChartView1Edit)
