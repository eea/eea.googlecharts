function prepareTable(originalDataTable, columns, availableColumns){
    columnLabels = [];
    jQuery(columns).each(function(index, chartToken){
        columnLabels.push(availableColumns[chartToken]);
    });

    dataTable = [];
    dataTable.push(columnLabels);

    jQuery(originalDataTable.items).each(function(row_index, row){
        chartRow = [];
        jQuery(columns).each(function(column_index, chartToken){
            chartRow.push(row[chartToken]);
        });
        dataTable.push(chartRow);
    });

    return dataTable;
}

function pivotTable(originalTable, normalColumns, pivotingColumns, valueColumn, availableColumns, originalProperties){
    var pivotedTable = [];
    var pivotTableColumns = [];
    var fixValues;
    var pivotValue;
    var pivotColumnName;
    var isNewColumn;
    var isNewRow;
    var addToThisRow;
    var defaultNewRowValues = [];
    var defaultNewColumnValue;
    var foundIndex = -1;
    var foundColumnIndex;
    jQuery(originalTable).each(function(row_index, row){
        if (row_index === 0){
            jQuery(row).each(function(column_index, column){
                found = false;
                jQuery(normalColumns).each(function(idx, value){
                    if (value === column_index){
                        found = true;
                    }
                });
                if (found){
                    pivotTableColumns.push(column);
                }
            });
        }
        else {
            fixValues = [];
            pivotColumnName = originalTable[0][valueColumn];
            pivotValue = row[valueColumn];
            defaultNewColumnValue = typeof(pivotValue) === 'string' ? '' : 0;
            isNewColumn = false;
            isNewRow = true;
            jQuery(normalColumns).each(function(column_index, column){
                fixValues.push(row[column]);
            });
            jQuery(pivotingColumns).each(function(column_index, column){
                pivotColumnName += " ";
                pivotColumnName += row[column];
            });

            found = false;
            jQuery(pivotTableColumns).each(function(idx, value){
                if (value === pivotColumnName){
                    found = true;
                }
            });
//            if (!pivotTableColumns.find(pivotColumnName)){
            if (!found){
                isNewColumn = true;
                pivotTableColumns.push(pivotColumnName);
                defaultNewRowValues.push(defaultNewColumnValue);
                foundColumnIndex = pivotTableColumns.length - 1;
            }
            else {
                foundColumnIndex = -1;
                jQuery(pivotTableColumns).each(function(idx, value){
                    if (pivotColumnName === value){
                        foundColumnIndex = idx;
                    }
                });
//                foundColumnIndex = pivotTableColumns.find(pivotColumnName);
            }
            isNewRow = true;
            foundIndex = -1;
            jQuery(pivotedTable).each(function(pivot_row_index, pivot_row){
                if (isNewColumn){
                    pivot_row.push(defaultNewColumnValue);
                }
                found = true;
                jQuery(fixValues).each(function(fix_column_index, fix_column){
                    if (pivot_row[fix_column_index] !== fix_column){
                        found = false;
                    }
                });
                if (found){
                    foundIndex = pivot_row_index;
                }
            });
            if (foundIndex === -1){
                pivotedTable.push(fixValues.concat(defaultNewRowValues));
                foundIndex = pivotedTable.length - 1;
            }
            pivotedTable[foundIndex][foundColumnIndex] = pivotValue;
        }
    });
    pivotedTable.splice(0, 0, pivotTableColumns);

    valueColumnString = '';
    jQuery.each(availableColumns,function(key,value){
       if (originalTable[0][valueColumn] === value) {
            valueColumnString = key;
       }
    });

    valueColumnType = (originalProperties[valueColumnString]);

    pivotTableObj = {};
    pivotTableObj.items = [];
    pivotTableObj.properties = {};
    pivotTableObj.available_columns = {};
    pivotTableProperties = [];
    pivotTableKeys = [];
    var found;
    jQuery(pivotedTable).each(function(row_index, row){
        if (row_index === 0){
            jQuery(row).each(function(col_index, col){
                colValue = col;
                colKey = col;
                found = false;
                jQuery.each(availableColumns,function(key,value){
                    if (col === value) {
                        colKey = key;
                        found = true;
                    }
                });
                if (!found){
                    colKey = colKey.replace(/[^A-Za-z0-9]/g, '_')
                    pivotTableObj.available_columns[colKey] = colValue;
                }
                pivotTableKeys.push(colKey);

                pivotTableObj.properties[colKey] = (originalProperties[colKey]?originalProperties[colKey]:valueColumnType);
            });
        }
        else{
            var item = {};
            jQuery(row).each(function(col_index, col){
                item[pivotTableKeys[col_index]] = col;
            });
            pivotTableObj.items.push(item);
        }
    });
    return pivotTableObj;
}

function prepareTableForChart(rows, columnSettings, originalAvailableColumns){
    preparedColumns = columnSettings.prepared;
    originalColumns = columnSettings.original;

    allColumns = [];
    availableColumns = {};
    originalChartColumns = [];

    normalColumns = [];
    pivotColumns = [];
    valueColumn = -1;

    dataTable = [];

    preparedColumnLabels = [];

    jQuery.each(originalAvailableColumns,function(key, value){
        availableColumns[key] = value;
        originalChartColumns.push(key);
    });

    jQuery(preparedColumns).each(function(index, value){
        allColumns.push(value.name);
/*        if (!originalAvailableColumns[value.name]){
            availableColumns[value.name] = value.name;
        }*/
        if (value.status === 1){
            preparedColumnLabels.push(value.name);
        }
    });


    jQuery.each(originalColumns, function(idx, value){
        columnName = value.name;
        columnType = value.status;
        switch(columnType){
            case 0:
                break;
            case 1:
                normalColumns.push(idx);
                break;
            case 2:
                pivotColumns.push(idx);
                break;
            case 3:
                valueColumn = idx;
                break;
        }
    });

    rowsToUse = rows;
    if (valueColumn != -1){
        dataTable = prepareTable(rows, originalChartColumns, availableColumns);
        rowsToUse = pivotTable(dataTable, normalColumns, pivotColumns, valueColumn, availableColumns, rows.properties);

        jQuery.each(rowsToUse.available_columns, function(key, value){
            availableColumns[key] = value;
        });
    }
    dataTable = prepareTable(rowsToUse, preparedColumnLabels, availableColumns);

    var tableWithColumns = {};
    tableWithColumns.columns = availableColumns;
    var finalDataTable = new google.visualization.DataTable();
    colTypes = [];
    jQuery(dataTable).each(function(row_index, row){
        if (row_index === 0){
            jQuery(row).each(function(col_index, col){
                var colKey = col;
                jQuery.each(availableColumns, function(key, value){
                    if (value === col){
                        colKey = key
                    }
                });
                coltype = rowsToUse.properties[colKey];
                if (coltype === "text"){
                    coltype = "string";
                }
                finalDataTable.addColumn(coltype, col);
                colTypes.push(coltype);
            });
        }
        else{
            newRow = [];
            jQuery(row).each(function(col_index, col){
                newCol = col;
                if (colTypes[col_index] === "date"){
                    newCol = jQuery.datepicker.parseDate("yy-mm-dd",col);
                }
                if (colTypes[col_index] === "datetime"){
                    newCol = jQuery.datepicker.parseDate("yy-mm-dd",col);
                }
                newRow.push(newCol);
            });
            finalDataTable.addRow(newRow);
        }
    });

    tableWithColumns.table = finalDataTable;
//    return finalDataTable;
    return tableWithColumns;
}
