var baseHref;
var baseHrefCounter = 0;
function disableBaseHref(){
    if ($('base').attr('href') !== ""){
        baseHref = $('base').attr('href');
    }
    $('base').attr('href', '');
}

function enableBaseHref(){
    baseHrefCounter++;
    setTimeout(function(){
        baseHrefCounter--;
        if (baseHrefCounter === 0){
            $('base').attr('href', baseHref);
        }
    }, 2000);
}

if (!window.EEAGoogleCharts) {
    window.EEAGoogleCharts = {};
}
if (!window.EEAGoogleCharts.embed) {
    window.EEAGoogleCharts.embed = {};
}

var embedModule = window.EEAGoogleCharts.embed;

function get_notes_for_chart(ChartNotesList, chart_id){
  var notes = _.filter(ChartNotesList, function(note){
    return note.global || note.charts.indexOf(chart_id) !== -1;
  });
  return notes || [];
}

function fixSVG(container){
    if (jQuery.browser.mozilla || jQuery.browser.msie){
        return;
    }
    var base = jQuery("base").attr("href");
    if (base === undefined){
        return;
    }

    var baseForSVG = window.location.href.split("#")[0];

    var r_elems = jQuery(container).find("rect[fill^='url']");
    var g_elems = jQuery(container).find("g[clip-path^='url']");
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
            url_val = url_val.replace("url(", "url("+baseForSVG);
            jQuery(elem).attr(elem_attr, url_val);
        }
    });
}

function chartAreaAttribute2px(value, size){
    var pixels = 0;
    if (typeof(value) === "string"){
        if (value.indexOf("%") != -1){
            pixels = size / 100 * parseFloat(value, 10);
        }
    }
    else {
        if (typeof(value) === "number"){
            pixels = value;
        }
    }
    return parseInt(pixels, 10);
}

function getQueryParams(obj){
    var query_params = window.location.hash.split("_filters=")[1];
    if (jQuery(obj).closest("div.googlechart_dashboard").attr("query_params") !== undefined){
        query_params = jQuery(obj).closest("div.googlechart_dashboard").attr("query_params");
    }
    if (query_params === undefined){
        query_params = "{}";
    }
    query_params = JSON.parse(decodeURIComponent(query_params).split(";").join(","));

    if (query_params.rowFilters === undefined){
        query_params.rowFilters = {};
    }

    if (query_params.columnFilters === undefined){
        query_params.columnFilters = {};
    }
    return query_params;
}

function updateHashForRowFilter(availableColumns, filter, type, updateHash){
    if (filter){
        var columnLabel = filter.getOptions().filterColumnLabel;
        var columnName = '';
        var values = [];
        patched_each(availableColumns, function(key, value){
            if (value === columnLabel){
                columnName = key;
            }
        });
        if (type === "0"){
            values.push(filter.getState().lowValue);
            values.push(filter.getState().highValue);
        }
        if (type === "1"){
            values.push(filter.getState().value);
        }
        if ((type === "2") || (type === "3")){
            values = filter.getState().selectedValues;
        }
        var hash = window.location.hash.split("_filters=")[0];

        var query_params = getQueryParams("#"+filter.getContainerId());

        if (values.length > 0){
            query_params.rowFilters[columnName] = values;
        }
        else {
            delete(query_params.rowFilters[columnName]);
        }

        query_params = encodeURIComponent(JSON.stringify(query_params).split(",").join(";"));
        if (updateHash){
            window.location.hash = hash + "_filters=" + query_params;
        }
        else{
            jQuery("#"+filter.getContainerId()).closest("div.googlechart_dashboard").attr("query_params", query_params);
        }
    }
}

function updateFilterDivs(){
    patched_each(jQuery("div.googlechart_filter"), function(idx, filter){
        var filterId = jQuery(filter).attr("id");
        var filterName = filterId.substr(20);
        var filterType = "rowFilter";
        var customPos;
        if (filterId === 'googlechart_filters_sortfilter_custom_filter'){
            customPos = filterName.indexOf("_custom_filter");
            filterType = "sortFilter";
            filterName = filterName.substr(0, customPos);
        }
        else {
            customPos = filterName.indexOf("_custom_filter");
            if (customPos !== -1){
                filterType = "columnFilter";
                filterName = filterName.substr(0, customPos);
            }
        }
        if (filterName.indexOf("pre_config_filter_") === 0){
            filterName = "pre_config_" + filterName.substr(18);
        }
        var chart_id = jQuery(this).closest(".googlechart_table").attr("id");
        var chart_id_array = chart_id.split("_");
        var chart_hash = "";
        if (chart_id_array[chart_id_array.length - 1] !== "table"){
            chart_hash = chart_id_array[chart_id_array.length - 1];
        }
        var filterInfo = {};
        var tmp_filterName = filterName;
        var tmp_filterId = filterId;
        if (chart_hash !== ""){
            tmp_filterName = tmp_filterName.replace(chart_hash + "_", "");
            tmp_filterId = tmp_filterId.replace(chart_hash + "_", "");
        }

        filterInfo.filterType = filterType;
        if (filterType !== "sortFilter"){
            filterInfo.filterNameForValueParams = tmp_filterName;
        }
        filterInfo.filterNameForHiddenParams = tmp_filterId;
        jQuery(filter).attr("filterInfo", JSON.stringify(filterInfo));
    });
    patched_each(jQuery("li.charts-container-horizontal"), function(idx, filterValue){
        if (jQuery(filterValue).closest(".googlechart_filters").hasClass("googlechart_filters_side")){
            return;
        }
        if (!jQuery(filterValue).hasClass("eea-moved-in-container")){
            jQuery("<div class='eea-filter-value-container'></div>").appendTo(jQuery(filterValue));
            jQuery(filterValue).addClass("eea-moved-in-container");
            jQuery(filterValue).find(".charts-inline-block").appendTo(jQuery(filterValue).find(".eea-filter-value-container"));
        }
    });
    patched_each(jQuery("ul.google-visualization-controls-categoryfilter-selected:visible"), function(idx, filterUl){
        if (jQuery(filterUl).closest(".googlechart_filters").length === 0){
            return;
        }
        if (jQuery(filterUl).closest(".googlechart_filters").hasClass("googlechart_filters_side")){
            return;
        }
        var container = jQuery(filterUl).closest("div.googlechart_filter");
        var button = jQuery(container).find("div.charts-menu-button");
    });
    patched_each(jQuery(".googlechart_filter"), function(idx, filter){
        filterWidth = jQuery(filter).width();
        filterLeft = jQuery(filter).offset().left;
        containerWidth = jQuery(filter).closest(".googlechart_filters").width();
        containerLeft = jQuery(filter).closest(".googlechart_filters").offset().left;
        if ((containerWidth !== 0) && ((containerWidth + containerLeft - filterWidth - filterLeft) < filterWidth)){
            if (!jQuery(filter).hasClass("eea-beautified")){
                jQuery(filter).addClass("eea-beautified");
            }
        }
    });
    var containers = [".googlechart_table_left", ".googlechart_table_right"];
    patched_each(containers, function(idx, container){
        patched_each(jQuery(container).find(".google-visualization-controls-rangefilter"), function(idx, filter){
            labels = jQuery(filter).find(".google-visualization-controls-rangefilter-thumblabel");
            if (!jQuery(filter).hasClass("eea-beautified")){
                jQuery(filter).addClass("eea-beautified");
                jQuery("<br/>").insertAfter(labels.eq(0));
                jQuery("<br/>").insertBefore(labels.eq(1));
                labels.eq(1).css("float", "right");
                labels.eq(0).css("float", "left");
            }
        });
    });
}

