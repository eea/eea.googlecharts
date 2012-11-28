""" Widget view
"""
import logging
from Products.Five.browser.pagetemplatefile import ZopeTwoPageTemplateFile
from eea.googlecharts.widgets.view import View as Widget
logger = logging.getLogger('eea.googlecharts')

class View(Widget):
    """ View portlet widget
    """
    index = ZopeTwoPageTemplateFile('view.pt', globals())

    @property
    def macro(self):
        """ Get macro
        """
        macro = self.widget.get('macro', None)

        if not macro:
            err = 'Empty macro %s' % macro
            logger.exception(err)
            raise ValueError(err)

        macro_list = macro.replace('here/', '', 1)
        macro_list = macro_list.split('/macros/')
        if len(macro_list) != 2:
            err = 'Invalid macro: %s' % macro
            logger.exception(err)
            raise ValueError(err)

        path, mode = macro_list
        path = path.split('/')
        try:
            template = self.context.restrictedTraverse(path)
            if template:
                return template.macros[mode]
        except Exception, err:
            # This means we didn't have access or it doesn't exist
            logger.exception(err)
            raise

        err = "Invalid macro: %s" % macro
        logger.exception(err)
        raise ValueError(err)
