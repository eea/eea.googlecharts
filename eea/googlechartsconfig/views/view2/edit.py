# -*- coding: utf-8 -*-
""" Edit view2
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.formlib.form import Fields
from eea.googlechartsconfig.views.view2.interfaces import IGoogleChartView2Edit
from eea.googlechartsconfig.views.edit import EditForm

class Edit(EditForm):
    """ Edit view2
    """
    label = u"view2 settings"
    form_fields = Fields(IGoogleChartView2Edit)
