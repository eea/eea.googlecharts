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
            var pivotColumnName = availableColumns[valueColumn];
            var pivotValue = row[valueColumn];
            var defaultPivotColumnValue = typeof(pivotValue) === 'string' ? '' : 0;

            jQuery(pivotingColumns).each(function(pivot_index, pivot_column){
                pivotColumnName += " " + row[pivot_column];
            });

            additionalColumns[pivotColumn] = pivotColumnName;

            var pivotColumn = pivotColumnName.replace(/[^A-Za-z0-9]/g, '_')

            pivotTable.available_columns[pivotColumn] = pivotColumnName;
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
                    pivot_row[pivotColumn] = typeof(pivot_row[pivotColumn]) !== 'undefined' ? pivot_row[pivotColumn] : defaultPivotColumnValue
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

function prepareForChart(originalDataTable, columns){
    var dataForChart = new google.visualization.DataTable();

    jQuery(columns).each(function(column_index, column){
        colName = originalDataTable.available_columns[column];
        colType = originalDataTable.properties[column];

        if (colType === "text"){
            colType = "string";
        }
        dataForChart.addColumn(colType, colName);
    });
    jQuery(originalDataTable.items).each(function(row_index, row){
        var newRow = [];
        jQuery(columns).each(function(column_index, column){
            newRow.push(row[column]);
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