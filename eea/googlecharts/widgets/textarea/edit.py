""" Forms
"""
from zope.formlib.form import Fields
from eea.googlecharts.widgets.textarea.interfaces import IWidgetAdd, IWidgetEdit
from eea.googlecharts.widgets.edit import AddForm, EditForm

class Add(AddForm):
    """ Add textarea widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)

class Edit(EditForm):
    """ Edit form
    """
    form_fields = Fields(IWidgetEdit)
