var allowedTypesForCharts = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];
var allowedChartsForTooltips = ['PieChart', 'BarChart', 'ColumnChart', 'LineChart', 'ComboChart', 'AreaChart', 'SteppedAreaChart', 'ScatterChart', 'GeoChart'];

function splitColumn(columnName, defaultvalue, defaulttype, unpivotSettings){
    var unpivotBase = "";
    jQuery.each(unpivotSettings.settings, function(idx, value){
        if (value.colType === "base"){
            unpivotBase = value.colName;
        }
    });
    if (columnName.indexOf(unpivotBase) !== 0){
        return {};
    }
    var defaultColumnName = columnName;
    var ranges = [];
    jQuery.each(unpivotSettings.settings, function(idx, value){
        if (ranges.length !== 0){
            ranges[ranges.length-1].length = value.start - ranges[ranges.length-1].start;
        }
        var range = {};
        range.start = value.end;
        ranges.push(range);
    });
    ranges.pop();
    var separators = [];
    jQuery.each(ranges, function(idx, value){
        separators.push(unpivotSettings.columnName.substr(value.start, value.length));
    });
    var components = [];
    jQuery.each(separators, function(idx, separator){
        var component = {};
        splittedColumnName = columnName.split(separator);
        components.push(splittedColumnName[0]);
        splittedColumnName.shift();
        columnName = splittedColumnName.join(separator);
    });
    if (columnName !== ""){
        components.push(columnName);
    }
    var values = {};
    if (components.length === unpivotSettings.settings.length){
        jQuery.each(unpivotSettings.settings, function(idx, settings){
            var value = {};
            if (settings.colType === 'base'){
                value.name = components[idx];
                value.value = defaultvalue;
                value.type = defaulttype;
            }
            else {
                value.name = settings.colName;
                value.value = components[idx];
                value.type = settings.valType;
            }
            values[value.name.replace(/[^A-Za-z0-9]/g, '_')] = value;
        });
    }
    return values;
}

function unpivotTable(settings){
    if (jQuery.isEmptyObject(settings.unpivotSettings)){
        return settings.originalTable;
    }
    var unpivotedTable = {};
    unpivotedTable.items = [];
    unpivotedTable.properties = {};
    var baseProperties;
    jQuery.each(settings.originalTable.items, function(row_nr, row){
        var fixed_values = {};
        var new_rows = [];
        jQuery.each(row, function(col_id, value){
            var colProp = settings.originalTable.properties[col_id];
            if (colProp !== undefined){
                colLabel = colProp.label || col_id;
                var splitted = splitColumn(colLabel, value, settings.originalTable.properties[col_id].columnType, settings.unpivotSettings);
                if (jQuery.isEmptyObject(splitted)){
                    fixed_values[col_id] = value;
                    unpivotedTable.properties[col_id] = settings.originalTable.properties[col_id];
                }
                else {
                    baseProperties = settings.originalTable.properties[col_id];
                    var new_row = {};
                    jQuery.each(splitted, function(key,value){
                        if (value.type === "number"){
                            new_row[key] = parseFloat(value.value);
                        }
                        else {
                            if (value.type === "date"){
                                var tmp_date = new Date(value.value);
                                tmp_year = tmp_date.getFullYear();
                                tmp_month = tmp_date.getMonth();
                                tmp_day = tmp_date.getDate();
                                new_row[key] = tmp_year.toString() + "-" + (tmp_month+1).toString() + "-" + tmp_day.toString();
                            }
                            else {
                                new_row[key] = value.value;
                            }
                        }
                    });
                    new_rows.push(new_row);
                }
            }
        });
        jQuery.each(new_rows, function(idx, new_row){
            jQuery.each(fixed_values, function(key, value){
                new_row[key] = value;
            });
        });
        jQuery.each(new_rows, function(idx, row){
            unpivotedTable.items.push(row);
        });
    });
    jQuery.each(settings.unpivotSettings.settings, function(idx, up_settings){
        var new_prop;
        if (up_settings.colType === 'pivot'){
            new_prop = {
                columnType : up_settings.valType,
                label : up_settings.colName,
                valueType : up_settings.valType
            };
            unpivotedTable.properties[up_settings.colName.replace(/[^A-Za-z0-9]/g, '_')] = new_prop;
        }
        else {
            var col_id = settings.unpivotSettings.columnName.replace(/[^A-Za-z0-9]/g, '_');
            var colName = settings.unpivotSettings.columnName.substr(up_settings.start, up_settings.end-up_settings.start);
            new_prop = {
                columnType : baseProperties.columnType,
                label : colName,
                valueType : baseProperties.valueType
            };
            unpivotedTable.properties[colName.replace(/[^A-Za-z0-9]/g, '_')] = new_prop;

        }
    });
    var order = 0;
    jQuery.each(unpivotedTable.properties, function(idx, value){
        value.order = order;
        order ++;
    });
    return unpivotedTable;
}

