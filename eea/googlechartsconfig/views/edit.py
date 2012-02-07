""" Edit GoogleCharts
"""
import json
import logging

from Products.Five import BrowserView

from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from eea.daviz.interfaces import IDavizConfig

logger = logging.getLogger('eea.googlecharts')

class Edit(BrowserView):
    """ Edit GoogleCharts form
    """
    label = "Googlechart Edit"
    def submit_charts(self):
        """ Submit
        """
        mutator = queryAdapter(self.context, IDavizConfig)
        data = {}
        data['chartsconfig'] = json.loads(self.request['charts'])
        mutator.edit_view('googlechart.googlecharts', **data)

        return 'Changes saved'

    def get_charts(self):
        """ Charts
        """
        mutator = queryAdapter(self.context, IDavizConfig)
        config = {}
        for view in mutator.views:
            if (view.get('chartsconfig')):
                config = view.get('chartsconfig')
        return json.dumps(config)

    def get_columns(self):
        """ Columns
        """
        vocab = getUtility(IVocabularyFactory,
                               name="eea.daviz.vocabularies.FacetsVocabulary")
        terms = [[term.token, term.title] for term in vocab(self.context)]
        return json.dumps(dict(terms))

    def get_rows(self):
        """ Rows
        """
        result = getMultiAdapter((self.context, self.request),
                                 name="daviz-relateditems.json")()
        result_json = json.loads(result)
        stripped_result = {}
        stripped_result['properties'] = result_json['properties']
        stripped_result['items'] = result_json['items'][:5]
        return json.dumps(stripped_result)

    def get_allrows(self):
        """ All Rows
        """
        result = getMultiAdapter((self.context, self.request),
                                 name="daviz-relateditems.json")()
        result_json = json.loads(result)
        stripped_result = {}
        stripped_result['properties'] = result_json['properties']
        stripped_result['items'] = result_json['items']
        return json.dumps(stripped_result)

class DashboardEdit(Edit):
    """ Edit google dashboard
    """
    def chart(self, **kwargs):
        """ Edit chart properties
        """
        name = kwargs.get('name', '')
        if not name:
            msg = 'Empty chart name provided %s' % name
            logger.exception(msg)
            return msg

        mutator = queryAdapter(self.context, IDavizConfig)
        dashboard = kwargs.pop('dashboard', "{}")
        try:
            dashboard = json.loads(dashboard)
        except Exception, err:
            logger.exception(err)
            return err

        view = mutator.view('googlechart.googlecharts')
        if not view:
            msg = 'Invalid view googlechart.googlecharts'
            logger.exception(msg)
            return msg

        config = view.get('chartsconfig', {})
        charts = config.get('charts', [])
        changed = False
        for chart in charts:
            if chart.get('id', '') == name:
                chart['dashboard'] = dashboard
                changed = True
                break

        if changed:
            mutator.edit_view('googlechart.googlecharts', **view)
        return u"Changes saved"

    def dashboard(self, **kwargs):
        """ Edit dashboard properties
        """
        return "Not implemented ERROR"

    def __call__(self, **kwargs):
        form = getattr(self.request, 'form', {})
        kwargs.update(form)

        if kwargs.pop('action', '') == 'chart':
            return self.chart(**kwargs)
        return self.index()
