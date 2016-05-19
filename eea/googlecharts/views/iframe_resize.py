""" update the source code for the iframe
"""
from Products.Five import BrowserView
from zope.security import checkPermission
import lxml

class Resizer(BrowserView):
    """ iframe resizer
    """
    def check_permission(self):
        """ check permission for resize
        """
        if checkPermission("cmf.ModifyPortalContent", self.context):
            return True
        return False

    def update_iframe(self):
        """ update the source code for the iframe
        """
        old_src = self.request.get("old_src", "")
        old_width = self.request.get("old_width", "")
        old_height = self.request.get("old_height", "")
        new_src = self.request.get("new_src", "")
        new_width = self.request.get("new_width", "")
        new_height = self.request.get("new_height", "")

        if "" in [old_src, old_width, old_height, new_src, new_width,
                  new_height]:
            return "error"
        for field in self.context.schema.fields():
            value = field.getAccessor(self.context)()
            if isinstance(value, str):
                html = lxml.html.fragments_fromstring(value.decode('utf-8'))
                has_changes = False
                new_value = ""
                for element in html:
                    if isinstance(element, lxml.html.HtmlElement):
                        iframes = element.xpath("//iframe")
                        for iframe in iframes:
                            if iframe.get("width") == old_width and \
                                iframe.get("height") == old_height and \
                                    iframe.get("src") == old_src:
                                has_changes = True
                                iframe.set("width", new_width)
                                iframe.set("height", new_height)
                                iframe.set("src", new_src)
                        new_value += lxml.html.tostring(
                            element, encoding='utf-8')
                    else:
                        new_value += element
                if has_changes:
                    self.context.processForm(
                        data=1, metadata=0, values={field.getName():new_value})
        return "ok"
