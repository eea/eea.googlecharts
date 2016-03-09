// global variable to store a hash with all ChartWrapper objects as they are returned by the drawGoogleChart method
// we use this to handle window resize without calling drawChart
// instead ajusting the 'width' parameter and call the ChartWrapper's draw method
var gl_charts = {};

var chartsForPaletteReorder = ["LineChart",
                                "ComboChart",
                                "ImageChart",
                                "AreaChart",
                                "SteppedAreaChart",
                                "ColumnChart",
                                "BarChart",
                                "ScatterChart",
                                "ImageSparkLine",
                                "AnnotatedTimeLine"];

function updateHashForSortFilter(attr_name, attr_values, updateHash, obj){
    var hash = window.location.hash.split("_filters=")[0];
    var query_params = getQueryParams(obj);

    if (attr_values.length > 0){
        query_params[attr_name] = attr_values;
    }
    else {
        delete (query_params[attr_name]);
    }
    query_params = encodeURIComponent(JSON.stringify(query_params).split(",").join(";"));

    if (updateHash){
        window.location.hash = hash + "_filters=" + query_params;
    }
    else {
        jQuery(obj).closest("div.googlechart_dashboard").attr("query_params", query_params);
    }
}

function updateHashForColumnFilter(attr_name, attr_defaults, updateHash, obj){
    if (attr_name.substr(0,27) === "columnfilter_custom_helper_"){
        return;
    }
    var hash = window.location.hash.split("_filters=")[0];
    var query_params = getQueryParams(obj);

    if (attr_defaults.length > 0){
        query_params.columnFilters[attr_name] = attr_defaults.sort();
    }
    else {
        delete(query_params.columnFilters[attr_name]);
    }
    query_params = encodeURIComponent(JSON.stringify(query_params).split(",").join(";"));
    if (updateHash){
        window.location.hash = hash + "_filters=" + query_params;
    }
    else {
        jQuery(obj).closest("div.googlechart_dashboard").attr("query_params", query_params);
    }
}

function addCustomFilter(options){
    var settings = {
        customTitle : '',
        customPrefix : '',
        filtersDiv : '',
        customValues : '',
        customAllowMultiple : '',
        customHandler : function(){},
        customReadyHandler : function(){},
        defaultValues : [],
        allowNone : true,
        paramsForHandler : null,
        filterType : 'CategoryFilter',
        filterAllowTyping : false,
        hideFilter : false,
        updateHash : false
    };
    jQuery.extend(settings, options);
    var defaults = [];
    if (settings.customPrefix.substr(0,18) === "pre_config_filter_"){
        defaults = [];
        patched_each(settings.defaultValues, function(idx, value){
            defaults.push(value[0]);
        });
        updateHashForColumnFilter("pre_config_"+settings.customPrefix.substr(18), defaults, settings.updateHash, "#"+settings.filtersDiv);
    }

    if (settings.customPrefix.substr(0,13) === "columnfilter_"){
        defaults = [];
        patched_each(settings.defaultValues, function(idx, value){
            defaults.push(value);
        });
        updateHashForColumnFilter("columnfilter_"+settings.customPrefix.substr(13), defaults, settings.updateHash, "#"+settings.filtersDiv);
    }

    updateFilterDivs();

    var filterData = google.visualization.arrayToDataTable(settings.customValues);

    var filterChartDivId = settings.filtersDiv + "_" + settings.customPrefix + "_custom_chart";
    var filterChartDiv = "<div id='" + filterChartDivId + "' style='display:none;'></div>";
    jQuery(filterChartDiv).appendTo("#" + settings.filtersDiv);

    var filterFilterDivId = settings.filtersDiv + "_" + settings.customPrefix + "_custom_filter";
    var filterFilterDiv;
    if ((settings.customTitle.indexOf("custom_helper_") === 0) || (settings.hideFilter)){
        filterFilterDiv = "<div id='" + filterFilterDivId + "' style='display:none;'></div>";
    }
    else{
        var hideFilter = false;
        var query_params = getQueryParams("#"+filterFilterDivId);
        if (query_params.hideFilters !== undefined){
            if (jQuery.inArray(('googlechart_filters_' + settings.customPrefix+"_custom_filter"), query_params.hideFilters) !== -1){
                hideFilter = true;
            }
        }
        if (hideFilter){
            filterFilterDiv = "<div class='googlechart_filter' id='" + filterFilterDivId + "' style='display:none'></div>";
        }
        else {
            filterFilterDiv = "<div class='googlechart_filter' id='" + filterFilterDivId + "'></div>";
        }

    }
    jQuery(filterFilterDiv).prependTo("#" + settings.filtersDiv);

    var filterChart = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': filterChartDivId,
        'options': {'height': '13em', 'width': '20em'}
    });

    var layout = 'side';
    if (jQuery("#" + settings.filtersDiv).hasClass("googlechart_filters_side")){
        layout = 'belowStacked';
    }
    var filterFilter = new google.visualization.ControlWrapper({
        'controlType': settings.filterType,
        'containerId': filterFilterDivId,
        'options': {
            'filterColumnLabel': settings.customTitle,
            'ui': {
                'allowNone' : settings.allowNone,
                'allowTyping': settings.allowTyping,
                'allowMultiple': settings.customAllowMultiple,
                'selectedValuesLayout': layout
            }
        }
    });

    settings.callerFilter = filterFilter;
    var filterDashboard = new google.visualization.Dashboard(document.getElementById(filterChartDivId));
    filterDashboard.bind(filterFilter, filterChart);

    google.visualization.events.addListener(filterFilter, 'statechange', function(event){
        disableBaseHref();
        settings.paramsForHandler.columnsToBeShown =  settings.callerFilter.columnsToBeShown;
        settings.customHandler(settings.paramsForHandler);
        updateFilterDivs();
    });

    google.visualization.events.addListener(filterDashboard, 'ready', function(event){
        settings.customReadyHandler(settings.paramsForHandler);
        updateFilterDivs();
        enableBaseHref();
    });


    filterDashboard.draw(filterData);
    filterFilter.setState({"selectedValues":settings.defaultValues});
    return filterFilter;
}


