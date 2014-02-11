var current_chart_id;
var tableForDashboard;
var allColumns;

if (typeof String.prototype.endsWith === "undefined") {
    String.prototype.endsWith = function(suffix) {
        return this.length >= suffix.length && this.substr(this.length - suffix.length) === suffix;
    };
}

function svgCleanup(svg) {
    svg = jQuery(svg);
    svg.find('g[clip-path]').removeAttr('clip-path');

    jQuery(svg).find("[fill^='url']").each(function() {
        var fill = '#' + jQuery(this).attr('fill').split('#')[1];
        jQuery(this).attr('fill', fill);
    });

    container = jQuery('<div/>');
    container.append(svg);
    return container.html();
}

function exportToPng(){
    var form = jQuery("#export");
    if (jQuery("#googlechart_view img").attr("src") === undefined){
        var svgobj = jQuery("#googlechart_full").find("iframe").contents().find("#chart");
        jQuery(svgobj).attr("xmlns","http://www.w3.org/2000/svg");
        var svg = jQuery("#googlechart_view").find("svg").parent().html();
        jQuery("#svg").attr("value",svg);
        jQuery("#imageChart_url").attr("value", '');
        jQuery("#export_fmt").attr("value", "png");
    }
    else {
        var img_url = jQuery("#googlechart_view img").attr("src");
        img_url = "http://"+img_url.substr(img_url.indexOf("chart.googleapis.com"));
        jQuery("#imageChart_url").attr("value", img_url);
    }

    form.submit();
}

function exportToSVG(){
    var form = jQuery("#export");
    if (jQuery("#googlechart_view img").attr("src") === undefined){
        var svgobj = jQuery("#googlechart_full").find("iframe").contents().find("#chart");
        jQuery(svgobj).attr("xmlns","http://www.w3.org/2000/svg");
        var svg = jQuery("#googlechart_view").find("svg").parent().html();
        var clean_svg = svgCleanup(svg);
        jQuery("#svg").attr("value",clean_svg);
        jQuery("#export_fmt").attr("value", "svg");
    }

    form.submit();
}