function getAvailable_columns_and_rows(unpivotSettings, availableColumnsForUnpivot, rowsForUnpivot){
    if (jQuery.isEmptyObject(unpivotSettings)){
        return {
            available_columns:availableColumnsForUnpivot,
            all_rows:rowsForUnpivot
        };
    }
    var unpivotOptions = {
        originalTable : rowsForUnpivot,
        unpivotSettings : unpivotSettings
    };
    var unpivotedTable = unpivotTable(unpivotOptions);
    var tmp_available_columns = {};
    jQuery.each(unpivotedTable.properties, function(key, value){
        tmp_available_columns[key] = value.label;
    });
    var rows_and_columns = {
        all_rows : unpivotedTable,
        available_columns : tmp_available_columns
    };
    return rows_and_columns;
}

function decodeStr(encodedStr){
    if (!encodedStr){
        encodedStr = '';
    }
    return jQuery("<div/>").html(encodedStr).text();
}

function addEmptyRows(dataview){
    col_ids = dataview.getViewColumns();
    row_ids = dataview.getViewRows();
    var modifiedDataForChart = new google.visualization.DataTable();
    var emptyRow = [];
    jQuery.each(col_ids, function(col_idx, col_id){
        var colName = dataview.getColumnLabel(col_id);
        var colType = dataview.getColumnType(col_id);
        modifiedDataForChart.addColumn(colType, colName);
        emptyRow.push(null);
    });
    modifiedDataForChart.addRow(emptyRow);
    jQuery.each(row_ids, function(row_idx, row_id){
        var newRow = [];
        var shouldAdd = false;
        jQuery.each(col_ids, function(col_idx, col_id){
            var value = dataview.getValue(row_idx, col_idx);
            if (value !== null){
                shouldAdd = true;
            }
            newRow.push(value);
        });
        if (shouldAdd){
            modifiedDataForChart.addRow(newRow);
            modifiedDataForChart.addRow(emptyRow);
        }
    });

    var modifiedTmpDataView = new google.visualization.DataView(modifiedDataForChart);
    return modifiedTmpDataView;
}

function filter_table(items, filters){
    var filtered_items = [];
    jQuery(items).each(function(row_index, row){
        var shouldDisplay = true;
        if (filters){
            jQuery.each(filters, function(column, column_filter){
                var val = "";
                try{
                    val = decodeStr(row[column].toString());
                }
                catch(err){}
                var filtertype = (column_filter.type?column_filter.type:'hidden');
                var foundVal = false;
                jQuery.each(column_filter.values, function(idx, col_val){
                    if (val === decodeStr(col_val)){
                        foundVal = true;
                    }
                });

                if ((filtertype === 'hidden') && (foundVal)){
                    shouldDisplay = false;
                }

                if ((filtertype === 'visible') && (!foundVal)){
                    shouldDisplay = false;
                }
            });
        }
        if (!shouldDisplay){
            return;
        }
        filtered_items.push(row);
    });
    return filtered_items;
}

