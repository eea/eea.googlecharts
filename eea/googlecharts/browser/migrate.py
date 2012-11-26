""" Migration utils
"""
from copy import deepcopy
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
        return 'Migration of %s Googlecharts Dashboards ... DONE' % (
            self.context.absolute_url()
        )
