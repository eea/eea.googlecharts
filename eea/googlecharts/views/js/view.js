var current_chart_id;
var tableForDashboard;
var allColumns;
var sortedDashboardChartsConfig;

function exportToPng(){
    var svgobj = jQuery("#googlechart_full").find("iframe").contents().find("#chart");
    jQuery(svgobj).attr("xmlns","http://www.w3.org/2000/svg");
    var svg = jQuery("#googlechart_view").find("svg").parent().html();
    var form = jQuery("#export");
    jQuery("#svg").attr("value",svg);

    form.submit();
}

function checkSVG(){
    var svg = jQuery("#googlechart_view").find("svg");
    if (svg[0]){
       jQuery("#googlechart_export_button").show();
    }
}

function putImageDivInPosition(div_id, position){
    if (position === "Disabled"){
        return;
    }

    var div = "<div id='" + div_id+ "' class='eea-googlechart-hidden-image'></div>";

    if (position.indexOf("Top") > -1){
        jQuery(div).appendTo("#googlechart_top_images");
    }

    if (position.indexOf("Bottom") > -1){
        jQuery(div).appendTo("#googlechart_bottom_images");
    }

    if (position.indexOf("Left") > -1){
        jQuery("#" + div_id).addClass("googlechart_left_image");
    }

    if (position.indexOf("Right") > -1){
        jQuery("#" + div_id).addClass("googlechart_right_image");
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
        var chart_showSort = (value[9]==='True'?true:false);
        var chart_hasPNG = (value[10]==='True'?true:false);
        var chart_row_filters = {};
        var chart_sortBy = value[12];
        var chart_sortAsc = true;

        var row_filters_str = value[11];
        var sortAsc_str = value[13];
        if (row_filters_str.length > 0){
            chart_row_filters = JSON.parse(row_filters_str);
        }
        if (sortAsc_str === 'desc'){
            chart_sortAsc = false;
        }


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
                    "<div id='googlechart_top_images'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_filters'></div>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_bottom_images'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        if (chart_filterposition === 1){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_left'>"+
                    "<div id='googlechart_top_images'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_filters'></div>"+
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_bottom_images'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        if (chart_filterposition === 2){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom'>"+
                    "<div id='googlechart_top_images'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_bottom_images'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        if (chart_filterposition === 3){
            googlechart_table = ""+
                "<div id='googlechart_table' class='googlechart_table googlechart_table_right'>"+
                    "<div id='googlechart_top_images'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_view' class='googlechart'></div>"+
                    "<div id='googlechart_filters'></div>"+
                    "<div style='clear: both'></div>" +
                    "<div id='googlechart_bottom_images'></div>"+
                    "<div style='clear: both'></div>" +
                "</div>";
        }
        jQuery(googlechart_table).appendTo('#googlechart_dashboard');
        var chart_url = baseurl + "#tab-" + chart_id;

        putImageDivInPosition("googlechart_qr", qr_pos);

        var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs="+qr_size+"x"+qr_size+"&chl=" + encodeURIComponent(chart_url);
        var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";
        jQuery('#qr_url').attr('value', qr_img_url);
        if (qr_pos !== "Disabled"){
            jQuery(googlechart_qr).appendTo("#googlechart_qr");
            jQuery("#googlechart_qr").removeClass("eea-googlechart-hidden-image");
        }

        putImageDivInPosition("googlechart_wm", wm_pos);

        var googlechart_wm = "<img alt='Watermark' src='" + wm_path + "'/>";
        if (wm_pos !== "Disabled"){
            jQuery(googlechart_wm).appendTo("#googlechart_wm");
            jQuery("#googlechart_wm").removeClass("eea-googlechart-hidden-image");
        }

        jQuery('#googlechart_dashboard').attr("chart_id", chart_id);
        jQuery('#googlechart_dashboard').attr("chart_width", chart_width);
        jQuery('#googlechart_dashboard').attr("chart_height", chart_height);
        jQuery('#googlechart_dashboard').attr("chart_hasPNG", chart_hasPNG);

        var columnsFromSettings = getColumnsFromSettings(chart_columns);

        var options = {
            originalTable : merged_rows,
            normalColumns : columnsFromSettings.normalColumns,
            pivotingColumns : columnsFromSettings.pivotColumns,
            valueColumn : columnsFromSettings.valueColumn,
            availableColumns : available_columns,
            filters : chart_row_filters
        };

        var transformedTable = transformTable(options);

        options = {
            originalDataTable : transformedTable,
            columns : columnsFromSettings.columns,
            sortBy : chart_sortBy,
            sortAsc : chart_sortAsc
        };
        var tableForChart = prepareForChart(options);

        var googlechart_params = {
            chartDashboard : 'googlechart_dashboard',
            chartViewDiv : 'googlechart_view',
            chartFiltersDiv : 'googlechart_filters',
            chartId : chart_id,
            chartJson : chart_json,
            chartDataTable : tableForChart,
            chartFilters : chart_filters,
            chartWidth : chart_width,
            chartHeight : chart_height,
            chartFilterPosition : chart_filterposition,
            chartOptions : chart_options,
            availableColumns : transformedTable.available_columns,
            chartReadyEvent : checkSVG,
            showSort : chart_showSort
        };

        drawGoogleChart(googlechart_params);
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
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div id='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }else{
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top googlechart_dashboard_table'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters'></div>"+
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery(googlechart_table).appendTo('#googlechart_dashboard');
    var chart_url = baseurl + "#tab-googlechart-googledashboard";

    putImageDivInPosition("googlechart_qr", qr_pos);

    var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs="+qr_size+"x"+qr_size+"&chl=" + encodeURIComponent(chart_url);
    var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";
    if (qr_pos !== "Disabled"){
        jQuery(googlechart_qr).appendTo("#googlechart_qr");
        jQuery("#googlechart_qr").removeClass("eea-googlechart-hidden-image");
    }

    putImageDivInPosition("googlechart_wm", wm_pos);

    var googlechart_wm = "<img alt='Watermark' src='" + wm_path + "'/>";
    if (wm_pos !== "Disabled"){
        jQuery(googlechart_wm).appendTo("#googlechart_wm");
        jQuery("#googlechart_wm").removeClass("eea-googlechart-hidden-image");
    }

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

    var googledashboard_params = {
        chartsDashboard : 'googlechart_dashboard',
        chartViewsDiv : 'googlechart_view',
        chartFiltersDiv : 'googlechart_filters',
        chartsSettings : sortedDashboardChartConfig,
        chartsMergedTable : tableForDashboard,
        allColumns : allColumns,
        filters : filters
    };

    drawGoogleDashboard(googledashboard_params);

}