function applySortOnChart(options){
    var tmpDataView = new google.visualization.DataView(options.sortFilterDataTable);
    var sortBy = options.sortFilterObj.getState().selectedValues[0];
    var tmpRows = options.sortFilterChart.getDataTable().getViewRows();
    var hasFilter = (tmpDataView.getNumberOfRows() !== tmpRows.length);
    var sortedRows;
    if (sortBy && hasFilter){
        sortedRows = options.sortFilterChart.getDataTable().getSortedRows(options.sortFilterArray[sortBy][0]);
        if (options.sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        var tmpFiltered = new google.visualization.DataView(options.sortFilterChart.getDataTable());
        tmpFiltered.setRows(sortedRows);
        if (options.enableEmptyRows){
            tmpFiltered = addEmptyRows(tmpFiltered);
        }
        options.sortFilterChart.setDataTable(tmpFiltered);
        options.sortFilterChart.draw();
    }
    if (sortBy && !hasFilter){
        sortedRows = tmpDataView.getSortedRows(options.sortFilterArray[sortBy][0]);
        if (options.sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        tmpDataView.setRows(sortedRows);
        if (options.enableEmptyRows){
            tmpDataView = addEmptyRows(tmpDataView);
        }
        options.sortFilterChart.setDataTable(tmpDataView);
        options.sortFilterChart.draw();
    }
    if (!sortBy && hasFilter){
        var tmpFiltered2 = new google.visualization.DataView(options.sortFilterChart.getDataTable());
        if (options.enableEmptyRows){
            tmpFiltered2 = addEmptyRows(tmpFiltered2);
        }
        options.sortFilterChart.setDataTable(tmpFiltered2);
        options.sortFilterChart.draw();
    }
    if (!sortBy && !hasFilter){
        options.sortFilterChart.setDataTable(tmpDataView);
        options.sortFilterChart.draw();
    }

    var sortBy_name = "__default__";
    if (sortBy === undefined){
        sortBy = "__default__";
    }
    var shortSortBy = sortBy;
    var sortBy_ext = "";
    if (sortBy.substr(sortBy.length - 11) === ' (reversed)'){
        shortSortBy = sortBy.substr(0, sortBy.length - 11);
        sortBy_ext = "_reversed";
    }
    patched_each(options.availableColumns, function(key, value){
        if (value === shortSortBy){
            sortBy_name = key + sortBy_ext;
        }
    });

    updateHashForSortFilter('sortFilter', [sortBy_name], options.updateHash, "#"+options.sortFilterChart.getContainerId());
    updateFilterDivs();
}

function applyCustomFilters(options){
    if (!options){
        return;
    }
    if (options.sortFilterObj){
        applySortOnChart(options);
    }
}

function addSortFilter(options){
    var settings = {
        filtersDiv : '',
        filterTitle : '',
        filterDataTable : null,
        filterChart : null,
        enableEmptyRows : false,
        sortFilterValue : '__default__',
        updateHash : false
    };
    jQuery.extend(settings, options);

    var sortFilterChart = settings.filterChart;
    var sortFilterDataTable = settings.filterDataTable;
    var colsnr = settings.filterDataTable.getNumberOfColumns();
    var cols_array = [[settings.filterTitle]];
    var sortFilterArray = {};
    var column_label;
    for (var i = 0; i < colsnr; i++){
        column_label = settings.filterDataTable.getColumnLabel(i);
        //  #67854 do now show defaulttoltip sorts as it will
        // duplicate the sort by filters
        if (column_label.indexOf('defaulttooltip') !== -1) {
            continue;
        }
        cols_array.push([column_label]);
        sortFilterArray[column_label] = [i, false];
        cols_array.push([column_label + " (reversed)"]);
        sortFilterArray[column_label + " (reversed)"] = [i, true];
    }

    var paramsForHandler = {
        sortFilterChart : sortFilterChart,
        sortFilterDataTable : sortFilterDataTable,
        sortFilterArray : sortFilterArray,
        enableEmptyRows : settings.enableEmptyRows,
        updateHash : settings.updateHash,
        availableColumns : settings.availableColumns
    };

    var options2 = {
        customTitle : settings.filterTitle,
        customPrefix : 'sortfilter',
        filtersDiv : settings.filtersDiv,
        customValues : cols_array,
        customAllowMultiple : false,
        customHandler : applyCustomFilters,
        paramsForHandler : paramsForHandler,
        enableEmptyRows : settings.enableEmptyRows,
        updateHash : settings.updateHash
    };

    if (settings.sortFilterValue !== '__default__'){
        options2.defaultValues = [settings.sortFilterValue];
        options2.customReadyHandler = applyCustomFilters;
    }

    sortFilterObj = addCustomFilter(options2);
    paramsForHandler.sortFilterObj = sortFilterObj;

    return paramsForHandler;
}


function getColNameFromFriendly(friendlyname, options){
    var colName = "";
    patched_each(options.columnFriendlyNames, function(key,value){
        if (value === friendlyname){
            colName = key;
        }
    });
    return (colName);
}

function applyColumnFilters(options){
/*    var skipColorReorder = false;
    patched_each(jQuery("#"+options.filtersDiv).find("div"), function(idx, div){
        if ((jQuery(div).attr("id") === undefined) || (jQuery(div).attr("id") === '')){
            return;
        }
        if (jQuery(div).attr("id").indexOf("pre_config_filter_") !== -1){
            skipColorReorder = true;
        }
    });*/
    jQuery("#"+options.filtersDiv).html('');
    jQuery("#"+options.chartViewDiv).html('');
    var config = [];

    var original_config;
    var conf_array = jQuery("#" + options.dashboardDiv).data('other_settings').googlechart_config_array;
    patched_each(conf_array, function(idx, conf){
        if (conf[0] === jQuery("#"+options.chartViewDiv).attr("chart_id")){
            original_config = conf;
            var chart_id = conf[0];
            var chart_json = JSON.parse(JSON.stringify(conf[1]));
            var chart_columns_old = conf[2];
            var chart_filters_old = conf[3];
            var chart_width = conf[4];
            var chart_height = conf[5];
            var chart_filterposition = conf[6];
            var chart_options = JSON.parse(JSON.stringify(conf[7]));
            var chart_dashboard = conf[8];
            var chart_sortFilter = conf[9];
            var chart_hasPNG = conf[10];
            var chart_row_filters = conf[11];
            var chart_sortBy = conf[12];
            var chart_sortAsc = conf[13];

            var chart_columnFilters_old = conf[14];
            var chart_columnFilters_new = [];


            patched_each(options.columnFiltersObj, function(c_idx, columnFilterObj){
                var chart_columnFilter_new = {};
                chart_columnFilter_new.title = chart_columnFilters_old[c_idx].title;
                chart_columnFilter_new.type = chart_columnFilters_old[c_idx].type;
                chart_columnFilter_new.allowempty = chart_columnFilters_old[c_idx].allowempty;
                chart_columnFilter_new.settings = {};
                var defaults_new = [];
                patched_each(columnFilterObj.getState().selectedValues, function(idx, default_new){
                    defaults_new.push(getColNameFromFriendly(default_new, options));
                });
                chart_columnFilter_new.settings.defaults = defaults_new;
                chart_columnFilter_new.settings.selectables = [];
                patched_each(chart_columnFilters_old[c_idx].settings.selectables, function(co_idx, columnFilter_old){
                    chart_columnFilter_new.settings.selectables.push(columnFilter_old);
                });
                chart_columnFilters_new.push(chart_columnFilter_new);
            });
            var chart_json_view_columns = [];
            var colnr = 0;
            var chart_columns_new = {};
            chart_columns_new.original = [];
            chart_columns_new.prepared = [];
            patched_each(chart_columns_old.original, function(idx, chart_column_old){
                var chart_column_new = {};
                chart_column_new.name = chart_column_old.name;
                chart_column_new.status = chart_column_old.status;
                chart_columns_new.original.push(chart_column_new);
            });
            var usedFilterIdxs = [];
            patched_each(chart_columns_old.prepared, function(idx, chart_column_old){
                var columnFilterIdx = -1;
                var shouldSkip;
                patched_each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (jQuery.inArray(chart_column_old.name, columnFilter_old.settings.defaults) !== -1){
                        if (usedFilterIdxs.indexOf(idx) === -1){
                            columnFilterIdx = idx;
                            usedFilterIdxs.push(idx);
                        }
                        else{
                            shouldSkip = true;
                        }
                    }
                });
                if (shouldSkip){
                    return;
                }
                if (columnFilterIdx === -1){
                    var chart_column_new = jQuery.extend(true, {}, chart_column_old);
                    chart_columns_new.prepared.push(chart_column_new);
                    if (chart_column_new.status === 1){
                        chart_json_view_columns.push(colnr);
                        colnr++;
                    }
                }
                else {
                    patched_each(chart_columnFilters_new[columnFilterIdx].settings.defaults.sort(), function(idx, default_col_new){
                        var chart_column_new = {};
                        chart_column_new.name = default_col_new;
                        patched_each(chart_columns_old.prepared, function(idx, tmpcol){
                            if (tmpcol.name === chart_column_new.name){
                                chart_column_new = jQuery.extend(true, {}, tmpcol);
                            }
                        });
                        chart_column_new.fullname = options.columnFriendlyNames[default_col_new];
                        chart_column_new.status = 1;


                        chart_columns_new.prepared.push(chart_column_new);
                        chart_json_view_columns.push(colnr);
                        colnr++;
                    });
                }
            });
            var chart_columns_new_prepared = [];
            patched_each(chart_columns_old.prepared, function(idx1, chart_column_old){
                patched_each(chart_columns_new.prepared, function(idx2, chart_column_new){
                    if (chart_column_old.name === chart_column_new.name){
                        chart_columns_new_prepared.push(chart_column_new);
                    }
                });
            });
            chart_columns_new.prepared = chart_columns_new_prepared;
            var chart_filters_new = {};
            patched_each(chart_filters_old,function(key,value){
                var columnFilterIdx = -1;
                patched_each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (columnFilter_old.settings.defaults.indexOf(key) !== -1){
                        columnFilterIdx = idx;
                    }
                });
                if (columnFilterIdx === -1){
                    chart_filters_new[key] = value;
                }
                else{
                    patched_each(chart_columnFilters_new[columnFilterIdx].settings.defaults, function(idx, default_col_new){
                        chart_filters_new[default_col_new] = value;
                    });
                }
            });

            chart_columns_new.columnsToBeShown=options.columnsToBeShown;
            chart_json.view.columns = chart_json_view_columns;
            config.push(chart_id);
            config.push(chart_json);
            config.push(chart_columns_new);
            config.push(chart_filters_new);
            config.push(chart_width);
            config.push(chart_height);
            config.push(chart_filterposition);
            config.push(chart_options);
            config.push(chart_dashboard);
            config.push(chart_sortFilter);
            config.push(chart_hasPNG);
            config.push(chart_row_filters);
            config.push(chart_sortBy);
            config.push(chart_sortAsc);
            config.push(chart_columnFilters_new);
        }
    });

    var other_settings = jQuery("#" + options.dashboardDiv).data('other_settings');

