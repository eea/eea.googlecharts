""" Edit GoogleCharts
"""
import json
import logging
import urllib2
from zope.formlib.form import Fields
from Products.Five import BrowserView

from zope.component import queryAdapter, getUtility, getMultiAdapter
from zope.schema.interfaces import IVocabularyFactory
from zope.container.interfaces import INameChooser
from eea.app.visualization.interfaces import IVisualizationConfig
from eea.app.visualization.views.edit import EditForm
from eea.googlecharts.views.interfaces import IGoogleChartsEdit
logger = logging.getLogger('eea.googlecharts')

def compare(a, b):
    """ Compare dashboard widgets
    """
    order_a = a.get('order', a.get('dashboard', {}).get('order', 998))
    order_b = b.get('order', b.get('dashboard', {}).get('order', 999))
    return cmp(order_a, order_b)

class Edit(BrowserView):
    """ Edit GoogleCharts form
    """
    def submit_charts(self):
        """ Submit
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        data = {}
        data['chartsconfig'] = json.loads(self.request['charts'])
        mutator.edit_view('googlechart.googlecharts', **data)

        previews = ["googlechart.googledashboard.preview.png",
                    "googlechart.motionchart.preview.png",
                    "googlechart.organizational.preview.png",
                    "googlechart.imagechart.preview.png",
                    "googlechart.sparkline.preview.png",
                    "googlechart.table.preview.png",
                    "googlechart.annotatedtimeline.preview.png",
                    "googlechart.treemap.preview.png"]
        for previewname in previews:
            if not self.context.get(previewname, None):
                img = self.context.restrictedTraverse(
                    "++resource++" + previewname)
                self.context.invokeFactory('Image',
                    id=previewname,
                    title=previewname,
                    image=img.GET())

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
        jsonStr = [u'{']
        jsonStr.append(u', '.join((u'"%s": "%s"' % (term[0], term[1]))
                                  for term in terms))
        jsonStr.append(u'}')
        return u''.join(jsonStr)

    def get_rows(self):
        """ Rows
        """
        result = getMultiAdapter((self.context, self.request),
                                 name="daviz.json")()
        result_json = json.loads(result)
        stripped_result = {}
        stripped_result['properties'] = result_json['properties']
        stripped_result['items'] = result_json['items'][:5]
        return json.dumps(stripped_result)

    def get_allrows(self):
        """ All Rows
        """
        result = getMultiAdapter((self.context, self.request),
                                 name="daviz.json")()
        result_json = json.loads(result)
        stripped_result = {}
        stripped_result['properties'] = result_json['properties']
        stripped_result['items'] = result_json['items']
        return json.dumps(stripped_result)

    def set_iframe_chart(self):
        """ Set chart for iframe
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        chart = json.loads(self.request['preview_tmp_chart'])
        chart['json'] = urllib2.unquote(chart['json'])
        chart['options'] = urllib2.unquote(chart['options'])
        chart['columns'] = urllib2.unquote(chart['columns'])

        data = {}
        data['chartsconfig_tmp_iframe'] = chart

        mutator.edit_view('googlechart.googlecharts', **data)

        return 'Changes saved'

class ChartsEdit(EditForm, Edit):
    """ Edit google charts
    """
    label = "Googlechart Edit"
    form_fields = Fields(IGoogleChartsEdit)

    def __call__(self, **kwargs):
        index = getattr(self, 'index', '')
        if index:
            index = index()
        result = super(ChartsEdit, self).__call__()
        return '\n'.join((index, result))


