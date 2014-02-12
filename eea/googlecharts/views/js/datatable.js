var allowedTypesForCharts = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];

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
                colLabel = colProp.label;
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
            pivotTable.properties[pivotColumn] = {
                valueType : unpivotedTable.properties[settings.valueColumn].valueType,
//                order : unpivotedTable.properties[settings.valueColumn].order,
                order : -1,
                columnType : unpivotedTable.properties[settings.valueColumn].columnType,
                label : pivotColumnLabel
            };

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
        if (property.order === -1){
            pivotColumnIds.push(key);
        }
        else {
            maxOrder = Math.max(maxOrder, property.order);
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

    jQuery(pivotTable.items).each(function(row_index, row){
        var shouldDisplay = true;
        if (settings.filters){
            jQuery.each(settings.filters, function(column, column_filter){
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
        filteredPivotTable.items.push(row);
    });
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

function prepareForChart(options){
    var settings = {
        originalDataTable : '',
        columns : '',
        limit : 0,
        sortBy : '',
        sortAsc : true,
        preparedColumns : '',
        enableEmptyRows : false
    };
    jQuery.extend(settings, options);

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

    jQuery.each(settings.columns, function(column_index, column){
        var colName = settings.originalDataTable.available_columns[column];
        var colType = settings.originalDataTable.properties[column];
        var role = "data";
        if(colType === undefined){
            colType = 'string';
        }else{
            colType = colType.valueType !== undefined ? colType.valueType: colType;
            if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                colType = "string";
            }
        }
        jQuery.each(settings.preparedColumns, function(pc_idx, pc_column){
            if (pc_column.fullname === colName){
                if (pc_column.hasOwnProperty("role")){
                    role = pc_column.role;
                }
            }
        });
        var column_options = {type:colType, label:colName, id:column};
        if ((column_index > 0) && (role !== "data")){
            column_options.role = role;
        }
        dataForChart.addColumn(column_options);
    });
    jQuery(itemsToDisplay).each(function(row_index, row){
        var newRow = [];
        jQuery(settings.columns).each(function(column_index, column){
            var newColumn = row[column];

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
                newRow.push(newColumn);
            }
        });
        dataForChart.addRow(newRow);
    });

    if (settings.preparedColumns !== ''){
        var formatterOptions = {
            datatable : dataForChart,
            preparedColumns : settings.preparedColumns
        };
        applyFormattersOnDataTable(formatterOptions);
    }
    var tmpDataView = new google.visualization.DataView(dataForChart);

    if (settings.sortBy !== ""){
        pos = jQuery.inArray(settings.sortBy, settings.columns);
        if (pos > -1){
            var tmp_sort = tmpDataView.getSortedRows(pos);
            if (!settings.sortAsc){
                tmp_sort.reverse();
            }
            tmpDataView.setRows(tmp_sort);
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