/*    if (!skipColorReorder){
        if (jQuery.inArray(config[1].chartType, chartsForPaletteReorder) !== -1){
            var original_palette = {};
            var column_nr = 0;
            var color_nr = 0;
            patched_each(original_config[2].prepared, function(idx, column){
                if (column.status === 1){
                    if (column_nr !== 0){
                        if (options.columnTypes[column.name].valueType === 'number'){
                            original_palette[column.name] = original_config[1].options.colors[color_nr];
                            color_nr++;
                            if (color_nr === original_config[1].options.colors.length){
                                color_nr = 0;
                            }
                        }
                    }
                    column_nr++;
                }
            });
            patched_each(original_config[14], function(idx, column_filter){
                patched_each(column_filter.settings.selectables, function(idx, column){
                    if ((options.columnTypes[column].valueType === 'number') && (typeof(original_palette[column]) === 'undefined')){
                        original_palette[column] = original_config[1].options.colors[color_nr];
                        color_nr++;
                        if (color_nr === original_config[1].options.colors.length){
                            color_nr = 0;
                        }
                    }
                });
            });

            var new_palette = [];
            patched_each(config[2].prepared, function(idx, column){
                if ((column.status === 1) && (typeof(original_palette[column.name]) !== 'undefined')){
                    new_palette.push(original_palette[column.name]);
                }
            });
            config[1].options.colors = new_palette;
            config[7].colors = new_palette;
        }
    }*/
    gl_charts[config[1].containerId] = drawChart(config, other_settings).chart;
}

