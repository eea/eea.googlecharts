=====================
EEA Google Charts API
=====================
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
1.  Set the query parameters for embedded charts
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | Starting from this chart: http://daviz.eionet.europa.eu/visualisations/data-visualization-2/#tab-chart_3.
    | If we use the embed option for chart, the popup will prompt if we want to use the current values of the filters in the embed and if we want to hide the filters (we can select one by one, or all of them). By default all filters are used and displayed in the iframe, and it's code looks like:

    ``<iframe width='1856' height='857' src='http://daviz.eionet.europa.eu/visualisations/data-visualization-2/embed-chart?chart=chart_3&chartWidth=1000&chartHeight=600&customStyle=.googlechart_view{margin-left:0px%3B}#_filters={}'></iframe>``

    | Put the code in a page and let's make some customization

    | The interesting part of the source for the iframe is after the **#_filters** part, where the filters are configured. As we didn't select anything, the option for filters is empty.

    | **Now get the original query parameters:**

        | ``var src = $("iframe").attr("src");``
        | ``var src_array = src.split("#_filters=");``
        | ``var query_params = JSON.parse(decodeURIComponent(src_array[1]).split(";").join(","));``

    | query_params in this moment is empty: {}

    | **set some filters:**
    | To find out the name of the filter and where it should be placed, check **How to figure out which filter in which section goes?**

        | ``query_params.rowFilters = {};``
        | ``query_params.rowFilters.country = ["Austria", "Belgium"];``

    | **hide a filter:**

        | ``query_params.hideFilters = ["googlechart_filters_main_activity"];``

    | **build the new src for the iframe:**

        | ``src_array[1] = encodeURIComponent(JSON.stringify(query_params).split(",").join(";"));``
        | ``src = src_array.join("#_filters=");``
        | ``$("iframe").attr("src", src);``

2.  Set sort order for embedded charts
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    | The sort option can only be set on non table charts.
    | Let's start from a chart with the Sort Filter enabled: http://daviz.eionet.europa.eu/visualisations/data-visualization-31#tab-chart_2, and embed it in a page.
    | **Get the original query parameters as described in the previous section**

    | **set the sort option**

    | ``query_params.sortFilter = ['country'];``

    |  **hide it**

    |  ``query_params.hideFilters = ["googlechart_filters_sortfilter_custom_filter"];``

    | **build the new src for the iframe**

