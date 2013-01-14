function drawDashboardEmbed(options){
    settings = {
        googlechart_config_array : [],
        main_title : '',
        vhash : '',
        dashboard_config : null,
        baseurl : '',
        qr_pos : '',
        qr_size : '',
        wm_pos : '',
        wm_path : '',
        merged_rows : '',
        available_columns : '',
        isInline : 'False'
    };

    jQuery.extend(settings, options);

    jQuery.each(settings.googlechart_config_array, function(key, config){
        config[1].options.title = config[1].options.title + " — " + settings.main_title;
    });

    jQuery("#googlechart_filters_" + settings.vhash).remove();
    jQuery("#googlechart_view_" + settings.vhash).remove();
    jQuery("#googlechart_table_" + settings.vhash).remove();

    var filters = '<div id="googlechart_filters_' + settings.vhash + '"></div>';
    var view = '<div id="googlechart_view_' + settings.vhash + '" class="googlechart"></div>';

    var googlechart_table;

    if ((settings.dashboard_config.chartsBox !== undefined) && (settings.dashboard_config.chartsBox.order === 0)){
        googlechart_table = ""+
            "<div id='googlechart_table_" + settings.vhash + "' class='googlechart_table googlechart_table_bottom googlechart_dashboard_table'>"+
                "<div id='googlechart_top_images_" + settings.vhash + "'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_" + settings.vhash + "' class='googlechart'></div>"+
                "<div id='googlechart_filters_" + settings.vhash + "'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_" + settings.vhash + "'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }else{
        googlechart_table = ""+
            "<div id='googlechart_table_" + settings.vhash + "' class='googlechart_table googlechart_table_top googlechart_dashboard_table'>"+
                "<div id='googlechart_top_images_" + settings.vhash + "'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_" + settings.vhash + "'></div>"+
                "<div id='googlechart_view_" + settings.vhash + "' class='googlechart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_" + settings.vhash + "'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery(googlechart_table).appendTo('#googlechart_dashboard_'+settings.vhash);
    var chart_url = settings.baseurl + "#tab-" + settings.dashboard_config.name.replace(".","-");

    jQuery("#googlechart_view_"+settings.vhash).addClass("googlechart_view");
    jQuery("#googlechart_filters_"+settings.vhash).addClass("googlechart_filters");

    if (settings.isInline !== 'True'){
        putImageDivInPosition("googlechart_qr_" + settings.vhash, settings.qr_pos, settings.vhash);

        var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs="+settings.qr_size+"x"+settings.qr_size+"&chl=" + encodeURIComponent(chart_url);
        var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";
        if (settings.qr_pos !== "Disabled"){
            jQuery(googlechart_qr).appendTo("#googlechart_qr_" + settings.vhash);
            jQuery("#googlechart_qr_" + settings.vhash).removeClass("eea-googlechart-hidden-image");
        }

        putImageDivInPosition("googlechart_wm_" + settings.vhash, settings.wm_pos, settings.vhash);

        var googlechart_wm = "<img alt='Watermark' src='" + settings.wm_path + "'/>";
        if (settings.wm_pos !== "Disabled"){
            jQuery(googlechart_wm).appendTo("#googlechart_wm");
            jQuery("#googlechart_wm_" + settings.vhash).removeClass("eea-googlechart-hidden-image");
        }
    }
    jQuery('#googlechart_dashboard_' + settings.vhash).removeAttr("chart_id");

    // Set width, height
    if ((settings.dashboard_config.chartsBox) && (settings.dashboard_config.chartsBox.width)){
        jQuery('#googlechart_view_' + settings.vhash, jQuery('#googlechart_dashboard_' + settings.vhash)).width(settings.dashboard_config.chartsBox.width);
    }
    if ((settings.dashboard_config.chartsBox) && (settings.dashboard_config.chartsBox.height)){
        jQuery('#googlechart_view_' + settings.vhash, jQuery('#googlechart_dashboard_' + settings.vhash)).height(settings.dashboard_config.chartsBox.height);
    }
    if ((settings.dashboard_config.filtersBox) && (settings.dashboard_config.filtersBox.width)){
        jQuery('#googlechart_filters_' + settings.vhash, jQuery('#googlechart_dashboard_' + settings.vhash)).width(settings.dashboard_config.filtersBox.width);
    }
    if ((settings.dashboard_config.filtersBox) && (settings.dashboard_config.filtersBox.height)){
        jQuery('#googlechart_filters_' + settings.vhash, jQuery('#googlechart_dashboard_' + settings.vhash)).height(settings.dashboard_config.filtersBox.height);
    }

    var googledashboard_params = {
        chartsDashboard : 'googlechart_dashboard_'+settings.vhash,
        chartViewsDiv : 'googlechart_view_'+settings.vhash,
        chartFiltersDiv : 'googlechart_filters_'+settings.vhash,
        chartsSettings : settings.dashboard_config.widgets,
        filters : settings.dashboard_config.filters,
        rows : settings.merged_rows,
        columns : settings.available_columns,
        charts : settings.googlechart_config_array,
        dashboardName: settings.dashboard_config.name
    };

    var other_settings = {
        merged_rows: settings.merged_rows,
        available_columns: settings.available_columns,
        googlechart_config_array: settings.googlechart_config_array
    };

    jQuery('#googlechart_dashboard_' + settings.vhash).data('other_settings', other_settings);

    drawGoogleDashboard(googledashboard_params);

}
jQuery(document).ready(function($){

});
