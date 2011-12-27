# -*- coding: utf-8 -*-
""" Views events
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import logging
from zope.component import queryAdapter
from eea.googlechartsconfig.interfaces import IGoogleChartConfig
logger = logging.getLogger('eea.googlechartsconfig.views.events')

def create_default_views(obj, evt):
    """ Create default views
    """

    mutator = queryAdapter(obj, IGoogleChartConfig)
    if not mutator:
        logger.warn("Couldn't find any IGoogleChartConfig adapter for %s",
                    obj.absolute_url(1))
        return

    # Remove all views
    mutator.delete_views()

    # Add default view: View1 view
    mutator.add_view(name=u'googlechart.view1')

def facet_deleted(obj, evt, googlechart_view):
    """ Cleanup removed facet from view properties
    """
    facet = evt.facet
    mutator = queryAdapter(obj, IGoogleChartConfig)
    if not mutator:
        logger.warn("Couldn't find any IGoogleChartConfig adapter for %s",
                    obj.absolute_url(1))
        return

    view = mutator.view(googlechart_view)
    if not view:
        return

    changed = False
    properties = dict(view)
    for key, value in properties.items():
        if isinstance(value, (unicode, str)):
            if value == facet:
                properties.pop(key)
                changed = True
        elif isinstance(value, (list, tuple)):
            if facet in value:
                value = list(item for item in value if item != facet)
                properties[key] = value
                changed = True

    if changed:
        mutator.edit_view(googlechart_view, **properties)
