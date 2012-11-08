""" Migration utils
"""
from copy import deepcopy
from Products.Five.browser import BrowserView
from eea.app.visualization.interfaces import IVisualizationConfig

class Dashboards(BrowserView):
    """ MIgrate single-dashboard to multiple dashboards
    """
    def __call__(self, **kwargs):
        mutator = IVisualizationConfig(self.context)
        view = mutator.view(u'googlechart.googledashboard')
        if not view:
            return


        view = deepcopy(view)
        view.setdefault('title', u'Dashboard')
        mutator.add_view(u'googlechart.googledashboards', dashboards=[view,])
        mutator.delete_view(u'googlechart.googledashboard')
        return 'Migration of %s Googlecharts Dashboards ... DONE' % (
            self.context.absolute_url()
        )
