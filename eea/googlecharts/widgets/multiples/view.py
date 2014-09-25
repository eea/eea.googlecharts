""" View
"""
from eea.googlecharts.widgets.view import View as Widget

class View(Widget):
    """ View portlet widget
    """

    @property
    def width(self):
        """ Widget width
        """
        return self.widget.get('dashboard', {}).get('width', 800)

    @property
    def height(self):
        """ Widget height
        """
        return self.widget.get('dashboard', {}).get('height', 600)

    @property
    def chart(self):
        """ get name of chart
        """
        return self.widget.get('name', '')[10:]
