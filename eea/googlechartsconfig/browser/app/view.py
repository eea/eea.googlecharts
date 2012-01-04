# -*- coding: utf-8 -*-
""" Module that contains default view
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Alin Voinea"""

from eea.daviz.browser.app import view

class View(view.View):
    """ Default view
    """
    @property
    def viewCategories(self):
        """ Returns view categories
        """
        views = self.accessor.views

        categories = []
        for v in views:
            if v.get('name').split('.')[0] not in categories:
                categories.append(v.get('name').split('.')[0])
        return categories

    def get_viewsforcategory(self, category):
        """ Returns views for a category
        """
        views = self.accessor.views
        views = [v.get('name') for v in views if v.get('name').split('.')[0] == category]
        return views

