""" Custom Events
"""
from zope.component.interfaces import IObjectEvent

class IChartsEvent(IObjectEvent):
    """ All google charts events should inherit from this class
    """

class IChartsChangedEvent(IChartsEvent):
    """ Charts settings changed
    """
