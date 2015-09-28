""" Installer
"""
import os
from setuptools import setup, find_packages

NAME = 'eea.googlecharts'
PATH = NAME.split('.') + ['version.txt']
VERSION = open(os.path.join(*PATH)).read().strip()

setup(name=NAME,
      version=VERSION,
      description="Configurator for GoogleCharts",
      long_description=open("README.txt").read() + "\n" +
                       open(os.path.join("docs", "HISTORY.txt")).read(),
      classifiers=[
          "Framework :: Zope2",
          "Framework :: Zope3",
          "Framework :: Plone",
          "Framework :: Plone :: 4.0",
          "Framework :: Plone :: 4.1",
          "Framework :: Plone :: 4.2",
          "Programming Language :: Zope",
          "Programming Language :: Python",
          "Topic :: Software Development :: Libraries :: Python Modules",
          "License :: OSI Approved :: GNU General Public License (GPL)",
          "License :: OSI Approved :: Mozilla Public License 1.0 (MPL)",
        ],
      keywords='eea google chart zope plone',
      author='European Environment Agency',
      author_email='webadmin@eea.europa.eu',
      maintainer='Zoltan Szabo (Eau de Web)',
      maintainer_email='zoltan.szabo@eaudeweb.ro',
      download_url="http://pypi.python.org/pypi/eea.googlecharts",
      url='http://eea.github.com/docs/eea.googlecharts',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['eea'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'lxml',
          'eea.converter >= 6.0',
          'eea.app.visualization > 9.3',
          'eea.icons',
          'collective.js.underscore',
          'eventlet',
      ],
      extras_require={
          'test': [
              'plone.app.testing',
          ]
      },
      entry_points="""
      [z3c.autoinclude.plugin]
      target = plone
      """
      )
