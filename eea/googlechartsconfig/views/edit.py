""" Edit GoogleCharts
"""
import json

from StringIO import StringIO

from Products.Five import BrowserView

from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from eea.daviz.interfaces import IDavizConfig

class Edit(BrowserView):
    """ Edit GoogleCharts form
    """
    label = "Googlechart Edit"
    def submit_charts(self):
        """ Submit
        """
        mutator = queryAdapter(self.context, IDavizConfig)
        data = {}
        data['chartsconfig'] = self.request['charts']
        mutator.edit_view('googlechart.googlecharts', **data)

        return 'Changes saved'

    def get_charts(self):
        """ Charts
        """
        mutator = queryAdapter(self.context, IDavizConfig)
        config = ''
        for view in mutator.views:
            if (view.get('chartsconfig')):
                config = view.get('chartsconfig')
        return config

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
        result_json = json.load(StringIO(result))
        stripped_result = {}
        stripped_result['properties'] = result_json['properties']
        stripped_result['items'] = result_json['items'][:5]
        return json.dumps(stripped_result)