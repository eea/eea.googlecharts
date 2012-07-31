""" Widgets interfaces
"""
from zope import schema
from zope.interface import Interface

class IWidgetsInfo(Interface):
    """ Utility to get available googlecharts dashboard widgets
    """

class IWidgetAdd(Interface):
    """ Add widget
    """
    wtype = schema.Choice(
        title=u'Widget type',
        description=u'Select widget type to add',
        required=True,
        vocabulary=u'eea.googlecharts.vocabularies.Widgets'
    )