function transformTable(options){
    var settings = {
        originalTable : '',
        unpivotSettings: null,
        normalColumns : '',
        pivotingColumns : '',
        valueColumn : '',
        availableColumns : '',
        filters: {}
    };
    jQuery.extend(settings, options);

    var unpivotSettings = {
        originalTable : settings.originalTable,
        unpivotSettings : settings.unpivotSettings
    };
    var unpivotedTable = unpivotTable(unpivotSettings);
    var additionalColumns = {};

    var pivotTable = {};
    pivotTable.items = [];
    pivotTable.available_columns = {};
    pivotTable.properties = {};
    pivotTable.pivotLevels = {};

    jQuery.each(settings.normalColumns,function(normal_index, normal_column){
        pivotTable.properties[normal_column] = unpivotedTable.properties[normal_column];
        pivotTable.available_columns[normal_column] = settings.availableColumns[normal_column];
    });
    var tmp_available_columns = {};
    jQuery(unpivotedTable.items).each(function(row_index, row){
        var newRow = {};
        var isNewRow = true;

        jQuery(settings.normalColumns).each(function(column_index, column){
            newRow[column] = row[column];
        });

        jQuery.each(additionalColumns,function(column_key, column_value){
            newRow[column_key] = column_value;
        });

        if (settings.valueColumn !== ''){
            if (pivotTable.pivotLevels[settings.valueColumn] === undefined){
                pivotTable.pivotLevels[settings.valueColumn] = {};
            }
            var node = pivotTable.pivotLevels[settings.valueColumn];
            var pivotColumnName = settings.valueColumn;
            var pivotColumnLabel = "";
            var pivotValue = row[settings.valueColumn];
            var defaultPivotColumnValue; // = undefined;
            jQuery(settings.pivotingColumns).each(function(pivot_index, pivot_column){
                pivotColumnLabel += " " + row[pivot_column];
                pivotColumnName += " " + row[pivot_column];
                if (node[row[pivot_column]] === undefined){
                    node[row[pivot_column]] = {};
                }
                node = node[row[pivot_column]];
            });

            pivotColumnLabel = pivotColumnLabel.substr(1);
            var pivotColumn = pivotColumnName.replace(/[^A-Za-z0-9]/g, '_');
            additionalColumns[pivotColumn] = defaultPivotColumnValue;

            tmp_available_columns[pivotColumn] = pivotColumnLabel;
            var unpivotedValue = unpivotedTable.properties[settings.valueColumn];
            if (unpivotedValue) {
                pivotTable.properties[pivotColumn] = {
                    valueType : unpivotedValue.valueType,
//                order : unpivotedTable.properties[settings.valueColumn].order,
                    order : -1,
                    columnType : unpivotedValue.columnType,
                    label : pivotColumnLabel
                };
            }

            jQuery(pivotTable.items).each(function(pivot_row_index, pivot_row){
                var foundRow = true;
                jQuery(settings.normalColumns).each(function(normal_col_index, normal_col){
                    if (newRow[normal_col] !== pivot_row[normal_col]){
                        foundRow = false;
                    }
                });
                if (foundRow){
                    isNewRow = false;
                    pivot_row[pivotColumn] = pivotValue;
                }
                else {
                    pivot_row[pivotColumn] = typeof(pivot_row[pivotColumn]) !== 'undefined' ? pivot_row[pivotColumn] : defaultPivotColumnValue;
                }
            });
            if (isNewRow){
                newRow[pivotColumn] = pivotValue;
            }
        }
        if (isNewRow){
            pivotTable.items.push(newRow);
        }
    });
    var pivotColumnIds = [];
    var maxOrder = -1;
    jQuery.each(pivotTable.properties, function(key, property){
        if (property) {
            if (property.order === -1){
                pivotColumnIds.push(key);
            }
            else {
                maxOrder = Math.max(maxOrder, property.order);
            }
        }
    });
    jQuery.each(pivotColumnIds.sort(), function(idx, columnId){
        maxOrder++;
        pivotTable.properties[columnId].order = maxOrder;
        pivotTable.available_columns[columnId] = tmp_available_columns[columnId];
    });
    var filteredPivotTable = {};
    filteredPivotTable.available_columns = pivotTable.available_columns;
    filteredPivotTable.properties = pivotTable.properties;
    filteredPivotTable.items = [];

    filteredPivotTable.items = filter_table(pivotTable.items, settings.filters);
    filteredPivotTable.pivotLevels = pivotTable.pivotLevels;
    return filteredPivotTable;
}

function tableToArray(options){
    var settings = {
        originalDataTable: '',
        columns: ''
    };
    jQuery.extend(settings, options);

    var columnLabels = [];
    var tableArray = [];

    jQuery(settings.columns).each(function(column_index, column){
        columnLabels.push(settings.originalDataTable.available_columns[column]);
    });

    tableArray.push(columnLabels);

    jQuery(settings.originalDataTable.items).each(function(row_index, row){
        var chartRow = [];
        jQuery(settings.columns).each(function(column_index, column){
            chartRow.push(row[column]);
        });
        tableArray.push(chartRow);
    });

    return tableArray;
}