var defaults_columnfilter = [];

var isFirstColumnFilters = true;

function updateColumnFiltersFromHash(options){
    if (defaults_columnfilter.length > 0){
        var default_columnfilter = defaults_columnfilter.pop();
        if (default_columnfilter.title !== options.customTitle){
            defaults_columnfilter.push(default_columnfilter);
            return;
        }
        var columnLabel = default_columnfilter.title.replace(/[^A-Za-z0-9]/g, '_');
        patched_each(options.columnFiltersObj, function(idx, filter){
            var filterLabel = filter.getOption("filterColumnLabel").replace(/[^A-Za-z0-9]/g, '_');
            if (filterLabel === columnLabel){
                filter.setState({"selectedValues":default_columnfilter.defaults});
            }
        });
        applyColumnFilters(options);
    }
}

function addColumnFilters(options){
    var settings = {
        dashboardDiv : '',
        chartViewDiv : '',
        filtersDiv : '',
        columnFilters : [],
        columns : {},
        columnTypes : {},
        columnFiltersObj : [],
        updateHash : false
    };
    jQuery.extend(settings, options);
    var columnFriendlyNames = settings.columns;
    columnFiltersColumnsWithNames = [];

    if (isFirstColumnFilters){
        isFirstColumnFilters = false;
        var hash = window.location.hash.split("_filters=")[0];
        var query_params = getQueryParams("#"+settings.filtersDiv);

        patched_each(query_params.columnFilters, function(key, defaults){
            if (key.substr(0,13) === 'columnfilter_'){
                var default_columnfilter = {};
                default_columnfilter.title = key.substr(13);
                default_columnfilter.defaults = defaults;
                defaults_columnfilter.push(default_columnfilter);
            }
        });
    }


    patched_each(settings.columnFilters.reverse(), function(idx, columnFilter){
        var paramsForHandler = {
            dashboardDiv : settings.dashboardDiv,
            chartViewDiv : settings.chartViewDiv,
            filtersDiv : settings.filtersDiv,
            columnFiltersObj : settings.columnFiltersObj,
            columnFriendlyNames : columnFriendlyNames,
            columnTypes : settings.columnTypes,
            customTitle : columnFilter.title.replace(/[^A-Za-z0-9]/g, '_'),
            updateHash : settings.updateHash
        };
        var values = [[columnFilter.title]];
        var defaultValues = [];
        patched_each(columnFilter.settings.defaults, function(idx, defaultcol){
            defaultValues.push(settings.columns[defaultcol]);
        });
        patched_each(columnFilter.settings.selectables, function(idx, selectable){
            values.push([settings.columns[selectable]]);
        });
        var options2 = {
            customTitle : columnFilter.title,
            customPrefix : 'columnfilter_' + columnFilter.title.replace(/[^A-Za-z0-9]/g, '_'),
            filtersDiv: settings.filtersDiv,
            customValues : values,
            customAllowMultiple : (columnFilter.type === '1' ? true : false),
            customHandler : applyColumnFilters,
            defaultValues : defaultValues,
            allowNone : columnFilter.allowempty,
            paramsForHandler : paramsForHandler,
            customReadyHandler : updateColumnFiltersFromHash,
            hideFilter : columnFilter.hideFilter,
            updateHash : settings.updateHash
        };
        settings.columnFiltersObj.push(addCustomFilter(options2));
    });
    settings.columnFilters.reverse();
    settings.columnFiltersObj.reverse();
}

