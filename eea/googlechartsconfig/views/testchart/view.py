# -*- coding: utf-8 -*-
""" PieChart View
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json
from StringIO import StringIO

from zope.interface import implements
from zope.component import queryAdapter, getMultiAdapter

from eea.googlechartsconfig.app.interfaces import IChartsConfig

from eea.googlechartsconfig.views.testchart.interfaces import IGoogleChartPieChart
from eea.googlechartsconfig.views import view
from eea.googlechartsconfig.converter.exhibit2googlechart import exhibit2googlechart

class View(view.View):
    """ PieChartView
    """
    label = 'TestChart'
    view_name = "googlechart.testchart"
    implements(IGoogleChartPieChart)

    def settingsAndData(self):
        accessor = queryAdapter(self.context, IChartsConfig)
        
        acc_settings = [view for view in accessor.views if view['name'] == self.view_name][0]

        columns = []

        columns.append([acc_settings.get('labels'), acc_settings.get('labels')])
        columns.append([acc_settings.get('values'), acc_settings.get('values')])

        result = json.load(StringIO(getMultiAdapter((self.context, self.request), name="daviz-view.json")()))
        dataTable = exhibit2googlechart(result, columns)

        settings = {}

        options = {}
        options["title"] = acc_settings.get('chartTitle', 'Chart Title')
        options["width"] = str(acc_settings.get('chartWidth', 500))
        options["height"] = str(acc_settings.get('chartWidth', 500))
        settings["options"] = options

        settings["dataTable"] = dataTable
        chart_type = acc_settings.get('chartType')
        settings["chartType"] = "ImagePieChart" if chart_type == "ImageChart" else "PieChart"

        return json.dumps(settings)

