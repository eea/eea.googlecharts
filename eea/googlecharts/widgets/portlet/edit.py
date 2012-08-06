""" Forms
"""
from zope.formlib.form import Fields
from eea.googlecharts.widgets.portlet.interfaces import IPortletAdd
from eea.googlecharts.widgets.portlet.interfaces import IPortletEdit
from eea.googlecharts.widgets.edit import AddForm, EditForm


class Add(AddForm):
    """ Add portlet widget to dashboard
    """
    form_fields = Fields(IPortletAdd)

class Edit(EditForm):
    """ Edit portlet widget
    """
    form_fields = Fields(IPortletEdit)
