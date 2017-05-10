""" Widgets meta directives
"""
from zope.interface import Interface, implements
from zope.publisher.interfaces.browser import IDefaultBrowserLayer
from eea.googlecharts.widgets.interfaces import IWidgetsInfo
from Products.Five.browser.metaconfigure import page


class WidgetsInfo(object):
    """ Widgets registry
    """
    implements(IWidgetsInfo)
    _widgets = {}

    @property
    def widgets(self):
        """ Widgets
        """
        return self._widgets

    def keys(self):
        """ Widgets names
        """
        return self.widgets.keys()

    def label(self, key):
        """ Widgets label or key
        """
        return self.widgets.get(key, key)


def WidgetDirective(_context, name, permission, for_=Interface,
                    layer=IDefaultBrowserLayer, template=None, class_=None,
                    allowed_interface=None, allowed_attributes=None,
                    attribute='__call__', menu=None, title=None):
    """ Widget view
    """
    label = title
    if title and not menu:
        title = None

    page(_context=_context, name=name, permission=permission,
         for_=for_, layer=layer, template=template, class_=class_,
         allowed_interface=allowed_interface,
         allowed_attributes=allowed_attributes,
         attribute=attribute, menu=menu, title=title)

    WidgetsInfo._widgets[name] = label or name
