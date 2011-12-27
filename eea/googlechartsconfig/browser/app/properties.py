""" GoogleChart properties
"""
import logging
try:
    import json as simplejson
    simplejson = simplejson # pylint
except ImportError:
    import simplejson
from zope import schema
from zope.interface import Interface
from zope.formlib.form import Fields
from zope.component import queryAdapter
from zope.formlib.form import SubPageForm
from Products.statusmessages.interfaces import IStatusMessage
from zope.formlib.form import action as formaction
from zope.formlib.form import setUpWidgets, haveInputWidgets
from eea.googlechartsconfig.interfaces import IGoogleChartConfig

from zope.i18nmessageid import MessageFactory

_ = MessageFactory("eea.googlechartsconfig")
logger = logging.getLogger('eea.googlechartsconfig')

class IGoogleChartPropertiesEdit(Interface):
    """ Edit googlechart global properties
    """
    views = schema.List(
        title=u'Views',
        description=u'Enable googlechart views',
        unique=True,
        value_type=schema.Choice(
            vocabulary="eea.googlechartsconfig.vocabularies.ViewsVocabulary")
    )
    json = schema.Text(
        title=u"JSON",
        description=u"Edit generated JSON",
        required=False
    )

class EditForm(SubPageForm):
    """ Layer to edit googlechart properties.
    """
    label = u"Global settings"
    form_fields = Fields(IGoogleChartPropertiesEdit)

    def __init__(self, context, request):
        super(EditForm, self).__init__(context, request)
        name = self.__name__
        if isinstance(name, unicode):
            name = name.encode('utf-8')
        self.prefix = name.replace('.edit', '', 1)
        self.message = 'Changes saved'

    @property
    def _data(self):
        """ Form data
        """
        accessor = queryAdapter(self.context, IGoogleChartConfig)
        return {
            'name': self.prefix,
            'json': simplejson.dumps(dict(accessor.json), indent=2),
            'views': [view.get('name') for view in accessor.views],
            'sources':
                [source.get('name') for source in accessor.sources],
        }

    def setUpWidgets(self, ignore_request=False):
        """ Setup widgets
        """
        self.adapters = {}
        self.widgets = setUpWidgets(
            self.form_fields, self.prefix, self.context, self.request,
            form=self, data=self._data, adapters=self.adapters,
            ignore_request=ignore_request)

    def handle_json(self, data):
        """ Handle json property
        """
        mutator = queryAdapter(self.context, IGoogleChartConfig)
        json = data.get('json', '{}')
        try:
            json = dict(simplejson.loads(json))
        except Exception, err:
            logger.exception(err)
            self.message = "ERROR: %s" % err
        else:
            mutator.json = json

    def handle_views(self, data):
        """ Handle views property
        """
        mutator = queryAdapter(self.context, IGoogleChartConfig)
        old = mutator.views
        old = dict((view.get('name', ''), dict(view))
                   for view in old)
        mutator.delete_views()

        for key in data.get('views', []):
            properties = old.get(key, {})
            properties.pop('name', None)
            mutator.add_view(name=key, **properties)

    def handle_sources(self, data):
        """ Handle sources property
        """
        mutator = queryAdapter(self.context, IGoogleChartConfig)
        sources = data.get('sources', [])
        sources = set(sources)
        mutator.delete_sources()
        for source in sources:
            source = source.strip()
            if not source:
                continue

            properties = {
                "name": source,
                "converter": "",
                "type": "json"
            }

            if 'google' in source.lower():
                properties['type'] = 'jsonp'
                properties['converter'] = 'googleSpreadsheets'
            elif 'rdfa' in source.lower():
                properties['type'] = 'RDFa'
            elif ('rdf' in source.lower()) or ('xml' in source.lower()):
                properties['type'] = 'rdf+xml'

            mutator.add_source(**properties)

    @formaction(_('Save'), condition=haveInputWidgets)
    def save(self, action, data):
        """ Handle save action
        """
        self.handle_json(data)
        self.handle_views(data)
        self.handle_sources(data)

        # Return
        name = action.__name__.encode('utf-8')
        value = self.request.form.get(name, '')
        if value == 'ajax':
            return self.message
        return self.nextUrl

    @property
    def nextUrl(self):
        """ Next
        """
        IStatusMessage(self.request).addStatusMessage(self.message, type='info')
        next_url = self.context.absolute_url() + '/googlechart-edit.html'
        self.request.response.redirect(next_url)

