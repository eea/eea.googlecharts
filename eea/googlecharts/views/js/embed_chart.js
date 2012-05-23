google.load('visualization', '1.0', {packages: ['controls']});

jQuery(document).ready(function($){
//    var chart_filterposition = 3;
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var filters = '<div id="googlechart_filters"></div>';
    var view = '<div id="googlechart_view" class="googlechart embedded-chart"></div>';
    var googlechart_table;
    if (chart_filterposition === 0){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top'>"+
                "<div id='googlechart_qr' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters'></div>"+
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (chart_filterposition === 1){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_left'>"+
                "<div id='googlechart_qr' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters' class='embedded-side-filters'></div>"+
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (chart_filterposition === 2){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom'>"+
                "<div id='googlechart_qr' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (chart_filterposition === 3){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_right'>"+
                "<div id='googlechart_qr' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters' class='embedded-side-filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
            "</div>";
    }
    jQuery(googlechart_table).appendTo('#googlechart_dashboard');
    var chart_url = baseurl + "#tab-" + chart_id;
    var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs=70x70&chl=" + encodeURIComponent(chart_url);
    var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";

    if (qr_pos !== "Disabled"){
        jQuery(googlechart_qr).appendTo("#googlechart_qr");
        jQuery("#googlechart_qr").removeClass("eea-googlechart-hidden-image");
    }

    var googlechart_wm = "<img alt='Watermark' src='" + wm_path + "'/>";
    if (wm_pos !== "Disabled"){
        jQuery(googlechart_wm).appendTo("#googlechart_wm");
        jQuery("#googlechart_wm").removeClass("eea-googlechart-hidden-image");
    }

    var columnsFromSettings = getColumnsFromSettings(chart_columns);
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
    );
});
