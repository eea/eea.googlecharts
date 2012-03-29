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
                while (true){
                    var foundKey = false;
//                    if (dashboardKeys.indexOf(newKey) === -1){
                    if (jQuery.inArray(newKey, dashboardKeys) === -1){
                        break;
                    }
                    else{
                        newKey++;
                        continue;
                    }
                }
                dashboardChartConfig[newKey] = config;
                dashboardKeys.push(newKey);
            }
            configs.push(config[2]);
        });
        var sortedDashboardKeys = dashboardKeys.sort(function(a,b){return a - b;});
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
        if (this.type === "3") {
            dashboard_filters[this.column] = "2";
        }
        else {
            dashboard_filters[this.column] = this.type;
        }
    });
    drawGoogleDashboard('googlechart_dashboard',
                        'googlechart_view',
                        'googlechart_filters',
                        sortedDashboardChartConfig,
                        tableForDashboard,
                        allColumns,
                        dashboard_filters);

});
