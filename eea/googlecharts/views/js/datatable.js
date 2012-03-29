var allowedTypesForCharts = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];

function transformTable(originalTable, normalColumns, pivotingColumns, valueColumn, availableColumns){
    var additionalColumns = {};

    var pivotTable = {};
    pivotTable.items = [];
    pivotTable.available_columns = {};
    pivotTable.properties = {};

    jQuery.each(normalColumns,function(normal_index, normal_column){
        pivotTable.properties[normal_column] = originalTable.properties[normal_column];
        pivotTable.available_columns[normal_column] = availableColumns[normal_column];
    });

    jQuery(originalTable.items).each(function(row_index, row){
        var newRow = {};
        var isNewRow = true;

        jQuery(normalColumns).each(function(column_index, column){
            newRow[column] = row[column];
        });

        jQuery.each(additionalColumns,function(column_key, column_value){
            newRow[column_key] = column_value;
        });

        if (valueColumn !== ''){
            var pivotColumnName = valueColumn;
            var pivotColumnLabel = availableColumns[valueColumn];
            var pivotValue = row[valueColumn];
            var defaultPivotColumnValue = typeof(pivotValue) === 'string' ? '' : 0;
            jQuery(pivotingColumns).each(function(pivot_index, pivot_column){
                pivotColumnLabel += " " + row[pivot_column];
                pivotColumnName += " " + row[pivot_column];
            });

            var pivotColumn = pivotColumnName.replace(/[^A-Za-z0-9]/g, '_');
            additionalColumns[pivotColumn] = defaultPivotColumnValue;

            pivotTable.available_columns[pivotColumn] = pivotColumnLabel;
            pivotTable.properties[pivotColumn] = originalTable.properties[valueColumn];

            jQuery(pivotTable.items).each(function(pivot_row_index, pivot_row){
                var foundRow = true;
                jQuery(normalColumns).each(function(normal_col_index, normal_col){
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
    return pivotTable;
}

function tableToArray(originalDataTable, columns){
    var columnLabels = [];
    var tableArray = [];

    jQuery(columns).each(function(column_index, column){
        columnLabels.push(originalDataTable.available_columns[column]);
    });

    tableArray.push(columnLabels);

    jQuery(originalDataTable.items).each(function(row_index, row){
        var chartRow = [];
        jQuery(columns).each(function(column_index, column){
            chartRow.push(row[column]);
        });
        tableArray.push(chartRow);
    });

    return tableArray;
}

function prepareForChart(originalDataTable, columns, limit){
    limit = typeof(limit) !== 'undefined' ? limit : -1;

    var itemsToDisplay = originalDataTable.items;
    if (limit > -1){
        itemsToDisplay = itemsToDisplay.splice(0, limit);
    }

    var dataForChart = new google.visualization.DataTable();

    jQuery.each(columns, function(column_index, column){
        var colName = originalDataTable.available_columns[column];
        var colType = originalDataTable.properties[column];
        if(colType === undefined){
            colType = 'string';
        }else{
            colType = colType.valueType !== undefined ? colType.valueType: colType;
//            if (allowedTypesForCharts.indexOf(colType) === -1){
            if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                colType = "string";
            }
        }
        dataForChart.addColumn(colType, colName);
    });
    jQuery(itemsToDisplay).each(function(row_index, row){
        var newRow = [];
        jQuery(columns).each(function(column_index, column){

            var colType = originalDataTable.properties[column];

            if(colType === undefined){
                colType = 'string';
            }else{
                colType = colType.valueType !== undefined ? colType.valueType: colType;
//                if (allowedTypesForCharts.indexOf(colType) === -1){
                if (jQuery.inArray(colType, allowedTypesForCharts) === -1){
                    colType = "string";
                }
            }

            var newColumn = row[column];

            if (colType === "date"){
                newColumn = jQuery.datepicker.parseDate("yy-mm-dd",newColumn);
            }
            if (colType === "datetime"){
                newColumn = jQuery.datepicker.parseDate("yy-mm-dd",newColumn);
            }
            newRow.push(newColumn);
        });
        dataForChart.addRow(newRow);
    });

    return dataForChart;
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

function createMergedTable(originalTable, tableConfigs, availableColumns){
    var mergedTable = {};
    mergedTable.items = [];
    mergedTable.properties = {};
    var mergedColumns = {};

    jQuery.each(originalTable.items, function(row_id, row){
        var newRow = {};
        jQuery.each(row, function(col_key, col){
            newRow[col_key] = col;
        });
        mergedTable.items.push(newRow);
    });

    jQuery.each(originalTable.properties, function(prop_id, prop_value){
        mergedTable.properties[prop_id] = prop_value;
    });

    jQuery.each(availableColumns, function(column_key, column_value){
        mergedColumns[column_key] = column_value;
    });

    jQuery.each(tableConfigs, function(key, config){
        var columnsFromSettings = getColumnsFromSettings(config);
        var transformedTable = transformTable(originalTable,
                                    columnsFromSettings.normalColumns,
                                    columnsFromSettings.pivotColumns,
                                    columnsFromSettings.valueColumn,
                                    availableColumns);

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