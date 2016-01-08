/* global drawGoogleChart, getColumnsFromSettings, getQueryParams, patched_each, getAvailable_columns_and_rows, prepareForChart, transformTable  */

/* GLOBALS come from:

 view.js:
 drawGoogleChart
 drawGoogleDashboard
 getQueryParams

 datatable.js
 patched_each
 getAvailable_columns_and_rows
 getColumnsFromSettings
 prepareForChart
 transformTable
 */
var commonModule = window.EEAGoogleCharts.common;
var embedModule = window.EEAGoogleCharts.embed;
var is_pdf_printing = embedModule && embedModule.isPrint;

function drawChart(value, options){
    var settings = {
        merged_rows : '',
        available_columns : '',
        googlechart_config_array: [],
        GoogleChartsConfig : null,
        main_title : '',
        baseurl : '',
        qr_pos : '',
        qr_size : '',
        wm_pos : '',
        wm_path : '',
        vhash : '',
        name : '',
        isInline : 'False'
    };

    jQuery.extend(settings, options);

    var embedchart_id = value[0];
    var embedchart_json = value[1];
    var embedchart_columns = value[2];
    var embedchart_filters = value[3];
    var embedchart_width = value[4];
    var embedchart_height = value[5];
    var embedchart_filterposition = value[6];
    var embedchart_options = value[7];
    var embedchart_sortFilter = value[9];
    var embedchart_row_filters_str = value[11];
    var embedchart_sortBy = value[12];
    var embedchart_sortAsc = true;
    var embedchart_ChartNotes = value[16];
    var query_params = getQueryParams("#googlechart_table_" + settings.vhash);
    patched_each(embedchart_filters, function(key, value){
        if (query_params.rowFilters[key] !== undefined){
            value.defaults = query_params.rowFilters[key];
        }
    });

    if (query_params.sortFilter !== undefined){
        embedchart_sortFilter = query_params.sortFilter[0];
    }

    var sortAsc_str = value[13];
    if (sortAsc_str === 'desc'){
        embedchart_sortAsc = false;
    }

    var embedchart_columnFilters = value[14];
    var embedchart_unpivotSettings = value[15];

    /* Reset the chart when pre-pivot filters are used */
    $(".googlechart-datasources-info").appendTo("body");
    $(".googlechart-share-box").appendTo("body");
    jQuery("#googlechart_filters_"+settings.vhash).remove();
    jQuery("#googlechart_view_"+settings.vhash).remove();
    jQuery("#googlechart_table_"+settings.vhash).remove();

    var googlechart_table;
    if (embedchart_filterposition === 0){
        googlechart_table = ""+
            "<div id='googlechart_table_"+settings.vhash+"' class='googlechart_table googlechart_table_top'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_"+settings.vhash+"' class='googlechart_filters'></div>"+
                "<div id='googlechart_view_"+settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 1){
        googlechart_table = ""+
            "<div id='googlechart_table_"+settings.vhash+"' class='googlechart_table googlechart_table_left'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_"+settings.vhash+"' class='embedded-side-filters googlechart_filters googlechart_filters_side'></div>"+
                "<div id='googlechart_view_"+settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 2){
        googlechart_table = ""+
            "<div id='googlechart_table_"+settings.vhash+"' class='googlechart_table googlechart_table_bottom'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_"+settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters_"+settings.vhash+"' class='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 3){
        googlechart_table = ""+
            "<div id='googlechart_table_"+settings.vhash+"' class='googlechart_table googlechart_table_right'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_"+settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters_"+settings.vhash+"' class='embedded-side-filters googlechart_filters googlechart_filters_side'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_"+settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    jQuery(googlechart_table).appendTo('#googlechart_dashboard_'+settings.vhash);
    jQuery('#googlechart_dashboard_'+settings.vhash).data('other_settings', settings);

    jQuery("#googlechart_view_"+settings.vhash).attr("chart_id", embedchart_id)
                                               .addClass("googlechart_view");

    var chart_url = settings.baseurl + "#tab-" + embedchart_id;

    commonModule.insertBottomImages(settings, chart_url);

    var row_filters = {};
    if (embedchart_row_filters_str.length > 0){
        row_filters = JSON.parse(embedchart_row_filters_str);
    }

    var columnsFromSettings = getColumnsFromSettings(embedchart_columns);

    var tmp_columns_and_rows = getAvailable_columns_and_rows(embedchart_unpivotSettings, settings.available_columns, settings.merged_rows);

    var settings_options = {
        originalTable : settings.merged_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : tmp_columns_and_rows.available_columns,
        unpivotSettings : embedchart_unpivotSettings,
        filters : row_filters
    };

    var transformedTable = transformTable(settings_options);

    settings.merged_rows = tmp_columns_and_rows.all_rows;
    settings.available_columns = tmp_columns_and_rows.available_columns;

    var new_columns = [];

    var column_names_to_be_shown = [];
    var i;
    if (embedchart_columns.columnsToBeShown){
        for (i = 0; i < embedchart_columns.columnsToBeShown.length; i++){
            for (var j = 0; j < embedchart_columns.prepared.length; j++){
                if (embedchart_columns.columnsToBeShown[i] === embedchart_columns.prepared[j].fullname){
                    column_names_to_be_shown.push(embedchart_columns.prepared[j].name);
                }
            }
        }
        for (i = 0; i < columnsFromSettings.columns.length; i++){
            if (jQuery.inArray(columnsFromSettings.columns[i], column_names_to_be_shown) !== -1){
                new_columns.push(columnsFromSettings.columns[i]);
            }
            if (jQuery.inArray(columnsFromSettings.columns[i], columnsFromSettings.normalColumns) !== -1){
                new_columns.push(columnsFromSettings.columns[i]);
            }
        }
    }
    else {
        new_columns = columnsFromSettings.columns;
    }

    settings_options = {
        originalDataTable : transformedTable,
        columns : new_columns,
        sortBy : embedchart_sortBy,
        sortAsc : embedchart_sortAsc,
        preparedColumns : embedchart_columns.prepared,
        enableEmptyRows : embedchart_options.enableEmptyRows,
        chartType : embedchart_json.chartType,
        focusTarget : embedchart_json.options.focusTarget
    };

    var tableForChart = prepareForChart(settings_options);

    if (!is_pdf_printing) {
        embedchart_json.options.title = settings.name + " — " + settings.main_title;
    }

    var googlechart_params = {
        chartDashboard : 'googlechart_dashboard_'+settings.vhash,
        chartViewDiv : 'googlechart_view_'+settings.vhash,
        chartFiltersDiv : 'googlechart_filters_'+settings.vhash,
        chartId : embedchart_id,
        chartJson : embedchart_json,
        chartDataTable : tableForChart,
        chartFilters : embedchart_filters,
        chartWidth : embedchart_width,
        chartHeight : embedchart_height,
        chartFilterPosition : embedchart_filterposition,
        chartOptions : embedchart_options,
        availableColumns : transformedTable.available_columns,
        sortFilter : embedchart_sortFilter,
        columnFilters : embedchart_columnFilters,
        columnTypes: transformedTable.properties,
        originalTable : settings.merged_rows,
        visibleColumns : columnsFromSettings.columns,
        ChartNotes: embedchart_ChartNotes,
        columnsToBeShown: embedchart_columns.columnsToBeShown
    };

    var lc_chart = drawGoogleChart(googlechart_params);
    jQuery(document).trigger('googlecharts.embed.ready', [settings.vhash]);
    return lc_chart;
}
