""" Forms
"""
from zope.formlib.form import Fields
from eea.googlecharts.widgets.textarea.interfaces import IWidgetAdd
from eea.googlecharts.widgets.edit import EditForm

class Add(EditForm):
    """ Add textarea widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)
