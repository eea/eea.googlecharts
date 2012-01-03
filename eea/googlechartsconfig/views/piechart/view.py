# -*- coding: utf-8 -*-
""" PieChart View
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json
from StringIO import StringIO

from zope.interface import implements
from zope.component import queryAdapter

from eea.daviz.interfaces import IDavizConfig

from eea.googlechartsconfig.views.piechart.interfaces import IGoogleChartPieChart
from eea.googlechartsconfig.views import view

class View(view.View):
    """ PieChartView
    """
    label = 'PieChart'
    view_name = "googlechart.piechart"
    implements(IGoogleChartPieChart)

    def settingsAndData(self):
        accessor = queryAdapter(self.context, IDavizConfig)
        acc_settings = [view for view in accessor.views if view['name'] == self.view_name][0]

        facets = {}
        for facet in accessor.facets:
            facets[facet['name']] = facet['label']

        self.columns = []
        self.columns.append([acc_settings.get('labels'), facets[acc_settings.get('labels')]])
        self.columns.append([acc_settings.get('values'), facets[acc_settings.get('values')]])

        settings = json.load(StringIO(super(View, self).settingsAndData()))


        chart_type = acc_settings.get('chartType')
        settings["chartType"] = "ImagePieChart" if chart_type == "ImageChart" else "PieChart"

        return json.dumps(settings)