function checkSVG(){
    var svg = jQuery("#googlechart_view").find("svg");
    if ((svg[0]) || (jQuery("#googlechart_view img").attr("src") !== undefined)){
       jQuery("#googlechart_export_button").show();
       jQuery("#googlechart_export_svg_button").show();
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

function drawChart(value, other_options){
    var other_settings = {
        merged_rows : '',
        available_columns : '',
        googlechart_config_array: [],
        GoogleChartsConfig : null
    };

    jQuery.extend(other_settings, other_options);

    var query_params = getQueryParams();

    var chart_id = value[0];
    var chart_json = value[1];
    var chart_columns = value[2];
    var chart_filters = value[3];
    if (query_params.rowFilters !== undefined){
        jQuery.each(chart_filters, function(key, value){
            if (query_params.rowFilters[key] !== undefined){
                value.defaults = query_params.rowFilters[key];
            }
        });
    }

    var chart_width = value[4];
    var chart_height = value[5];
    var chart_filterposition = value[6];
    var chart_options = value[7];
    var chart_sortFilter = value[9];
    if (query_params.sortFilter !== undefined){
        chart_sortFilter = query_params.sortFilter[0];
    }

    var chart_hasPNG = (value[10]==='True'?true:false);
    var chart_row_filters = value[11];
    var chart_sortBy = value[12];
    var chart_sortAsc = true;

    var sortAsc_str = value[13];
    if (sortAsc_str === 'desc'){
        chart_sortAsc = false;
    }

    var chart_columnFilters = value[14];

    var chart_unpivotSettings = value[15];

    jQuery("#filename").attr("value",chart_json.options.title);
    jQuery("#type").attr("value","image/png");

    jQuery("#googlechart_export_button").hide();
    jQuery("#googlechart_export_svg_button").hide();
    jQuery("#googlechart_embed_button").show();
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    filters = '<div id="googlechart_filters"></div>';
    var googlechart_table;
    if (chart_filterposition === 0){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters' class='googlechart_filters'></div>"+
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
                "<div id='googlechart_filters' class='googlechart_filters googlechart_filters_side'></div>"+
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
                "<div id='googlechart_filters' class='googlechart_filters'></div>"+
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
                "<div id='googlechart_filters' class='googlechart_filters googlechart_filters_side'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    jQuery(googlechart_table).appendTo('#googlechart_dashboard');
    jQuery("#googlechart_view").attr("chart_id", chart_id);
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

    jQuery('#googlechart_dashboard').data('other_settings', other_settings);

    var columnsFromSettings = getColumnsFromSettings(chart_columns);

    var tmp_columns_and_rows = getAvailable_columns_and_rows(chart_unpivotSettings, other_settings.available_columns, other_settings.merged_rows);
    var options = {
        originalTable : other_settings.merged_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : tmp_columns_and_rows.available_columns,
        filters : chart_row_filters,
        unpivotSettings : chart_unpivotSettings
    };

    var transformedTable = transformTable(options);
    other_settings.merged_rows = tmp_columns_and_rows.all_rows;
    other_settings.available_columns = tmp_columns_and_rows.available_columns;

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : chart_sortBy,
        sortAsc : chart_sortAsc,
        preparedColumns : chart_columns.prepared,
        enableEmptyRows : chart_options.enableEmptyRows
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
        sortFilter : chart_sortFilter,
        columnFilters : chart_columnFilters,
        columnTypes : transformedTable.properties,
        originalTable : other_settings.merged_rows,
        visibleColumns : columnsFromSettings.columns,
        updateHash : true
    };
    drawGoogleChart(googlechart_params);
}

function drawDashboard(value, other_options){
    var other_settings = {
        merged_rows : '',
        available_columns : '',
        googlechart_config_array: []
    };

    jQuery.extend(other_settings, other_options);

    var settings = {
        name : "",
        title : "",
        filters : [],
        filtersBox : {},
        widgets : [],
        chartsBox : {}
    };

    jQuery.extend(settings, value);

    var query_params = getQueryParams();

    jQuery("#googlechart_export_button").hide();
    jQuery("#googlechart_export_svg_button").hide();
    jQuery("#googlechart_embed_button").show();
    jQuery("#googlechart_filters").remove();
    jQuery("#googlechart_view").remove();
    jQuery("#googlechart_table").remove();
    var googlechart_table;
    if ((settings.chartsBox !== undefined) && (settings.chartsBox.order === 0)){
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_bottom googlechart_dashboard_table'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div id='googlechart_filters' class='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }else{
        googlechart_table = ""+
            "<div id='googlechart_table' class='googlechart_table googlechart_table_top googlechart_dashboard_table'>"+
                "<div id='googlechart_top_images'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters' class='googlechart_filters'></div>"+
                "<div id='googlechart_view' class='googlechart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_wm' class='eea-googlechart-hidden-image'></div>" +
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }

    jQuery('#googlechart_dashboard').data('other_settings', other_settings);
    jQuery(googlechart_table).appendTo('#googlechart_dashboard');

    var chart_url = baseurl + "#tab-" + settings.name.replace(".","-");

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
    jQuery('#googlechart_dashboard').attr("dashboard_id", value.name);

    // Set width, height
    if(settings.chartsBox.width){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).width(settings.chartsBox.width);
    }
    if(settings.chartsBox.height){
        jQuery('#googlechart_view', jQuery('#googlechart_dashboard')).height(settings.chartsBox.height);
    }
    if(settings.filtersBox.width){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).width(settings.filtersBox.width);
    }
    if(settings.filtersBox.height){
        jQuery('#googlechart_filters', jQuery('#googlechart_dashboard')).height(settings.filtersBox.height);
    }

    var dashboard_filters = settings.filters;
    if (query_params.rowFilters !== undefined){
        jQuery.each(dashboard_filters, function(idx, value){
            if (query_params.rowFilters[value.column] !== undefined){
                value.defaults = JSON.stringify(query_params.rowFilters[value.column]);
            }
        });
    }

    var googledashboard_params = {
        chartsDashboard : 'googlechart_dashboard',
        chartViewsDiv : 'googlechart_view',
        chartFiltersDiv : 'googlechart_filters',
        chartsSettings : settings.widgets,
        filters : dashboard_filters,
        rows : other_settings.merged_rows,
        columns : other_settings.available_columns,
        charts : other_settings.googlechart_config_array,
        dashboardName: value.name,
        updateHash : true
    };

    drawGoogleDashboard(googledashboard_params);
}

