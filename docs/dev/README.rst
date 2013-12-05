================
EEA Googlecharts
================
.. image:: http://ci.eionet.europa.eu/job/eea.googlecharts-www/badge/icon
  :target: http://ci.eionet.europa.eu/job/eea.googlecharts-www/lastBuild
.. image:: http://ci.eionet.europa.eu/job/eea.googlecharts-plone4/badge/icon
  :target: http://ci.eionet.europa.eu/job/eea.googlecharts-plone4/lastBuild

.. contents::



Passing parameters in url
=========================

**eea.googlecharts** allows users to pass the filter settings to the charts in the url of the visualization. Using the filters in the url, users can give a direct link to their chart with filters already configured. Users also can embed these charts including their filter choices. In the case of embedded charts the user has the possibility to hide the filters.

The filters are passed in the hash of the page. It is an encoded JSON but commas are replaced with semicolons.

Differences between simple visualization pages and embedded charts
------------------------------------------------------------------

| The query params for simple views and embedded charts is the same, 
| The only difference is that in case of a view page the hash contains the id of the chart, and in the case of the embed the hash only contains the filters

    | **Example:** 
    | *normal view*:
    | ``visualization#tab-chart_1_filter=....``

    | *embedded*:
    | ``visualization/embed-chart?chart=chart_1#_filters=...``

    | **Note**: 
    | In the case of embedded charts there is a possibility to add some customizations to the chart (chartWidth, chartHeight, customStyle)
    | The hash with the filters will be in the last position, so the url will look like
    | ``visualization/embed-chart?chart=chart_1?chartWidth=800&chartHeight=600#_filters=...``



How the filters should be configured
------------------------------------
The filters are composed from the following parts:

1. sortFilter - used for our custom sortFilter
2. rowFilters - used for googlecharts own built in filters
3. columnFilters - used for our custom column filters and pre-pivot filters
4. hideFilters - used for filters to be hidden

sortFilter
^^^^^^^^^^
    | In this parameter we can configure the default sort order for the data in the chart. 
    | The value for the sortFilter is a list with a single element, what can be: "**__default__**", "**__disabled__**", **<columnname>** or **<columnname_reversed>**

hideFilters
^^^^^^^^^^^
    | In this parameter we can configure the visibility of the available filters of the chart.
    | It's value is a list with the filters to be hidden

rowFilters & columnFilters
^^^^^^^^^^^^^^^^^^^^^^^^^^
    | In these parameters we can configure the values for each filter.
    | The value is a vocabulary with the configured filters, the keys are the name of the filters, the values are lists with the values. Depending on the filter's type the list with the values may contain 0, 1, 2 or many values

    - if the filter's type is single category the list will have 1 element
    - if the filter's type is multiple category the list may have 0 elements or as many elements are needed
    - if the filter's type is string the list will have 1 element
    - if the filter's type is number rang the list will contain 2 elements, the minimum and the maximum values
    - the type of the values from the list should have the same type as configured for the chart

How to figure out which filter in which section goes?
-----------------------------------------------------
| We have 2 possibilities to possibilities to find out which filters how should be configured in the queries.

The first option is to

Use the embed string of the chart
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | When preparing the chart for embedding, make a selection for each filter, and on the **embed code** dialog on the **Include the following filters** section uncheck the **All** option. This way all the options will be configured in the embed string. We only have to apply an ``decodeURIComponent`` on the embed string, and all the options are readable.

The second option is to

Use the filterinfo attribute from chart filters
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | Each filter on a chart contains some information what can be accessed in order to help creating queries via url for the chart. We just have follow the following steps:

    1. on the chart right click on the label of the filter, and find the closest ".googlechart_filter"
    2. it has an attribute called filterinfo with a value of a stringified JSON what contains the filterType, filterNameForValueParams, filterNameForHiddenParams
        - filterType specifies in which section of the query it should be configured, it can have the following values: sortFilter, rowFilter, columnFilter
        - filterNameForValueParams specifies the name of the filter what should be used as key in the rowFilters or the columnFilters
        - filterNameForHiddenParams specifies the name how the filter should be added in the hideFilters list

Examples of how to build queries for charts:
--------------------------------------------
1.  Set the query parameters for a chart
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | Starting from this chart: http://daviz.eionet.europa.eu/visualisations/data-visualization-2/#tab-chart_3.
    | When we open the page, the url doesn't contain any parameters, because there are no values selected for the filters. But when  a country or an activity is selected, the url will be updated with the query:
    | http://daviz.eionet.europa.eu/visualisations/data-visualization-2/#tab-chart_3_filters=%7B%22rowFilters%22%3A%7B%22country%22%3A%5B%22Austria%22%3B%22Belgium%22%5D%7D%3B%22columnFilters%22%3A%7B%7D%7D

    | We can decode and parse the filter params:
    | ``query_params = JSON.parse(decodeURIComponent("%7B%22rowFilters%22%3A%7B%22country%22%3A%5B%22Austria%22%3B%22Belgium%22%5D%7D%3B%22columnFilters%22%3A%7B%7D%7D").split(";").join(","))`` 
    | and we have a json with the settings:  
    | ``{rowFilters: {country: ["Austria", "Belgium"]}, columnFilters: {}}``

    | If we add a new value for the country rowfilter:
    | ``query_params.rowFilters.country.push("Bulgaria")``
    | then encode it:
    | ``encodeURIComponent(JSON.stringify(query_params).split(",").join(";"))``
    | and update the url with the new filter param and reload the page, the country filter will have now "Austria", "Belgium", "Bulgaria" selected
    
2. Hiding filters embedded chart 
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | After embedding the previous chart in a page decode and parse the parameters
    | Hide a filter with the params:
    | ``query_params.hideFilters = []``

    | Find out the name of the filter as described in section **How to figure out which filter in which section goes?**
    | update the query_params
    | ``query_params.hideFilters.push("googlechart_filters_country")``
    | encode it, update the embed string, and reload the page.
    | The country filter is not displayed anymore. It's values are still applied to the chart
