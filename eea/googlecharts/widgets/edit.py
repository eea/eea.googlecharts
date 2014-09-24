""" Forms
"""
from zope.component import queryAdapter
from zope.formlib.form import Fields
from zope.formlib.form import action, setUpWidgets
from zope.formlib.form import SubPageForm as BaseForm
from zope.container.interfaces import INameChooser
from eea.app.visualization.zopera import IStatusMessage
from eea.app.visualization.config import EEAMessageFactory as _
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.googlecharts.widgets.interfaces import IWidgetAdd

class SubPageForm(BaseForm):
    """ Common Form
    """
    def __init__(self, context, request):
        super(SubPageForm, self).__init__(context, request)
        self._dashboards = {}
        self._dashboard = {}
        self.prefix = self.request.form.get('dashboard', '')
        self.widget_name = self.request.form.get('name', '')

    @property
    def dashboards(self):
        """ Get dashboards from annotations
        """
        if not self._dashboards:
            mutator = queryAdapter(self.context, IVisualizationConfig)
            self._dashboards = mutator.view('googlechart.googledashboards', {})
        return self._dashboards

    @dashboards.setter
    def dashboards(self, value):
        """ Update dashboards settings
        """
        if value == 'Changed':
            value = self.dashboards

        mutator = queryAdapter(self.context, IVisualizationConfig)
        mutator.edit_view('googlechart.googledashboards', **value)

    @property
    def dashboard(self):
        """ Return dashboard by name
        """
        if not self._dashboard:
            for dashboard in self.dashboards.get('dashboards', []):
                if dashboard.get('name', '') == self.prefix:
                    self._dashboard = dashboard
                    break
        return self._dashboard

    @property
    def nextUrl(self):
        """ Redirect to daviz-edit.html as next_url
        """
        IStatusMessage(self.request).addStatusMessage(_('Changes saved'),
                                                        type='info')
        next_url = self.context.absolute_url() + '/daviz-edit.html'
        self.request.response.redirect(next_url)

    def __call__(self):
        for key, value in self.request.form.items():
            if isinstance(value, str):
                self.request.form[key] = value.decode('utf-8')
        self.prefix = self.request.form.get('dashboard', '')
        self.widget_name = self.request.form.get('name', '')
        return super(SubPageForm, self).__call__()

class AddForm(SubPageForm):
    """ Common add form for widgets
    """

    def prepare(self, data):
        """ Prepare data to be saved
        """
        chooser = queryAdapter(self.context, INameChooser)
        if not chooser:
            chooser = queryAdapter(self.context.getParentNode(), INameChooser)
        name = data.get('name', 'widget')
        data.setdefault('title', name)
        data['name'] = chooser.chooseName(name, self.context)
        data['wtype'] = self.__name__.replace('.add', '', 1)
        data['dashboard'] = {
            'width': 800,
            'height': 600,
            'order': 997,
            'hidden': False
        }
        return data

    @action(_('Save'))
    def save(self, saction, data):
        """ Handle save action
        """
        self.dashboard.setdefault('widgets', [])

        data = self.prepare(data)
        for widget in self.dashboard.get('widgets', []):
            if data.get('name', '') == widget.get('name', '') and \
                data.get('wtype', '') == widget.get('wtype', ''):
                return u'Invalid name. Widget not added'

        self.dashboard['widgets'].append(data)
        self.dashboards = 'Changed'

        name = saction.__name__.encode('utf-8')
        value = self.request.form.get(name, '')
        if value == 'ajax':
            return 'Changes saved'
        return self.nextUrl

class EditForm(SubPageForm):
    """ Common Edit form for widgets
    """
    def prepare(self, data):
        """ Update data dict
        """
        return data

    @action(_('Save'))
    def save(self, saction, data):
        """ Handle save action
        """
        name = saction.__name__.encode('utf-8')
        value = self.request.form.get(name, '')
        widgetName = self.request.form.get('name', '')

        widgets = self.dashboard.get('widgets', [])

        data = self.prepare(data)

        changed = False
        for widget in widgets:
            if widget.get('name', '') == widgetName:
                widget.update(data)
                changed = True
                break

        if changed:
            self.dashboards = 'Changed'

        if value == 'ajax':
            return _('Changes saved')

        return self.nextUrl

    @property
    def _data(self):
        """ Return view
        """
        widgets = self.dashboard.get('widgets', [])
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
#
# Add form to select widget type
#
class Add(AddForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)