function applyFormattersOnDataTable(options){
    var settings = {
        datatable : '',
        preparedColumns : ''
    };
    jQuery.extend(settings, options);

    var idx = 0;
    jQuery.each(settings.preparedColumns, function(tmp_idx, tmpcol){
        if (tmpcol.status !== 1){
            return;
        }
        if (tmpcol.formatters){
            var formatters = tmpcol.formatters;
            var formatter;
            if (formatters.hasOwnProperty("arrowformatter")){
                formatter = formatters.arrowformatter;
                if (formatter.enabled){
                    var arrowformat = {
                        base : formatter.base
                    };
                    var arrowformatter = new google.visualization.ArrowFormat(arrowformat);
                    arrowformatter.format(settings.datatable, idx);
                }
            }

            if (formatters.hasOwnProperty("barformatter")){
                formatter = formatters.barformatter;
                if (formatter.enabled){
                    var barformat = {
                        base : formatter.base,
                        colorNegative : formatter.colornegative,
                        colorPositive : formatter.colorpositive,
                        drawZeroLine : formatter.zeroline,
                        min : formatter.min,
                        max : formatter.max,
                        showValue : formatter.showvalue,
                        width : formatter.width
                    };
                    var barformatter = new google.visualization.BarFormat(barformat);
                    barformatter.format(settings.datatable, idx);
                }
            }

            if (formatters.hasOwnProperty("colorformatter")){
                formatter = formatters.colorformatter;
                if (formatter.enabled){
                    var colorformatter = new google.visualization.ColorFormat();
                    jQuery.each(formatter.ranges, function(idx, range){
                        if (range.bgcolor === range.bgcolor2){
                            colorformatter.addRange(range.from, range.to, range.color, range.bgcolor);
                        }
                        else {
                            colorformatter.addGradientRange(range.from, range.to, range.color, range.bgcolor, range.bgcolor2);
                        }
                    });
                    colorformatter.format(settings.datatable, idx);
                }
            }
            if (formatters.hasOwnProperty("dateformatter")){
                formatter = formatters.dateformatter;
                if (formatter.enabled){
                    var dateformat = {};
                    if (formatter.usepattern){
                        dateformat.pattern = formatter.pattern;
                    }
                    else {
                        dateformat.formatType = formatter.formattype;
                    }
                    var dateformatter = new google.visualization.DateFormat(dateformat);
                    dateformatter.format(settings.datatable, idx);
                }
            }

            if (formatters.hasOwnProperty("numberformatter")){
                formatter = formatters.numberformatter;
                if (formatter.enabled){
                    var numberformat = {};
                    numberformat.negativeColor = formatter.negativecolor;
                    if (formatter.usepattern){
                        numberformat.pattern = formatter.pattern;
                    }
                    else {
                        numberformat.decimalSymbol = formatter.decimalsymbol;
                        numberformat.fractionDigits = formatter.fractiondigits;
                        numberformat.groupingSymbol = formatter.groupingsymbol;
                        numberformat.negativeParens = formatter.negativeparens;
                        numberformat.prefix = formatter.prefix;
                        numberformat.suffix = formatter.suffix;
                    }
                    var numberformatter = new google.visualization.NumberFormat(numberformat);
                    numberformatter.format(settings.datatable, idx);
                }
            }

            if (formatters.hasOwnProperty("patternformatter")){
                formatter = formatters.patternformatter;
                if (formatter.enabled){
                    var patternformatter = new google.visualization.PatternFormat(decodeStr(formatter.pattern));
                    patternformatter.format(settings.datatable, [idx]);
                }
            }
        }
        idx++;
    });
}

