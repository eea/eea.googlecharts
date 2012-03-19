google.load('visualization', '1.0', {packages: ['controls']});

jQuery(document).ready(function($){
    if (has_dashboard) {
        var configs = [];
        sortedDashboardChartConfig = [];
        var dashboardChartConfig = {};
        var dashboardKeys = [];
        jQuery.each(googlechart_config_array, function(key, config){
            var isDashboardChart = false;
            if (!config[8].hidden){
                isDashboardChart = true;
            }
            if (isDashboardChart){
                var newKey = config[8].order === undefined ? 999 : config[8].order;
                if (dashboardKeys.length === 0){
                    newKey = 0;
                }
                else{
                    if (dashboardKeys.indexOf(config[8].order!==-1)){
                        newKey = Math.max.apply(Math, dashboardKeys) + 1;
                    }
                }
                dashboardChartConfig[newKey] = config;
                dashboardKeys.push(newKey);
            }
            configs.push(config[2]);
        });
        var sortedDashboardKeys = dashboardKeys.sort();
        jQuery.each(sortedDashboardKeys, function(key, dashboardKey){
            sortedDashboardChartConfig.push(dashboardChartConfig[dashboardKey]);
        });

        var mergedTable = createMergedTable(merged_rows, configs, available_columns);
        allColumns = [];
        jQuery.each(mergedTable.available_columns, function(key, value){
            allColumns.push(key);
        });
        tableForDashboard = prepareForChart(mergedTable, allColumns);
    }
    else {
        return;
    }

//    var chart_filterposition = 3;
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var filters = '<div id="googlechart_filters"></div>';
    var view = '<div id="googlechart_view" class="googlechart"></div>';

    var googlechart_table;
    var chartsBox = googledashboard_filters.chartsBox !== undefined ? googledashboard_filters.chartsBox: {};
    var filtersBox = googledashboard_filters.filtersBox !== undefined ? googledashboard_filters.filtersBox: {};
    var myFilters = googledashboard_filters.filters !== undefined ? googledashboard_filters.filters: [];
    if ((chartsBox !== undefined) && (chartsBox.order === 0)){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom googlechart_dashboard_table'>"+
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div id='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }else{
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top googlechart_dashboard_table'>"+
                "<div id='googlechart_filters'></div>"+
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery(googlechart_table).appendTo('#googlechart_dashboard');

    jQuery('#googlechart_dashboard').removeAttr("chart_id");

    // Set width, height
    if(chartsBox.width){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).width(chartsBox.width);
    }
    if(chartsBox.height){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).height(chartsBox.height);
    }
    if(filtersBox.width){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).width(filtersBox.width);
    }
    if(filtersBox.height){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).height(filtersBox.height);
    }

    var dashboard_filters = {};
    jQuery.each(myFilters, function(){
        dashboard_filters[this.column] = this.type;
    });
    drawGoogleDashboard('googlechart_dashboard',
                        'googlechart_view',
                        'googlechart_filters',
                        sortedDashboardChartConfig,
                        tableForDashboard,
                        allColumns,
                        dashboard_filters);

/*    var columnsFromSettings = getColumnsFromSettings(chart_columns);
    var transformedTable = transformTable(merged_rows,
                                        columnsFromSettings.normalColumns,
                                        columnsFromSettings.pivotColumns,
                                        columnsFromSettings.valueColumn,
                                        available_columns);
    var tableForChart = prepareForChart(transformedTable, columnsFromSettings.columns);
    chart_json.options.title = name;
    jQuery.each(chart_filters,function(key,value){
            if (value === "3"){
                chart_filters[key] = "2";
            }
    });
    drawGoogleChart(
            'googlechart_dashboard',
            'googlechart_view',
            'googlechart_filters',
            'embed',
            chart_json,
            tableForChart,
            chart_filters,
            width,
            height,
            '',
            options,
            transformedTable.available_columns,
            function(){},
            function(){}
    );*/
});
