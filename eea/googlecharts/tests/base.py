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
        import eea.googlechartsconfig
        self.loadZCML(package=eea.googlechartsconfig)
        z2.installProduct(app, 'eea.googlechartsconfig')

    def tearDownZope(self, app):
        """ Uninstall Zope
        """
        z2.uninstallProduct(app, 'eea.googlechartsconfig')

    def setUpPloneSite(self, portal):
        """ Setup Plone
        """
        #applyProfile(portal, 'eea.googlechartsconfig:default')

EEAFIXTURE = EEAFixture()
FUNCTIONAL_TESTING = FunctionalTesting(bases=(EEAFIXTURE,),
            name='EEAGoogleChartsConfig:Functional')
