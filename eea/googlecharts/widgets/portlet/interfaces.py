""" Widget interfaces
"""
from zope import schema
from zope.interface import Interface
from eea.googlecharts.config import EEAMessageFactory as _

class IPortletAdd(Interface):
    """ Portlet widget add schema
    """
    name = schema.TextLine(
        title=_(u'Name'),
        description=_(u"Widget's name"),
        required=True
    )

    macro = schema.TextLine(
        title=_(u'Macro'),
        description=_(u'Portlet macro '
                     '(e.g. here/navigation/macros/portlet)'),
        required=True
    )

class IPortletEdit(Interface):
    """ Portlet widget edit schema
    """
    title = schema.TextLine(
        title=_(u'Title'),
        description=_(u"Widget's title"),
        required=True
    )

    macro = schema.TextLine(
        title=_(u'Macro'),
        description=_(u'Portlet macro '
                     '(e.g. here/navigation/macros/portlet)'),
        required=True
    )
