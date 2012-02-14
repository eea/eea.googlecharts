""" Base test cases
"""
from plone.testing import z2
from plone.app.testing import FunctionalTesting
from plone.app.testing import PloneSandboxLayer

class EEAFixture(PloneSandboxLayer):
    """ Custom fixture
    """

    def setUpZope(self, app, configurationContext):
        """ Setup Zope
        """
        import eea.googlecharts
        self.loadZCML(package=eea.googlecharts)
        z2.installProduct(app, 'eea.googlecharts')

    def tearDownZope(self, app):
        """ Uninstall Zope
        """
        z2.uninstallProduct(app, 'eea.googlecharts')

    def setUpPloneSite(self, portal):
        """ Setup Plone
        """
        #applyProfile(portal, 'eea.googlecharts:default')

EEAFIXTURE = EEAFixture()
FUNCTIONAL_TESTING = FunctionalTesting(bases=(EEAFIXTURE,),
            name='EEAGoogleCharts:Functional')
