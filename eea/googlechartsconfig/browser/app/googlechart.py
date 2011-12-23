import json
from Products.Five import BrowserView

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
        titles = [column[0] for column in self.context.columns]
        dataTable = list(self.context.jsondata)
        dataTable.insert(0,titles)
        settings["dataTable"] = dataTable
        return json.dumps(settings)


