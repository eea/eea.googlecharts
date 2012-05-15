""" Googlecharts interfaces
"""
from zope.interface import Interface
from eea.app.visualization.views.interfaces import IVisualizationView

class IGoogleCharts(IVisualizationView):
    """ GoogleCharts
    """

class IGoogleChartsEdit(Interface):
    """ Google Charts Edit Form
    """
