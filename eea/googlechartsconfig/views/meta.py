""" Custom meta-directives GoogleChart Views
"""
from zope.interface import implements
from eea.googlechartsconfig.views.interfaces import IGoogleChartViews
from eea.daviz.views.interfaces import IDavizViews

class GoogleChartViews(object):
    """ Registry for googlechart views registered via ZCML
    """
    implements(IDavizViews)
    _views = []

    @property
    def views(self):
        """ Views
        """
        return self._views

    def __call__(self):
        return self.views

def ViewDirective(_context, name=None, **kwargs):
    """ Register faceted widgets
    """
    if not name:
        raise TypeError("No name provided")

    if name not in GoogleChartViews._views:
        GoogleChartViews._views.append(name)