function applyPreConfigFilters(options){
    var filterTitle = this.customTitle;
    if (filterTitle === undefined){
        filterTitle = options.customTitle;
    }
    var selectedValues = [];
    var objForTrigger;
    var allowMultiple;
    patched_each(options.preConfigFiltersObj, function(idx, columnFilterObj){
        if (columnFilterObj.getOption("filterColumnLabel") === filterTitle){
            selectedValues = columnFilterObj.getState().selectedValues;
            allowMultiple = columnFilterObj.getOption("ui.allowMultiple");
        }
    });
    if ((selectedValues.length === 0) && (!allowMultiple)){
        return;
    }
    var chart_columnFilters_old;
    var chart_columns_old;
    var conf_array = jQuery("#" + options.dashboardDiv).data('other_settings').googlechart_config_array;
    patched_each(conf_array, function(idx, conf){
        if (conf[0] === jQuery("#"+options.chartViewDiv).attr("chart_id")){
            chart_columnFilters_old = conf[14];
            chart_columns_old = conf[2];
        }
    });
    patched_each(chart_columns_old.prepared, function(idx, prepared){
        var shouldHide = true;
        patched_each(chart_columns_old.original, function(idx, original){
            if (original.name === prepared.name){
                shouldHide = false;
            }
        });
        if (shouldHide){
            prepared.status = 0;
        }
    });

    var filtersNotToRemove = [];
    var filtersNotToRemoveTitles = [];
    var filtersConfNotToRemove = [];
    var filtersConfNotToRemoveTitles = [];

    var columnsToBeShown = [];
    patched_each(options.columnFiltersObj, function(idx1, columnFilterObj){
        if (columnFilterObj.getOption("filterColumnLabel").indexOf("custom_helper_") === -1){
            filtersNotToRemove.push(columnFilterObj);
            filtersNotToRemoveTitles.push(columnFilterObj.getOption("filterColumnLabel"));
            patched_each(chart_columnFilters_old, function (idx3, oldFilter){
                if ((oldFilter.title === columnFilterObj.getOption("filterColumnLabel")) && (jQuery.inArray(oldFilter.title, filtersConfNotToRemoveTitles) === -1)){
                    filtersConfNotToRemove.push(oldFilter);
                    filtersConfNotToRemoveTitles.push(oldFilter.title);
                }
            });
        }
        patched_each(options.thisCustomHelperFilters, function(idx2, helperFilter){
            if (columnFilterObj.getOption("filterColumnLabel") === helperFilter.title){
                var newState = {"selectedValues":[]};
                patched_each(selectedValues, function(idx3, selectedValue){
                    patched_each(helperFilter.settings.selectables, function(idx4, selectable){
                        selectedValueStr = selectedValue.toString().replace(/[^A-Za-z0-9]/g, '_');
                        if (selectable.replace("_"+selectedValueStr, "") === helperFilter.title.replace("custom_helper_", "")){
                            newState.selectedValues.push(options.availableColumns[selectable]);
                        }
                    });
                });
                if (newState.selectedValues.length > 0){
                    for (var i = 0; i < newState.selectedValues.length; i++){
                        if (jQuery.inArray(newState.selectedValues[i], columnsToBeShown) === -1){
                            columnsToBeShown.push(newState.selectedValues[i]);
                        }
                    }
                }

                columnFilterObj.setState(newState);
                columnFilterObj.draw();
                objForTrigger = columnFilterObj;
                if (jQuery.inArray(helperFilter.title, filtersNotToRemoveTitles) === -1){
                    filtersNotToRemove.push(columnFilterObj);
                    filtersNotToRemoveTitles.push(helperFilter.title);
                }
                patched_each(chart_columnFilters_old, function (idx3, oldFilter){
                    if ((oldFilter.title === helperFilter.title) && (jQuery.inArray(oldFilter.title, filtersConfNotToRemoveTitles) === -1)){
                        filtersConfNotToRemove.push(oldFilter);
                        filtersConfNotToRemoveTitles.push(oldFilter.title);
                    }
                });
            }
        });
    });
    options.columnFiltersObj.splice(0, options.columnFiltersObj.length);
    patched_each(filtersNotToRemove, function(idx, filter){
        options.columnFiltersObj.push(filter);
    });
    chart_columnFilters_old.splice(0, chart_columnFilters_old.length);
    patched_each(filtersConfNotToRemove, function(idx, filter){
        chart_columnFilters_old.push(filter);
    });
    objForTrigger.columnsToBeShown = columnsToBeShown;
    google.visualization.events.trigger(objForTrigger, 'statechange');
}

