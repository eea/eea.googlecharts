""" Widget view
"""
import logging
from zope.component import queryAdapter
from eea.app.visualization.interfaces import IVisualizationConfig
from Products.Five.browser import BrowserView
from Products.Five.browser.pagetemplatefile import ZopeTwoPageTemplateFile
logger = logging.getLogger('eea.googlecharts')

class View(BrowserView):
    """ View portlet widget
    """
    index = ZopeTwoPageTemplateFile('view.pt', globals())

    def __init__(self, context, request):
        super(View, self).__init__(context, request)
        self.widget_name = ''

    @property
    def macro(self):
        """ Get macro
        """
        mutator = queryAdapter(self.context, IVisualizationConfig)
        view = mutator.view('googlechart.googledashboard', {})
        widgets = view.get('widgets', [])
        macro = None
        for widget in widgets:
            if widget.get('name', None) == self.widget_name:
                macro = widget.get('macro', None)

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

    def __call__(self, **kwargs):
        form = self.request.form
        form.update(kwargs)
        self.widget_name = form.get('name', '')
        return self.index()
