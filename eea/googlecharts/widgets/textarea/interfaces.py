""" Textarea interfaces
"""
from zope import schema
from zope.interface import Interface

class IWidgetAdd(Interface):
    """ Widget add schema
    """
    name = schema.TextLine(
        title=u'Name',
        description=u"Widget's name",
        required=True
    )
