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
        description=_(u"Select the chart for which you want the multiples"),
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.multiples.add"
    )
    multiples_settings = schema.TextLine(
        title=_(u"Settings"),
        description=_(u"JSON of small multiple settings"),
        required=False
    )


class IEdit(Interface):
    """ Widget edit schema
    """
    name = schema.Choice(
        title=_(u"Chart"),
        description=_(u"Select the chart for which you want the multiples"),
        required=True,
        vocabulary=u"eea.googlecharts.vocabularies.multiples.edit"
    )
    multiples_settings = schema.TextLine(
        title=_(u"Settings"),
        description=_(u"JSON of small multiple settings"),
        required=False
    )
