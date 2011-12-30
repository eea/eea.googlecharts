# -*- coding: utf-8 -*-
""" PieChart View
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

from eea.googlechartsconfig.views.piechart.interfaces import IGoogleChartPieChart
from eea.googlechartsconfig.converter.exhibit2googlechart import exhibit2googlechart

class View(ViewForm):
    """ PieChartView
    """
    label = 'PieChart'
    implements(IGoogleChartPieChart)

    def settingsAndData(self):
        columns = []
        facets = {}
        accessor = queryAdapter(self.context, IDavizConfig)
        #import pdb; pdb.set_trace( )
        acc_settings = [view for view in accessor.views if view['name'] == 'googlechart.piechart'][0]

        for facet in accessor.facets:
            facets[facet['name']] = facet['label']

        columns.append([acc_settings.get('labels'), facets[acc_settings.get('labels')]])
        columns.append([acc_settings.get('values'), facets[acc_settings.get('values')]])
        result = json.load(urllib.urlopen(self.context.absolute_url()+'/@@daviz-view.json'))

        filters = [[key[7:], acc_settings[key]] for key in acc_settings.keys() if key.startswith('filter') and acc_settings[key] and key[7:] in facets.keys()]

        dataTable = exhibit2googlechart(result, columns, filters)

        settings = {}

        chart_type = acc_settings.get('chartType')
        settings["chartType"] = "ImagePieChart" if chart_type == "ImageChart" else "PieChart"

        options = {}
        vAxis = {}
        vAxis["title"] = acc_settings.get('verticalTitle', 'Vertical Title')
        titleTextStyle={}
        titleTextStyle["color"] = "red"
        hAxis = {}
        vAxis["titleTextStyle"] = titleTextStyle
        hAxis["title"] = acc_settings.get('horizontalTitle', 'Horizontal Title')
        options["title"] = acc_settings.get('chartTitle', 'Chart Title')
        options["width"] = "500"
        settings["options"] = options

        settings["dataTable"] = dataTable
        return json.dumps(settings)

