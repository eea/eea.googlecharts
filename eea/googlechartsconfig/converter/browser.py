# -*- coding: utf-8 -*-
""" Module to enable or disable GoogleChart support
"""
__author__ = """European Environment Agency (EEA)"""
__docformat__ = 'plaintext'
__credits__ = """contributions: Zoltan Szabo"""


from Products.Five.browser import BrowserView
from Products.statusmessages.interfaces import IStatusMessage
from StringIO import StringIO

from eea.googlechartsconfig.converter.interfaces import IGoogleChartJsonConverter
from eea.googlechartsconfig.events import GoogleChartEnabledEvent
from eea.googlechartsconfig.interfaces import IGoogleChartConfig, IGoogleChartJson
from eea.googlechartsconfig.subtypes.interfaces import IGoogleChartSubtyper

from zope.component import queryAdapter, queryUtility
from zope.event import notify
from zope.interface import alsoProvides, noLongerProvides, implements
from zope.publisher.interfaces import NotFound

import logging

logger = logging.getLogger('eea.googlechartsconfig.converter')


class GoogleChartPublicSupport(BrowserView):
    """ Public support for subtyping objects
        view for non IPossibleGoogleChartJson objects
    """
    implements(IGoogleChartSubtyper)

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def _redirect(self, msg = '', to = ''):
        """ Redirect
        """
        if self.request:
            if msg:
                IStatusMessage(self.request).addStatusMessage(
                    str(msg), type='info')
            if to:
                self.request.response.redirect(self.context.absolute_url() + to)
            else:
                self.request.response.redirect(self.context.absolute_url()
                                                                + "/view")
        return msg

    @property
    def can_enable(self):
        """ See IGoogleChartSubtyper
        """
        return False

    @property
    def can_disable(self):
        """ See IGoogleChartSubtyper
        """
        return False

    @property
    def is_googlechart(self):
        """ Is googlechart?
        """
        return False


    def enable(self):
        """ See IGoogleChartSubtyper
        """
        raise NotFound(self.context, 'enable', self.request)

    def disable(self):
        """ See IGoogleChartSubtyper
        """
        raise NotFound(self.context, 'disable', self.request)


class GoogleChartSupport(GoogleChartPublicSupport):
    """ Enable/Disable GoogleChart
    """

    def _redirect(self, msg='', to='/googlechart-edit.html'):
        """ Return or redirect
        """
        if self.request:
            if msg:
                IStatusMessage(self.request).addStatusMessage(
                    str(msg), type='info')
            if to:
                self.request.response.redirect(self.context.absolute_url() + to)
            else:
                self.request.response.redirect(self.context.absolute_url()
                                                                + "/view")
        return msg

    @property
    def can_enable(self):
        """ See IGoogleChartSubtyper
        """
        return not self.is_googlechart

    @property
    def can_disable(self):
        """ See IGoogleChartSubtyper
        """
        return self.is_googlechart

    @property
    def is_googlechart(self):
        """ Is googlechart viewable?
        """
        return IGoogleChartJson.providedBy(self.context)

    def enable(self):
        """ Enable GoogleChart
        """
        datafile = StringIO(self.context.getFile().data)
        converter = queryUtility(IGoogleChartJsonConverter)
        try:
            columns, json = converter(datafile)
        except Exception, err:
            logger.exception(err)
            return self._redirect(('An error occured while trying to convert '
                                   'attached file. Please ensure you provided '
                                   'a valid CSV file'), 'view')

        if not IGoogleChartJson.providedBy(self.context):
            alsoProvides(self.context, IGoogleChartJson)

        # Update annotations
        mutator = queryAdapter(self.context, IGoogleChartConfig)
        mutator.json = json
        notify(GoogleChartEnabledEvent(self.context, columns=columns))
        return self._redirect('Enabled GoogleChart view')

    def disable(self):
        """ Disable GoogleChart
        """
        noLongerProvides(self.context, IGoogleChartJson)
        return self._redirect('Removed GoogleChart view', to='')
