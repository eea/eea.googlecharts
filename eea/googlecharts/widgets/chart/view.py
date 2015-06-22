""" View
"""
from urllib import urlencode
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
    def src(self):
        """ Src
        """
        query = {
            'chart': self.widget.get('name', ''),
            'width': self.width,
            'height': self.height,
        }

        return u'%s/chart-full?%s' % (
            self.context.absolute_url(),
            urlencode(query)
        )
