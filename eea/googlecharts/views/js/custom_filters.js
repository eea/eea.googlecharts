function addCustomFilter(options){
    var settings = {
        customTitle : '',
        customPrefix : '',
        filtersDiv : '',
        customValues : '',
        customAllowMultiple : '',
        customHandler : function(){}
    };
    jQuery.extend(settings, options);

    var filterData = google.visualization.arrayToDataTable(settings.customValues);

    var filterChartDivId = settings.customPrefix + "_custom_chart";
    var filterChartDiv = "<div id='" + filterChartDivId + "' style='display:none;'></div>";
    jQuery(filterChartDiv).appendTo("#" + settings.filtersDiv);

    var filterFilterDivId = settings.customPrefix + "_custom_filter";
    var filterFilterDiv = "<div id='" + filterFilterDivId + "'></div>";
    jQuery(filterFilterDiv).prependTo("#" + settings.filtersDiv);

    var filterChart = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': filterChartDivId,
        'options': {'height': '13em', 'width': '20em'}
    });
    var filterFilter = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': filterFilterDivId,
        'options': {
            'filterColumnLabel': settings.customTitle,
            'ui': {
                'allowTyping': false,
                'allowMultiple': settings.customAllowMultiple
            }
        }
    });

    var filterDashboard = new google.visualization.Dashboard(document.getElementById(filterChartDivId));
    filterDashboard.bind(filterFilter, filterChart);

    google.visualization.events.addListener(filterFilter, 'statechange', function(event){
        settings.customHandler();
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

function addSortFilter(options){
    var settings = {
        filtersDiv : '',
        filterTitle : '',
        filterDataTable : null,
        filterChart : null
    };

    jQuery.extend(settings, options);

    sortFilterChart = settings.filterChart;
    sortFilterDataTable = settings.filterDataTable;
    var colsnr = settings.filterDataTable.getNumberOfColumns();
    var cols_array = [[settings.filterTitle]];
    for (var i = 0; i < colsnr; i++){
        cols_array.push([settings.filterDataTable.getColumnLabel(i)]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i)] = [i, false];
        cols_array.push([settings.filterDataTable.getColumnLabel(i) + " reversed"]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i) + " reversed"] = [i, true];
    }

    var options2 = {
        customTitle : settings.filterTitle,
        customPrefix : 'sortfilter',
        filtersDiv : settings.filtersDiv,
        customValues : cols_array,
        customAllowMultiple : false,
        customHandler : applyCustomFilters
    };

    sortFilterObj = addCustomFilter(options2);
}