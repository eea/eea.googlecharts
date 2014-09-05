""" CSS/JS resources provided by this package
"""
from zope.interface import implements
from eea.app.visualization.interfaces import IVisualizationViewResources
from eea.app.visualization.interfaces import IVisualizationEditResources

class ViewResources(object):
    """ Resources to be used in view mode
    """
    implements(IVisualizationViewResources)

    @property
    def extcss(self):
        """ Required CSS resources
        """
        return []

    @property
    def css(self):
        """ CSS resources
        """
        return [
            '++resource++eea.googlecharts.view.css'
        ]

    @property
    def extjs(self):
        """ Required JS resources
        """
        return [
            u'++resource++eea.jquery.ui.js',
        ]

    @property
    def js(self):
        """ JS resources
        """
        return [
            '++resource++json2.js',
            '++resource++eea.googlecharts.chart.js',
            '++resource++eea.googlecharts.datatable.js',
            '++resource++eea.googlecharts.palettes.js',
            '++resource++eea.googlecharts.dashboard.js',
            '++resource++eea.googlecharts.view.js',
            '++resource++eea.googlecharts.configurator_messages.js',
            '++resource++eea.googlecharts.custom_filters.js',
        ]

class EditResources(object):
    """ Resources to be used in edit mode
    """
    implements(IVisualizationEditResources)

    @property
    def extcss(self):
        """ Required CSS resources
        """
        return []

    @property
    def css(self):
        """ CSS resources
        """
        return [
            '++resource++eea.googlecharts.edit.css',
        ]

    @property
    def extjs(self):
        """ Required JS resources
        """
        return []

    @property
    def js(self):
        """ JS resources
        """
        return [
            '++resource++json2.js',
            '++resource++eea.googlecharts.chart.js',
            '++resource++eea.googlecharts.datatable.js',
            '++resource++eea.googlecharts.palettes.js',
            '++resource++eea.googlecharts.dashboard-edit.js',
            '++resource++eea.googlecharts.multiples-edit.js',
            '++resource++eea.googlecharts.dashboards-edit.js',
            '++resource++eea.googlecharts.edit.js',
            '++resource++eea.googlecharts.configurator_messages.js',
            '++resource++eea.googlecharts.edit_grid.js',
            '++resource++eea.googlecharts.uuid.js',
        ]
