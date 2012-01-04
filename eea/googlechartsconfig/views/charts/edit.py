# -*- coding: utf-8 -*-
""" Edit Charts
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.formlib import interfaces, namedtemplate
from zope.app.pagetemplate import ViewPageTemplateFile

from eea.googlechartsconfig.views.edit import EditForm

from eea.googlechartsconfig.views.charts.interfaces import IGoogleChartsEdit
from zope.formlib.form import Fields


subpage_template = namedtemplate.NamedTemplateImplementation(
    ViewPageTemplateFile('edit.pt'), interfaces.ISubPageForm)

class Edit(EditForm):
    """ Edit Charts form
    """
    label = u"Charts settings"
    form_fields = Fields(IGoogleChartsEdit)
    template = namedtemplate.NamedTemplate('charts.edit')
