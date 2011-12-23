import json
from Products.Five import BrowserView
from eea.googlechartsconfig.converter import converter

class GoogleChart(BrowserView):
    def chartSettingsAndData(self):
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
        dataTable = self.context.chartdata()
        settings["dataTable"] = converter.csv2json(self.context.csvdata())[1]

        return json.dumps(settings)