function getErrorbarsFromSeries(series){
    var errorbars = {};
    if (series !== undefined){
        jQuery.each(series, function(key, settings){
            if (!isNaN(key)){
                return;
            }
            if (settings.errorBars !== undefined){
                if (settings.errorBars.errorType !== 'none'){
                    errorbars[key] = {};
                    errorbars[key].type = settings.errorBars.errorType;
                    errorbars[key].value = settings.errorBars.magnitude;
                    if (errorbars[key].value === undefined){
                        errorbars[key].value = 10;
                    }
                }
            }
        });
    }
    return errorbars;
}
function prepareForChart(options){
    var settings = {
        originalDataTable : '',
        columns : '',
        limit : 0,
        sortBy : '',
        sortAsc : true,
        preparedColumns : '',
        enableEmptyRows : false,
        chartType : 'barchart',
        focusTarget : 'datum',
        errorbars : undefined
    };
    jQuery.extend(settings, options);
    if (jQuery.inArray(settings.chartType, allowedChartsForTooltips) === -1){
        settings.hideTooltips = true;
    }
    if (settings.focusTarget === 'category'){
        settings.hideTooltips = true;
    }
    var tmpItemsToDisplay = settings.originalDataTable.items;
    var itemsToDisplay = [];
    if (settings.limit > 0){
        var step = Math.max(Math.round(tmpItemsToDisplay.length/settings.limit), 1);
        var count = 0;
        jQuery.each(tmpItemsToDisplay, function(idx, item){
            if (count == step){
                count = 0;
            }
            if (count === 0){
                itemsToDisplay.push(item);
            }
            count++;
        });
    }
    else {
        itemsToDisplay = tmpItemsToDisplay;
    }
    var dataForChart = new google.visualization.DataTable();
    var columnsForChart = [];
    var isFirstColumn = true;
    jQuery.each(settings.columns, function(column_index, column){
        var hasTooltip = false;
        var colName = settings.originalDataTable.available_columns[column];
        var propColName = settings.originalDataTable.properties[column];
        var couldAddErrorbars = false;
        var shouldAddErrorbars = false;
        var isData = false;
        jQuery.each(settings.preparedColumns, function(pc_idx, pc){
            if ((pc.name === column) && ((pc.role === 'data') || (pc.role === undefined) || (pc.role === ''))){
                isData = true;
            }
        });
        if (( propColName && propColName.columnType === 'number') && (isData)){
            couldAddErrorbars = true;
            if ((settings.errorbars !== undefined) && (settings.errorbars[column] !== undefined)){
                shouldAddErrorbars = true;
            }
        }
        var checkNextCol = false;
        var nextColName;
        if (column_index < settings.columns.length - 1){
            checkNextCol = true;
            nextColName = settings.originalDataTable.available_columns[settings.columns[column_index + 1]];
        }
        var colType = propColName;
        if(colType === undefined){
            colType = 'string';
        }else{
            colType = colType.valueType !== undefined ? colType.valueType: colType;
            if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                colType = "string";
            }
        }
        var yearType = false;
        if (settings.originalDataTable.properties[column] !== undefined){
            yearType = ((settings.originalDataTable.properties[column].columnType === 'year') || (settings.originalDataTable.properties[column].valueType === 'year'));
        }
        var role = "data";
        var customtooltip;
        var isTooltip = false;
        jQuery.each(settings.preparedColumns, function(pc_idx, pc_column){
            if (pc_column.fullname === colName){
                if (yearType){
                    pc_column.yearType = true;
                }
                if (pc_column.hasOwnProperty("role")){
                    role = pc_column.role;
                    if (role === 'tooltip'){
                        isTooltip = true;
                    }
                }
                customtooltip = pc_column.customTooltip;
            }
            if (checkNextCol && (pc_column.fullname === nextColName)){
                if (pc_column.role === 'tooltip'){
                    hasTooltip = true;
                }
            }
        });
        var column_options = {type:colType, label:colName, id:column};
        if ((column_index > 0) && (role !== "data")){
            column_options.role = role;
        }
        var shouldAddColumn = true;
        if ((settings.hideTooltips) && (isTooltip)){
            shouldAddColumn = false;
        }
        if (shouldAddColumn){
            dataForChart.addColumn(column_options);
            columnsForChart.push({column:column, type:'normal'});
        }
        if ((!hasTooltip) && (customtooltip)){
            if (customtooltip.enabled){
                var customtooltip_column_options = {type:"string",
                                                    label:"customtooltip_for_" + colName,
                                                    id:"customtooltip_for_" + column,
                                                    role:"tooltip",
                                                    p: {'html': true}};
                if (!settings.hideTooltips){
                    dataForChart.addColumn(customtooltip_column_options);
                    columnsForChart.push({column:customtooltip_column_options.id, type:'customtooltip', template:customtooltip.tooltip});
                }
                hasTooltip = true;
            }
        }
        if ((!hasTooltip) && (!isTooltip) && (!isFirstColumn)){
            if ((role === 'data') || (role === '')){
                var defaulttooltip_column_options = {type:"string",
                                                    label:"defaulttooltip_for_" + colName,
                                                    id:"defaulttooltip_for_" + column,
                                                    role:"tooltip",
                                                    p: {'html': true}};
                if (!settings.hideTooltips){
                    dataForChart.addColumn(defaulttooltip_column_options);
                    columnsForChart.push({column:defaulttooltip_column_options.id,
                                        type:'customtooltip',
                                        template:settings.originalDataTable.available_columns[column]+": <b>{"+column+"}</b><br/>"+settings.originalDataTable.available_columns[settings.columns[0]]+": <b>{"+settings.columns[0]+"}</b>"
                                        });
                }
            }
        }
        if (shouldAddErrorbars){
                var errorbar_min = {type:"number",
                                    label:"eea_errorbar_min_for_" + colName,
                                    id:"eea_errorbar_min_for_" + column,
                                    role:"interval"};
                var errorbar_max = {type:"number",
                                    label:"eea_errorbar_max_for_" + colName,
                                    id:"eea_errorbar_max_for_" + column,
                                    role:"interval"};
                dataForChart.addColumn(errorbar_min);
                dataForChart.addColumn(errorbar_max);
                columnsForChart.push({column:errorbar_min.id,type:'customerrorbar_min',parent:column});
                columnsForChart.push({column:errorbar_max.id,type:'customerrorbar_max',parent:column});
        }
        isFirstColumn = false;
    });
    jQuery(itemsToDisplay).each(function(row_index, row){
        var newRow = [];
        jQuery(columnsForChart).each(function(column_index, column_settings){
            var error_base_value, error_type, error_value;
            if (column_settings.type === 'customerrorbar_min'){
                error_base_value = row[column_settings.parent];
                error_type = settings.errorbars[column_settings.parent].type;
                error_value = settings.errorbars[column_settings.parent].value;
                newRow.push(error_type === 'constant' ? error_base_value - error_value: error_base_value / 100 * (100 - error_value));
                return;
            }
            if (column_settings.type === 'customerrorbar_max'){
                error_base_value = row[column_settings.parent];
                error_type = settings.errorbars[column_settings.parent].type;
                error_value = settings.errorbars[column_settings.parent].value;
                newRow.push(error_type === 'constant' ? error_base_value + error_value: error_base_value / 100 * (100 + error_value));
                return;
            }
            if (column_settings.type === 'customtooltip'){
                var tooltip_column = column_settings.template;
                jQuery.each(row, function(key, value){
                    tooltip_column = tooltip_column.split("{"+key+"}").join(value);
                });
                tooltip_column = jQuery('<textarea/>').html(tooltip_column).text();
                newRow.push(tooltip_column);
                return;
            }
            var column = column_settings.column;
            var newColumn = row[column];
            // 94182 avoid js error when column data is missing and we attempt to
            // create a new chart

            if ((!newColumn) && (newColumn !== 0)) {
                newRow.push(newColumn);
                if (window.console) {
                    console.log('Value for', column, 'is missing');
                }
                return;
            }

            var colType = settings.originalDataTable.properties[column];

            if(colType === undefined){
                colType = 'string';
            }else{
                colType = colType.valueType !== undefined ? colType.valueType: colType;
                var listType = ((colType.columnType === 'list') || (colType.valueType === 'list'));
                if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                    if(listType){
                        newColumn = newColumn.join(", ");
                    }
                    colType = "string";
                }
            }

            if (colType === "date"){
                newColumn = jQuery.datepicker.parseDate("yy-mm-dd",newColumn);
            }
            if (colType === "datetime"){
                newColumn = jQuery.datepicker.parseDate("yy-mm-dd",newColumn);
            }
            if (colType === "string"){
                newRow.push(decodeStr(newColumn));
            }
            else{
                if ((typeof newColumn === 'string') && (colType === 'number')){
                    newRow.push(undefined);
                }
                else {
                    newRow.push(newColumn);
                }
            }
        });
        dataForChart.addRow(newRow);
    });

    if (settings.preparedColumns !== ''){
        var formatterOptions = {
            datatable : dataForChart,
            preparedColumns : settings.preparedColumns
        };
        // 69908 apply formatters on dataTable only if chartTypes is Table
        // this avoids strange html tooltips on non Table charts
        if (settings.chartType === "Table") {
            applyFormattersOnDataTable(formatterOptions);
        }
        // 72256 apply formatter for year column type
        jQuery.each(settings.preparedColumns, function(tmp_idx, tmpcol){
            if (tmpcol.yearType){
                var yearformat = {};
                yearformat.decimalSymbol = "";
                yearformat.fractionDigits = "0";
                yearformat.groupingSymbol = "";
                yearformat.negativeParens = "";
                if (tmpcol.formatters && tmpcol.formatters.hasOwnProperty("numberformatter")){
                    yearformat.prefix = tmpcol.formatters.numberformatter.prefix;
                    yearformat.suffix = tmpcol.formatters.numberformatter.suffix;
                }
                var numberformatter = new google.visualization.NumberFormat(yearformat);
                numberformatter.format(formatterOptions.datatable, tmp_idx);
            }
        });
    }
    var tmpDataView = new google.visualization.DataView(dataForChart);

    var sgrid = window.grid;
    if (settings.sortBy !== ""){
        var pos = jQuery.inArray(settings.sortBy, settings.columns);
        if (pos > -1){
            var tmp_sort = tmpDataView.getSortedRows(pos);
            if (!settings.sortAsc){
                tmp_sort.reverse();
            }
            tmpDataView.setRows(tmp_sort);
        }
        else {
            var sorted_items = [];
            var i, j;
            if (sgrid) {
                var items = sgrid.getData().getItems();
                for (i = 0, l = items.length; i < l; i++) {
                    sorted_items.push(items[i].id);
                }
                tmpDataView.setRows(sorted_items);
            }
            else {
                var sortBy = settings.sortBy;
                var sortOrder = settings.sortAsc;
                var vals = [];
                var objs = {};
                $(itemsToDisplay).each(function(row_index, row){
                    var value = row[sortBy];
                    if (objs[value]) {
                        objs[value].push(row_index);
                    }
                    else {
                        objs[value] = [row_index];
                    }
                    vals.push(row[sortBy]);
                });
                var compare = function compare(a, b) {
                  if (a < b) {
                    return -1;
                  }
                  if (a > b) {
                    return 1;
                  }
                  // a must be equal to b
                  return 0;
                };

                vals.sort(compare);
                if (!sortOrder) {
                    vals.reverse();
                }
                // vals.sort(function(a, b){
                //   return sortOrder ? a - b : b - a;
                // });

                var value;
                var obj_val;
                var added_values = [];
                var first_value;
                for (i = 0, l = vals.length; i < l; i++) {
                    value = vals[i];
                    obj_val = objs[value];
                    if (obj_val.length === 1) {
                        sorted_items.push(obj_val[0]);
                    }
                    else {
                        first_value = value;
                        if (added_values.indexOf(first_value) === -1) {
                            if (!sortOrder) {
                                for (j = 0, jl = obj_val.length - 1; jl >= j; jl--) {
                                    sorted_items.push(obj_val[jl]);
                                }
                            }
                            else {
                                for (j = 0, jl = obj_val.length - 1; j <= jl; j++) {
                                    sorted_items.push(obj_val[j]);
                                }
                            }
                            added_values.push(first_value);
                        }
                    }
                }
                tmpDataView.setRows(sorted_items);
            }
        }
    }

    if (settings.enableEmptyRows){
        tmpDataView = addEmptyRows(tmpDataView);
    }
    return tmpDataView;
}


