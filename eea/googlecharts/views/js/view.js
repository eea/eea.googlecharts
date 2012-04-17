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
        jQuery("#googlechart_embed_button").show();
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
        jQuery('#googlechart_dashboard').attr("chart_id", chart_id);
        jQuery('#googlechart_dashboard').attr("chart_width", chart_width);
        jQuery('#googlechart_dashboard').attr("chart_height", chart_height);

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
    jQuery("#googlechart_embed_button").show();
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
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

    var filters = {};
    jQuery.each(myFilters, function(){
        filters[this.column] = this.type;
    });
    drawGoogleDashboard('googlechart_dashboard',
                        'googlechart_view',
                        'googlechart_filters',
                        sortedDashboardChartConfig,
                        tableForDashboard,
                        allColumns,
                        filters);

}

function showEmbed(){
    var chartObj = jQuery("#googlechart_dashboard");
    var iframeWidth = chartObj.width();
    var iframeHeight = parseInt(chartObj.height(),10) + 30;
    var iframeSrc;
    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                    "&chartWidth=" + chartObj.attr('chart_width') +
                    "&chartHeight=" + chartObj.attr('chart_height');
    }
    else{
        iframeSrc = baseurl+"/embed-dashboard";
    }
    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
    var embedHtml = '<div>' +
                        '<textarea style="width:96%" rows="7">' + iframeCode + '</textarea>' +
                    '</div>';

    jQuery(embedHtml).dialog({
        title: "Embed code",
        modal:true,
        open: function(evt, ui){
            jQuery('textarea', this)[0].focus();
            jQuery('textarea', this)[0].select();
            jQuery(this).delegate('textarea', 'click', function(){
                this.focus();
                this.select();
            });
        }
        }
    );
}

var googleChartTabClick = function(context){
    if (jQuery(context).attr("chart_id") !== current_chart_id){
        current_chart_id = jQuery(context).attr("chart_id");
        jQuery(context).addClass("current");

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
};

var googleChartOnTabClick = function(settings){
    var tab = jQuery(settings.tab);
    var css = tab.attr('class');
    if(css.indexOf('googlechart_class') === -1){
        jQuery('.googlecharts_container').hide();
        return;
    }

    var chart_id = tab.attr('href').replace('#tab-', '');
    if(chart_id.indexOf('dashboard')!==-1){
        chart_id = 'dashboard';
    }

    tab.attr('chart_id', chart_id);
    jQuery('.googlecharts_container').show();
    googleChartTabClick(tab);
};

jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }

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

    // Integrate google charts with daviz tabs
    jQuery('.googlecharts_container').hide();
    jQuery(document).bind('eea-daviz-tab-click', function(evt, settings){
        googleChartOnTabClick(settings);
    });

    // First tab is a google charts tab
    var api = jQuery("ul.chart-tabs").data('tabs');
    googleChartOnTabClick({
        api: api,
        tab: api.getTabs()[0],
        index: 0
    });

});
