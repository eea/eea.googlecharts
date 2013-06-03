""" Widget interfaces
"""
from zope import schema
from zope.interface import Interface
from eea.googlecharts.config import EEAMessageFactory as _

class IAdd(Interface):
    """ Widget add schema
    """
    name = schema.Choice(
        title=_(u"Chart"),
        description=_(u"Select chart"),
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.charts.add"
    )

class IEdit(Interface):
    """ Widget edit schema
    """
    name = schema.Choice(
        title=_(u"Chart"),
        description=_(u"Select chart"),
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.charts.edit"
    )
