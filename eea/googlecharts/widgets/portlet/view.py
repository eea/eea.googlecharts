""" Widget view
"""
from zope.component import queryAdapter
from eea.app.visualization.interfaces import IVisualizationConfig
from Products.Five.browser import BrowserView

class View(BrowserView):
    """ View portlet widget
    """
    def __init__(self, context, request):
        super(View, self).__init__(context, request)
        self.widget_name = ''
        self.default_macro = 'empty'

    @property
    def macro(self):
        """ Portlet macro
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googledashboard', {})
        widgets = view.get('widgets', [])
        for widget in widgets:
            if widget.get('name', None) == self.widget_name:
                return widget.get('macro', self.default_macro)
        return self.default_macro

    def __call__(self, **kwargs):
        form = self.request.form
        form.update(kwargs)
        self.widget_name = form.get('name', '')
        return self.index()