function drawGoogleChart(options){
    var settings = {
        chartDashboard : '',
        chartViewDiv : '',
        chartFiltersDiv : '',
        chartId : '',
        chartJson : '',
        chartDataTable : '',
        chartFilters : '',
        chartWidth : '',
        chartHeight : '',
        chartFilterPosition : '',
        chartOptions : '',
        availableColumns : '',
        chartReadyEvent: function() {
            if (embedModule && !embedModule.isPrint) {
                return;
            }
            // get only the text elements that are bold which should select only title texts
            var $chart_titles = $("#" + this.chartViewDiv).find("text").filter(function(idx, el) {
                return el.getAttribute('font-weight') === "bold";
            });
            // 30473 move dashboard chart title to the left side of the chart when pdf printing
            $chart_titles.each(function(idx, el) {
                if (el.getAttribute('PDF_MODIFIED')) {
                    return;
                }
                el.setAttribute('x', '10');
                el.setAttribute('y', window.parseInt(el.getAttribute('y')) - 5);
                var next_el = $(el).next()[0];
                if (next_el && next_el.tagName === "rect") {
                    next_el.setAttribute('x', 10);
                    next_el.setAttribute('width', 550);
                }
                el.setAttribute('PDF_MODIFIED', true);
            });
        },
        chartErrorEvent : function(){},
        sortFilter : '__disabled__',
        customFilterHandler : function(){},
        customFilterOptions : null,
        notes: [],
        hideNotes: false,
        columnFilters : [],
        columnTypes: {},
        originalTable : '',
        visibleColumns : '',
        updateHash : false,
        ChartNotes : []
    };
    jQuery.extend(settings, options);
    if (settings.chartJson.chartType === "ImageChart"){
        var tmp_width = settings.chartWidth;
        var tmp_height = settings.chartHeight;
        var tmp_pixels = tmp_width * tmp_height;
        var max_pixels = 300000;
        if (tmp_pixels > max_pixels){
            var tmp_ratio = tmp_width / tmp_height;
            tmp_height = Math.sqrt(max_pixels/tmp_ratio);
            tmp_width = tmp_height * tmp_ratio;
        }
        settings.chartJson.options.chs = tmp_width.toString() + "," + tmp_height.toString();
        if (settings.chartOptions.hasOwnProperty("chartArea")){
            var marginLeft = chartAreaAttribute2px(settings.chartOptions.chartArea.left, tmp_width);
            var marginRight = tmp_width - marginLeft - chartAreaAttribute2px(settings.chartOptions.chartArea.width, tmp_width);
            var marginTop = chartAreaAttribute2px(settings.chartOptions.chartArea.top, settings.chartHeight);
            var marginBottom = tmp_height - marginTop - chartAreaAttribute2px(settings.chartOptions.chartArea.height, tmp_height);
            settings.chartJson.options.chma = marginLeft + "," + marginRight + "," + marginTop + "," + marginBottom;
        }
    }
    jQuery("<div class='googlechart_loading_img'></div>").appendTo("#"+settings.chartViewDiv);

    settings.notes = _.sortBy(get_notes_for_chart(settings.ChartNotes, settings.chartId), function(note){
      return note.order[settings.chartId];
    });

    jQuery("#"+settings.chartViewDiv).width(settings.chartWidth).height(settings.chartHeight);

    settings.chartJson.options.allowHtml = true;
    settings.chartJson.options.width = settings.chartWidth;
    settings.chartJson.options.height = settings.chartHeight;
    var cleanChartOptions = {};
    jQuery.extend(true, cleanChartOptions, settings.chartOptions);
    delete cleanChartOptions.series;
    jQuery.extend(true, settings.chartJson.options, cleanChartOptions);

    settings.chartJson.dataTable = [];

    settings.chartJson.containerId = settings.chartViewDiv;
    if (settings.chartJson.options.focusTarget !== 'category'){
        settings.chartJson.options.tooltip = {isHtml : true};
    }
    var chartOptions = settings.chartJson.options;
    var dataTable = settings.chartDataTable;
    var trendlines = {};
    var series_settings = {};
    series_settings[settings.chartId] = {};
    var series = series_settings[settings.chartId];

    patched_each(chartOptions.trendlines || {}, function(name, trendline){
        for (var i = 0; i < dataTable.getNumberOfColumns(); i++){
            if (dataTable.getColumnId(i) === name){
                trendlines[i - 1] = trendline;
            }
        }
    });
    settings.chartJson.options.trendlines = trendlines;

    var series_counter = 0;
    settings.chartJson.options.series = settings.chartJson.options.series || {};
    jQuery.extend(true, settings.chartJson.options.series, settings.chartOptions.series);
    function series_loop(i){
        patched_each(settings.chartOptions.series || {}, function(name, opt){
            if (dataTable.getColumnId(i) === name){
                series[series_counter-1] = opt;
            }
        });
    }

    for (var i = 0; i < dataTable.getNumberOfColumns(); i++){
        if (dataTable.getColumnRole(i) === "" || dataTable.getColumnRole(i) === "data") {
            series_loop(i);
            series_counter++;
        }
    }
    jQuery.extend(true, settings.chartJson.options.series, series);

    /* remove duplicated suffixes */
    patched_each(settings.chartJson.options.vAxes || {}, function(axid, ax){
        if (ax.format !== undefined){
            ax.format = ax.format.replace(/[^0-9.,#]/g, '');
        }
    });
    var ax = settings.chartJson.options.hAxis || {};
    if (ax.format !== undefined){
        ax.format = ax.format.replace(/[^0-9.,#]/g, '');
    }
    /* end of removing duplicated suffixes */
    settings.chartJson.view = {};
    var chart = new google.visualization.ChartWrapper(settings.chartJson);

    var filtersArray = [];
    var usedColumnNames = [];
    for (i = 0; i < settings.chartDataTable.getNumberOfColumns(); i++){
        usedColumnNames.push(settings.chartDataTable.getColumnLabel(i));
    }
    if (settings.chartFilters){
        var hasPreConfig = false;
        var hasPivotedFilter = false;
        var pivotedFilterType;
        var originalTableProps = [];
        patched_each(settings.originalTable.properties, function(key, value){
            originalTableProps.push(key);
        });
        patched_each(settings.chartFilters, function(key, value){
            if (key.indexOf('pre_config_') === 0){
                hasPreConfig = true;
            }
            else{
                if (jQuery.inArray(key, originalTableProps) === -1){
                    hasPivotedFilter = true;
                    pivotedFilterType = value;
                }
            }
        });
        if (hasPreConfig && hasPivotedFilter){
            patched_each(settings.availableColumns, function(key, value){
                if (jQuery.inArray(key, originalTableProps) === -1){
                    settings.chartFilters[key] = pivotedFilterType;
                }
            });
        }
        patched_each(settings.chartFilters, function(key, value){
            if (key.indexOf('pre_config_') === 0){
                return;
            }
            if (!settings.availableColumns[key]){
                return;
            }
            if (jQuery.inArray(settings.availableColumns[key], usedColumnNames) === -1){
                return;
            }
            var filter_div_id = settings.chartFiltersDiv + "_" + key;

            var filter_div;
            if (!jQuery("#"+settings.chartFiltersDiv).hasClass("googledashboard-hidden-helper-filters")){
                var hideFilter = false;
                var query_params = getQueryParams("#"+settings.chartFiltersDiv);

                if (query_params.hideFilters !== undefined){
                    if (jQuery.inArray(('googlechart_filters_' + key), query_params.hideFilters) !== -1){
                        hideFilter = true;
                    }
                }
                if (hideFilter){
                    filter_div = "<div class='googlechart_filter' id='" + filter_div_id + "' style='display:none'></div>";
                }
                else {
                    filter_div = "<div class='googlechart_filter' id='" + filter_div_id + "'></div>";
                }
            }
            else{
                filter_div = "<div id='" + filter_div_id + "'></div>";
            }

            jQuery(filter_div).appendTo("#" + settings.chartFiltersDiv);

            var filterSettings = {};
            filterSettings.options = {};
            filterSettings.options.ui = {};
            filterSettings.options.filterColumnLabel = settings.availableColumns[key];
            filterSettings.containerId = filter_div_id;
            filterSettings.state = {};

            switch(value.type){
                case "0":
                    filterSettings.controlType = 'NumberRangeFilter';
                    if (value.defaults.length > 0){
                        filterSettings.state.lowValue=value.defaults[0];
                        filterSettings.state.highValue=value.defaults[1];
                    }
                    if (value.hasOwnProperty("settings")){
                        filterSettings.options.ui = value.settings;
                    }
                    filterSettings.options.ui.showRangeValues = false;
                    break;
                case "1":
                    filterSettings.controlType = 'StringFilter';
                    if (value.defaults.length > 0){
                        filterSettings.state.value=value.defaults[0];
                    }
                    break;
                case "2":
                    filterSettings.controlType = 'CategoryFilter';
                    filterSettings.options.ui.allowTyping = false;
                    filterSettings.options.ui.allowMultiple = false;
                    if (value.defaults.length > 0){
                        filterSettings.state.selectedValues = value.defaults;
                    }
                    break;
                case "3":
                    filterSettings.controlType = 'CategoryFilter';
                    filterSettings.options.ui.allowTyping = false;
                    filterSettings.options.ui.allowMultiple = true;
                    filterSettings.options.ui.selectedValuesLayout = 'side';
                    if (jQuery("#"+settings.chartFiltersDiv).hasClass('googlechart_filters_side')){
                        filterSettings.options.ui.selectedValuesLayout = 'belowStacked';
                    }
                    if (value.defaults.length > 0){
                        filterSettings.state.selectedValues = value.defaults;
                    }
                    break;
            }
            var filter = new google.visualization.ControlWrapper(filterSettings);

            google.visualization.events.addListener(filter, 'statechange', function(event){
                disableBaseHref();
                /* workaround for #19292 */
                if (filter.getControlType() === "NumberRangeFilter"){
                    jQuery("#"+filter.getContainerId()).find("span.google-visualization-controls-rangefilter-thumblabel").eq(0).text(filter.getState().lowValue);
                    jQuery("#"+filter.getContainerId()).find("span.google-visualization-controls-rangefilter-thumblabel").eq(1).text(filter.getState().highValue);
                }
                /* end of workaround */
                updateHashForRowFilter(settings.availableColumns, filter, value.type, settings.updateHash);
                settings.customFilterHandler(settings.customFilterOptions);
                updateFilterDivs();
            });

            /* workaround for #19292 */
            google.visualization.events.addListener(filter, 'ready', function(event){
                var slider = jQuery("#"+filter.getContainerId()).find("div[role='slider']");
                jQuery("<span>")
                    .addClass("google-visualization-controls-rangefilter-thumblabel")
                    .text(filter.getState().lowValue)
                    .insertBefore(slider);
                jQuery("<span>")
                    .addClass("google-visualization-controls-rangefilter-thumblabel")
                    .text(filter.getState().highValue)
                    .insertAfter(slider);
                enableBaseHref();
            });
            /* end of workaround */

            filtersArray.push(filter);
        });
    }

    var dataView = new google.visualization.DataView(settings.chartDataTable);

    var customFilterParams;
    if (filtersArray.length > 0){
        var dashboard = new google.visualization.Dashboard(
            document.getElementById(settings.chartDashboard));

        dashboard.bind(filtersArray, chart);

        google.visualization.events.addListener(dashboard, 'ready', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartReadyEvent();
            updateFilterDivs();
            fixSVG("#"+settings.chartViewDiv);
            enableBaseHref();
        });

        google.visualization.events.addListener(dashboard, 'error', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartErrorEvent();
            enableBaseHref();
        });

        jQuery(filtersArray).each(function(key,value){
            google.visualization.events.addListener(value, 'statechange', function(event){
                disableBaseHref();
                applyCustomFilters(customFilterParams);
            });
            updateFilterDivs();
        });

        disableBaseHref();
        dashboard.draw(dataView);
    }
    else {
        chart.setDataTable(dataView);
        google.visualization.events.addListener(chart, 'ready', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartReadyEvent();
            updateFilterDivs();
            fixSVG("#"+settings.chartViewDiv);
            enableBaseHref();
        });

        google.visualization.events.addListener(chart, 'error', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartErrorEvent();
            enableBaseHref();
        });
        disableBaseHref();
        chart.draw();
    }

    var customColumnFilters = [];
    var columnFiltersObj = [];
    if (settings.chartFilters){
        var pre_config_options = {
            originalTable : settings.originalTable,
            visibleColumns : settings.visibleColumns,
            availableColumns : settings.availableColumns,
            filtersDiv : settings.chartFiltersDiv,
            dashboardDiv : settings.chartDashboard,
            chartViewDiv :  settings.chartViewDiv,
            columnFiltersObj : columnFiltersObj,
            filters : [],
            updateHash : settings.updateHash,
            columnsToBeShown: settings.columnsToBeShown
        };
        patched_each(settings.chartFilters, function(key, value){
            if (key.indexOf('pre_config_') === 0){
                var pre_config_option = {
                    filterTitle : key.substr(11),
                    filterType : value.type
                };
                pre_config_options.filters.push(pre_config_option);
            }
        });
        customColumnFilters = addPreConfigFilters(pre_config_options);
    }
    if ((settings.sortFilter !== '__disabled__') && (settings.chartJson.chartType !== 'Table')){
        var options2 = {
            filtersDiv : settings.chartFiltersDiv,
            filterTitle : 'sort by',
            filterDataTable : settings.chartDataTable,
            filterChart : chart,
            enableEmptyRows : settings.chartOptions.enableEmptyRows,
            sortFilterValue : settings.sortFilter,
            updateHash : settings.updateHash,
            availableColumns : settings.availableColumns
        };
        if (settings.sortFilter !== '__enabled__'){
            if (settings.sortFilter.substring(settings.sortFilter.length - 9) !== '_reversed'){
                options2.sortFilterValue = settings.availableColumns[settings.sortFilter];
            }
            else {
                options2.sortFilterValue = settings.availableColumns[settings.sortFilter.substring(0, settings.sortFilter.length - 9)] + " (reversed)";
            }
        }
        customFilterParams = addSortFilter(options2);
    }

    if (!jQuery("#" + settings.chartDashboard).data()){
        return;
    }
    var conf_array = jQuery("#" + settings.chartDashboard).data('other_settings').googlechart_config_array;

    patched_each(conf_array, function(idx, conf){
        if (conf[0] === jQuery("#"+settings.chartViewDiv).attr("chart_id")){
            var chart_columnFilters_old = conf[14];
            // remove all custom column filters from original
            var columnFiltersToKeep = [];
            patched_each(chart_columnFilters_old, function(idx2, columnFilter){
                if (columnFilter.title.indexOf('custom_helper_') !== 0){
                    columnFiltersToKeep.push(columnFilter);
                }
            });
            chart_columnFilters_old.splice(0, chart_columnFilters_old.length);
            patched_each(columnFiltersToKeep, function(idx2, columnFilter){
                chart_columnFilters_old.push(columnFilter);
            });

            // remove all custom column filters from settings
            columnFiltersToKeep = [];
            patched_each(settings.columnFilters, function(idx2, columnFilter){
                if (columnFilter.title.indexOf('custom_helper_') !== 0){
                    columnFiltersToKeep.push(columnFilter);
                }
            });
            settings.columnFilters.splice(0, settings.columnFilters.length);
            patched_each(columnFiltersToKeep, function(idx2, columnFilter){
                settings.columnFilters.push(columnFilter);
            });

            // update custom column filters for original and for settings
            patched_each(customColumnFilters, function(idx2, customFilter){
                var shouldAdd = true;
                patched_each(chart_columnFilters_old, function(idx3, columnFilter){
                    if (columnFilter.title === customFilter.title){
                        shouldAdd = false;
                    }
                });
                if (shouldAdd){
                    settings.columnFilters.push(customFilter);
                }
            });

            patched_each(settings.columnFilters, function(idx2, columnFilter){
                var shouldAdd = true;
                patched_each(chart_columnFilters_old, function(idx3, tmpFilter){
                    if (columnFilter.title === tmpFilter.title){
                        shouldAdd = false;
                    }
                });
                if (shouldAdd){
                    chart_columnFilters_old.push(columnFilter);
                }
            });
        }
    });

    if (settings.columnFilters.length > 0){
        patched_each(settings.columnFilters, function(idx1, columnFilter1){
            var shouldHide = false;
            if (columnFilter1.title.indexOf("custom_helper_") === -1){
                patched_each(settings.columnFilters, function(idx2, columnFilter2){
                    if (columnFilter1.title !== columnFilter2.title){
                        patched_each(columnFilter1.settings.selectables, function(idx3, column){
                            if (jQuery.inArray(column, columnFilter2.settings.selectables) !== -1){
                                shouldHide = true;
                            }
                        });
                    }
                });
            }
            columnFilter1.hideFilter = shouldHide;
        });
        var options3 = {
            dashboardDiv : settings.chartDashboard,
            chartViewDiv :  settings.chartViewDiv,
            filtersDiv : settings.chartFiltersDiv,
            columnFilters : settings.columnFilters,
            columns : settings.availableColumns,
            columnTypes : settings.columnTypes,
            columnFiltersObj : columnFiltersObj,
            updateHash : settings.updateHash
        };
        addColumnFilters(options3);
    }

    // Notes
    if (!settings.hideNotes){
        var notes = jQuery('<div>')
            .addClass('googlechart-notes')
            .width(settings.chartWidth);

        patched_each(settings.notes, function(index, note){
            jQuery('<div>')
                .addClass('googlecharts-note')
                .html(note.text)
                .appendTo(notes);
        });
        if (settings.chartFilterPosition < 2){
            jQuery('#' + settings.chartViewDiv).after(notes);
        }
        else{
            jQuery('#' + settings.chartFiltersDiv).after(notes);
        }
    }
    return {'chart': chart, 'filters': filtersArray};

}

