""" Widget interfaces
"""
from zope import schema
from zope.interface import Interface

class IPortletAdd(Interface):
    """ Portlet widget add schema
    """
    name = schema.TextLine(
        title=u'Name',
        description=u"Widget's name",
        required=True
    )

    macro = schema.TextLine(
        title=u'Macro',
        description=(u'Portlet macro '
                     '(e.g. here/navigation/macros/portlet)'),
        required=True
    )

class IPortletEdit(Interface):
    """ Portlet widget edit schema
    """
    title = schema.TextLine(
        title=u'Title',
        description=u"Widget's title",
        required=True
    )

    macro = schema.TextLine(
        title=u'Macro',
        description=(u'Portlet macro '
                     '(e.g. here/navigation/macros/portlet)'),
        required=True
    )
