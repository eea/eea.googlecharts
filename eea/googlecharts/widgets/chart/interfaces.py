""" Widget interfaces
"""
from zope import schema
from zope.interface import Interface

class IAdd(Interface):
    """ Widget add schema
    """
    name = schema.Choice(
        title=u"Chart",
        description=u"Select chart",
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.charts.add"
    )

class IEdit(Interface):
    """ Widget edit schema
    """
    name = schema.Choice(
        title=u"Chart",
        description=u"Select chart",
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.charts.edit"
    )
