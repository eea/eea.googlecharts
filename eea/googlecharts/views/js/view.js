if (!window.EEAGoogleCharts) {
    window.EEAGoogleCharts = {};
}

var embedModule = window.EEAGoogleCharts.embed;

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
    svg.attr("xmlns","http://www.w3.org/2000/svg");
    var r_elems = svg.find("rect[fill^='url']");
    var g_elems = svg.find("g[clip-path^='url']");
    var elems = jQuery.merge(r_elems, g_elems);

    patched_each(elems, function(idx, elem){
        var fillVal = jQuery(elem).attr("fill");
        var clip_path = jQuery(elem).attr("clip-path");
        var elem_attr, url_val;
        if (fillVal === undefined){
            elem_attr = 'clip-path';
            url_val = jQuery(elem).attr("clip-path");
        } else if (clip_path === undefined) {
            elem_attr = 'fill';
            url_val = jQuery(elem).attr("fill");
        } else {
            return;
        }
        if (url_val.indexOf("url(") === 0){
            url_val = 'url(#' + url_val.split('#')[1].split('"').join('');
            jQuery(elem).attr(elem_attr, url_val);
        }
    });

    container = jQuery('<div/>');
    container.append(svg);
    return container.html();
}

function exportToPng(){
    var form = jQuery("#export");

    if (jQuery("#googlechart_view img").attr("src") === undefined){
        var svg = jQuery('<div>').append(jQuery("#googlechart_view").find("svg").clone()).html();
        var clean_svg = svgCleanup(svg);

        jQuery("#svg").attr("value",clean_svg);
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
        var svg = jQuery('<div>').append(jQuery("#googlechart_view").find("svg").clone()).html();
        var clean_svg = svgCleanup(svg);
        jQuery("#svg").attr("value",clean_svg);
        jQuery("#export_fmt").attr("value", "svg");
    }

    form.submit();
}

