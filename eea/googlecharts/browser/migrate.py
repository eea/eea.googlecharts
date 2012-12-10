""" Migration utils
"""
from copy import deepcopy
from zope.component import queryMultiAdapter
from Products.Five.browser import BrowserView
from eea.app.visualization.interfaces import IVisualizationConfig

def compare(a, b):
    """ Compare dashboard widgets
    """
    order_a = a.get('dashboard', {}).get('order', 998)
    order_b = b.get('dashboard', {}).get('order', 999)
    return cmp(order_a, order_b)

class Dashboards(BrowserView):
    """ MIgrate single-dashboard to multiple dashboards
    """
    def __call__(self, **kwargs):
        mutator = IVisualizationConfig(self.context)
        view = mutator.view(u'googlechart.googledashboard')
        if not view:
            return

        order = [
            xview.get('name').replace(u'googlechart.googledashboard',
                                      u'googlechart.googledashboards', 1)
            for xview in mutator.views]

        view = deepcopy(dict(view))
        view.setdefault('title', u'Dashboard')
        view.setdefault('widgets', [])

        charts = mutator.view('googlechart.googlecharts', {}).get(
            'chartsconfig', {}).get('charts', [])

        for chart in charts:
            cid = chart.get('id', 'chart')
            path = u'googlechart.googlecharts/chartsconfig/charts/%s' % cid
            dashboard = dict(chart.pop('dashboard', {}))
            widget = {
                'name': cid,
                'title': chart.get('name', cid),
                'path': path,
                'dashboard': dashboard,
                'wtype': u'googlecharts.widgets.chart'
            }
            view['widgets'].append(widget)
            view['widgets'].sort(cmp=compare)

        mutator.add_view(u'googlechart.googledashboards', dashboards=[view, ])
        mutator.delete_view(u'googlechart.googledashboard')

        # Reorder views
        reorder = queryMultiAdapter((self.context, self.request),
                                    name='daviz-edit.save')
        query = {'daviz.views.save': 'ajax', 'order': order}
        reorder(**query)

        # Return
        return 'Migration of %s Googlecharts Dashboards ... DONE' % (
            self.context.absolute_url()
        )
