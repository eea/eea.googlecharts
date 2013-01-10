var allowedTypesForCharts = ['string', 'number', 'boolean', 'date', 'datetime', 'timeofday'];

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
        var shouldDisplay = true;
        jQuery.each(settings.filters, function(column, column_filter){
            if (jQuery.inArray(row[column], column_filter) !== -1){
                shouldDisplay = false;
            }
        });
        if (!shouldDisplay){
            return;
        }
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
            pivotTable.properties[pivotColumn] = settings.originalTable.properties[settings.valueColumn];

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
    return pivotTable;
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

function prepareForChart(options){
    var settings = {
        originalDataTable : '',
        columns : '',
        limit : 0,
        sortBy : '',
        sortAsc : true
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
//        itemsToDisplay = itemsToDisplay.slice(0, limit);
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
//            if (allowedTypesForCharts.indexOf(colType) === -1){
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
            newRow.push(newColumn);
        });
        dataForChart.addRow(newRow);
    });

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