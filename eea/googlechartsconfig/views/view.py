import json
from StringIO import StringIO

from zope.component import queryAdapter
from zope.component import getMultiAdapter

from eea.daviz.interfaces import IDavizConfig
from eea.daviz.views.view import ViewForm

from eea.googlechartsconfig.converter.exhibit2googlechart import exhibit2googlechart


class View(ViewForm):
    """ GoogleChartView
    """
    columns=[]
    view_name = "googlechart.view"

    def settingsAndData(self):
        facets = {}
        accessor = queryAdapter(self.context, IDavizConfig)
        acc_settings = [view for view in accessor.views if view['name'] == self.view_name][0]

        for facet in accessor.facets:
            facets[facet['name']] = facet['label']

        result = json.load(StringIO(getMultiAdapter((self.context, self.request), name="daviz-view.json")()))

        filters = [[key[7:], acc_settings[key]] for key in acc_settings.keys() if key.startswith('filter') and acc_settings[key] and key[7:] in facets.keys()]

        dataTable = exhibit2googlechart(result, self.columns, filters)

        settings = {}

        options = {}
        options["title"] = acc_settings.get('chartTitle', 'Chart Title')
        options["width"] = str(acc_settings.get('chartWidth', 500))
        options["height"] = str(acc_settings.get('chartWidth', 500))
        settings["options"] = options

        settings["dataTable"] = dataTable
        return json.dumps(settings)

