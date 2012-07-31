""" Widget interfaces
"""
from zope import schema
from zope.interface import Interface

class IPortletAdd(Interface):
    """ Portlet widget add schema
    """
    name = schema.TextLine(
        title=u'Name',
        description=u'Widget name',
        required=True
    )

    macro = schema.TextLine(
        title=u'Macro',
        description=(u'Portlet macro '
                     '(e.g. here/navigation/macros/portlet)'),
        required=True
    )
