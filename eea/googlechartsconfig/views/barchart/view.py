# -*- coding: utf-8 -*-
""" BarChart View
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json

from zope.interface import implements
from zope.component import queryAdapter
from StringIO import StringIO

from eea.daviz.interfaces import IDavizConfig

from eea.googlechartsconfig.views.barchart.interfaces import IGoogleChartBarChart
from eea.googlechartsconfig.views import view

class View(view.View):
    """ BarChartView
    """
    label = 'BarChart'
    implements(IGoogleChartBarChart)
    view_name = "googlechart.barchart"

    def settingsAndData(self):
        accessor = queryAdapter(self.context, IDavizConfig)
        acc_settings = [v for v in accessor.views if v['name'] == self.view_name][0]

        facets = {}
        for facet in accessor.facets:
            facets[facet['name']] = facet['label']

        self.columns = []
        for column in acc_settings.get('columns'):
            self.columns.append([column, facets[column]])

        settings = json.load(StringIO(super(View, self).settingsAndData()))

        chart_type = acc_settings.get('chartType')
        settings["chartType"] = "ImageChart" if chart_type == "ImageChart" else "BarChart"

        vAxis = {}
        vAxis["title"] = acc_settings.get('verticalTitle', 'Vertical Title')
        hAxis = {}
        hAxis["title"] = acc_settings.get('horizontalTitle', 'Horizontal Title')
        settings["options"]["hAxis"] = hAxis
        settings["options"]["vAxis"] = vAxis
        settings["options"]["cht"] = "bhg"

        return json.dumps(settings)