function showEmbed(){
    jQuery(".googlechart_ignore_filters").remove();
    jQuery(".googlechart_hide_filters").remove();
    var chartObj = jQuery("#googlechart_dashboard");
    var iframeWidth = chartObj.width();
    var iframeHeight = parseInt(chartObj.height(),10) + 30;
    var iframeSrc;
    var query_params = window.location.hash.split("_filters=")[1];
    if (query_params === undefined){
       query_params = "{}";
    }
    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                    "&chartWidth=" + chartObj.attr('chart_width') +
                    "&chartHeight=" + chartObj.attr('chart_height') +
                    "&customStyle=.googlechart_view{margin-left:0px%3B}" +
                    "#_filters=" + query_params;
    }
    else{
        iframeSrc = baseurl+"/embed-dashboard?dashboard=" + chartObj.attr('dashboard_id')+ 
                    "&customStyle=.googlechart_view{margin-left:0px%3B}" +
                    "#_filters=" + query_params;
    }
    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
    var hasPNG = chartObj.attr('chart_hasPNG');
    var embedHtml = '<div class="googlechart_embed_form">' +
                        '<h3>Interactive chart: </h3>'+
                        '<div class="googlechart_ignore_filters">'+
                            'Remember my filter choices <input class="googlechart_embed_ignore_filters" type="checkbox" checked="checked"/><br/>'+
                        '</div>'+
                        '<div class="googlechart_hide_filters">' +
                            'Include the following filters: <br/>' +
                            '<table><tr><td style="width:200px">All</td><td><input class="googlechart_hide_filter" type="checkbox" filter_id="all" checked="checked"/></td></tr></table>'+
                        '</div>'+
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
                if (jQuery(".googlechart_filter").length === 0){
                    jQuery(".googlechart_hide_filters").hide();
                    jQuery(".googlechart_ignore_filters").hide();
                }
                else{
                    jQuery.each(jQuery(".googlechart_filter"), function(idx, filter){
                        var filter_id = jQuery(filter).attr("id");
                        var filter_label = jQuery(filter).find(".google-visualization-controls-label").text();
                        jQuery("<tr><td>"+filter_label+"</td><td><input class='googlechart_hide_filter' type='checkbox' checked='checked' filter_id='"+filter_id+"'/></td></tr>").appendTo(".googlechart_hide_filters table");
                    });
                }
                jQuery('.iframeCode', this)[0].focus();
                jQuery('.iframeCode', this)[0].select();
                jQuery(this).delegate('textarea', 'click', function(){
                    this.focus();
                    this.select();
                });
                jQuery(this).delegate(".googlechart_embed_form input", "change", function(){
                    if (jQuery(this).attr("filter_id") === 'all'){
                        jQuery(".googlechart_hide_filter").prop("checked", jQuery(this).prop("checked"));
                    }

                    var hide_filters = [];
                    jQuery.each(jQuery(".googlechart_hide_filter"), function(idx, filter){
                        if (jQuery(filter).attr("filter_id") !== 'all'){
                            if (!jQuery(filter).prop("checked")){
                                hide_filters.push(jQuery(filter).attr("filter_id"));
                            }
                        }
                    });
                    if (hide_filters.length !== jQuery(".googlechart_hide_filter").length - 1){
                        jQuery("input.googlechart_hide_filter[filter_id='all']").prop("checked", true);
                    }
                    else {
                        jQuery("input.googlechart_hide_filter[filter_id='all']").prop("checked", false);
                    }
                    var query_params = getQueryParams();
                    query_params.hideFilters = hide_filters;
                    query_params = encodeURIComponent(JSON.stringify(query_params).split(",").join(";"));

                    var iframeSrc;
                    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
                        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                            "&chartWidth=" + chartObj.attr('chart_width') +
                            "&chartHeight=" + chartObj.attr('chart_height') +
                            "&customStyle=.googlechart_view{margin-left:0px%3B}";
                    }
                    else{
                        iframeSrc = baseurl+"/embed-dashboard?dashboard=" + chartObj.attr('dashboard_id')+ 
                            "&customStyle=.googlechart_view{margin-left:0px%3B}";
                    }
                    if (jQuery(".googlechart_embed_ignore_filters").attr("checked") === 'checked'){
                        iframeSrc += "#_filters=" + query_params;
                    }
                    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
                    jQuery(".iframeCode").text(iframeCode);

                });
            }
        }
    );
}

