# -*- coding: utf-8 -*-
""" Displays module responsible for retrieval of views
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.interface import implements
from zope.component import adapts
import p4a.z2utils #Patch CMFDynamicViewFTI
#p4a.z2utils # pyflakes
from Products.CMFDynamicViewFTI import interfaces as cmfdynifaces
from eea.googlechartsconfig.interfaces import IGoogleChartJson

class DynamicViews(object):
    """ Display
    """
    implements(cmfdynifaces.IDynamicallyViewable)
    adapts(IGoogleChartJson)

    def __init__(self, context):
        self.context = context

    def getAvailableViewMethods(self):
        """ Get a list of registered view method names
        """
        return [view for view, _name in self.getAvailableLayouts()]

    def getDefaultViewMethod(self):
        """ Get the default view method name
        """
        return 'googlechart-view.html'

    def getAvailableLayouts(self):
        """ Get the layouts registered for this object.
        """
        return (("googlechart-view.html", "GoogleChart View"),)

__all__ = [
        p4a.z2utils
        ]
