var current_chart_id;
var tableForDashboard;
var allColumns;
var sortedDashboardChartsConfig;

function exportToPng(){
    var svgobj = jQuery("#googlechart_full").find("iframe").contents().find("#chart");
    jQuery(svgobj).attr("xmlns","http://www.w3.org/2000/svg");
    var svg = jQuery("#googlechart_view").find("iframe").contents().find("#chartArea").html();

    var form = jQuery("#export");
    jQuery("#svg").attr("value",svg);
    form.submit();
}

function checkSVG(){
    var svg = jQuery("#googlechart_view").find("iframe").contents().find("#chartArea").html();
    if ((svg) && (svg !== "")){
        jQuery("#googlechart_export_button").show();
    }
}

function drawChart(value){
        var chart_id = value[0];
        var chart_json = value[1];
        var chart_columns = value[2];
        var chart_filters = value[3];
        var chart_width = value[4];
        var chart_height = value[5];
        var chart_filterposition = value[6];
        var chart_options = value[7];

        jQuery("#filename").attr("value",chart_json.options.title);
        jQuery("#type").attr("value","image/png");

        jQuery("#googlechart_export_button").hide();
        jQuery("#googlechart_filters").remove();
        jQuery("#googlechart_view").remove();
        jQuery("#googlechart_table").remove();
        filters = '<div id="googlechart_filters"></div>';
        var view = '<div id="googlechart_view" class="googlechart"></div>';
        var googlechart_table;
        if (chart_filterposition === 0){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_top'>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                "</div>";
        }
        if (chart_filterposition === 1){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_left'>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                "</div>";
        }
        if (chart_filterposition === 2){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom'>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        if (chart_filterposition === 3){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_right'>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        jQuery(googlechart_table).appendTo('#googlechart_dashboard');

        var columnsFromSettings = getColumnsFromSettings(chart_columns);
        var transformedTable = transformTable(merged_rows,
                                        columnsFromSettings.normalColumns,
                                        columnsFromSettings.pivotColumns,
                                        columnsFromSettings.valueColumn,
                                        available_columns);
        var tableForChart = prepareForChart(transformedTable, columnsFromSettings.columns);


        drawGoogleChart(
            'googlechart_dashboard',
            'googlechart_view',
            'googlechart_filters',
            chart_id,
            chart_json,
            tableForChart,
            chart_filters,
            chart_width,
            chart_height,
            chart_filterposition,
            chart_options,
            transformedTable.available_columns,
            checkSVG,
            function(){}
            );
}

function drawDashboard(){
    jQuery("#googlechart_export_button").hide();
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var googlechart_table;
    googlechart_table = ""+
        "<div id='googlechart_table' class='googlechart_table googlechart_table_top'>"+
            "<div id='googlechart_filters'></div>"+
            "<div id='googlechart_view' class='googlechart'></div>"+
            "<div style='clear: both'></div>" +
        "</div>";
    jQuery(googlechart_table).appendTo('#googlechart_dashboard');

    drawGoogleDashboard('googlechart_dashboard',
                        'googlechart_view',
                        'googlechart_filters',
                        sortedDashboardChartConfig,
                        tableForDashboard,
                        allColumns);

}

jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }

    jQuery(googlechart_config_array).each(function(index, value){
        var tabsObj = jQuery(".googlechart_tabs");
        tabsObj.find("a[chart_id='"+value[0]+"']").addClass("googlechart_class_"+value[1].chartType);
    });

    jQuery(".googlechart_tabs").delegate("a", "click", function(){
        if (jQuery(this).attr("chart_id") !== current_chart_id){
            current_chart_id = jQuery(this).attr("chart_id");
            jQuery(".googlechart_tabs a").removeClass("current");
            jQuery(this).addClass("current");

            var index_to_use = -1;
            jQuery(googlechart_config_array).each(function(index, value){
                if (value[0] == current_chart_id){
                    index_to_use = index;
                }
            });
            if (index_to_use != -1){
                jQuery("#googlechart_filters").html('');
                jQuery("#googlechart_view").html('');

                drawChart(googlechart_config_array[index_to_use]);
            }
            else {
                drawDashboard();
            }
        }
        return false;
    });

    if (!has_dashboard){
        var value = googlechart_config_array[0];
        current_chart_id = value[0];
        drawChart(value);
    }
    else {
        var configs = [];
        sortedDashboardChartConfig = [];
        var dashboardChartConfig = {};
        var dashboardKeys = [];
        jQuery.each(googlechart_config_array, function(key, config){
            var isDashboardChart = true;
            if (typeof(config[8].hidden) === 'undefined'){
                isDashboardChart = false;
            }
            else{
                if (config[8].hidden){
                    isDashboardChart = false;
                }
            }
            if (isDashboardChart){
                dashboardChartConfig[config[8].order] = config;
                dashboardKeys.push(config[8].order);
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
        drawDashboard();
    }
});