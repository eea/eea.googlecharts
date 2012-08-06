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

    text = schema.Text(
        title=u"Text",
        description=u"Widget's body",
        required=False
    )

class IWidgetEdit(Interface):
    """ Widget edit schema
    """
    title = schema.TextLine(
        title=u'Title',
        description=u"Widget's title",
        required=True
    )

    text = schema.Text(
        title=u"Text",
        description=u"Widget's body",
        required=False
    )
