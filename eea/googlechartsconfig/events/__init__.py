""" GoogleChartsConfig/events init module with GoogleChartEnabledEvent class
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Alec Ghica, Alin Voinea"""

from zope.interface import implements
from eea.googlechartsconfig.events.interfaces import IGoogleChartEnabledEvent
from eea.googlechartsconfig.events.interfaces import IGoogleChartFacetDeletedEvent

class GoogleChartEnabledEvent(object):
    """ Sent if a document was converted to googlechart json
    """
    implements(IGoogleChartEnabledEvent)

    def __init__(self, context, **kwargs):
        self.object = context
        self.columns = kwargs.get('columns', [])

class GoogleChartFacetDeletedEvent(object):
    """ Sent if a googlechart facet was deleted
    """
    implements(IGoogleChartFacetDeletedEvent)

    def __init__(self, context, **kwargs):
        self.object = context
        self.facet = kwargs.get('facet', '')
