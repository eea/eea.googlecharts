""" Custom charts events
"""
from zope.interface import implements
from eea.googlecharts.interfaces import IChartsChangedEvent

class ChartsChanged(object):
    """ Charts settings changed
    """
    implements(IChartsChangedEvent)

    def __init__(self, context, **kwargs):
        self.object = context
        self.config = kwargs.get('config', {})
