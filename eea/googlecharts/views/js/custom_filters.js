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

function addCustomFilter(options){
    var settings = {
        customTitle : '',
        customPrefix : '',
        filtersDiv : '',
        customValues : '',
        customAllowMultiple : '',
        customHandler : function(){},
        defaultValues : [],
        allowNone : true,
        paramsForHandler : null,
        filterType : 'CategoryFilter',
        filterAllowTyping : false,
        hideFilter : false
    };
    jQuery.extend(settings, options);
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
        filterFilterDiv = "<div id='" + filterFilterDivId + "'></div>";
    }
    jQuery(filterFilterDiv).prependTo("#" + settings.filtersDiv);

    var filterChart = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': filterChartDivId,
        'options': {'height': '13em', 'width': '20em'}
    });

    var filterFilter = new google.visualization.ControlWrapper({
        'controlType': settings.filterType,
        'containerId': filterFilterDivId,
        'options': {
            'filterColumnLabel': settings.customTitle,
            'ui': {
                'allowNone' : settings.allowNone,
                'allowTyping': settings.allowTyping,
                'allowMultiple': settings.customAllowMultiple,
                'selectedValuesLayout': 'belowStacked'
            }
        }
    });

    var filterDashboard = new google.visualization.Dashboard(document.getElementById(filterChartDivId));
    filterDashboard.bind(filterFilter, filterChart);

    google.visualization.events.addListener(filterFilter, 'statechange', function(event){
        settings.customHandler(settings.paramsForHandler);
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
        options.sortFilterChart.setDataTable(tmpFiltered);
        options.sortFilterChart.draw();
    }
    if (sortBy && !hasFilter){
        sortedRows = tmpDataView.getSortedRows(options.sortFilterArray[sortBy][0]);
        if (options.sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        tmpDataView.setRows(sortedRows);
        options.sortFilterChart.setDataTable(tmpDataView);
        options.sortFilterChart.draw();
    }
    if (!sortBy && hasFilter){
        var tmpFiltered2 = new google.visualization.DataView(options.sortFilterChart.getDataTable());
        options.sortFilterChart.setDataTable(tmpFiltered2);
        options.sortFilterChart.draw();
    }
    if (!sortBy && !hasFilter){
        options.sortFilterChart.setDataTable(tmpDataView);
        options.sortFilterChart.draw();
    }
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
        filterChart : null
    };

    jQuery.extend(settings, options);

    var sortFilterChart = settings.filterChart;
    var sortFilterDataTable = settings.filterDataTable;
    var colsnr = settings.filterDataTable.getNumberOfColumns();
    var cols_array = [[settings.filterTitle]];
    var sortFilterArray = {};
    for (var i = 0; i < colsnr; i++){
        cols_array.push([settings.filterDataTable.getColumnLabel(i)]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i)] = [i, false];
        cols_array.push([settings.filterDataTable.getColumnLabel(i) + " (reversed)"]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i) + " (reversed)"] = [i, true];
    }

    var paramsForHandler = {
        sortFilterChart : sortFilterChart,
        sortFilterDataTable : sortFilterDataTable,
        sortFilterArray : sortFilterArray
    };
    var options2 = {
        customTitle : settings.filterTitle,
        customPrefix : 'sortfilter',
        filtersDiv : settings.filtersDiv,
        customValues : cols_array,
        customAllowMultiple : false,
        customHandler : applyCustomFilters,
        paramsForHandler : paramsForHandler
    };

    sortFilterObj = addCustomFilter(options2);
    paramsForHandler.sortFilterObj = sortFilterObj;
    return paramsForHandler;
}


function getColNameFromFriendly(friendlyname, options){
    var colName = "";
    jQuery.each(options.columnFriendlyNames, function(key,value){
        if (value === friendlyname){
            colName = key;
        }
    });
    return (colName);
}

