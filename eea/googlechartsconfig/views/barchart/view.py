# -*- coding: utf-8 -*-
""" BarChart View
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json
import urllib

from zope.interface import implements
from zope.component import queryAdapter

from eea.daviz.interfaces import IDavizConfig
from eea.daviz.views.view import ViewForm

from eea.googlechartsconfig.views.barchart.interfaces import IGoogleChartBarChart
from eea.googlechartsconfig.converter.exhibit2googlechart import exhibit2googlechart

class View(ViewForm):
    """ BarChartView
    """
    label = 'BarChart'
    implements(IGoogleChartBarChart)

    def settingsAndData(self):
        columns = []
        facets = {}
        accessor = queryAdapter(self.context, IDavizConfig)
        acc_settings = [view for view in accessor.views if view['name'] == 'googlechart.charts'][0]

        for facet in accessor.facets:
            facets[facet['name']] = facet['label']
        for column in acc_settings.get('columns'):
            columns.append([column, facets[column]])

        result = json.load(urllib.urlopen(self.context.absolute_url()+'/@@daviz-view.json'))
        dataTable = exhibit2googlechart(result, columns)

        settings = {}
        chart_type = acc_settings.get('chartType', [])
        chart_type = chart_type.pop() if chart_type else ''
        settings["chartType"] = "ImageChart" if chart_type == "ImageChart" else "BarChart"
        options = {}
        vAxis = {}
        vAxis["title"] = acc_settings.get('verticalTitle', 'Vertical Title')
        titleTextStyle={}
        titleTextStyle["color"] = "red"
        hAxis = {}
        vAxis["titleTextStyle"] = titleTextStyle
        hAxis["title"] = acc_settings.get('horizontalTitle', 'Horizontal Title')
        options["hAxis"] = hAxis
        options["vAxis"] = vAxis
        options["title"] = acc_settings.get('chartTitle', 'Chart Title')
        options["width"] = "500"
        options["cht"] = "bhg"
        settings["options"] = options

        settings["dataTable"] = dataTable
        return json.dumps(settings)

