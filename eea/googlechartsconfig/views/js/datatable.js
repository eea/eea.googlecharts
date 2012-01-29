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
    var pivotTable = [];
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
                if (normalColumns.find(column_index)){
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

            if (!pivotTableColumns.find(pivotColumnName)){
                isNewColumn = true;
                pivotTableColumns.push(pivotColumnName);
                defaultNewRowValues.push(defaultNewColumnValue);
                foundColumnIndex = pivotTableColumns.length - 1;
            }
            else {
                foundColumnIndex = pivotTableColumns.find(pivotColumnName);
            }
            isNewRow = true;
            foundIndex = -1;
            jQuery(pivotTable).each(function(pivot_row_index, pivot_row){
                if (isNewColumn){
                    pivot_row.push(defaultNewColumnValue);
                }
                found = true
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
                pivotTable.push(fixValues.concat(defaultNewRowValues));
                foundIndex = pivotTable.length - 1;
            }
            pivotTable[foundIndex][foundColumnIndex] = pivotValue;
        }
    });
    pivotTable.splice(0, 0, pivotTableColumns);

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
    pivotTableKeys = [];
    jQuery(pivotTable).each(function(row_index, row){
        if (row_index === 0){
            jQuery(row).each(function(col_index, col){
                colValue = col;
                colKey = col
                jQuery.each(availableColumns,function(key,value){
                    if (col === value) {
                        colKey = key;
                    }
                });
                pivotTableKeys.push(colKey);
                pivotTableObj.properties[colKey] = originalProperties[colKey];
                if (!pivotTableObj.properties[colKey]){
                    pivotTableObj.properties[colKey] = valueColumnType;
                }
            });
        }
        else{
            item = {};
            jQuery(row).each(function(col_index, col){
                item[pivotTableKeys[col_index]] = col;
            });
            pivotTableObj.items.push(item);
        }
    });
    return pivotTableObj;
}