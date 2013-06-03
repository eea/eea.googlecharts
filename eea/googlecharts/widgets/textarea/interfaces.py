""" Textarea interfaces
"""
from zope import schema
from zope.interface import Interface
from eea.googlecharts.config import EEAMessageFactory as _

class IWidgetAdd(Interface):
    """ Widget add schema
    """
    name = schema.TextLine(
        title=_(u'Name'),
        description=_(u"Widget's name"),
        required=True
    )

    text = schema.Text(
        title=_(u"Text"),
        description=_(u"Widget's body"),
        required=False
    )

class IWidgetEdit(Interface):
    """ Widget edit schema
    """
    title = schema.TextLine(
        title=_(u'Title'),
        description=_(u"Widget's title"),
        required=True
    )

    text = schema.Text(
        title=_(u"Text"),
        description=_(u"Widget's body"),
        required=False
    )
