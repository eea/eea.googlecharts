""" Edit
"""
from zope.browserpage.viewpagetemplatefile import ViewPageTemplateFile
from zope.component import queryUtility
from zope.formlib.form import Fields
from zope.schema.interfaces import IVocabularyFactory
from eea.googlecharts.widgets.multiples.interfaces import IAdd
from eea.googlecharts.widgets.multiples.interfaces import IEdit
from eea.googlecharts.widgets.edit import AddForm, EditForm


class Add(AddForm):
    """ Add widget to dashboard
    """
    form_fields = Fields(IAdd)

    template = ViewPageTemplateFile('edit.pt')

    page = "add"

    def prepare(self, data):
        """ Update data dict
        """
        data = super(Add, self).prepare(data)
        #add "multiples_" prefix so we can make a difference
        #between charts and small multiples
        data['name'] = 'multiples_' + data['name']

        voc = queryUtility(IVocabularyFactory,
                           name=u'eea.googlecharts.vocabularies.multiples')
        for term in voc(self.context):
            if term.value == data.get('name', ''):
                data['title'] = term.title
                data['path'] = term.token
        return data

class Edit(EditForm):
    """ Edit dashboard widget
    """
    form_fields = Fields(IEdit)

    template = ViewPageTemplateFile('edit.pt')

    page = "edit"

    def prepare(self, data):
        """ Update data dict
        """
        data = super(Edit, self).prepare(data)
        data['name'] = 'multiples_' + data['name']

        voc = queryUtility(IVocabularyFactory,
                           name=u'eea.googlecharts.vocabularies.multiples')
        for term in voc(self.context):
            if term.value == data.get('name', ''):
                data['title'] = term.title
                data['path'] = term.token
        return data