class DashboardEdit(ChartsEdit):
    """ Edit google dashboard
    """
    form_fields = Fields(IGoogleChartsEdit)

    def __init__(self, context, request):
        super(DashboardEdit, self).__init__(context, request)
        self.dashboard_name = ''
        self._dashboards = None
        self._dashboard = None

    @property
    def dashboards(self):
        """ Get dashboards from annotations
        """
        if self._dashboards is None:
            mutator = queryAdapter(self.context, IVisualizationConfig)
            viewname = self.__name__.replace('googlechart.googledashboard',
                                             'googlechart.googledashboards', 1)
            viewname = viewname.replace('.edit', '')
            self._dashboards = mutator.view(viewname, {})
        return self._dashboards

    @dashboards.setter
    def dashboards(self, value):
        """ Update dashboards settings
        """
        if value == 'Changed':
            value = self.dashboards

        mutator = queryAdapter(self.context, IVisualizationConfig)
        viewname = self.__name__.replace(
            'googlechart.googledashboard', 'googlechart.googledashboards', 1)
        viewname = viewname.replace('.edit', '')
        mutator.edit_view(viewname, **value)

    @property
    def dashboard(self):
        """ Return dashboard by name
        """
        if self._dashboard is None:
            self.dashboards.setdefault('dashboards', [])
            for dashboard in self.dashboards['dashboards']:
                if dashboard.get('name', '') == self.dashboard_name:
                    self._dashboard = dashboard
                    break

        # Dashboard not found
        if self._dashboard is None:
            self._dashboard = {}
        return self._dashboard

    def json(self, **kwargs):
        """ Return config JSON
        """
        return json.dumps(dict(self.dashboard))

    def widgetEdit(self, **kwargs):
        """ Edit dashboard widget
        """
        settings = kwargs.pop('settings', "{}")
        try:
            settings = json.loads(settings)
        except Exception, err:
            logger.exception(err)
            return err

        name = kwargs.get('name', '')
        if not name:
            msg = 'Empty widget name provided %s' % name
            logger.exception(msg)
            return msg

        widgets = self.dashboard.get('widgets', [])

        changed = False
        for widget in widgets:
            if widget.get('name', '') == name:
                widget.update(settings)
                changed = True

        if changed:
            self.dashboards = 'Changed'
        return u'Changes saved'

    def widgetDelete(self, **kwargs):
        """ Delete widget
        """
        widget_name = kwargs.get('name', '')
        if not widget_name:
            err = 'Empty widget name provided %s' % widget_name
            logger.exception(err)
            return err

        widgets = self.dashboard.get('widgets', [])

        changed = False
        for index, widget in enumerate(widgets):
            if widget.get('name', '') == widget_name:
                widgets.pop(index)
                changed = True
                break

        if changed:
            self.dashboards = 'Changed'
        return u'Widget deleted'

    def chartsPosition(self, **kwargs):
        """ Change chats position in dashboard
        """
        order = kwargs.get('order', [])
        order = dict((name, index) for index, name in enumerate(order))

        # Widgets order
        widgets = self.dashboard.get('widgets', [])

        changed = False
        for widget in widgets:
            dashboard = widget.get('dashboard', {})
            if not dashboard:
                continue

            name = widget.get('name', '')
            new_order = order.get(name, -1)
            my_order = dashboard.get('order', -1)
            if my_order == new_order:
                continue

            dashboard['order'] = new_order
            changed = True

        if changed:
            widgets.sort(cmp=compare)
            self.dashboards = 'Changed'
        return u'Changed saved'

    def chartsSize(self, **kwargs):
        """ Change filters box size
        """
        self.dashboard.setdefault('chartsBox', {})
        self.dashboard['chartsBox']['width'] = kwargs.get('width', '100%')
        self.dashboard['chartsBox']['height'] = kwargs.get('height', 'auto')

        self.dashboards = 'Changed'
        return 'Charts box resized'

    def filterAdd(self, **kwargs):
        """ Add filter
        """
        self.dashboard.setdefault('filters', [])
        self.dashboard['filters'].append(kwargs)

        self.dashboards = 'Changed'
        return u'Filter added'

    def filterDelete(self, **kwargs):
        """ Delete filter
        """
        filtername = kwargs.get('name', '')
        filters = [item for item in self.dashboard.get('filters', [])
                   if item.get('column', '') != filtername]
        self.dashboard['filters'] = filters

        self.dashboards = 'Changed'
        return u'Filter deleted'

    def filtersPosition(self, **kwargs):
        """ Change filters position
        """
        order = kwargs.get('order', [])
        if not order:
            return 'New order not provided'

        filters = dict((item.get('column'), item)
                       for item in self.dashboard.get('filters', []))

        reordered = []
        for name in order:
            if name not in filters:
                continue
            reordered.append(filters.get(name))
        self.dashboard['filters'] = reordered

        self.dashboards = 'Changed'
        return 'Filters position changed'

    def filtersSize(self, **kwargs):
        """ Change filters box size
        """
        width = kwargs.get('width', '100%')
        height = kwargs.get('height', 'auto')

        self.dashboard.setdefault('filtersBox', {})
        self.dashboard['filtersBox']['width'] = width
        self.dashboard['filtersBox']['height'] = height

        self.dashboards = 'Changed'
        return 'Filters box resized'

    def sectionsPosition(self, **kwargs):
        """ Change sections position in dashboard
        """
        order = kwargs.get('order', [])
        if not order:
            return u'New order not provided'

        for item in order:
            self.dashboard.setdefault(item, {})
            self.dashboard[item]['order'] = order.index(item)

        self.dashboards = 'Changed'
        return 'Position changed'

    def __call__(self, **kwargs):
        form = getattr(self.request, 'form', {})
        kwargs.update(form)
        action = kwargs.pop('action', '')
        self.dashboard_name = kwargs.pop('dashboard', '')
        #
        # View mode
        #
        if not action:
            return super(DashboardEdit, self).__call__()
        #
        # Edit mode
        #
        if action == 'json':
            return self.json(**kwargs)

        #   Charts
        elif action == 'charts.position':
            return self.chartsPosition(**kwargs)
        elif action == 'charts.size':
            return self.chartsSize(**kwargs)

        # Widgets
        elif action == 'widget.edit':
            return self.widgetEdit(**kwargs)
        elif action == 'widget.delete':
            return self.widgetDelete(**kwargs)

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

        return 'Invalid action provided: %s' % action

