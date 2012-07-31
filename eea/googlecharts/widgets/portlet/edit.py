""" Forms
"""
from zope.formlib.form import Fields
from eea.googlecharts.widgets.portlet.interfaces import IPortletAdd
from eea.googlecharts.widgets.edit import EditForm

class Add(EditForm):
    """ Add portlet widget to dashboard
    """
    form_fields = Fields(IPortletAdd)