function getHashCode(val) {
    if (Array.prototype.reduce){
        return val.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
    }
    var hash = 0;
    if (val.length === 0) {
        return hash;
    }
    for (var i = 0; i < val.length; i++) {
        var character  = val.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function getChartTitle(title_placeholder, possibleLabels, transformedTable, customlabels) {
    // Returns the title replacing the placeholders with the required values
    if ((title_placeholder !== undefined) && (!jQuery.isEmptyObject(possibleLabels))){
        var vertical_str = possibleLabels.vertical.value;
        if (customlabels.vertical[vertical_str] !== undefined){
            vertical_str = customlabels.vertical[vertical_str];
        }
        else {
            if (possibleLabels.vertical.type === "column"){
                vertical_str = transformedTable.available_columns[vertical_str];
            }
        }
        var horizontal_str = possibleLabels.horizontal.value;
        if (customlabels.horizontal[horizontal_str] !== undefined){
            horizontal_str = customlabels.horizontal[horizontal_str];
        }
        else {
            if (possibleLabels.horizontal.type === "column"){
                horizontal_str = transformedTable.available_columns[horizontal_str];
            }
        }
        return title_placeholder.split("{Y}").join(vertical_str)
                .split("{X}").join(horizontal_str);
    }
    return title_placeholder;
}

function openChartDialog(evt) {
    var ctl_parent = jQuery(this).parent().parent();
    var chart_div = ctl_parent.find('.sm-charts');
    var smc_chart = chart_div.data('chart');
    var smc_title = smc_chart.chart.getOption('title');
    var original_settings = chart_div.data('original_settings');
    var parent = ctl_parent.parent();
    var original_chart_div = parent.find('#original_chart_div');
    if (original_chart_div.length === 0) {
        original_chart_div = jQuery('<div>', {
            id: 'original_chart_div'
        });
    original_chart_div.css('height', original_settings.height);
    original_chart_div.css('width', original_settings.width);
    original_chart_div.appendTo(parent);
    }
    original_chart_div.empty();
    original_chart_div.dialog({
        width: 'auto',
        height: 'auto',
        title: smc_title,
        open: function ( event, ui ) {
            var new_chart = new google.visualization.ChartWrapper(smc_chart.chart.toJSON());
            new_chart.setContainerId('original_chart_div');
            new_chart.setOption('height', original_settings.height);
            new_chart.setOption('width', original_settings.width);
            var chartArea = {};
            if (original_settings.chartArea !== undefined){
                if (original_settings.chartArea.top !== undefined){
                    chartArea.top = chartAreaAttribute2px(original_settings.chartArea.top, original_settings.height);
                }
                if (original_settings.chartArea.left !== undefined){
                    chartArea.left = chartAreaAttribute2px(original_settings.chartArea.left, original_settings.width);
                }
                if (original_settings.chartArea.height !== undefined){
                    chartArea.height = chartAreaAttribute2px(original_settings.chartArea.height, original_settings.height);
                }
                if (original_settings.chartArea.width !== undefined){
                    chartArea.width = chartAreaAttribute2px(original_settings.chartArea.width, original_settings.width);
                }
            }
            new_chart.setOption('chartArea', chartArea);
            new_chart.setOption('legend', original_settings.misc.legend);
            new_chart.setOption('enableInteractivity', true);
            new_chart.draw();
            $(this).dialog( "option", "position", { my: "center", at: "center", of: window });
        },
        close: function( event, ui ) {
            jQuery(this).dialog( "destroy" );
            jQuery(this).remove();
        }
    });
}

function getSMMatrixHeaders(charts){
    var verticals = [];
    var allVerticals = [];
    var horizontals = [];
    var allHorizontals = [];
    var verticaltype = "column";
    var horizontaltype = "column";
    var hasVisible;
    var j;
    for (var i = 0; i < charts.length; i++) {
        var chart = charts[i];
        if (chart.possibleLabels.horizontal !== undefined) {
            horizontaltype = chart.possibleLabels.horizontal.type;
            if (jQuery.inArray(chart.possibleLabels.horizontal.value, allHorizontals) === -1){
                allHorizontals.push(chart.possibleLabels.horizontal.value); 
            }
            if (jQuery.inArray(chart.possibleLabels.horizontal.value, horizontals) === -1){
                hasVisible = false;
                for (j = 0; j < charts.length; j++){
                    if ((charts[j].possibleLabels.horizontal.value === chart.possibleLabels.horizontal.value) && (charts[j].enabled)){
                        hasVisible = true;
                    }
                }
                if (hasVisible){
                    horizontals.push(chart.possibleLabels.horizontal.value); 
                }
            }
        }
        if (chart.possibleLabels.vertical !== undefined) {
            verticaltype = chart.possibleLabels.vertical.type;
            if (jQuery.inArray(chart.possibleLabels.vertical.value, allVerticals) === -1){
                allVerticals.push(chart.possibleLabels.vertical.value);
            }
            if (jQuery.inArray(chart.possibleLabels.vertical.value, verticals) === -1){
                hasVisible = false;
                for (j = 0; j < charts.length; j++){
                    if ((charts[j].possibleLabels.vertical.value === chart.possibleLabels.vertical.value) && (charts[j].enabled)){
                        hasVisible = true;
                    }
                }
                if (hasVisible){
                    verticals.push(chart.possibleLabels.vertical.value);
                }
            }
        }
    }
    return {verticals : {type:verticaltype, values:verticals, allValues:allVerticals}, horizontals : {type:horizontaltype, values:horizontals, allValues:allHorizontals}};
}

function getSortedChartsForMultiples(charts, sort){
    var sortedCharts = [];
    var i, j, k, found;
    if (sort !== undefined){
        if (sort.type === 'manual'){
            if (!sort.matrix){
                for (i = 0; i < sort.order.length; i++){
                    for (j = 0; j < charts.length; j++){
                        if (_.isEqual(charts[j].possibleLabels, sort.order[i].chart)){
                            sortedCharts.push(charts[j]);
                        }
                    }
                }
            }
            else {
                for (i = 0; i < sort.vertical.length; i++){
                    for (j = 0; j < sort.horizontal.length; j++){
                        for (k = 0; k < charts.length; k++){
                            if ((charts[k].possibleLabels.vertical.value === sort.vertical[i]) && (charts[k].possibleLabels.horizontal.value === sort.horizontal[j])){
                                sortedCharts.push(charts[k]);
                            }
                        }
                    }
                }
            }
        }
    }
    for (i = 0; i < charts.length; i++){
        found = false;
        for (j = 0; j < sortedCharts.length; j++){
            if (_.isEqual(charts[i], sortedCharts[j])){
                found = true;
            }
        }
        if (!found){
            sortedCharts.push(charts[i]);
        }
    }
    return sortedCharts;
}

function rotateMultiples(charts){
    var rotatedCharts = new Array(charts.length);
    var headers = getSMMatrixHeaders(charts);
    var rowLength = headers.horizontals.allValues.length;
    var colLength = headers.verticals.allValues.length;
    if (rowLength === 0){
        rowLength = 1;
    }
    if (colLength === 0){
        colLength = 1;
    }
    for (var i = 0; i < colLength; i++){
        for (var j = 0; j < rowLength; j++){
            rotatedCharts[j*colLength + i] = charts[i*rowLength + j];
        }
    }
    return rotatedCharts;
}

function rotateHeaders(headers){
    return {horizontals : headers.verticals, verticals : headers.horizontals};
}

function rotateLabels(labels){
    return {horizontal : labels.vertical, vertical : labels.horizontal};

}
function drawSMCharts(smc_settings) {
    var chartConfig = smc_settings.chartConfig;
    var multiples_settings = smc_settings.multiples_settings;
    var settings = smc_settings.settings;
    var transformedTable = smc_settings.transformedTable;
    var columnsFromSettings = getColumnsFromSettings(chartConfig[2]);
    var adv_options = smc_settings.adv_options;
    var chart_height = smc_settings.chart_height;
    var chart_width = smc_settings.chart_width;
    var smc_item_settings = smc_settings.smc_item_settings;
    var container_class = 'smc-widget';
    if (smc_item_settings) {
        container_class += ' ' + smc_item_settings.css_class;
    }
    var chart_sortBy = chartConfig[12];
    var chart_sortAsc = true;
    var chart_row_filters = chartConfig[11];

    var sortAsc_str = chartConfig[13];
    if (sortAsc_str === 'desc'){
        chart_sortAsc = false;
    }
    var charts = multiples_settings.charts;
    var sort = multiples_settings.sort || {};
    charts = getSortedChartsForMultiples(charts, sort);
    var headers = getSMMatrixHeaders(charts);
    var enabled_charts = [];
    for (var i = 0; i < charts.length; i++){
        if ((jQuery.inArray(charts[i].possibleLabels.horizontal.value, headers.horizontals.values) !== -1) &&
            (jQuery.inArray(charts[i].possibleLabels.vertical.value, headers.verticals.values) !== -1)){
            enabled_charts.push(charts[i]);
        }
    }
    charts = enabled_charts;
//    if (!smc_settings.disableSort){
//        charts = getSortedChartsForMultiples(charts);
//    }
    var smcustomlabels = multiples_settings.customLabels || {vertical:{}, horizontal:{}};
    if ((multiples_settings.matrix !== undefined) && (multiples_settings.matrix.rotated)){
        charts = rotateMultiples(charts);
    }
    jQuery.each(charts, function(c_id, c_settings){
        if ((!multiples_settings.matrix.enabled) && (!c_settings.enabled)){
            return;
        }
        var delimiters = JSON.stringify(c_settings.possibleLabels);
        var smc_container_id = settings.chartViewsDiv + '_' + getHashCode(delimiters);
        var smc_widget = jQuery('<div>', {
            'class': container_class,
            'style': 'float:left;'

        });
        smc_widget.attr('horizontal-column-id', c_settings.possibleLabels.horizontal.value);
        smc_widget.attr('vertical-column-id', c_settings.possibleLabels.vertical.value);

        if (!c_settings.columns) {
            c_settings.columns = columnsFromSettings.columns;
        }
        if (!c_settings.filters) {
            c_settings.filters = chart_row_filters;
        }
        smc_widget.attr('used_columns', JSON.stringify(c_settings.columns));
        smc_widget.attr('filters', JSON.stringify(c_settings.filters));
        smc_widget.attr('possible_labels', JSON.stringify(c_settings.possibleLabels));

        var smc_container = jQuery('<div>', {
            'id': smc_container_id,
            'class': 'sm-charts'
        });
        smc_container.appendTo(smc_widget);
        var current_table_items = filter_table(transformedTable.items, c_settings.filters);
        smc_widget.appendTo(smc_settings.container);
        if (!c_settings.enabled){
            smc_widget.width(multiples_settings.settings.width);
            smc_widget.height(multiples_settings.settings.height);
            return;
        }
        var current_table = jQuery.extend(true, {}, transformedTable);
        current_table.items = current_table_items;
        var smc_options = {
            originalDataTable : current_table,
            columns : c_settings.columns,
            sortBy : chart_sortBy,
            sortAsc : chart_sortAsc,
            preparedColumns : chartConfig[2].prepared,
            enableEmptyRows : chartConfig[7].enableEmptyRows,
            chartType : chartConfig[1].chartType,
            focusTarget : chartConfig[1].options.focusTarget
        };

        var tableForChart = prepareForChart(smc_options);

        if (!chart_width) {
            chart_width = chartConfig[4];
        }
        if (!chart_height) {
            chart_height = chartConfig[5];
        }
        var smc_chartJson = jQuery.extend(true, {}, chartConfig[1]);
        smc_chartJson.options.title = getChartTitle(multiples_settings.settings.chartTitle,
                                                    c_settings.possibleLabels,
                                                    current_table,
                                                    smcustomlabels);
        smc_chartJson.options.enableInteractivity = smc_settings.interactive;
        if (!multiples_settings.settings.displayLegend){
            smc_chartJson.options.legend = 'none';
        }

        chart_options = {
            chartDashboard : settings.chartsDashboard,
            chartViewDiv : smc_container_id,
            chartFiltersDiv : smc_settings.chartFiltersId,
            chartId : chartConfig[0],
            chartJson: smc_chartJson,
            chartDataTable : tableForChart,
            chartFilters : smc_settings.dashboard_filters,
            chartWidth: multiples_settings.settings.width,
            chartHeight: multiples_settings.settings.height,
            chartFilterPosition : '',
            chartOptions : adv_options,
            availableColumns : current_table_items.available_columns,
            chartReadyEvent : settings.chartReadyEvent || function() {},
            sortFilter:'__disabled__',
            hideNotes:true,
            originalTable:settings.rows
        };
        var smc_chart = drawGoogleChart(chart_options);
        jQuery(smc_container).data('chart', smc_chart);
        jQuery(smc_container).data('original_settings', {
            width: chartConfig[4],
            height: chartConfig[5],
            chartArea: chartConfig[7].chartArea,
            misc: {
                legend: chartConfig[1].options.legend
            }
        });

        // Make controls areas
        var control_top = jQuery('<div>', {
            'class': 'smc-controls smc-controls-top'
        }).appendTo(smc_widget);
        var control_bottom = jQuery('<div>', {
            'class': 'smc-controls smc-controls-bottom'
        }).appendTo(smc_widget);

        if (smc_settings.controls) {
            jQuery.each(smc_settings.controls, function(idx, val) {
                var btn = jQuery('<div>')
                    .attr('title', val.title);
                var control = jQuery('<span>', {
                    'class': 'smc-control eea-icon ' + val.icon + ' ' + val.position_x
                });
                control.appendTo(btn);
                if (val.btn_class !== undefined){
                    btn.addClass(val.btn_class);
                }
                if (val.control_class !== undefined){
                    control.addClass(val.control_class);
                }
                if (val.btn_width !== undefined){
                    btn.width(val.btn_width);
                }
                if (val.btn_height !== undefined){
                    btn.height(val.btn_height);
                }
                if (val.position_y === 'top') {
                    btn.appendTo(control_top);
                } else {
                    btn.appendTo(control_bottom);
                }
                jQuery.each(val.events, function(evt, callback){
                    btn.on(evt, callback);
                });
            });
            jQuery(smc_container).on('click', smc_settings.click_event);
        }

    });
}

function dashboardFilterChanged(options){
    var filtersStates = {};
    jQuery(options.dashboardFilters).each(function(idx, filter){
        var filterName = filter.getOption("filterColumnLabel");
        filtersStates[filterName] = {};
        jQuery.extend(true, filtersStates[filterName], filter.getState());

    });
    jQuery(options.hiddenDashboardFilters).each(function(idx, filter){
        var filterName = filter.getOption("filterColumnLabel");
        var state = {};
        jQuery.extend(true, state, filtersStates[filterName]);
        /* workaround for setting range filters */
        delete (state.lowThumbAtMinimum);
        delete (state.highThumbAtMaximum);
        /* end of workaround */
        filter.setState(state);
        filter.draw();
    });
    return;
}

function drawGoogleDashboard(options){
    var hiddenDashboardFilters = [];
    var dashboardFilters = [];
    var settings = {
        chartsDashboard : '',
        chartViewsDiv : '',
        chartFiltersDiv : '',
        chartsSettings : '',
        filters : '',
        rows : {},
        columns : {},
        charts : [],
        dashboardName : "",
        updateHash : false
    };
    jQuery.extend(settings, options);

    var dashboardCharts = [];
    var dashboardLink = jQuery('#' + settings.chartsDashboard).attr('data-link');
    dashboardLink = dashboardLink !== undefined ? dashboardLink + '/' : '';

    var dashboard_filters = {};
    patched_each(settings.filters, function(key, value){
        var def_str = value.defaults;
        if ((def_str === undefined) || (def_str === "")){
            def_str = "[]";
        }
        var defaults = JSON.parse(def_str);
        var filter_settings_str = value.settings;

        if ((filter_settings_str === undefined) || (filter_settings_str === "")){
            filter_settings_str = "{}";
        }

        var filter_settings = JSON.parse(filter_settings_str);
        dashboard_filters[value.column] = {"type":value.type, defaults:defaults, settings:filter_settings};
    });
    // Dashboard charts
    patched_each(settings.chartsSettings, function(key, value){
        var chartConfig;
        var chart_unpivotsettings;
        var chartContainerId;
        var chartContainer;
        var columnsFromSettings;
        var tmp_columns_and_rows;
        var options;
        var transformedTable;
        var chart_width;
        var chart_height;
        if(value.dashboard.hidden){
            return;
        }
        if (value.wtype === 'googlecharts.widgets.chart'){
            jQuery(settings.charts).each(function(idx, config){
                if (config[0] === value.name){
                    chartConfig = config;
                    chart_unpivotSettings = config[15];
                }
            });
            chartContainerId = settings.chartViewsDiv+"_" + value.name;
            chartContainer = jQuery('<div>')
                .attr('id', chartContainerId)
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .text('chart')
                .appendTo('#'+settings.chartViewsDiv);

            var chartFiltersId = settings.chartFiltersDiv + "_hidden_filters_" + value.name;
            var chartFilters = jQuery('<div>')
                .attr('id', chartFiltersId)
                .addClass('googledashboard-hidden-helper-filters')
                .css('float', 'left')
                .appendTo('#'+settings.chartFiltersDiv);

            columnsFromSettings = getColumnsFromSettings(chartConfig[2]);

            var chart_sortBy = chartConfig[12];
            var chart_sortAsc = true;
            chart_row_filters = chartConfig[11];

            var sortAsc_str = chartConfig[13];
            if (sortAsc_str === 'desc'){
                chart_sortAsc = false;
            }

            tmp_columns_and_rows = getAvailable_columns_and_rows(chart_unpivotSettings, settings.columns, settings.rows);
            options = {
                originalTable : settings.rows,
                normalColumns : columnsFromSettings.normalColumns,
                pivotingColumns : columnsFromSettings.pivotColumns,
                valueColumn : columnsFromSettings.valueColumn,
                availableColumns : tmp_columns_and_rows.available_columns,
                unpivotSettings : chart_unpivotSettings,
                filters : chart_row_filters
            };

            transformedTable = transformTable(options);

            options = {
                originalDataTable : transformedTable,
                columns : columnsFromSettings.columns,
                sortBy : chart_sortBy,
                sortAsc : chart_sortAsc,
                preparedColumns : chartConfig[2].prepared,
                enableEmptyRows : chartConfig[7].enableEmptyRows,
                chartType : chartConfig[1].chartType,
                focusTarget : chartConfig[1].options.focusTarget
            };

            var tableForChart = prepareForChart(options);

            chart_width = chartConfig[4];
            chart_height = chartConfig[5];
            if (value.dashboard.width){
                chart_width = value.dashboard.width;
            }
            if (value.dashboard.height){
                chart_height = value.dashboard.height;
            }
            chart_options = {
                chartDashboard : settings.chartsDashboard,
                chartViewDiv : chartContainerId,
                chartFiltersDiv : chartFiltersId,
                chartId : chartConfig[0],
                chartJson: chartConfig[1],
                chartDataTable : tableForChart,
                chartFilters : dashboard_filters,
                chartWidth: chart_width,
                chartHeight: chart_height,
                chartFilterPosition : '',
                chartOptions : chartConfig[7],
                availableColumns : transformedTable.available_columns,
                chartReadyEvent : settings.chartReadyEvent || function() {},
                sortFilter:'__disabled__',
                hideNotes:true,
                originalTable:settings.rows
            };
            var tmp_chart = drawGoogleChart(chart_options);
            hiddenDashboardFilters = hiddenDashboardFilters.concat(tmp_chart.filters);
        } else if (value.wtype === 'googlecharts.widgets.multiples') {
            if (settings.charts.length >=1) {
                jQuery(settings.charts).each(function(idx, config){
                    if (config[0] === value.name.substr(10)){
                        chartConfig = config;
                        chart_unpivotSettings = config[15];
                    }
                });
            }

            var multiples_settings = JSON.parse(value.multiples_settings);
            chartContainerId = settings.chartViewsDiv+"_" + value.name;
            chartContainer = jQuery('<div>')
                .attr('id', chartContainerId)
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .width(value.dashboard.width)
                .height(value.dashboard.height)
                .appendTo('#'+settings.chartViewsDiv);

            columnsFromSettings = getColumnsFromSettings(chartConfig[2]);


            tmp_columns_and_rows = getAvailable_columns_and_rows(chart_unpivotSettings,
                                                                     settings.columns,
                                                                     settings.rows);
            options = {
                originalTable : settings.rows,
                normalColumns : columnsFromSettings.normalColumns,
                pivotingColumns : columnsFromSettings.pivotColumns,
                valueColumn : columnsFromSettings.valueColumn,
                availableColumns : tmp_columns_and_rows.available_columns,
                unpivotSettings : chart_unpivotSettings,
                filters :{}
            };

            transformedTable = transformTable(options);
            var adv_options = jQuery.extend(true, {}, chartConfig[7]);
            adv_options.chartArea = {
                width: multiples_settings.settings.chartAreaWidth,
                height: multiples_settings.settings.chartAreaHeight,
                top: multiples_settings.settings.chartAreaTop,
                left: multiples_settings.settings.chartAreaLeft
            };
            if (value.dashboard.width){
                chart_width = value.dashboard.width;
            }
            if (value.dashboard.height){
                chart_height = value.dashboard.height;
            }
            if (multiples_settings.matrix.enabled){
                var smmatrixheaders = getSMMatrixHeaders(getSortedChartsForMultiples(multiples_settings.charts, multiples_settings.sort));
                var smmatrixlabels = multiples_settings.customLabels || {vertical:{}, horizontal:{}};
                if (multiples_settings.matrix.rotated){
                    smmatrixheaders = rotateHeaders(smmatrixheaders);
                    smmatrixlabels = rotateLabels(smmatrixlabels);
                }
                var horizontalHeaders = [];
                var verticalHeaders = [];
                var top_enabled = multiples_settings.matrix.headers.top.enabled;
                var bottom_enabled = multiples_settings.matrix.headers.bottom.enabled;
                var left_enabled = multiples_settings.matrix.headers.left.enabled;
                var right_enabled = multiples_settings.matrix.headers.right.enabled;
                if ((smmatrixheaders.horizontals.values.length === 1) && (smmatrixheaders.horizontals.values[0] === null)) {
                    top_enabled = false;
                    bottom_enabled = false;
                }
                if ((smmatrixheaders.verticals.values.length === 1) && (smmatrixheaders.verticals.values[0] === null)) {
                    left_enabled = false;
                    right_enabled = false;
                }
                if (top_enabled){
                    jQuery("<div>")
                        .addClass("multiples-sm-header-top")
                        .css("float", "left")
                        .appendTo(chartContainer);
                    horizontalHeaders.push("#" + chartContainerId + " .multiples-sm-header-top");
                }

                if (left_enabled){
                    jQuery("<div>")
                        .addClass("multiples-sm-header-left")
                        .width(multiples_settings.matrix.headers.left.width + 3)
                        .css("float", "left")
                        .appendTo(chartContainer);
                    verticalHeaders.push("#" + chartContainerId + " .multiples-sm-header-left");
                }

                jQuery("<div>")
                    .addClass("multiples-sm-area")
                    .appendTo(chartContainer);

                var horizontalitems = smmatrixheaders.horizontals.values.length;
                if (horizontalitems === 0){
                    horizontalitems = 1;
                }
                jQuery("#" + chartContainerId + " .multiples-sm-area")
                    .width(horizontalitems * (multiples_settings.settings.width + 4));

                if (right_enabled){
                    jQuery("<div>")
                        .addClass("multiples-sm-header-right")
                        .width(multiples_settings.matrix.headers.left.width + 3)
                        .css("float", "left")
                        .appendTo(chartContainer);
                    verticalHeaders.push("#" + chartContainerId + " .multiples-sm-header-right");
                }

                if (bottom_enabled){
                    jQuery("<div>")
                        .addClass("multiples-sm-header-bottom")
                        .css("float", "left")
                        .appendTo(chartContainer);
                    horizontalHeaders.push("#" + chartContainerId + " .multiples-sm-header-bottom");
                }
                var i, j, label;
                for (i = 0; i < verticalHeaders.length; i++){
                    for (j = 0; j < smmatrixheaders.verticals.values.length; j++){
                        label = smmatrixheaders.verticals.values[j];
                        if (smmatrixlabels.vertical[label] !== undefined){
                            label = smmatrixlabels.vertical[label];
                        }
                        else {
                            if (smmatrixheaders.verticals.type === "column"){
                                label = transformedTable.available_columns[label];
                            }
                        }
                        jQuery("<div>")
                            .addClass("multiples-sm-header-item")
                            .attr("original-value", smmatrixheaders.verticals.values[j])
                            .text(label)
                            .width(multiples_settings.matrix.headers.left.width)
                            .height(multiples_settings.settings.height)
                            .appendTo(verticalHeaders[i]);
                    }
                }
                for (i = 0; i < horizontalHeaders.length; i++){
                    if (left_enabled) {
                        jQuery("<div>")
                            .addClass("multiples-sm-header-item")
                            .width(multiples_settings.matrix.headers.left.width)
                            .appendTo(horizontalHeaders[i]);
                    }

                    for (j = 0; j < smmatrixheaders.horizontals.values.length; j++){
                        label = smmatrixheaders.horizontals.values[j];
                        if (smmatrixlabels.horizontal[label] !== undefined){
                            label = smmatrixlabels.horizontal[label];
                        }
                        else {
                            if (smmatrixheaders.horizontals.type === "column"){
                                label = transformedTable.available_columns[label];
                            }
                        }
                        jQuery("<div>")
                            .addClass("multiples-sm-header-item")
                            .attr("original-value", smmatrixheaders.horizontals.values[j])
                            .text(label)
                            .width(multiples_settings.settings.width)
                            .appendTo(horizontalHeaders[i]);
                    }
                    if (right_enabled) {
                        jQuery("<div>")
                            .addClass("multiples-sm-header-item")
                            .width(multiples_settings.matrix.headers.right.width)
                            .appendTo(horizontalHeaders[i]);
                    }
                }
            }
            else {
                jQuery("<div>")
                    .addClass("multiples-sm-area")
                    .appendTo(chartContainer);
            }

            var smcharts_settings = {
                container: jQuery("#" + chartContainerId + " .multiples-sm-area"),
                smc_item_settings: null,
                sm_chart_width: chart_width,
                sm_chart_height: chart_height,
                multiples_settings: multiples_settings,
                settings: settings,
                transformedTable: transformedTable,
                chartConfig: chartConfig,
                adv_options: adv_options,
                chartFiltersId: null,
                dashboard_filters: dashboard_filters,
                interactive: false,
                controls: {
                    enlarge_btn: {
                        position_x: 'right',
                        position_y: 'top',
                        icon: 'eea-icon-search-plus',
                        control_class: 'control-multiples-sm-enlarge',
                        btn_class: 'btn-multiples-sm-enlarge',
                        btn_width: multiples_settings.settings.width,
                        btn_height: multiples_settings.settings.height,
                        title: 'Expand chart',
                        events: {
                            'click': openChartDialog
                        }
                    }
                }
            };
            drawSMCharts(smcharts_settings);
        }
        else{
            var widgetDiv = jQuery('<div>')
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .addClass('googledashboard-widget')
                .attr('id', value.name)
                .attr('title', value.title)
                .width(value.dashboard.width)
                .height(value.dashboard.height)
                .data('dashboard', value.dashboard)
                .load(dashboardLink + '@@' + value.wtype, {name: value.name, dashboard: settings.dashboardName});

                widgetDiv.appendTo('#'+settings.chartViewsDiv);
        }
    });

    // Dashboard filters
    if (settings.filters.length > 0){
            filters_chart_id = 'filters_helper_tablechart';
            var chartContainerId = settings.chartFiltersDiv + "_" + filters_chart_id;

            var chartContainer = jQuery('<div>')
                .attr('id', chartContainerId)
                .addClass('googlechart_dashboard_filters_helper')
                .prependTo('#'+settings.chartViewsDiv);

            var normalColumns = [];
            patched_each(settings.columns, function(key,value){
                normalColumns.push(key);
            });
            options = {
                originalTable : settings.rows,
                normalColumns : normalColumns,
                pivotingColumns : [],
                valueColumn : "",
                availableColumns : settings.columns
            };

            var transformedTable = transformTable(options);

            options = {
                originalDataTable : transformedTable,
                columns : normalColumns,
                chartType : 'Table'
            };

            var tableForChart = prepareForChart(options);
            var filtersHelperChart = {'chartType': 'Table',
                                      'options': {'height': '13em', 'width': '20em'}};
            var customFilterOptions = {
                dashboardFilters : dashboardFilters,
                hiddenDashboardFilters : hiddenDashboardFilters
            };

            chart_options = {
                chartDashboard : settings.chartsDashboard,
                chartViewDiv : chartContainerId,
                chartFiltersDiv : settings.chartFiltersDiv,
                chartId : filters_chart_id,
                chartJson: filtersHelperChart,
                chartDataTable : tableForChart,
                chartFilters : dashboard_filters,
                chartWidth: 200,
                chartHeight: 200,
                chartFilterPosition : '',
                availableColumns : transformedTable.available_columns,
                chartReadyEvent : settings.chartReadyEvent || function() {},
                sortFilter : '__disabled__',
                customFilterHandler : dashboardFilterChanged,
                customFilterOptions : customFilterOptions,
                originalTable : settings.rows,
                updateHash : settings.updateHash
            };
            var tmp_chart = drawGoogleChart(chart_options);
            patched_each(tmp_chart.filters, function(idx, filter){
                dashboardFilters.push(filter);
            });
    }
}
