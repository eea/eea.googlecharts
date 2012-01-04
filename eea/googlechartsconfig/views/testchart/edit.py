# -*- coding: utf-8 -*-
""" Edit PieChart
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""

from zope import schema
from zope.formlib import form
from zope.formlib.form import Fields
from zope.component import queryAdapter

from eea.googlechartsconfig.views.testchart.interfaces import IGoogleChartPieChartEdit
from eea.googlechartsconfig.views.edit import EditForm
from eea.googlechartsconfig.app.interfaces import IChartsConfig

class Edit(EditForm):
    """ Edit PieChart form
    """
    label = u"TestChart settings"
    form_fields = Fields(IGoogleChartPieChartEdit)
    def update(self):
        accessor = queryAdapter(self.context, IChartsConfig)
        for facet in accessor.facets:
            filter_name = unicode('filter_'+facet['name'])
            filter_title = unicode(facet['label'])

            if not self.form_fields.get(filter_name):
                if facet['item_type'] == 'text':
                    field = schema.TextLine(__name__=filter_name,
                                title=filter_title,
                                required=False)
                if facet['item_type'] == 'number':
                    field = schema.Float(__name__=filter_name,
                                title=filter_title,
                                required=False)
                self.form_fields = self.form_fields + form.Fields(field)
            else:
                self.form_fields.get(filter_name).field.title = filter_title
        super(Edit, self).update()