var defaults_preconfig = [];

var isFirstPreConfigFilters = true;

function updatePreConfigFiltersFromHash(options){
    if (defaults_preconfig.length > 0){
        var default_preconfig = defaults_preconfig.pop();
        if (default_preconfig.title !== options.customTitle){
            defaults_preconfig.push(default_preconfig);
            return;
        }
        var columnLabel = default_preconfig.title.replace(/[^A-Za-z0-9]/g, '_');
        patched_each(options.preConfigFiltersObj, function(idx, filter){
            var filterLabel = filter.getOption("filterColumnLabel").replace(/[^A-Za-z0-9]/g, '_');
            if (filterLabel === columnLabel){
                filter.setState({"selectedValues":default_preconfig.defaults});
            }
        });
        applyPreConfigFilters(options);
    }
}

function addPreConfigFilters(options){
    var settings = {
        originalTable : '',
        visibleColumns : '',
        availableColumns : '',
        transformedTable : '',
        filtersDiv : '',
        dashboardDiv : '',
        filters : [],
        updateHash : false
    };
    jQuery.extend(settings, options);
    var column_names_to_be_shown = [];
    patched_each(settings.availableColumns, function(key, column){
        if (settings.columnsToBeShown){
            for (var i = 0; i < settings.columnsToBeShown.length; i++){
                if (column === settings.columnsToBeShown[i]){
                    column_names_to_be_shown.push(key);
                }
            }
        }
        else{
            column_names_to_be_shown.push(key);
        }
    });
    settings.filters.reverse();
    var preConfigFiltersObj = [];

    var customHelperFilters = [];
    var availableCustomHelperFilters = [];
    var allCustomHelperFiltersTitle = [];
    if (isFirstPreConfigFilters){
        isFirstPreConfigFilters = false;
        var hash = window.location.hash.split("_filters=")[0];
        var query_params = getQueryParams(settings.filtersDiv);
        patched_each(query_params.columnFilters, function(key, defaults){
            if (key.substr(0,11) === 'pre_config_'){
                var default_preconfig = {};
                default_preconfig.title = key.substr(11);
                default_preconfig.defaults = defaults;
                defaults_preconfig.push(default_preconfig);
            }
        });
    }
    patched_each(settings.filters, function(idx, filter){
        var allThisCustomHelperFilters = [];
        var mainDefaults = [];
        var customTitle = settings.originalTable.properties[filter.filterTitle].label;
        if (customTitle === undefined){
            customTitle = filter.filterTitle;
        }
        var tmp_table = [];
        tmp_table.push([customTitle]);
        var tmp_items = [];
        patched_each(settings.originalTable.items, function(idx, value){
            if (jQuery.inArray(value[filter.filterTitle], tmp_items) === -1){
                tmp_items.push(value[filter.filterTitle]);
            }
        });
        tmp_items = tmp_items.sort();
        patched_each(tmp_items, function(idx, value){
            tmp_table.push([value]);
        });
        patched_each(settings.availableColumns, function(key, availableColumn){
            patched_each(tmp_table, function(f_idx, filterValue){
                var filterStr = filterValue[0].toString().replace(/[^A-Za-z0-9]/g, '_');
                if (f_idx === 0){
                    return;
                }
                var pos = key.indexOf(filterStr);
                if (pos === -1){
                    return;
                }
                has_othermatch = false;
                patched_each(tmp_table, function(f_idx2, filterValue2){
                    var filterStr2 = filterValue2[0].toString().replace(/[^A-Za-z0-9]/g, '_');
                    if ((f_idx2 !== f_idx) && (key.indexOf(filterStr2) !== -1) && (filterStr.length < filterStr2.length)){
                        has_othermatch = true;
                    }
                });
                if (has_othermatch){
                    return;
                }
                var tmp_title = key.replace("_"+filterStr, "");
                var found_customHelperFilter = false;
                var tmp_customHelperFilter = null;
                patched_each(customHelperFilters, function(h_idx, customHelperFilter){
                    if (customHelperFilter.title === 'custom_helper_' + tmp_title){
                        tmp_customHelperFilter = customHelperFilter;
                    }
                });
                if (!tmp_customHelperFilter){
                     var customFilterType = '0';
                     if (filter.filterType === '3'){
                        customFilterType = '1';
                     }
                     tmp_customHelperFilter = {
                        settings: {
                            defaults : [],
                            selectables : []
                        },
                        allowempty : false,
                        type: customFilterType,
                        title:'custom_helper_' + tmp_title
                    };
                    customHelperFilters.push(tmp_customHelperFilter);
                    allThisCustomHelperFilters.push(tmp_customHelperFilter);
                }
                if (jQuery.inArray(key, tmp_customHelperFilter.settings.selectables) === -1){
                    tmp_customHelperFilter.settings.selectables.push(key);
                }
                if (jQuery.inArray(key, settings.visibleColumns)!== -1){
                    if (jQuery.inArray(key, tmp_customHelperFilter.settings.defaults) === -1){
                        tmp_customHelperFilter.settings.defaults.push(key);
                        if (jQuery.inArray(filterValue, mainDefaults) === -1){
                            if (jQuery.inArray(key, column_names_to_be_shown) !== -1){
                                mainDefaults.push(filterValue);
                            }
                        }
                    }
                }
            });
        });
        var filterType;
        var allowMultiple = false;
        if (filter.filterType === "0"){
            filterType = 'NumberRangeFilter';
        }
        if (filter.filterType === "1"){
            filterType = 'StringFilter';
        }
        if (filter.filterType === "2"){
            filterType = 'CategoryFilter';
        }
        if (filter.filterType === "3"){
            filterType = 'CategoryFilter';
            allowMultiple = true;
        }

        var thisCustomHelperFilters = [];
        patched_each(allThisCustomHelperFilters, function (all_idx, customHelperFilter){
            if (customHelperFilter.settings.defaults.length > 0){
                thisCustomHelperFilters.push(customHelperFilter);
            }
        });
        var paramsForHandler = {
            dashboardDiv : settings.dashboardDiv,
            chartViewDiv : settings.chartViewDiv,
            filtersDiv : settings.filtersDiv,
            preConfigFiltersObj : preConfigFiltersObj,
            columnFiltersObj : settings.columnFiltersObj,
            allCustomHelperFilters : allCustomHelperFiltersTitle,
            thisCustomHelperFilters : thisCustomHelperFilters,
            availableColumns : settings.availableColumns,
            customTitle : customTitle,
            updateHash : settings.updateHash
        };

        var options2 = {
            customTitle : customTitle,
            customPrefix : "pre_config_filter_"+filter.filterTitle,
            filtersDiv: settings.filtersDiv,
            customValues : tmp_table,
            customAllowMultiple : allowMultiple,
            filterType : filterType,
            customHandler : applyPreConfigFilters,
            paramsForHandler : paramsForHandler,
            defaultValues : mainDefaults,
            allowNone : false,
            customReadyHandler : updatePreConfigFiltersFromHash,
            preConfigFiltersObj : preConfigFiltersObj,
            updateHash : settings.updateHash
        };
        if ((!allowMultiple) && (mainDefaults.length > 1)){
            options2.allowNone = true;
            options2.defaultValues = [];
        }
        preConfigFiltersObj.push(addCustomFilter(options2));
    });
    patched_each(customHelperFilters, function (chf_idx, customHelperFilter){
        if (customHelperFilter.settings.defaults.length > 0){
            availableCustomHelperFilters.push(customHelperFilter);
            allCustomHelperFiltersTitle.push(customHelperFilter.title);
        }
    });
    return availableCustomHelperFilters;
}
