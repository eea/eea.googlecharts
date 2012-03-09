""" EEA GoogleChart Installer
"""
from setuptools import setup, find_packages
import os

NAME = 'eea.googlecharts'
PATH = NAME.split('.') + ['version.txt']
VERSION = open(os.path.join(*PATH)).read().strip()

setup(name=NAME,
      version=VERSION,
      description="Configurator for GoogleCharts",
      long_description=open("README.txt").read() + "\n" +
                       open(os.path.join("docs", "HISTORY.txt")).read(),
      classifiers=[
          "Framework :: Plone",
          "Programming Language :: Python",
          "Topic :: Software Development :: Libraries :: Python Modules",
        ],
      keywords='eea google chart zope plone',
      author='Zoltan Szabo, European Environment Agency',
      author_email='webadmin@eea.europa.eu',
      url='http://svn.eionet.europa.eu/projects/'
          'Zope/browser/trunk/eea.googlecharts',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['eea'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'eea.converter',
          'eea.app.visualization',
      ],
      entry_points="""
      # -*- Entry points: -*-
      """,
      )
