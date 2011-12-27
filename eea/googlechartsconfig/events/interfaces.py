""" GoogleChart Events interfaces
"""

__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Alec Ghica, Alin Voinea"""

from zope.component.interfaces import IObjectEvent

class IGoogleChartEvent(IObjectEvent):
    """ All googlechart events should inherit from this class
    """

class IGoogleChartEnabledEvent(IGoogleChartEvent):
    """ GoogleChart was enabled
    """

class IGoogleChartFacetDeletedEvent(IGoogleChartEvent):
    """ GoogleChart facet deleted
    """

__all__ = [
    IGoogleChartEvent,
    IGoogleChartEnabledEvent,
    IGoogleChartFacetDeletedEvent,
]
