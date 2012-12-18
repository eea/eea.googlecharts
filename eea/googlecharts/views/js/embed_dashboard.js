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

jQuery(document).ready(function($){
    jQuery.each(googlechart_config_array, function(key, config){
        config[1].options.title = config[1].options.title + " — " + main_title;
    });

    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var filters = '<div id="googlechart_filters"></div>';
    var view = '<div id="googlechart_view" class="googlechart"></div>';

    var googlechart_table;

    if ((dashboard_config.chartsBox !== undefined) && (dashboard_config.chartsBox.order === 0)){
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
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery(googlechart_table).appendTo('#googlechart_dashboard');
    var chart_url = baseurl + "#tab-" + dashboard_config.name.replace(".","-");

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
    if(dashboard_config.chartsBox.width){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).width(dashboard_config.chartsBox.width);
    }
    if(dashboard_config.chartsBox.height){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).height(dashboard_config.chartsBox.height);
    }
    if(dashboard_config.filtersBox.width){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).width(dashboard_config.filtersBox.width);
    }
    if(dashboard_config.filtersBox.height){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).height(dashboard_config.filtersBox.height);
    }

    var googledashboard_params = {
        chartsDashboard : 'googlechart_dashboard',
        chartViewsDiv : 'googlechart_view',
        chartFiltersDiv : 'googlechart_filters',
        chartsSettings : dashboard_config.widgets,
        filters : dashboard_config.filters,
        rows : merged_rows,
        columns : available_columns,
        charts : googlechart_config_array,
        dashboardName: dashboard_config.name
    };

    drawGoogleDashboard(googledashboard_params);

});
