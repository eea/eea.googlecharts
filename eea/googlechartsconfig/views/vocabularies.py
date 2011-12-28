""" Vocabularies for views
"""
import operator
from zope.component import getUtility, queryMultiAdapter
from zope.interface import implements
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleVocabulary
from zope.schema.vocabulary import SimpleTerm
from eea.googlechartsconfig.views.interfaces import IGoogleChartViews

from zope.i18nmessageid import MessageFactory

_ = MessageFactory("eea.googlechartsconfig")

class ViewsVocabulary(object):
    """ Available registered googlechart views
    """
    implements(IVocabularyFactory)

    def _adapters(self, context):
        """ Return adapters
        """
        views = getUtility(IGoogleChartViews)
        for view in views():
            browser = queryMultiAdapter((context, context.REQUEST), name=view)
            yield view, getattr(browser, 'label', view)

    def __call__(self, context=None):
        """ See IVocabularyFactory interface

        views = [
          (u'googlechart.view1', 'View1'),
          (u'googlechart.view2', 'View2')
        ]
        """
        views = [(name, label) for name, label in self._adapters(context)]
        views.sort(key=operator.itemgetter(1))
        views = [SimpleTerm(key, key, val) for key, val in views]
        return SimpleVocabulary(views)

ViewsVocabularyFactory = ViewsVocabulary()


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
