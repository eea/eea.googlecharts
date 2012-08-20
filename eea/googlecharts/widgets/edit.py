""" Forms
"""
from zope.component import queryAdapter
from zope.formlib.form import Fields
from zope.formlib.form import action, setUpWidgets
from zope.formlib.form import SubPageForm
from zope.container.interfaces import INameChooser
from eea.app.visualization.zopera import IStatusMessage
from eea.app.visualization.config import EEAMessageFactory as _
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.googlecharts.widgets.interfaces import IWidgetAdd

class AddForm(SubPageForm):
    """ Common add form for widgets
    """
    @action(_('Save'))
    def save(self, saction, data):
        """ Handle save action
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        viewname = 'googlechart.googledashboard'
        view = mutator.view(viewname, {})
        view.setdefault('widgets', [])

        chooser = queryAdapter(self.context, INameChooser)
        if not chooser:
            chooser = queryAdapter(self.context.getParentNode(), INameChooser)
        name = data.get('name', 'widget')
        data['title'] = name
        data['name'] = chooser.chooseName(name, self.context)
        for widget in view.get('widgets', []):
            if data.get('name', '') == widget.get('name', ''):
                return u'Invalid name. Widget not added'

        data['wtype'] = self.__name__.replace('.add', '', 1)
        data['dashboard'] = {
            'width': 800,
            'height': 600,
            'order': 997,
            'hidden': False
        }
        view['widgets'].append(data)
        mutator.edit_view(viewname, **view)

        name = saction.__name__.encode('utf-8')
        value = self.request.form.get(name, '')
        if value == 'ajax':
            return 'Changes saved'
        return self.nextUrl

    @property
    def nextUrl(self):
        """ Redirect to daviz-edit.html as next_url
        """
        IStatusMessage(self.request).addStatusMessage('Changes saved',
                                                        type='info')
        next_url = self.context.absolute_url() + '/daviz-edit.html'
        self.request.response.redirect(next_url)

    def __call__(self):
        for key, value in self.request.form.items():
            if isinstance(value, str):
                self.request.form[key] = value.decode('utf-8')
        return super(AddForm, self).__call__()

class EditForm(SubPageForm):
    """ Common Edit form for widgets
    """
    def __init__(self, context, request):
        super(EditForm, self).__init__(context, request)
        self.prefix = 'googlechart.googledashboard'
        self.widget_name = ''

    @action(_('Save'))
    def save(self, saction, data):
        """ Handle save action
        """
        name = saction.__name__.encode('utf-8')
        value = self.request.form.get(name, '')
        widgetName = self.request.form.get('name', '')
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.prefix, {})
        widgets = view.get('widgets', [])
        changed = False
        for widget in widgets:
            if widget.get('name', '') == widgetName:
                widget.update(data)
                changed = True
                break

        if changed:
            mutator.edit_view(self.prefix, **view)

        if value == 'ajax':
            return 'Changes saved'

        return self.nextUrl

    @property
    def nextUrl(self):
        """ Redirect to daviz-edit.html as next_url
        """
        IStatusMessage(self.request).addStatusMessage('Changes saved',
                                                        type='info')
        next_url = self.context.absolute_url() + '/daviz-edit.html'
        self.request.response.redirect(next_url)

    @property
    def _data(self):
        """ Return view
        """
        accessor = queryAdapter(self.context, IVisualizationConfig)
        view = accessor.view(self.prefix, {})
        widgets = view.get('widgets', [])
        for widget in widgets:
            if widget.get('name', '') == self.widget_name:
                return widget
        return {}

    def setUpWidgets(self, ignore_request=False):
        """ Sets up widgets
        """
        self.adapters = {}
        self.widgets = setUpWidgets(
            self.form_fields, self.prefix, self.context, self.request,
            form=self, data=self._data, adapters=self.adapters,
            ignore_request=ignore_request)

    def __call__(self):
        for key, value in self.request.form.items():
            if isinstance(value, str):
                self.request.form[key] = value.decode('utf-8')
        self.widget_name = self.request.form.get('name', '')
        return super(EditForm, self).__call__()
#
# Add form to select widget type
#
class Add(AddForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)
