# -*- coding: utf-8 -*-
""" View1
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

import json
import urllib

from zope.interface import implements
from zope.component import queryAdapter
from zope.annotation.interfaces import IAnnotations

from eea.googlechartsconfig.interfaces import IGoogleChartConfig
from eea.googlechartsconfig.views.view import ViewForm
from eea.googlechartsconfig.views.view1.interfaces import IGoogleChartView1
from eea.googlechartsconfig.config import ANNO_VIEWS, ANNO_FACETS, ANNO_JSON, ANNO_SOURCES


class View(ViewForm):
    """ view1
    """
    label = 'View1'
    implements(IGoogleChartView1)

    @property
    def details(self):
        """ Show details column?
        """
        return self.data.get('details', False)

    @property
    def columns(self):
        """ Returns columns property for view1
        """
        columns = self.data.get('columns', [])
        for column in columns:
            yield '.%s' % column

        if self.details:
            yield '!label'

    @property
    def formats(self):
        """ Column formats
        """
        accessor = queryAdapter(self.context, IGoogleChartConfig)
        columns = self.data.get('columns', [])
        for column in columns:
            facet = accessor.facet(column, {})
            itype = facet.get('item_type', 'text')
            yield itype

        if self.details:
            yield "item {title: expression('more')}"

    @property
    def labels(self):
        """ Returns labels property for view1
        """
        accessor = queryAdapter(self.context, IGoogleChartConfig)
        columns = self.data.get('columns', [])

        for column in columns:
            facet = accessor.facet(column, {})
            label = facet.get('label', column)
            yield label

        if self.details:
            yield 'Details'

    def settingsAndData(self):
        settings = {}
        settings["chartType"] = "BarChart"
        vAxis = {}
        vAxis["title"] = "Year"
        titleTextStyle={}
        titleTextStyle["color"] = "red"
        vAxis["titleTextStyle"] = titleTextStyle
        settings["vAxis"] = vAxis
        options = {}
        options["title"] = "Bar"
        colors = []
        colors.append("AAAAAA")
        colors.append("BBBBBB")
        options["colors"] = colors
        options["width"] = "500"
        settings["options"] = options

        accessor = queryAdapter(self.context, IGoogleChartConfig)
        result = accessor.json
        dataTable = result['dataTable']
        titles = [title['label'] for title in accessor.facets]
        dataTable.insert(0,titles)
        settings["dataTable"] = dataTable
        return json.dumps(settings)

