""" Forms
"""
from zope.component import queryAdapter
from zope.formlib.form import Fields
from eea.googlecharts.widgets.textarea.interfaces import IWidgetAdd
from eea.googlecharts.widgets.edit import EditForm
from Products.Five.browser import BrowserView
from eea.app.visualization.interfaces import IVisualizationConfig

class Add(EditForm):
    """ Add textarea widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)

class Edit(BrowserView):
    """ Edit form
    """
    def __init__(self, context, request):
        super(Edit, self).__init__(context, request)
        self.widget_name = ''

    @property
    def name(self):
        """ Widget name
        """
        return self.widget_name

    @property
    def dashboard(self):
        """ Widget settings
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googledashboard', {})
        widgets = view.get('widgets', [])
        for widget in widgets:
            if widget.get('name', None) == self.widget_name:
                return widget.get('dashboard', {})
        return {}

    @property
    def text(self):
        """ Widget text
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googledashboard', {})
        widgets = view.get('widgets', [])
        for widget in widgets:
            if widget.get('name', None) == self.widget_name:
                return widget.get('text', '')
        return ''

    def __call__(self, **kwargs):
        form = self.request.form
        form.update(kwargs)
        self.widget_name = form.get('name', '')
        return self.index()
