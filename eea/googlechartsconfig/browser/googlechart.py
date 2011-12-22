from Products.Five import BrowserView

class GoogleChart(BrowserView):
    def chartSettingsAndData(self):
        return """
{
    "chartType": "ImageChart",
    "dataTable": 
          [["Year", "Sales", "Expenses"],
          ["2004", 1000, 400],
          ["2005", 1170, 460],
          ["2006", 660, 1120],
          ["2007", 1030, 540]],
     "vAxis": {"title": "Year",  "titleTextStyle": {"color": "red"}},
    
    "options": {"cht":"bhg", "title": "Bar Image", "colors":["AAAAAA","BBBBBB"], "width":"500"}
}
        """

