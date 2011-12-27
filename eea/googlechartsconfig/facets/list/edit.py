""" Edit facet
"""
from zope.formlib.form import Fields
from eea.googlechartsconfig.facets.list.interfaces import IGoogleChartListFacetEdit
from eea.googlechartsconfig.facets.edit import EditForm

class Edit(EditForm):
    """ Edit list facet
    """
    form_fields = Fields(IGoogleChartListFacetEdit)