function getColumnsFromSettings(columnSettings){
    var settings = {};
    settings.normalColumns = [];
    settings.pivotColumns = [];
    settings.valueColumn = '';
    settings.columns = [];

    jQuery.each(columnSettings.original, function(idx, value){
        var columnName = value.name;
        var columnType = value.status;
        switch(columnType){
            case 0:
                break;
            case 1:
                settings.normalColumns.push(value.name);
                break;
            case 2:
                settings.pivotColumns.push(value.name);
                break;
            case 3:
                settings.valueColumn = value.name;
                break;
        }
    });

    jQuery.each(columnSettings.prepared, function(idx, value){
        var columnName = value.name;
        var columnType = value.status;
        if (columnType === 1){
            settings.columns.push(value.name);
        }
    });

    return settings;
}

function guessSeries(chart){
    var options = chart[7];
    if (options.series === undefined){
        options.series = {};
    }
    var dataSettings = chart[2];
    var shouldAdd = false;
    var col_nr = 0;

    jQuery.each(dataSettings.prepared, function(idx, col){
        if (col.role === undefined){
            col.role = '';
        }
        if ((col.status === 1) && (col.role === '')){
            col.role = 'data';
        }
    });
    //check if we can determine the roles and settings for pivoted columns
    //first check if pivoted columns are in a row (no other columns between or after them)
    //also check if hidden pivoted columns has any settings, if they do, guessing is not possible
    var normalColumns = [];
    jQuery.each(dataSettings.original, function(idx, col){
        normalColumns.push(col.name);
    });
    var seriesIds = [];
    jQuery.each(options.series, function(key, settings){
        seriesIds.push(key);
    });
    var arePivotsOk = true;
    var isPivotFound = false;
    var pivotedWithSettings = [];
    var nrPivotedWithSettings = 0;
    var pivotedWithoutSettings = [];
    var nrPivotedWithoutSettings = 0;
    jQuery.each(dataSettings.prepared, function (idx, col){
        if (jQuery.inArray(col.name, normalColumns) === -1){
            isPivotFound = true;
            if ((col.status === 1) || (col.role === 'data')){
                nrPivotedWithSettings++;
                pivotedWithSettings.push({name: col.name, role: col.role, serieSettings: options.series[col.name]});
            }
            else{
                nrPivotedWithoutSettings++;
                pivotedWithoutSettings.push(col.name);
            }
            if ((col.status === 0) && (jQuery.inArray(col.name, seriesIds) !== -1)){
                arePivotsOk = false;
            }
        }
        else {
            if (isPivotFound){
                arePivotsOk = false;
            }
        }
    });
    //check if settings of pivoted columns can be applied equally on columns without settings
    if (nrPivotedWithoutSettings % nrPivotedWithSettings !== 0){
        arePivotsOk = false;
    }
    if (arePivotsOk){
        jQuery.each(pivotedWithoutSettings, function(idx, col){
            var settings = pivotedWithSettings[idx%nrPivotedWithSettings];
            if (settings.serieSettings !== undefined){
                options.series[col] = jQuery.extend(true, {}, settings.serieSettings);
                if (options.series[col] !== undefined){
                    delete options.series[col].color;
                }
            }
            jQuery.each(dataSettings.prepared, function(prep_idx, prep_col){
                if (prep_col.name === col){
                    prep_col.role = settings.role;
                }
            });
        });
    }
    //set the colors for series
    //leave the colors untuched if simlpe category filters is used
    var hasPrePivotSimpleCategoryFilter = false;
    var filters = chart[3];
    jQuery.each(filters, function(key, settings){
        if ((key.indexOf("pre_config") === 0) && (settings.type === "2")){
            hasPrePivotSimpleCategoryFilter = true;
        }
    });
    if (hasPrePivotSimpleCategoryFilter){
        return;
    }
    if (options.colors){
        var col_id = -1;
        jQuery.each(dataSettings.prepared, function(idx, col){
           if (col_id > -1) {
               if (options.series[col_id] !== undefined){
                   options.series[col.name] = options.series[col_id];
               }
           }
            if (col.role === 'data') {
                col_id++;
            }
        });

        jQuery.each(dataSettings.prepared, function(idx, col){
            if (shouldAdd){
                if (col.role === 'data'){
                    if (options.series[col.name] === undefined){
                        options.series[col.name] = {};
                    }
                    if (options.series[col.name].color === undefined){
                        options.series[col.name].color = options.colors[col_nr];
                        col_nr++;
                    }
                }
            }
            else{
                if (col.status === 1){
                    shouldAdd = true;
                }
            }
        });
    }
}
