""" Forms
"""
from zope.component import queryAdapter
from zope.formlib.form import Fields
from eea.googlecharts.widgets.interfaces import IWidgetAdd
from zope.formlib.form import SubPageForm
from zope.formlib.form import action
from Products.statusmessages.interfaces import IStatusMessage
from eea.app.visualization.config import EEAMessageFactory as _
from eea.app.visualization.interfaces import IVisualizationConfig

class EditForm(SubPageForm):
    """ Common edit form for widgets
    """
    @action(_('Save'))
    def save(self, saction, data):
        """ Handle save action
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        viewname = 'googlechart.googledashboard'
        view = mutator.view(viewname, {})
        view.setdefault('widgets', [])

        for widget in view.get('widgets', []):
            if data.get('name', '') == widget.get('name', ''):
                return u'Invalid name. Widget not added'

        data['wtype'] = self.__name__.replace('.add', '', 1)
        data['dashboard'] = {
            'width': 400,
            'height': 400,
            'order': 0,
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

class Add(EditForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IWidgetAdd)
