function addCustomFilter(options){
    var settings = {
        customTitle : '',
        customPrefix : '',
        filtersDiv : '',
        customValues : '',
        customAllowMultiple : '',
        customHandler : function(){},
        defaultValues : [],
        allowNone : true
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
                'allowNone' : settings.allowNone,
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
    filterFilter.setState({"selectedValues":settings.defaultValues});
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

var columnFiltersObj = [];
function applyColumnFilters(){
    jQuery("#googlechart_filters").html('');
    jQuery("#googlechart_view").html('');

    var config = [];
    jQuery.each(googlechart_config_array, function(idx, conf){
        if (conf[0] === jQuery("#googlechart_view").attr("chart_id")){
            var chart_id = conf[0];
            var chart_json = conf[1];
            var chart_columns = conf[2];
            var chart_filters = conf[3];
            var chart_width = conf[4];
            var chart_height = conf[5];
            var chart_filterposition = conf[6];
            var chart_options = conf[7];
            var chart_dashboard = conf[8];
            var chart_showSort = conf[9];
            var chart_hasPNG = conf[10];
            var chart_row_filters = conf[11];
            var chart_sortBy = conf[12];
            var chart_sortAsc = conf[13];

            var chart_columnFilters = conf[14];

            config.push(chart_id);
            config.push(chart_json);
            config.push(chart_columns);
            config.push(chart_filters);
            config.push(chart_width);
            config.push(chart_height);
            config.push(chart_filterposition);
            config.push(chart_options);
            config.push(chart_dashboard);
            config.push(chart_showSort);
            config.push(chart_hasPNG);
            config.push(chart_row_filters);
            config.push(chart_sortBy);
            config.push(chart_sortAsc);
            config.push(chart_columnFilters);
        }
    });
    drawChart(config);
}

function addColumnFilters(options){
    var settings = {
        filtersDiv : '',
        columnFilters : [],
        columns: {}
    };

    jQuery.extend(settings, options);
    columnFiltersObj = [];
    columnFiltersColumnsWithNames = [];
    jQuery.each(settings.columnFilters.reverse(), function(idx, columnFilter){
        var values = [[columnFilter.title]];
        var defaultValues = [];
        if (columnFilter.type !== '2'){
            jQuery.each(columnFilter.settings.defaults, function(idx, defaultcol){
                defaultValues.push(settings.columns[defaultcol]);
            });
            jQuery.each(columnFilter.settings.selectables, function(idx, selectable){
                values.push([settings.columns[selectable]]);
            });
        }
        else{
            defaultValues = [settings.columns[columnFilter.settings.defaults[0]] + " - " + settings.columns[columnFilter.settings.defaults[1]]];
            jQuery.each(columnFilter.settings.selectables, function(idx, selectable1){
                jQuery.each(columnFilter.settings.selectables, function(idx, selectable2){
                    if (selectable1 !== selectable2){
                        values.push([settings.columns[selectable1] + " - " + settings.columns[selectable2]]);
                    }
                });
            });
        }
        var options2 = {
            customTitle : columnFilter.title,
            customPrefix : 'columnfilter' + columnFilter.title,
            filtersDiv: settings.filtersDiv,
            customValues : values,
            customAllowMultiple : (columnFilter.type === '1' ? true : false),
            customHandler : applyColumnFilters,
            defaultValues : defaultValues,
            allowNone : (columnFilter.type === '1' ? true : false)
        };
        columnFiltersObj.push(addCustomFilter(options2));
    });
}