var googleChartTabClick = function(context){
    if (jQuery(context).attr("chart_id") !== current_chart_id){
        current_chart_id = jQuery(context).attr("chart_id");

        var chart_index_to_use = -1;
        jQuery(googlechart_config_array).each(function(index, value){
            if (value[0] == current_chart_id){
                chart_index_to_use = index;
            }
        });
        if (chart_index_to_use != -1){
            jQuery("#googlechart_filters").html('');
            jQuery("#googlechart_view").html('');

            var chart_other_options = {
                merged_rows: merged_rows,
                available_columns: available_columns,
                googlechart_config_array: googlechart_config_array,
                GoogleChartsConfig: GoogleChartsConfig
            };

            drawChart(googlechart_config_array[chart_index_to_use], chart_other_options);
        }
        else {
            var config;
            jQuery(dashboards_config_array).each(function(index, value){
                if (value.name === current_chart_id){
                    config = value;
                }
                else if (value.name == current_chart_id.replace("-", ".")){
                    config = value;
                }
            });
            var dashboard_other_options = {
                merged_rows: merged_rows,
                available_columns: available_columns,
                googlechart_config_array: googlechart_config_array,
                GoogleChartsConfig: GoogleChartsConfig
            };
            drawDashboard(config, dashboard_other_options);
        }
    }
    return false;
};

var googleChartOnTabClick = function(settings){
    googlechart_config_array = JSON.parse(jQuery("#daviz-view").attr("original_configs"));

    var tab = jQuery(settings.tab);
    var css = tab.attr('class');
    if(css.indexOf('googlechart_class') === -1){
        jQuery('.googlecharts_container').hide();
        return;
    }

    var chart_id = tab.attr('href').replace('#tab-', '');

    tab.attr('chart_id', chart_id);
    jQuery('.googlecharts_container').show();
    googleChartTabClick(tab);
};

jQuery(document).ready(function($){
    // workaround for firefox issue: http://taskman.eionet.europa.eu/issues/9941
    if (jQuery.browser.mozilla){
        var href = document.location.href;
        var href_array = href.split("#");
        if (!href_array[0].endsWith("/")){
            href_array[0] = href_array[0] + "/";
            var href2 = href_array.join("#");
            document.location = href2;
        }
    }
    // end of workaround

    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    jQuery.each(googlechart_config_array, function(key, config){
        config[1].options.title = config[1].options.title + " — " + main_title;
    });

    // Integrate google charts with daviz tabs
    jQuery('.googlecharts_container').hide();
    jQuery(document).bind('eea-daviz-tab-click', function(evt, settings){
        googleChartOnTabClick(settings);
    });

    // First tab is a google charts tab
    var api = jQuery("ul.chart-tabs").data('tabs');
    var hash = document.location.hash;
    if (hash === ""){
        hash = jQuery(api.getTabs()[0]).attr("href");
        document.location.hash = hash;
    }
    hash = hash.split("_filters=")[0];
    var index = 0;
    jQuery.each(api.getTabs(), function(idx, tab){
        if(jQuery(tab).attr('href') == hash){
            index = idx;
            return false;
        }
    });

    jQuery("#daviz-view").attr("original_configs", JSON.stringify(googlechart_config_array));

    googleChartOnTabClick({
        api: api,
        tab: api.getTabs()[index],
        index: index
    });

    jQuery(window).trigger("hashchange");
});
