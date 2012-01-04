# -*- coding: utf-8 -*-
""" Module that contains default view
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Alin Voinea"""

from eea.daviz.browser.app import view
from eea.googlechartsconfig.app.interfaces import IChartsConfig

from zope.component import queryAdapter, queryMultiAdapter

class View(view.View):
    """ Default view
    """
    @property
    def viewCategories(self):
        """ Returns view categories
        """
        views = self.accessor.views

        categories = []
        for view in views:
            if view.get('name').split('.')[0] not in categories:
                categories.append(view.get('name').split('.')[0])
        return categories

    def get_viewsforcategory(self, category):
        """ Returns views for a category
        """
        if category == 'daviz':
            views = self.accessor.views
            views = [view.get('name') for view in views if view.get('name').split('.')[0] == category]
        else:
            charts = queryAdapter(self.context, IChartsConfig)
            views  = [view.get('name') for view in charts.views]
        return views

