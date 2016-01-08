/* global drawGoogleDashboard, getQueryParams, patched_each */

/* GLOBALS come from:

    view.js:
    drawGoogleDashboard
    getQueryParams

    datatable.js
    patched_each
*/

/* module requirements */
var commonModule = window.EEAGoogleCharts.common;
var embedModule = window.EEAGoogleCharts.embed;
var is_pdf_printing = embedModule && embedModule.isPrint;

function drawDashboardEmbed(options){
  var settings = {
        merged_rows : '',
        available_columns : '',
        googlechart_config_array : [],
        main_title : '',
        dashboard_config : null,
        baseurl : '',
        qr_pos : '',
        qr_size : '',
        wm_pos : '',
        wm_path : '',
        vhash : '',
        isInline : 'False'
    };

    jQuery.extend(settings, options);

    var query_params = getQueryParams();

    if (!is_pdf_printing) {
        patched_each(settings.googlechart_config_array, function(key, config){
            config[1].options.title = config[1].options.title + " — " + settings.main_title;
        });
    }



    var googlechart_table;
    var chart_hash = settings.vhash;


    /* Reset the chart when pre-pivot filters are used */
    $(".googlechart-datasources-info").appendTo("body");
    $(".googlechart-share-box").appendTo("body");
    jQuery("#googlechart_filters_" + chart_hash).remove();
    jQuery("#googlechart_view_" + chart_hash).remove();
    jQuery("#googlechart_table_" + chart_hash).remove();

    if ((settings.dashboard_config.chartsBox !== undefined) && (settings.dashboard_config.chartsBox.order === 0)){
        googlechart_table = ""+
            "<div id='googlechart_table_" + chart_hash + "' class='googlechart_table googlechart_table_bottom googlechart_dashboard_table'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_" + chart_hash + "'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_" + chart_hash + "' class='googlechart'></div>"+
                "<div id='googlechart_filters_" + chart_hash + "' class='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_" + chart_hash + "'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }else{
        googlechart_table = ""+
            "<div id='googlechart_table_" + chart_hash + "' class='googlechart_table googlechart_table_top googlechart_dashboard_table'>"+
                "<div class='googlechart_top_images' id='googlechart_top_images_" + chart_hash + "'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_" + chart_hash + "' class='googlechart_filters'></div>"+
                "<div id='googlechart_view_" + chart_hash + "' class='googlechart'></div>"+
                "<div style='clear: both'></div>" +
                "<div class='googlechart_bottom_images' id='googlechart_bottom_images_" + chart_hash + "'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery(googlechart_table).appendTo('#googlechart_dashboard_'+chart_hash);
    var chart_url = settings.baseurl + "#tab-" + settings.dashboard_config.name.replace(".","-");

    jQuery("#googlechart_view_"+chart_hash).addClass("googlechart_view");
    jQuery("#googlechart_filters_"+chart_hash).addClass("googlechart_filters");

    commonModule.insertBottomImages(settings, chart_url);

    jQuery('#googlechart_dashboard_' + chart_hash).removeAttr("chart_id");

    // #22489 disable setting of height and width letting percentage width to be used and inline values to be placed by google
    // Set width, height
    //if ((settings.dashboard_config.chartsBox) && (settings.dashboard_config.chartsBox.width)){
    //    jQuery('#googlechart_view_' + chart_hash, jQuery('#googlechart_dashboard_' + chart_hash)).width(settings.dashboard_config.chartsBox.width);
    //}
    //if ((settings.dashboard_config.chartsBox) && (settings.dashboard_config.chartsBox.height)){
    //    jQuery('#googlechart_view_' + chart_hash, jQuery('#googlechart_dashboard_' + chart_hash)).height(settings.dashboard_config.chartsBox.height);
    //}
    //if ((settings.dashboard_config.filtersBox) && (settings.dashboard_config.filtersBox.width)){
    //    jQuery('#googlechart_filters_' + chart_hash, jQuery('#googlechart_dashboard_' + chart_hash)).width(settings.dashboard_config.filtersBox.width);
    //}
    //if ((settings.dashboard_config.filtersBox) && (settings.dashboard_config.filtersBox.height)){
    //    jQuery('#googlechart_filters_' + chart_hash, jQuery('#googlechart_dashboard_' + chart_hash)).height(settings.dashboard_config.filtersBox.height);
    //}

    if (query_params.rowFilters !== undefined){
        patched_each(settings.dashboard_config.filters, function(idx, value){
            if (query_params.rowFilters[value.column] !== undefined){
                value.defaults = JSON.stringify(query_params.rowFilters[value.column]);
            }
        });
    }

    /* #22489 reduce size of dashboards when pdf printing in order to avoid text shrinking */
    if (is_pdf_printing) {
        $.each(settings.dashboard_config.widgets, function(idx, el) {
            var dashboard = el.dashboard;
            // magic numbers found after playing with an assessment where the larger charts
            // are set to the maximum 650
            dashboard.width =  "100%";
            dashboard.height = 295;
        });

    }

    var googledashboard_params = {
        chartsDashboard : 'googlechart_dashboard_'+chart_hash,
        chartViewsDiv : 'googlechart_view_'+chart_hash,
        chartFiltersDiv : 'googlechart_filters_'+chart_hash,
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
    jQuery('#googlechart_dashboard_' + chart_hash).data('other_settings', other_settings);
    drawGoogleDashboard(googledashboard_params);
    jQuery(document).trigger('googlecharts.embed.ready', [settings.vhash]);

}
