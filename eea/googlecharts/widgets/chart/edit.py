""" Edit
"""
from zope.component import queryUtility
from zope.formlib.form import Fields
from zope.schema.interfaces import IVocabularyFactory
from eea.googlecharts.widgets.chart.interfaces import IAdd
from eea.googlecharts.widgets.chart.interfaces import IEdit
from eea.googlecharts.widgets.edit import AddForm, EditForm


class Add(AddForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IAdd)

    def prepare(self, data):
        """ Update data dict
        """
        data = super(Add, self).prepare(data)
        voc = queryUtility(IVocabularyFactory,
                           name=u'eea.googlecharts.vocabularies.charts')
        for term in voc(self.context):
            if term.value == data.get('name', ''):
                data['title'] = term.title
                data['path'] = term.token
        return data

class Edit(EditForm):
    """ Edit dashboard widget
    """
    form_fields = Fields(IEdit)

    def prepare(self, data):
        """ Update data dict
        """
        data = super(Edit, self).prepare(data)

        voc = queryUtility(IVocabularyFactory,
                           name=u'eea.googlecharts.vocabularies.charts')
        for term in voc(self.context):
            if term.value == data.get('name', ''):
                data['title'] = term.title
                data['path'] = term.token
        return data