function showEmbed(){
    var chartObj = jQuery("#googlechart_dashboard");
    var iframeWidth = chartObj.width();
    var iframeHeight = parseInt(chartObj.height(),10) + 30;
    var iframeSrc;
    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                    "&chartWidth=" + chartObj.attr('chart_width') +
                    "&chartHeight=" + chartObj.attr('chart_height') +
                    "&customStyle=%23googlechart_view{margin-left:0px%3B}";
    }
    else{
        iframeSrc = baseurl+"/embed-dashboard?customStyle=%23googlechart_view{margin-left:0px%3B}";
    }
    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
    var hasPNG = chartObj.attr('chart_hasPNG');
    var embedHtml = '<div>' +
                        '<h3>Interactive chart: </h3>'+
                        '<textarea class="iframeCode" style="width:96%" rows="7">' + iframeCode + '</textarea>';
    if (hasPNG === 'true'){
        var chart_id = chartObj.attr("chart_id");
        var pngCode = '<a href="'  + baseurl + "#tab-" + chart_id + '">' +
                        '<img alt="' + chart_id + '" src="' + baseurl + "/" + chart_id + '.png" />' +
                        '<div style="clear:both"></div>' +
                        'Go to original visualization' +
                      '</a>';
        embedHtml += '<h3>Static image: </h3>';
        embedHtml += '<textarea class="pngCode" style="width:96%" rows="3">' + pngCode + '</textarea>';
    }
    embedHtml += '</div>';

    jQuery(embedHtml).dialog({
        title: "Embed code",
        modal:true,
        open: function(evt, ui){
            jQuery('.iframeCode', this)[0].focus();
            jQuery('.iframeCode', this)[0].select();
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
    jQuery.each(googlechart_config_array, function(key, config){
        config[1].options.title = config[1].options.title + " — " + main_title;
    });
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

        var options = {
            originalTable : merged_rows,
            tableConfigs : configs,
            availableColumns : available_columns
        };
        var mergedTable = createMergedTable(options);
        allColumns = [];
        jQuery.each(mergedTable.available_columns, function(key, value){
            allColumns.push(key);
        });

        options = {
            originalDataTable : mergedTable,
            columns : allColumns
        };

        tableForDashboard = prepareForChart(options);
    }

    // Integrate google charts with daviz tabs
    jQuery('.googlecharts_container').hide();
    jQuery(document).bind('eea-daviz-tab-click', function(evt, settings){
        googleChartOnTabClick(settings);
    });

    // First tab is a google charts tab
    var api = jQuery("ul.chart-tabs").data('tabs');
    var index = 0;
    jQuery.each(api.getTabs(), function(idx, tab){
        if(jQuery(tab).attr('href') == window.location.hash){
            index = idx;
            return false;
        }
    });

    googleChartOnTabClick({
        api: api,
        tab: api.getTabs()[index],
        index: index
    });

});