function checkSVG(){
    var svg = jQuery("#googlechart_view").find("svg");
    var chart_image = jQuery("#googlechart_view img"),
        chart_image_src = chart_image.attr("src");
    // 25835 data-and-maps/daviz/cars-co2-emissions-trends-by-manufacturer-1
    // table charts can have images for pagination as such we need to check
    // if image is referenced from chart.googleapis.com
    if ((svg[0]) || ( chart_image_src !== undefined &&
                     chart_image_src.indexOf('chart.googleapis.com') !== -1)){
        jQuery("#googlechart_export_button").show();
        if(svg[0]) {
            jQuery("#googlechart_export_svg_button").show();
        }
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
        patched_each(chart_filters, function(key, value){
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
    var chart_ChartNotes = value[16];

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
    var resized_width = chart_width;
    if ((gl_charts.googlechart_view) && (gl_charts.googlechart_view.getOption("resized_width"))){
        resized_width = gl_charts.googlechart_view.getOption("resized_width");
    }
    jQuery("#googlechart_table").css("max-width",chart_width + 20);
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

    var new_columns = [];

    var column_names_to_be_shown = [];
    var i;
    if (chart_columns.columnsToBeShown){
        for (i = 0; i < chart_columns.columnsToBeShown.length; i++){
            for (var j = 0; j < chart_columns.prepared.length; j++){
                if (chart_columns.columnsToBeShown[i] === chart_columns.prepared[j].fullname){
                    column_names_to_be_shown.push(chart_columns.prepared[j].name);
                }
            }
        }
        for (i = 0; i < columnsFromSettings.columns.length; i++){
            if (jQuery.inArray(columnsFromSettings.columns[i], column_names_to_be_shown) !== -1){
                new_columns.push(columnsFromSettings.columns[i]);
            }
            if (jQuery.inArray(columnsFromSettings.columns[i], columnsFromSettings.normalColumns) !== -1){
                new_columns.push(columnsFromSettings.columns[i]);
            }
        }
    }
    else {
        new_columns = columnsFromSettings.columns;
    }
    options = {
        originalDataTable : transformedTable,
        columns : new_columns,
        sortBy : chart_sortBy,
        sortAsc : chart_sortAsc,
        preparedColumns : chart_columns.prepared,
        enableEmptyRows : chart_options.enableEmptyRows,
        chartType : chart_json.chartType,
        focusTarget : chart_json.options.focusTarget
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
        chartWidth : resized_width,
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
        updateHash : true,
        ChartNotes : chart_ChartNotes,
        columnsToBeShown: chart_columns.columnsToBeShown
    };
    return drawGoogleChart(googlechart_params);
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
    jQuery(googlechart_table).css("max-width",value[4] + 20);
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
        patched_each(dashboard_filters, function(idx, value){
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

function maintainAspectRatio(elem, aspectRatio) {
    elem = jQuery(elem);
    var value = parseInt(elem.attr("value"), 10);
    var new_value;

    if (elem.attr("id") === "manual-chart-width") {
        new_value = Math.round(value / aspectRatio);
        jQuery("#manual-chart-height").attr("value", new_value);
        return [value, new_value];
    } else {
        new_value = Math.round(value * aspectRatio);
        jQuery("#manual-chart-width").attr("value", new_value);
        $("#chart-size-slider").slider( "value", new_value);
        return [new_value, value];
    }
}

function isPositiveInteger(n) {
    return n >>> 0 === parseFloat(n);
}

function validateSize(value) {
    if (jQuery.isNumeric(value) && isPositiveInteger(value)) {
        return true;
    }
    return false;
}

function getManualPaddings(){
    var paddings = [];
    var error = jQuery('.padding-error');
    error.hide();

    jQuery(".manual-padding-settings").each(function() {
        var value = jQuery(this).val();
        if (!jQuery.isNumeric(value) || !isPositiveInteger(value)) {
            jQuery(this).attr("value", 0);
            error.show();
        }
        paddings.push(jQuery(this).val());
    });

    return paddings;
}

function showEmbed(){
    jQuery(".googlechart_ignore_filters").remove();
    jQuery(".googlechart_hide_filters").remove();
    jQuery(".googlechart_embed_form").remove();
    var chartObj = jQuery("#googlechart_dashboard");
    var chartWidth  = chartObj.attr('chart_width');
    if (chartWidth=='100%') {
        //handle 100% width used for the window resize
        chartWidth = jQuery('#googlechart_table').width() - 20;
    }
    var chartHeight = chartObj.attr('chart_height');
    var iframeWidth = jQuery('#googlechart_table').width();
    var iframeHeight = parseInt(chartObj.height(),10) + 30;
    var widthDiff = iframeWidth - chartWidth;
    var heightDiff = iframeHeight - chartHeight;
    var iframeSrc;
    var query_params = window.location.hash.split("_filters=")[1];
    if (query_params === undefined){
       query_params = "{}";
    }
    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                    "&chartWidth=" + chartWidth +
                    "&chartHeight=" + chartHeight +
                    "&padding=fixed" +
                    "&customStyle=.googlechart_view{margin-left:0px%3B}";
    }
    else{
        iframeSrc = baseurl+"/embed-dashboard?dashboard=" + chartObj.attr('dashboard_id')+
                    "&customStyle=.googlechart_view{margin-left:0px%3B}";
    }
    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
    var hasPNG = chartObj.attr('chart_hasPNG');
    var embedHtml = '<div class="googlechart_embed_form">' +
                        '<h3>Interactive chart: </h3>'+
                        '<div class="googlechart_ignore_filters">'+
                            'Remember my filter choices <input class="googlechart_embed_ignore_filters" type="checkbox"/><br/>'+
                        '</div>'+
                        '<div class="googlechart_hide_filters" style="display:none">' +
                            'Include the following filters: <br/>' +
                            '<table><tr><td style="width:200px">All</td><td><input class="googlechart_hide_filter" type="checkbox" filter_id="all" checked="checked"/></td></tr></table>'+
                        '</div>'+
                        '<textarea class="iframeCode" style="width:96%" rows="7">' + iframeCode + '</textarea>' +
                        '<div class="embed-settings">' +
                        '<h4>Chart size</h4>' +
                        '<div id="manual-chart-size">' +
                        '<p>Drag slider to adjust chart size:</p>' +
                        '<div id="chart-size-slider" title=""></div>' +
                        '<a href="#" class="discreet embed-controls" id="default-size">Reset to default size</a>' +
                        '<div class="visualClear"><!-- &nbsp; --></div>' +
                        '<p class="manual-settings-error size-error">Please enter only positive integers!</p>' +
                        '<div class="chart-size-settings"><div class="chart-size">' +
                        '<p><label for="manual-chart-width">Chart width: </label><input type="text" name="manual-chart-width" id="manual-chart-width" class="manual-chart-settings" value="' + chartWidth + '"/>px</p>' +
                        '<p><label for="manual-chart-height">Chart height: </label><input type="text" name="manual-chart-height" id="manual-chart-height" class="manual-chart-settings" value="' + chartHeight + '"/>px</p></div>' +
                        '<div class="embed-misc-settings"><p title="Keep aspect ratio"><input type="checkbox" checked="checked" name="aspect-ratio" id="aspect-ratio"/>Keep aspect ratio</p>' +
                        '<p title="Also resize the parent iframe when resizing the chart"><input type="checkbox" checked="checked" name="resize-iframe" id="resize-iframe"/>Also resize iframe</p></div>' +
                        '<div class="visualClear"><!-- &nbsp; --></div></div></div>' +
                        '<a href="#" class="discreet embed-controls" id="embed-padding-advanced">Advanced settings</a>' +
                        '<div class="visualClear"><!-- &nbsp; --></div>' +
                        '<div id="embed-padding-settings">' +
                        '<h4>Padding</h4>' +
                        '<input type="hidden" name="padding-settings" id="padding-settings" value="fixed" />' +
                        '<span title="Keep the percentual chart paddings when resizing" class="radio-embed"><input type="radio" name="padding" class="embed-padding" value="auto" />Auto</span>' +
                        '<span title="Keep the fixed chart paddings when resizing" class="radio-embed"><input type="radio" checked="checked" name="padding" class="embed-padding" value="fixed"/>Fixed</span>' +
                        '<span title="Use my own padding settings when resizing" class="radio-embed"><input type="radio" name="padding" class="embed-padding" value="manual" />Manual<br/></span>' +
                        '<div id="manual-paddings">' +
                        '<p class="manual-settings-error padding-error">Please enter only positive integers!</p>' +
                        '<p><label for="top_p">Top padding: </label><input type="text" name="top_p" id="top_p" class="manual-padding-settings" value="0"/>px</p>' +
                        '<p><label for="right_p">Right padding: </label><input type="text" name="right_p" id="right_p" class="manual-padding-settings" value="0"/>px</p>' +
                        '<p><label for="bottom_p">Bottom padding: </label><input type="text" name="bottom_p" id="bottom_p" class="manual-padding-settings" value="0"/>px</p>' +
                        '<p><label for="left_p">Left padding: </label><input type="text" name="left_p" id="left_p" class="manual-padding-settings" value="0"/>px</p></div></div></div>';
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
                    patched_each(jQuery(".googlechart_filter"), function(idx, filter){
                        var filter_id = jQuery(filter).attr("id");
                        var filter_label = jQuery(filter).find(".google-visualization-controls-label").text();
                        jQuery("<tr><td>"+filter_label+"</td><td><input class='googlechart_hide_filter' type='checkbox' checked='checked' filter_id='"+filter_id+"'/></td></tr>").appendTo(".googlechart_hide_filters table");
                    });
                }
                var manual_settings = jQuery(".manual-padding-settings");
                var padding_settings = jQuery("#padding-settings");
                var aspectRatio = chartWidth / chartHeight;
                padding_settings.attr("value", "");
                jQuery("#chart-size-slider").slider({
                    min: 100,
                    max: 1000,
                    value: chartObj.attr('chart_width'),
                    slide: function( event, ui ) {
                        jQuery('#manual-chart-width').attr("value", ui.value);
                        jQuery('#manual-chart-width').trigger("change", [true]);
                    }
                });
                jQuery(".manual-settings-error").hide();
                if (!jQuery(".embed-padding[value='manual']").is(":checked")) {
                    manual_settings.attr("disabled", true);
                }

                jQuery(this).delegate(".embed-padding", "change", function() {
                    jQuery('.padding-error').hide();
                    if (this.value === 'manual') {
                        manual_settings.attr("disabled", false);
                        padding_settings.attr("value", getManualPaddings());
                    } else if (this.value === 'auto') {
                        manual_settings.attr("disabled", true);
                        padding_settings.attr("value", this.value);
                    } else {
                        manual_settings.attr("disabled", true);
                        padding_settings.attr("value", "fixed");
                    }
                });

                jQuery(this).delegate(".manual-padding-settings", "change", function() {
                    padding_settings.attr("value", getManualPaddings());
                });

                jQuery(this).delegate(".manual-chart-settings", "change", function(e, keepAspectRatio) {
                    jQuery('.size-error').hide();
                    var value = jQuery(this).val();
                    var default_val;

                    if (jQuery(this).attr("id") === 'manual-chart-width') {
                        default_val = chartObj.attr('chart_width');

                        if (!validateSize(value)) {
                            jQuery(this).attr("value", default_val);
                            jQuery('.size-error').show();
                        }
                        value = parseInt(jQuery(this).val(), 10);
                        if (jQuery("#resize-iframe").is(':checked')) {
                            iframeWidth = value + widthDiff;
                        }
                        $("#chart-size-slider").slider( "value", value);

                    } else {
                        default_val = chartObj.attr('chart_height');

                        if (!validateSize(value)) {
                            jQuery(this).attr("value", default_val);
                            jQuery('.size-error').show();
                        }
                        value = parseInt(jQuery(this).val(), 10);
                        if (jQuery("#resize-iframe").is(':checked')) {
                            iframeHeight = value + heightDiff;
                        }
                    }
                    if (jQuery("#aspect-ratio").is(':checked') || keepAspectRatio) {
                        var chartSizes = maintainAspectRatio(this, aspectRatio);
                        if (chartSizes && jQuery("#resize-iframe").is(':checked')) {
                            iframeWidth = chartSizes[0] + widthDiff;
                            iframeHeight = chartSizes[1] + heightDiff;
                        }
                    }
                });

                var p_settings = jQuery("#embed-padding-settings");
                p_settings.hide();
                jQuery(this).delegate("#default-size", "click", function(evt) {
                    evt.preventDefault();
                    jQuery("#chart-size-slider").slider( "value", chartWidth);
                    jQuery("#manual-chart-width").attr("value", chartWidth);
                    jQuery("#manual-chart-height").attr("value", chartHeight);
                    iframeWidth = chartObj.width();
                    iframeHeight = parseInt(chartObj.height(),10) + 30;
                    jQuery("#manual-chart-width").trigger("change");
                });

                jQuery(this).delegate("#embed-padding-advanced", "click", function(evt) {
                    evt.preventDefault();
                    if (p_settings.is(":hidden")) {
                        p_settings.show();
                    } else {
                        p_settings.hide();
                    }
                });

                jQuery('.iframeCode', this)[0].focus();
                jQuery('.iframeCode', this)[0].select();
                jQuery(this).delegate('textarea', 'click', function(){
                    this.focus();
                    this.select();
                });
                jQuery(".googlechart_embed_form input").bind("change", function(){
                    if (jQuery(this).attr("filter_id") === 'all'){
                        jQuery(".googlechart_hide_filter").prop("checked", jQuery(this).prop("checked"));
                    }

                    var hide_filters = [];
                    patched_each(jQuery(".googlechart_hide_filter"), function(idx, filter){
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
                    var padding = jQuery("#padding-settings").val() || 'fixed';
                    if (typeof(chartObj.attr('chart_id')) !== 'undefined'){
                        iframeSrc = baseurl+"/embed-chart?chart=" + chartObj.attr('chart_id') +
                            "&chartWidth=" + jQuery('#manual-chart-width').val() +
                            "&chartHeight=" + jQuery('#manual-chart-height').val() +
                            "&padding=" + padding +
                            "&customStyle=.googlechart_view{margin-left:0px%3B}";
                    }
                    else{
                        iframeSrc = baseurl+"/embed-dashboard?dashboard=" + chartObj.attr('dashboard_id')+
                            "&customStyle=.googlechart_view{margin-left:0px%3B}";
                    }
                    if (jQuery(".googlechart_embed_ignore_filters").attr("checked") === 'checked'){
                        iframeSrc += "#_filters=" + query_params;
                        jQuery(".googlechart_hide_filters").show();
                    }
                    else{
                        jQuery(".googlechart_hide_filters").hide();
                    }
                    var iframeCode = "<iframe width='" + iframeWidth + "' height='" + iframeHeight + "' src='" + iframeSrc + "'></iframe>";
                    jQuery(".iframeCode").text(iframeCode);

                });
            }
        }
    );
}

var googleChartTabClick = function(context){
    current_chart_id = jQuery(context).attr("chart_id");

    var chart_index_to_use = -1;
    jQuery(googlechart_config_array).each(function(index, value){
        if (value[0] == current_chart_id){
            chart_index_to_use = index;
        }
//        value[4] = jQuery('#googlechart_table').width() - 20;
//        value[4] = '100%';
        var chart_options = value[1].options;
        var legend = chart_options.legend;
        // #28453 do now show legend if it is set to none
        if (legend === "none") {
            return;
        }
        // #28505 set the legend to the top only if we have
        // a small resolution and the legend is set to the
        // right or left. If users sets it to bottom of inside
        // it would give the same effect as sticking it to the
        // top so we avoid giving surprises in those cases
        // and leave the legend set to the initial value
        if (jQuery(document).width() < 600 &&
            (legend === "right" || legend === "left")) {
            chart_options.legend = 'top';
        }
    });
    if (chart_index_to_use !== -1){
        jQuery("#googlechart_filters").html('');
        jQuery("#googlechart_view").html('');

        var chart_other_options = {
            merged_rows: merged_rows,
            available_columns: available_columns,
            googlechart_config_array: googlechart_config_array,
            GoogleChartsConfig: GoogleChartsConfig
        };

        guessSeries(googlechart_config_array[chart_index_to_use]);
        gl_charts.googlechart_view = drawChart(googlechart_config_array[chart_index_to_use], chart_other_options).chart;
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
    return false;
};

var googleChartOnTabClick = function(settings){
    var tab = jQuery(settings.tab);
    var css = tab.attr('class');
    googlechart_config_array = JSON.parse(jQuery("#daviz-view").attr("original_configs"));

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
    // Removed workaround as the issue has been already fixed. Details here:
    // https://code.google.com/p/google-visualization-api-issues/issues/detail?id=598
    // if (jQuery.browser.mozilla){
    //     var href = document.location.href;
    //     var href_array = href.split("#");
    //     if (!href_array[0].endsWith("/")){
    //         href_array[0] = href_array[0] + "/";
    //         var href2 = href_array.join("#");
    //         document.location = href2;
    //     }
    // }
    // end of workaround
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    var is_pdf_printing = embedModule && embedModule.isPrint;
    if (!is_pdf_printing) {
        patched_each(googlechart_config_array, function(key, config){
            config[1].options.title = config[1].options.title + " — " + window.main_title;
        });
    }

    // Integrate google charts with daviz tabs
    jQuery('.googlecharts_container').hide();
    jQuery(document).bind('eea-daviz-tab-click', function(evt, settings){
        googleChartOnTabClick(settings);
    });

    // First tab is a google charts tab
    var api = jQuery("ul.chart-tabs").data('tabs');
    if (!api) {
        return;
    }
    var hash = document.location.hash;
    if (hash === ""){
        hash = jQuery(api.getTabs()[0]).attr("href");
        document.location.hash = hash;
    }
    hash = hash.split("_filters=")[0];
    var index = 0;
    patched_each(api.getTabs(), function(idx, tab){
        if(jQuery(tab).attr('href') == hash){
            index = idx;
            return false;
        }
    });

    jQuery("#daviz-view").attr("original_configs", JSON.stringify(googlechart_config_array));

    gl_charts.googlechart_view = null;

    googleChartOnTabClick({
        api: api,
        tab: api.getTabs()[index],
        index: index
    });

    jQuery(window).resize(_.debounce(function() {
        var new_width = jQuery('#googlechart_table').width() - 20;
        jQuery('#googlechart_view').css('width', new_width);
        gl_charts.googlechart_view.setOption('width', new_width);
        gl_charts.googlechart_view.setOption('resized_width', new_width);
        disableBaseHref();
        gl_charts.googlechart_view.draw();
    }));

    jQuery(window).trigger("hashchange");
});
