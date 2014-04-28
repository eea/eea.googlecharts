function fixSVG(container){
    if (jQuery.browser.mozilla){
        return;
    }
    var base = jQuery("base").attr("href");
    if (base === undefined){
        return;
    }

    var baseForSVG = window.location.href.split("#")[0];

    var rects = jQuery(container).find("rect");
    jQuery.each(rects, function(idx, rect){
        var fillVal = jQuery(rect).attr("fill");
        if (fillVal === undefined){
            return;
        }
        if (fillVal.indexOf("url(") === 0){
            fillVal = fillVal.replace("url(", "url("+baseForSVG);
            jQuery(rect).attr("fill", fillVal);
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
        jQuery.each(availableColumns, function(key, value){
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
    jQuery.each(jQuery("div.googlechart_filter"), function(idx, filter){
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
    jQuery.each(jQuery("li.charts-container-horizontal"), function(idx, filterValue){
        if (jQuery(filterValue).closest(".googlechart_filters").hasClass("googlechart_filters_side")){
            return;
        }
        if (!jQuery(filterValue).hasClass("eea-moved-in-container")){
            jQuery("<div class='eea-filter-value-container'></div>").appendTo(jQuery(filterValue));
            jQuery(filterValue).addClass("eea-moved-in-container");
            jQuery(filterValue).find(".charts-inline-block").appendTo(jQuery(filterValue).find(".eea-filter-value-container"));
        }
    });
    jQuery.each(jQuery("ul.google-visualization-controls-categoryfilter-selected"), function(idx, filterUl){
        if (jQuery(filterUl).closest(".googlechart_filters").length === 0){
            return;
        }
        if (jQuery(filterUl).closest(".googlechart_filters").hasClass("googlechart_filters_side")){
            return;
        }
        var container = jQuery(filterUl).closest("div.googlechart_filter");
        var button = jQuery(container).find("div.charts-menu-button");
        jQuery(filterUl).width(jQuery(container).width() - jQuery(button).width() - 10);
    });
    jQuery.each(jQuery(".googlechart_filter"), function(idx, filter){
        filterWidth = jQuery(filter).width();
        filterLeft = jQuery(filter).offset().left;
        containerWidth = jQuery(filter).closest(".googlechart_filters").width();
        containerLeft = jQuery(filter).closest(".googlechart_filters").offset().left;
        if ((containerWidth !== 0) && ((containerWidth + containerLeft - filterWidth - filterLeft) < filterWidth)){
            if (!jQuery(filter).hasClass("eea-beautified")){
                jQuery(filter).addClass("eea-beautified");
                jQuery(filter).after("<div style='clear:both'></div>");
            }
        }
    });
    var containers = [".googlechart_table_left", ".googlechart_table_right"];
    jQuery.each(containers, function(idx, container){
        jQuery.each(jQuery(container).find(".google-visualization-controls-rangefilter"), function(idx, filter){
            labels = jQuery(filter).find(".google-visualization-controls-rangefilter-thumblabel");
            if (!jQuery(filter).hasClass("eea-beautified")){
                jQuery(filter).addClass("eea-beautified");
                jQuery("<br/>").insertAfter(labels.eq(0));
                jQuery("<br/>").insertBefore(labels.eq(1));
                labels.eq(1).css("float", "right");
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
        chartReadyEvent : function(){},
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
        updateHash : false
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
    // XXX Use GoogleChartsConfig for options instead of googlechart_config_array
    var other_settings = jQuery("#"+settings.chartDashboard).data("other_settings");
    if ((other_settings) && (other_settings.GoogleChartsConfig)){
        jQuery.each(other_settings.GoogleChartsConfig, function(index, value){
            if((value.id == settings.chartId) && value.notes){
                settings.notes = value.notes;
            }
        });
    }

    jQuery("#"+settings.chartViewDiv).width(settings.chartWidth).height(settings.chartHeight);

    settings.chartJson.options.allowHtml = true;
    settings.chartJson.options.width = settings.chartWidth;
    settings.chartJson.options.height = settings.chartHeight;

    jQuery.extend(true, settings.chartJson.options, settings.chartOptions);

    settings.chartJson.dataTable = [];

    settings.chartJson.containerId = settings.chartViewDiv;

    var chartOptions = settings.chartJson.options;
    var dataTable = settings.chartDataTable;
    var trendlines = {};
    jQuery.each(chartOptions.trendlines || {}, function(name, trendline){
        for (var i = 0; i < dataTable.getNumberOfColumns(); i++){
            if (dataTable.getColumnId(i) === name){
                trendlines[i - 1] = trendline;
            }
        }
    });
    settings.chartJson.options.trendlines = trendlines;

    /* remove duplicated suffixes */
    jQuery.each(settings.chartJson.options.vAxes || {}, function(axid, ax){
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
        jQuery.each(settings.originalTable.properties, function(key, value){
            originalTableProps.push(key);
        });
        jQuery.each(settings.chartFilters, function(key, value){
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
            jQuery.each(settings.availableColumns, function(key, value){
                if (jQuery.inArray(key, originalTableProps) === -1){
                    settings.chartFilters[key] = pivotedFilterType;
                }
            });
        }
        jQuery.each(settings.chartFilters, function(key, value){
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
        });

        google.visualization.events.addListener(dashboard, 'error', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartErrorEvent();
        });

        jQuery(filtersArray).each(function(key,value){
            google.visualization.events.addListener(value, 'statechange', function(event){
                applyCustomFilters(customFilterParams);
            });
            updateFilterDivs();
        });


        dashboard.draw(dataView);
    }
    else {
        chart.setDataTable(dataView);
        google.visualization.events.addListener(chart, 'ready', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartReadyEvent();
            updateFilterDivs();
            fixSVG("#"+settings.chartViewDiv);
        });

        google.visualization.events.addListener(chart, 'error', function(event){
            jQuery("#"+settings.chartViewDiv).find(".googlechart_loading_img").remove();
            settings.chartErrorEvent();
        });
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
            updateHash : settings.updateHash
        };
        jQuery.each(settings.chartFilters, function(key, value){
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

    if (jQuery("#" + settings.chartDashboard).data() === null){
        return;
    }
    var conf_array = jQuery("#" + settings.chartDashboard).data('other_settings').googlechart_config_array;
    jQuery.each(conf_array, function(idx, conf){
        if (conf[0] === jQuery("#"+settings.chartViewDiv).attr("chart_id")){
            var chart_columnFilters_old = conf[14];
            // remove all custom column filters from original
            var columnFiltersToKeep = [];
            jQuery.each(chart_columnFilters_old, function(idx2, columnFilter){
                if (columnFilter.title.indexOf('custom_helper_') !== 0){
                    columnFiltersToKeep.push(columnFilter);
                }
            });
            chart_columnFilters_old.splice(0, chart_columnFilters_old.length);
            jQuery.each(columnFiltersToKeep, function(idx2, columnFilter){
                chart_columnFilters_old.push(columnFilter);
            });

            // remove all custom column filters from settings
            columnFiltersToKeep = [];
            jQuery.each(settings.columnFilters, function(idx2, columnFilter){
                if (columnFilter.title.indexOf('custom_helper_') !== 0){
                    columnFiltersToKeep.push(columnFilter);
                }
            });
            settings.columnFilters.splice(0, settings.columnFilters.length);
            jQuery.each(columnFiltersToKeep, function(idx2, columnFilter){
                settings.columnFilters.push(columnFilter);
            });

            // update custom column filters for original and for settings
            jQuery.each(customColumnFilters, function(idx2, customFilter){
                var shouldAdd = true;
                jQuery.each(chart_columnFilters_old, function(idx3, columnFilter){
                    if (columnFilter.title === customFilter.title){
                        shouldAdd = false;
                    }
                });
                if (shouldAdd){
                    settings.columnFilters.push(customFilter);
                }
            });

            jQuery.each(settings.columnFilters, function(idx2, columnFilter){
                var shouldAdd = true;
                jQuery.each(chart_columnFilters_old, function(idx3, tmpFilter){
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
        jQuery.each(settings.columnFilters, function(idx1, columnFilter1){
            var shouldHide = false;
            if (columnFilter1.title.indexOf("custom_helper_") === -1){
                jQuery.each(settings.columnFilters, function(idx2, columnFilter2){
                    if (columnFilter1.title !== columnFilter2.title){
                        jQuery.each(columnFilter1.settings.selectables, function(idx3, column){
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

        jQuery.each(settings.notes, function(index, note){
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
    jQuery.each(settings.filters, function(key, value){
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
    jQuery.each(settings.chartsSettings, function(key, value){
        if(value.dashboard.hidden){
            return;
        }
        if (value.wtype === 'googlecharts.widgets.chart'){
            var chartConfig;
            var chart_unpivotsettings;
            jQuery(settings.charts).each(function(idx, config){
                if (config[0] === value.name){
                    chartConfig = config;
                    chart_unpivotSettings = config[15];
                }
            });
            var chartContainerId = settings.chartViewsDiv+"_" + value.name;
            var chartContainer = jQuery('<div>')
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

            var columnsFromSettings = getColumnsFromSettings(chartConfig[2]);

            var chart_sortBy = chartConfig[12];
            var chart_sortAsc = true;
            var chart_row_filters = chartConfig[11];

            var sortAsc_str = chartConfig[13];
            if (sortAsc_str === 'desc'){
                chart_sortAsc = false;
            }

            var tmp_columns_and_rows = getAvailable_columns_and_rows(chart_unpivotSettings, settings.columns, settings.rows);
            var options = {
                originalTable : settings.rows,
                normalColumns : columnsFromSettings.normalColumns,
                pivotingColumns : columnsFromSettings.pivotColumns,
                valueColumn : columnsFromSettings.valueColumn,
                availableColumns : tmp_columns_and_rows.available_columns,
                unpivotSettings : chart_unpivotSettings,
                filters : chart_row_filters
            };

            var transformedTable = transformTable(options);

            options = {
                originalDataTable : transformedTable,
                columns : columnsFromSettings.columns,
                sortBy : chart_sortBy,
                sortAsc : chart_sortAsc,
                preparedColumns : chartConfig[2].prepared,
                enableEmptyRows : chartConfig[7].enableEmptyRows
            };

            var tableForChart = prepareForChart(options);

            var chart_width = chartConfig[4];
            var chart_height = chartConfig[5];
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
                chartReadyEvent : function(){},
                sortFilter:'__disabled__',
                hideNotes:true,
                originalTable:settings.rows
            };
            var tmp_chart = drawGoogleChart(chart_options);
            hiddenDashboardFilters = hiddenDashboardFilters.concat(tmp_chart.filters);
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
            jQuery.each(settings.columns, function(key,value){
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
                columns : normalColumns
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
                chartReadyEvent : function(){},
                sortFilter : '__disabled__',
                customFilterHandler : dashboardFilterChanged,
                customFilterOptions : customFilterOptions,
                originalTable : settings.rows,
                updateHash : settings.updateHash
            };
            var tmp_chart = drawGoogleChart(chart_options);
            jQuery.each(tmp_chart.filters, function(idx, filter){
                dashboardFilters.push(filter);
            });
    }
}
