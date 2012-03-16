""" Edit GoogleCharts
"""
import json
import logging

from Products.Five import BrowserView

from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from eea.app.visualization.interfaces import IVisualizationConfig

logger = logging.getLogger('eea.googlecharts')

class Edit(BrowserView):
    """ Edit GoogleCharts form
    """
    label = "Googlechart Edit"
    def submit_charts(self):
        """ Submit
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        data = {}
        data['chartsconfig'] = json.loads(self.request['charts'])
        mutator.edit_view('googlechart.googlecharts', **data)

        return 'Changes saved'

    def get_charts(self):
        """ Charts
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        config = {}
        for view in mutator.views:
            if view.get('chartsconfig'):
                config = view.get('chartsconfig')
                break
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
    def json(self, **kwargs):
        """ Return config JSON
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        return json.dumps(dict(view))

    def chartEdit(self, **kwargs):
        """ Edit chart properties
        """
        name = kwargs.get('name', '')
        if not name:
            msg = 'Empty chart name provided %s' % name
            logger.exception(msg)
            return msg

        mutator = queryAdapter(self.context, IVisualizationConfig)
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

    def chartsPosition(self, **kwargs):
        """ Change chats position in dashboard
        """
        order = kwargs.get('order', [])
        order = dict((name, index) for index, name in enumerate(order))

        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googlecharts', {})
        config = view.get('chartsconfig', {})
        charts = config.get('charts', [])

        changed = False
        for chart in charts:
            dashboard = chart.get('dashboard', {})
            if not dashboard:
                continue

            name = chart.get('id', '')
            new_order = order.get(name, -1)
            my_order = dashboard.get('order', -1)
            if my_order == new_order:
                continue

            dashboard['order'] = new_order
            changed = True

        if changed:
            mutator.edit_view('googlechart.googlecharts', **view)
        return u'Changed saved'

    def chartsSize(self, **kwargs):
        """ Change filters box size
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        width = kwargs.get('width', '100%')
        height = kwargs.get('height', 'auto')
        view.setdefault('chartsBox', {})
        view['chartsBox']['width'] = width
        view['chartsBox']['height'] = height
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return 'Charts box resized'

    def filterAdd(self, **kwargs):
        """ Add filter
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        view.setdefault('filters', [])
        view['filters'].append(kwargs)
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return u'Filter added'

    def filterDelete(self, **kwargs):
        """ Delete filter
        """
        name = kwargs.get('name', '')
        if not name:
            return u'No filter name provided'

        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        filters = [item for item in view.get('filters', [])
                   if item.get('column', '') != name]
        view['filters'] = filters
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return u'Filter deleted'

    def filtersPosition(self, **kwargs):
        """ Change filters position
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        filters = dict((item.get('column'), item)
                       for item in view.get('filters', []))
        order = kwargs.get('order', [])
        if not order:
            return 'New order not provided'

        reordered = []
        for name in order:
            if name not in filters:
                continue
            reordered.append(filters.get(name))
        view['filters'] = reordered
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return 'Filters position changed'

    def filtersSize(self, **kwargs):
        """ Change filters box size
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        width = kwargs.get('width', '100%')
        height = kwargs.get('height', 'auto')
        view.setdefault('filtersBox', {})
        view['filtersBox']['width'] = width
        view['filtersBox']['height'] = height
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return 'Filters box resized'

    def sectionsPosition(self, **kwargs):
        """ Change sections position
        """
        order = kwargs.get('order', [])
        if not order:
            return u'New order not provided'
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view(self.__name__.replace('.edit', ''), {})
        for item in order:
            view.setdefault(item, {})
            view[item]['order'] = order.index(item)
        mutator.edit_view(self.__name__.replace('.edit', ''), **view)
        return 'Position changed'

    def __call__(self, **kwargs):
        form = getattr(self.request, 'form', {})
        kwargs.update(form)
        action = kwargs.pop('action', '')
        if not action:
            return self.index()

        # Edit mode
        if action == 'json':
            return self.json(**kwargs)

        #   Charts
        elif action == 'chart.edit':
            return self.chartEdit(**kwargs)
        elif action == 'charts.position':
            return self.chartsPosition(**kwargs)
        elif action == 'charts.size':
            return self.chartsSize(**kwargs)

        #   Filters
        elif action == 'filter.add':
            return self.filterAdd(**kwargs)
        elif action == 'filter.delete':
            return self.filterDelete(**kwargs)
        elif action == 'filters.position':
            return self.filtersPosition(**kwargs)
        elif action == 'filters.size':
            return self.filtersSize(**kwargs)

        # Sections
        elif action == 'sections.position':
            return self.sectionsPosition(**kwargs)


        # View mode
        return 'Invalid action provided: %s' % action
