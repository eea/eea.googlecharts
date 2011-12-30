""" Custom meta-directives DaViz Views
"""
from zope.interface import implements
from eea.googlechartsconfig.views.charts.interfaces import IChartViews

class ChartViews(object):
    """ Registry for daviz views registered via ZCML
    """
    implements(IChartViews)
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

    if name not in ChartViews._views:
        ChartViews._views.append(name)
