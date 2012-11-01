function addCustomFilter(customTitle, customPrefix, filtersDiv, customValues, customAllowMultiple, customHandler){
    var filterData = google.visualization.arrayToDataTable(customValues);

    var filterChartDivId = customPrefix + "_custom_chart";
    var filterChartDiv = "<div id='" + filterChartDivId + "' style='display:none;'></div>";
    jQuery(filterChartDiv).appendTo("#" + filtersDiv);

    var filterFilterDivId = customPrefix + "_custom_filter";
    var filterFilterDiv = "<div id='" + filterFilterDivId + "'></div>";
    jQuery(filterFilterDiv).prependTo("#" + filtersDiv);

    var filterChart = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': filterChartDivId,
        'options': {'height': '13em', 'width': '20em'}
    });
    var filterFilter = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': filterFilterDivId,
        'options': {
            'filterColumnLabel': customTitle,
            'ui': {
                'allowTyping': false,
                'allowMultiple': customAllowMultiple
            }
        }
    });

    var filterDashboard = new google.visualization.Dashboard(document.getElementById(filterChartDivId));
    filterDashboard.bind(filterFilter, filterChart);

    google.visualization.events.addListener(filterFilter, 'statechange', function(event){
        customHandler();
    });

    filterDashboard.draw(filterData);

    return filterFilter;
}


var sortFilterChart = null;
var sortFilterDataTable = null;
var sortFilterObj = null;
var sortFilterArray = {};

function applySortOnChart(){
    var tmpDataView = new google.visualization.DataView(sortFilterDataTable);
    var sortBy = sortFilterObj.getState().selectedValues[0];
    var tmpRows = sortFilterChart.getDataTable().getViewRows();
    var hasFilter = (tmpDataView.getNumberOfRows() !== tmpRows.length);
    var sortedRows;
    if (sortBy && hasFilter){
         sortedRows = sortFilterChart.getDataTable().getSortedRows(sortFilterArray[sortBy][0]);
        if (sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        var tmpFiltered = new google.visualization.DataView(sortFilterChart.getDataTable());
        tmpFiltered.setRows(sortedRows);
        sortFilterChart.setDataTable(tmpFiltered);
        sortFilterChart.draw();
    }
    if (sortBy && !hasFilter){
        sortedRows = tmpDataView.getSortedRows(sortFilterArray[sortBy][0]);
        if (sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        tmpDataView.setRows(sortedRows);
        sortFilterChart.setDataTable(tmpDataView);
        sortFilterChart.draw();
    }
    if (!sortBy && hasFilter){
        tmpDataView.setRows(tmpRows);
        sortFilterChart.setDataTable(tmpDataView);
        sortFilterChart.draw();
    }
    if (!sortBy && !hasFilter){
        sortFilterChart.setDataTable(tmpDataView);
        sortFilterChart.draw();
    }
}

function applyCustomFilters(){
    if (sortFilterObj){
        applySortOnChart();
    }
}

function addSortFilter(filtersDiv, filterTitle, filterDataTable, filterChart){
    sortFilterChart = filterChart;
    sortFilterDataTable = filterDataTable;
    var colsnr = filterDataTable.getNumberOfColumns();
    var cols_array = [[filterTitle]];
    for (var i = 0; i < colsnr; i++){
        cols_array.push([filterDataTable.getColumnLabel(i)]);
        sortFilterArray[filterDataTable.getColumnLabel(i)] = [i, false];
        cols_array.push([filterDataTable.getColumnLabel(i) + " reversed"]);
        sortFilterArray[filterDataTable.getColumnLabel(i) + " reversed"] = [i, true];
    }

    sortFilterObj = addCustomFilter(filterTitle, 'sortfilter', filtersDiv, cols_array, false, applyCustomFilters);
}