""" Widgets interfaces
"""
from zope import schema
from zope.interface import Interface
from eea.googlecharts.config import EEAMessageFactory as _


class IWidgetsInfo(Interface):
    """ Utility to get available googlecharts dashboard widgets
    """

class IWidgetAdd(Interface):
    """ Add widget
    """
    wtype = schema.Choice(
        title=_(u'Widget type'),
        description=_(u'Select widget type to add'),
        required=True,
        vocabulary=u'eea.googlecharts.vocabularies.Widgets'
    )
