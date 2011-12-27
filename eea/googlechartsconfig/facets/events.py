# -*- coding: utf-8 -*-
""" Facets events module
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import logging
from zope.component import queryAdapter
from eea.googlechartsconfig.interfaces import IGoogleChartConfig
logger = logging.getLogger('eea.googlechartsconfig.facets.events')

def create_default_facets(obj, evt):
    """ Create default facets
    """
    mutator = queryAdapter(obj, IGoogleChartConfig)
    if not mutator:
        logger.warn("Couldn't find any IGoogleChartConfig adapter for %s",
                    obj.absolute_url(1))
        return

    # Remove all facets
    mutator.delete_facets()

    # Add new facets
    for facet, typo in evt.columns:
        show = ('label' not in facet) or ('id' not in facet)
        mutator.add_facet(name=facet, label=facet, show=show, item_type=typo)
