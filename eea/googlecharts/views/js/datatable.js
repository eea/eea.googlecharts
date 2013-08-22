var allowedTypesForCharts = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];

function decodeStr(encodedStr){
    if (!encodedStr){
        encodedStr = '';
    }
    return jQuery("<div/>").html(encodedStr).text();
}

function transformTable(options){
    var settings = {
        originalTable : '',
        normalColumns : '',
        pivotingColumns : '',
        valueColumn : '',
        availableColumns : '',
        filters: {}
    };
    jQuery.extend(settings, options);
    var additionalColumns = {};

    var pivotTable = {};
    pivotTable.items = [];
    pivotTable.available_columns = {};
    pivotTable.properties = {};

    jQuery.each(settings.normalColumns,function(normal_index, normal_column){
        pivotTable.properties[normal_column] = settings.originalTable.properties[normal_column];
        pivotTable.available_columns[normal_column] = settings.availableColumns[normal_column];
    });

    jQuery(settings.originalTable.items).each(function(row_index, row){
        var newRow = {};
        var isNewRow = true;

        jQuery(settings.normalColumns).each(function(column_index, column){
            newRow[column] = row[column];
        });

        jQuery.each(additionalColumns,function(column_key, column_value){
            newRow[column_key] = column_value;
        });

        if (settings.valueColumn !== ''){
            var pivotColumnName = settings.valueColumn;
            var pivotColumnLabel = settings.availableColumns[settings.valueColumn];
            var pivotValue = row[settings.valueColumn];
            var defaultPivotColumnValue; // = undefined;
            jQuery(settings.pivotingColumns).each(function(pivot_index, pivot_column){
                pivotColumnLabel += " " + row[pivot_column];
                pivotColumnName += " " + row[pivot_column];
            });

            var pivotColumn = pivotColumnName.replace(/[^A-Za-z0-9]/g, '_');
            additionalColumns[pivotColumn] = defaultPivotColumnValue;

            pivotTable.available_columns[pivotColumn] = pivotColumnLabel;
            pivotTable.properties[pivotColumn] = {
                valueType : settings.originalTable.properties[settings.valueColumn].valueType,
                order : settings.originalTable.properties[settings.valueColumn].order,
                columnType : settings.originalTable.properties[settings.valueColumn].columnType,
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
                    var patternformatter = new google.visualization.PatternFormat(formatter.pattern);
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
        preparedColumns : ''
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
        if(colType === undefined){
            colType = 'string';
        }else{
            colType = colType.valueType !== undefined ? colType.valueType: colType;
            if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                colType = "string";
            }
        }
        dataForChart.addColumn(colType, colName);
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

function createMergedTable(options){
    var settings = {
        originalTable : '',
        tableConfigs : '',
        availableColumns : ''
    };
    jQuery.extend(settings, options);

    var mergedTable = {};
    mergedTable.items = [];
    mergedTable.properties = {};
    var mergedColumns = {};

    jQuery.each(settings.originalTable.items, function(row_id, row){
        var newRow = {};
        jQuery.each(row, function(col_key, col){
            newRow[col_key] = col;
        });
        mergedTable.items.push(newRow);
    });

    jQuery.each(settings.originalTable.properties, function(prop_id, prop_value){
        mergedTable.properties[prop_id] = prop_value;
    });

    jQuery.each(settings.availableColumns, function(column_key, column_value){
        mergedColumns[column_key] = column_value;
    });

    jQuery.each(settings.tableConfigs, function(key, config){
        var columnsFromSettings = getColumnsFromSettings(config);

        var options = {
            originalTable : settings.originalTable,
            normalColumns : columnsFromSettings.normalColumns,
            pivotingColumns : columnsFromSettings.pivotColumns,
            valueColumn : columnsFromSettings.valueColumn,
            availableColumns : settings.availableColumns
        };

        var transformedTable = transformTable(options);

        jQuery.each(transformedTable.properties, function(prop_id, prop_value){
            mergedTable.properties[prop_id] = prop_value;
        });

        jQuery.each(transformedTable.available_columns, function(col_id, col_value){
            mergedColumns[col_id] = col_value;
        });

        jQuery.each(transformedTable.items, function(tr_row_id, tr_row){
            jQuery.each(mergedTable.items, function(merged_row_id, merged_row){
                var addToThis = true;
                jQuery.each(columnsFromSettings.normalColumns, function(col_id, col){
                    if (merged_row[col] !== tr_row[col]){
                        addToThis = false;
                    }
                });
                if (addToThis){
                    jQuery.each(tr_row, function(tr_col_id, tr_col_value){
                        merged_row[tr_col_id] = tr_col_value;
                    });
                }
            });
        });
    });

    mergedTable.available_columns = mergedColumns;
    return mergedTable;
}
