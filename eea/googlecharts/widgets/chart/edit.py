""" Edit
"""
from zope.formlib.form import Fields
from eea.googlecharts.widgets.chart.interfaces import IAdd
from eea.googlecharts.widgets.chart.interfaces import IEdit
from eea.googlecharts.widgets.edit import AddForm, EditForm


class Add(AddForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IAdd)

class Edit(EditForm):
    """ Edit dashboard widget
    """
    form_fields = Fields(IEdit)
