google.load('visualization', '1.0', {packages: ['controls']});

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
    var embedchart_id = value[0];
    var embedchart_json = value[1];
    var embedchart_columns = value[2];
    var embedchart_filters = value[3];
    var embedchart_width = value[4];
    var embedchart_height = value[5];
    var embedchart_filterposition = value[6];
    var embedchart_options = value[7];
    var embedchart_showSort = (value[9]==='True'?true:false);
    var embedchart_hasPNG = (value[10]==='True'?true:false);
    var embedchart_row_filters_str = value[11];
    var embedchart_sortBy = value[12];
    var embedchart_sortAsc = true;

    var sortAsc_str = value[13];
    if (sortAsc_str === 'desc'){
        embedchart_sortAsc = false;
    }

    var embedchart_columnFilters = value[14];

    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var filters = '<div id="googlechart_filters"></div>';
    var view = '<div id="googlechart_view" class="googlechart embedded-chart"></div>';
    var googlechart_table;
    if (embedchart_filterposition === 0){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters'></div>"+
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 1){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_left'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters' class='embedded-side-filters'></div>"+
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 2){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 3){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_right'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters' class='embedded-side-filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    jQuery(googlechart_table).appendTo('#googlechart_dashboard');
    var chart_url = baseurl + "#tab-" + embedchart_id;
    jQuery("#googlechart_view").attr("chart_id", embedchart_id);
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

    var row_filters = {};
    if (embedchart_row_filters_str.length > 0){
        row_filters = JSON.parse(embedchart_row_filters_str);
    }

    var columnsFromSettings = getColumnsFromSettings(embedchart_columns);

    var options = {
        originalTable : merged_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : available_columns,
        filters : row_filters
    };

    var transformedTable = transformTable(options);

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : embedchart_sortBy,
        sortAsc : embedchart_sortAsc
    };

    var tableForChart = prepareForChart(options);

    embedchart_json.options.title = name + " — " + main_title;
    jQuery.each(embedchart_filters,function(key,value){
        if (value === "3"){
            embedchart_filters[key] = "2";
        }
    });

    var googlechart_params = {
        chartDashboard : 'googlechart_dashboard',
        chartViewDiv : 'googlechart_view',
        chartFiltersDiv : 'googlechart_filters',
        chartId : embedchart_id,
        chartJson : embedchart_json,
        chartDataTable : tableForChart,
        chartFilters : embedchart_filters,
        chartWidth : embedchart_width,
        chartHeight : embedchart_height,
        chartFilterPosition : embedchart_filterposition,
        chartOptions : embedchart_options,
        availableColumns : transformedTable.available_columns,
        showSort : embedchart_showSort,
        columnFilters : embedchart_columnFilters
    };
    drawGoogleChart(googlechart_params);

}
var googlechart_config_array = [];
jQuery(document).ready(function($){
    var settings = [];
    settings.push(GoogleChartsConfig[0].id);
    settings.push(chart_json);
    settings.push(chart_columns);
    settings.push(chart_filters);
    settings.push(width);
    settings.push(height);
    settings.push(chart_filterposition);
    settings.push(chart_options);
    settings.push(null);
    settings.push(showSort);
    settings.push(null);
    settings.push(row_filters_str);
    settings.push(sortBy);
    settings.push(sortAsc_str);
    settings.push(chart_columnFilters);
    googlechart_config_array.push(settings);
    drawChart(settings);
});
