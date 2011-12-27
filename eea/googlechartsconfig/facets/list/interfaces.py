""" List facet
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope.interface import Interface
from zope.schema import TextLine, Bool
from eea.googlechartsconfig.facets.interfaces import IGoogleChartFacet

class IGoogleChartListFacet(IGoogleChartFacet):
    """ GoogleChart list facet
    """
    def gett(key, default):
        """ Get data property
        """

class IGoogleChartListFacetEdit(Interface):
    """ GoogleChart list facet edit
    """
    label = TextLine(title=u'Friendly name',
                     description=u'Label for googlechart facet')
    show = Bool(title=u'Visible', description=u'Is this facet visible?',
            required=False)
