""" Vocabularies for views
"""
from zope.interface import implements
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary
from zope.schema.vocabulary import SimpleTerm

from zope.i18nmessageid import MessageFactory

_ = MessageFactory("eea.googlechartsconfig")

class ChartTypesVocabulary(object):
    """ Simple vocabulary for Chart Types ( HTML or PNG )
    """
    implements(IVocabularyFactory)
    def __call__(self, context=None):
        chartType = SimpleVocabulary(
            [SimpleTerm(value=u'ImageChart', title=_(u'ImageChart')),
             SimpleTerm(value=u'HTMLChart', title=_(u'HTMLChart'))])
        return chartType

ChartTypesVocabularyFactory = ChartTypesVocabulary()
