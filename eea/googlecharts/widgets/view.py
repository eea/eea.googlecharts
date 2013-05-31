""" Generic view
"""
from zope.component import queryAdapter
from eea.app.visualization.interfaces import IVisualizationConfig
from Products.Five.browser import BrowserView


class View(BrowserView):
    """ Generic widget view
    """
    def __init__(self, context, request):
        super(View, self).__init__(context, request)
        self.widget_name = ''
        self.dashboard_name = ''
        self._dashboard = {}
        self._widget = {}

    @property
    def dashboard(self):
        """ Dashboard
        """
        if self._dashboard:
            return self._dashboard

        mutator = queryAdapter(self.context, IVisualizationConfig)
        dashboards = mutator.view('googlechart.googledashboards', {})
        for dashboard in dashboards.get('dashboards', []):
            if dashboard.get('name', '') == self.dashboard_name:
                self._dashboard = dashboard
                break
        return self._dashboard

    @property
    def widget(self):
        """ Widget
        """
        if self._widget:
            return self._widget

        widgets = self.dashboard.get('widgets', [])
        for widget in widgets:
            if widget.get('name', None) == self.widget_name:
                self._widget = widget
                break
        return self._widget

    def __call__(self, **kwargs):
        form = self.request.form
        form.update(kwargs)
        self.widget_name = form.get('name', '')
        self.dashboard_name = form.get('dashboard', '')
        return self.index()