function applyColumnFilters(options){
    var skipColorReorder = false;
    jQuery.each(jQuery("#"+options.filtersDiv).find("div"), function(idx, div){
        if ((jQuery(div).attr("id") === undefined) || (jQuery(div).attr("id") === '')){
            return;
        }
        if (jQuery(div).attr("id").indexOf("pre_config_filter_") !== -1){
            skipColorReorder = true;
        }
    });
    jQuery("#"+options.filtersDiv).html('');
    jQuery("#"+options.chartViewDiv).html('');
    var config = [];

    var original_config;
    var conf_array = jQuery("#" + options.dashboardDiv).data('other_settings').googlechart_config_array;
    jQuery.each(conf_array, function(idx, conf){
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
            var chart_showSort = conf[9];
            var chart_hasPNG = conf[10];
            var chart_row_filters = conf[11];
            var chart_sortBy = conf[12];
            var chart_sortAsc = conf[13];

            var chart_columnFilters_old = conf[14];
            var chart_columnFilters_new = [];


            jQuery.each(options.columnFiltersObj, function(c_idx, columnFilterObj){
                var chart_columnFilter_new = {};
                chart_columnFilter_new.title = chart_columnFilters_old[c_idx].title;
                chart_columnFilter_new.type = chart_columnFilters_old[c_idx].type;
                chart_columnFilter_new.allowempty = chart_columnFilters_old[c_idx].allowempty;
                chart_columnFilter_new.settings = {};
                var defaults_new = [];
                jQuery.each(columnFilterObj.getState().selectedValues, function(idx, default_new){
                    defaults_new.push(getColNameFromFriendly(default_new, options));
                });
                chart_columnFilter_new.settings.defaults = defaults_new;
                chart_columnFilter_new.settings.selectables = [];
                jQuery.each(chart_columnFilters_old[c_idx].settings.selectables, function(co_idx, columnFilter_old){
                    chart_columnFilter_new.settings.selectables.push(columnFilter_old);
                });
                chart_columnFilters_new.push(chart_columnFilter_new);
            });

            var chart_json_view_columns = [];
            var colnr = 0;
            var chart_columns_new = {};
            chart_columns_new.original = [];
            chart_columns_new.prepared = [];
            jQuery.each(chart_columns_old.original, function(idx, chart_column_old){
                var chart_column_new = {};
                chart_column_new.name = chart_column_old.name;
                chart_column_new.status = chart_column_old.status;
                chart_columns_new.original.push(chart_column_new);
            });
            var usedFilterIdxs = [];
            jQuery.each(chart_columns_old.prepared, function(idx, chart_column_old){
                var columnFilterIdx = -1;
                var shouldSkip;
                jQuery.each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (columnFilter_old.settings.defaults.indexOf(chart_column_old.name) !== -1){
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
                    var chart_column_new = {};
                    chart_column_new.name = chart_column_old.name;
                    chart_column_new.fullname = chart_column_old.fullname;
                    chart_column_new.status = chart_column_old.status;
                    chart_column_new.formatters = chart_column_old.formatters;
                    chart_columns_new.prepared.push(chart_column_new);
                    if (chart_column_new.status === 1){
                        chart_json_view_columns.push(colnr);
                        colnr++;
                    }
                }
                else {
                    jQuery.each(chart_columnFilters_new[columnFilterIdx].settings.defaults, function(idx, default_col_new){
                        var chart_column_new = {};
                        chart_column_new.name = default_col_new;
                        chart_column_new.fullname = options.columnFriendlyNames[default_col_new];
                        chart_column_new.status = 1;
                        jQuery.each(chart_columns_old.prepared, function(idx, tmpcol){
                            if ((tmpcol.name === chart_column_new.name) && (tmpcol.hasOwnProperty("formatters"))){
                                chart_column_new.formatters = tmpcol.formatters;
                            }
                        });

                        chart_columns_new.prepared.push(chart_column_new);
                        chart_json_view_columns.push(colnr);
                        colnr++;
                    });
                }
            });
            var chart_filters_new = {};
            jQuery.each(chart_filters_old,function(key,value){
                var columnFilterIdx = -1;
                jQuery.each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (columnFilter_old.settings.defaults.indexOf(key) !== -1){
                        columnFilterIdx = idx;
                    }
                });
                if (columnFilterIdx === -1){
                    chart_filters_new[key] = value;
                }
                else{
                    jQuery.each(chart_columnFilters_new[columnFilterIdx].settings.defaults, function(idx, default_col_new){
                        chart_filters_new[default_col_new] = value;
                    });
                }
            });

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
            config.push(chart_showSort);
            config.push(chart_hasPNG);
            config.push(chart_row_filters);
            config.push(chart_sortBy);
            config.push(chart_sortAsc);
            config.push(chart_columnFilters_new);
        }
    });

    var other_settings = jQuery("#" + options.dashboardDiv).data('other_settings');

    if (!skipColorReorder){
        if (jQuery.inArray(config[1].chartType, chartsForPaletteReorder) !== -1){
            var original_palette = {};
            var column_nr = 0;
            var color_nr = 0;
            jQuery.each(original_config[2].prepared, function(idx, column){
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
            jQuery.each(original_config[14], function(idx, column_filter){
                jQuery.each(column_filter.settings.selectables, function(idx, column){
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
            jQuery.each(config[2].prepared, function(idx, column){
                if ((column.status === 1) && (typeof(original_palette[column.name]) !== 'undefined')){
                    new_palette.push(original_palette[column.name]);
                }
            });
            config[1].options.colors = new_palette;
            config[7].colors = new_palette;
        }
    }
    drawChart(config, other_settings);
}

function addColumnFilters(options){
    var settings = {
        dashboardDiv : '',
        chartViewDiv : '',
        filtersDiv : '',
        columnFilters : [],
        columns: {},
        columnTypes: {},
        columnFiltersObj: []
    };
    jQuery.extend(settings, options);
    var columnFriendlyNames = settings.columns;
    columnFiltersColumnsWithNames = [];
    var paramsForHandler = {
        dashboardDiv : settings.dashboardDiv,
        chartViewDiv : settings.chartViewDiv,
        filtersDiv : settings.filtersDiv,
        columnFiltersObj : settings.columnFiltersObj,
        columnFriendlyNames : columnFriendlyNames,
        columnTypes: settings.columnTypes
    };

    jQuery.each(settings.columnFilters.reverse(), function(idx, columnFilter){
        var values = [[columnFilter.title]];
        var defaultValues = [];
        jQuery.each(columnFilter.settings.defaults, function(idx, defaultcol){
            defaultValues.push(settings.columns[defaultcol]);
        });
        jQuery.each(columnFilter.settings.selectables, function(idx, selectable){
            values.push([settings.columns[selectable]]);
        });
        var options2 = {
            customTitle : columnFilter.title,
            customPrefix : 'columnfilter_' + columnFilter.title,
            filtersDiv: settings.filtersDiv,
            customValues : values,
            customAllowMultiple : (columnFilter.type === '1' ? true : false),
            customHandler : applyColumnFilters,
            defaultValues : defaultValues,
            allowNone : columnFilter.allowempty,
            paramsForHandler : paramsForHandler,
            hideFilter : columnFilter.hideFilter
        };
        settings.columnFiltersObj.push(addCustomFilter(options2));
    });
    settings.columnFilters.reverse();
    settings.columnFiltersObj.reverse();
}

function applyPreConfigFilters(options){
    var filterTitle = this.customTitle;
    var selectedValues = [];
    var objForTrigger;
    jQuery.each(options.preConfigFiltersObj, function(idx, columnFilterObj){
        if (columnFilterObj.getOption("filterColumnLabel") === filterTitle){
            selectedValues = columnFilterObj.getState().selectedValues;
        }
    });

    var chart_columnFilters_old;
    var chart_columns_old;
    var conf_array = jQuery("#" + options.dashboardDiv).data('other_settings').googlechart_config_array;
    jQuery.each(conf_array, function(idx, conf){
        if (conf[0] === jQuery("#"+options.chartViewDiv).attr("chart_id")){
            chart_columnFilters_old = conf[14];
            chart_columns_old = conf[2];
        }
    });

    jQuery.each(chart_columns_old.prepared, function(idx, prepared){
        var shouldHide = true;
        jQuery.each(chart_columns_old.original, function(idx, original){
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

    jQuery.each(options.columnFiltersObj, function(idx1, columnFilterObj){
        if (columnFilterObj.getOption("filterColumnLabel").indexOf("custom_helper_") === -1){
            filtersNotToRemove.push(columnFilterObj);
            filtersNotToRemoveTitles.push(columnFilterObj.getOption("filterColumnLabel"));
            jQuery.each(chart_columnFilters_old, function (idx3, oldFilter){
                if ((oldFilter.title === columnFilterObj.getOption("filterColumnLabel")) && (jQuery.inArray(oldFilter.title, filtersConfNotToRemoveTitles) === -1)){
                    filtersConfNotToRemove.push(oldFilter);
                    filtersConfNotToRemoveTitles.push(oldFilter.title);
                }
            });
        }
        jQuery.each(options.thisCustomHelperFilters, function(idx2, helperFilter){
            if (columnFilterObj.getOption("filterColumnLabel") === helperFilter.title){
                var newState = {"selectedValues":[]};
                jQuery.each(selectedValues, function(idx3, selectedValue){
                    jQuery.each(helperFilter.settings.selectables, function(idx4, selectable){
                        selectedValueStr = selectedValue.replace(/[^A-Za-z0-9]/g, '_');
                        if (selectable.replace("_"+selectedValueStr, "") === helperFilter.title.replace("custom_helper_", "")){
                            newState.selectedValues.push(options.availableColumns[selectable]);
                        }
                    });
                });
                columnFilterObj.setState(newState);
                columnFilterObj.draw();
                objForTrigger = columnFilterObj;
                if (jQuery.inArray(helperFilter.title, filtersNotToRemoveTitles) === -1){
                    filtersNotToRemove.push(columnFilterObj);
                    filtersNotToRemoveTitles.push(helperFilter.title);
                }
                jQuery.each(chart_columnFilters_old, function (idx3, oldFilter){
                    if ((oldFilter.title === helperFilter.title) && (jQuery.inArray(oldFilter.title, filtersConfNotToRemoveTitles) === -1)){
                        filtersConfNotToRemove.push(oldFilter);
                        filtersConfNotToRemoveTitles.push(oldFilter.title);
                    }
                });
            }
        });
    });
    options.columnFiltersObj.splice(0, options.columnFiltersObj.length);
    jQuery.each(filtersNotToRemove, function(idx, filter){
        options.columnFiltersObj.push(filter);
    });
    chart_columnFilters_old.splice(0, chart_columnFilters_old.length);
    jQuery.each(filtersConfNotToRemove, function(idx, filter){
        chart_columnFilters_old.push(filter);
    });
    google.visualization.events.trigger(objForTrigger, 'statechange');
}

function addPreConfigFilters(options){
    var settings = {
        originalTable : '',
        visibleColumns : '',
        availableColumns : '',
        transformedTable : '',
        filtersDiv : '',
        dashboardDiv : '',
        filters : []
    };
    jQuery.extend(settings, options);
    var preConfigFiltersObj = [];

    var customHelperFilters = [];
    var availableCustomHelperFilters = [];
    var allCustomHelperFiltersTitle = [];
    jQuery.each(settings.filters, function(idx, filter){
        var allThisCustomHelperFilters = [];
        var mainDefaults = [];
        var customTitle = settings.originalTable.properties[filter.filterTitle].label;
        if (customTitle === undefined){
            customTitle = filter.filterTitle;
        }
        var tmp_table = [];
        tmp_table.push([customTitle]);
        var tmp_items = [];
        jQuery.each(settings.originalTable.items, function(idx, value){
            if (jQuery.inArray(value[filter.filterTitle], tmp_items) === -1){
                tmp_items.push(value[filter.filterTitle]);
                tmp_table.push([value[filter.filterTitle]]);
            }
        });
        jQuery.each(settings.availableColumns, function(key, availableColumn){
            jQuery.each(tmp_table, function(f_idx, filterValue){
                var filterStr = filterValue[0].replace(/[^A-Za-z0-9]/g, '_');
                if (f_idx === 0){
                    return;
                }
                var pos = key.indexOf(filterStr);
                if (pos === -1){
                    return;
                }
                var tmp_title = key.replace("_"+filterStr, "");
                var found_customHelperFilter = false;
                var tmp_customHelperFilter = null;
                jQuery.each(customHelperFilters, function(h_idx, customHelperFilter){
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
                            mainDefaults.push(filterValue);
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
        jQuery.each(allThisCustomHelperFilters, function (all_idx, customHelperFilter){
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
            availableColumns : settings.availableColumns
        };

        var options2 = {
            customTitle : customTitle,
            customPrefix : "pre_config_filter_"+customTitle,
            filtersDiv: settings.filtersDiv,
            customValues : tmp_table,
            customAllowMultiple : allowMultiple,
            filterType : filterType,
            customHandler : applyPreConfigFilters,
            paramsForHandler : paramsForHandler,
            defaultValues : mainDefaults,
            allowNone : false
        };
        preConfigFiltersObj.push(addCustomFilter(options2));
    });
    jQuery.each(customHelperFilters, function (chf_idx, customHelperFilter){
        if (customHelperFilter.settings.defaults.length > 0){
            availableCustomHelperFilters.push(customHelperFilter);
            allCustomHelperFiltersTitle.push(customHelperFilter.title);
        }
    });
    return availableCustomHelperFilters;
}