class DashboardsEdit(ChartsEdit):
    """ Edit Google Dashboards
    """
    form_fields = Fields(IGoogleChartsEdit)

    def __init__(self, context, request):
        super(DashboardsEdit, self).__init__(context, request)
        self._dashboards = None

    @property
    def dashboards(self):
        """ Get dashboards from annotations
        """
        if not self._dashboards:
            mutator = queryAdapter(self.context, IVisualizationConfig)
            viewname = self.__name__.replace('.edit', '')
            self._dashboards = mutator.view(viewname, {})
            self._dashboards.setdefault('dashboards', [])
        return self._dashboards

    @dashboards.setter
    def dashboards(self, value):
        """ Update dashboards settings
        """
        if value == 'Changed':
            value = self.dashboards

        mutator = queryAdapter(self.context, IVisualizationConfig)
        viewname = self.__name__.replace('.edit', '')
        mutator.edit_view(viewname, **value)

    def json(self, **kwargs):
        """ Return config JSON
        """
        return json.dumps(dict(self.dashboards), ensure_ascii=False)

    def chooseName(self, title, existing=None):
        """ Choose unique name for dashboard
        """
        if not existing:
            existing = [dashboard.get('name', '')
                        for dashboard in self.dashboards.get('dashboards', [])]

        chooser = queryAdapter(self.context, INameChooser)
        if not chooser:
            chooser = queryAdapter(self.context.getParentNode(), INameChooser)
        name = chooser.chooseName(title, self.context)

        if name in existing:
            free_ids = set(u'%s-%d' % (name, uid)
                           for uid in range(len(existing)+1))
            name = free_ids.difference(existing)
            name = name.pop()
        return name

    def add(self, **kwargs):
        """ Add new dashboard
        """
        title = kwargs.get('title', 'Dashboard')
        name = self.chooseName(title)

        dashboard = {
            "title": title,
            "name": name,
            "filtersBox": {
                "height": "auto",
                "width": "100%",
            },
            "chartsBox": {
                "height": "auto",
                "width": "100%",
            },
            "filters": [],
            "widgets": [],
        }

        self.dashboards['dashboards'].append(dashboard)
        self.dashboards = "Changed"
        return self.json(**kwargs)

    def dashboardsPosition(self, **kwargs):
        """ Reorder dashboards
        """
        order = kwargs.get('order', [])
        order = dict((name, index) for index, name in enumerate(order))

        changed = False
        dashboards = self.dashboards['dashboards']
        for dashboard in dashboards:
            name = dashboard.get('name', '')
            my_order = dashboard.get('order', -1)
            new_order = order.get(name, -1)
            if my_order == new_order:
                continue

            dashboard['order'] = new_order
            changed = True

        if changed:
            dashboards.sort(cmp=compare)
            self.dashboards = 'Changed'
        return self.json(**kwargs)

    def __call__(self, **kwargs):
        form = getattr(self.request, 'form', {})
        kwargs.update(form)
        action = kwargs.pop('action', '')
        #
        # View mode
        #
        if not action:
            return super(DashboardsEdit, self).__call__()
        #
        # Edit mode
        #
        if action == 'json':
            return self.json(**kwargs)
        if action == 'add':
            return self.add(**kwargs)
        if action == 'dashboards.position':
            return self.dashboardsPosition(**kwargs)

        return 'Invalid action provided: %s' % action
