""" View
"""
from eea.googlecharts.widgets.view import View as Widget

class View(Widget):
    """ View portlet widget
    """
    @property
    def text(self):
        """ Widget text
        """
        return self.widget.get('text', '')
