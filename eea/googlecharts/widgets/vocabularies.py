""" Vocabularies for views
"""
from zope.component import getUtility
from zope.interface import implements
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary
from zope.schema.vocabulary import SimpleTerm
from eea.googlecharts.widgets.interfaces import IWidgetsInfo

class Widgets(object):
    """ Available registered exhibit views
    """
    implements(IVocabularyFactory)

    def __call__(self, context=None):
        """ See IVocabularyFactory interface
        """
        info = getUtility(IWidgetsInfo)
        widgets = [SimpleTerm(key, key, val)
                   for key, val in info.widgets.items()]
        return SimpleVocabulary(widgets)
