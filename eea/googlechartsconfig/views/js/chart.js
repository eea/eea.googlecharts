function drawGoogleChart(chartDashboard, chartViewDiv, chartFiltersDiv, chartId, chartJson, chartDataTable, chartFilters, chartWidth, chartHeight, chartFilterPosition, chartOptions, availableColumns, chartReadyEvent, chartErrorEvent){
    chartJson.options.width = chartWidth;
    chartJson.options.height = chartHeight;

    jQuery.each(chartOptions, function(key, value){
        chartJson.options[key] = value;
    });

    chartJson.dataTable = [];

    chartJson.containerId = chartViewDiv;

    var chart = new google.visualization.ChartWrapper(chartJson);

    var filtersArray = [];

    if (chartFilters){
        jQuery.each(chartFilters, function(key, value){
            var filter_div_id = chartFiltersDiv + "_" + key;
            var filter_div = "<div id='" + filter_div_id + "'></div>";
            jQuery(filter_div).appendTo("#" + chartFiltersDiv);

            var filterSettings = {};
            filterSettings.options = {};
            filterSettings.options.ui = {};
            filterSettings.options.filterColumnLabel = availableColumns[key];
            filterSettings.containerId = filter_div_id;

            switch(value){
                case "0":
                    filterSettings.controlType = 'NumberRangeFilter';
                    break;
                case "1":
                    filterSettings.controlType = 'StringFilter';
                    break;
                case "2":
                    filterSettings.controlType = 'CategoryFilter';
                    filterSettings.options.ui.allowTyping = false;
                    filterSettings.options.ui.allowMultiple = false;
                    break;
                case "3":
                    filterSettings.controlType = 'CategoryFilter';
                    filterSettings.options.ui.allowTyping = false;
                    filterSettings.options.ui.allowMultiple = true;
                    filterSettings.options.ui.selectedValuesLayout = 'belowStacked';
                    break;
            }
            var filter = new google.visualization.ControlWrapper(filterSettings);
            filtersArray.push(filter);
        });
    }

    if (filtersArray.length > 0){
        var dashboard = new google.visualization.Dashboard(
            document.getElementById(chartDashboard));

        dashboard.bind(filtersArray, chart);

        google.visualization.events.addListener(dashboard, 'ready', function(event){
            chartReadyEvent();
        });

        google.visualization.events.addListener(dashboard, 'error', function(event){
            chartErrorEvent();
        });

        dashboard.draw(chartDataTable);
    }
    else {
        chart.setDataTable(chartDataTable);
        google.visualization.events.addListener(chart, 'ready', function(event){
            chartReadyEvent();
        });

        google.visualization.events.addListener(chart, 'error', function(event){
            chartErrorEvent();
        });

        chart.draw();
    }
}

function removeDuplicated(chart, cols) {
    var columns = chart.getView().columns;
    var dataTable = chart.getDataTable()
    if (!dataTable){
        return;
    }
    var rows_nr = dataTable.getNumberOfRows();
//    var table = dataTable.toDataTable();
    var table = dataTable;
    var newRows = [];
    var distinctRows = [];
    for (var i = 0; i < rows_nr; i++){
        var newRow = {}
        jQuery(cols).each(function(key,value){
            newRow[key] = table.getValue(i,value);
        });
        var isNewRow = true;

        jQuery(distinctRows).each(function(distinct_key, distinct_row){
            var foundRow = true;
            jQuery.each(distinct_row,function(row_key, row_value){
                if (newRow[row_key] !== row_value){
                    foundRow = false;
                };
            });
            if (foundRow){
                isNewRow = false;
            }
        });
        if (isNewRow){
            distinctRows.push(newRow);
            newRows.push(i);
        };
    };
    chart.setView({"columns":columns,"rows":newRows});
}

function drawGoogleDashboard(dashboard, chartViewsDiv, chartFiltersDiv, chartsSettings, chartsMergedTable, allColumns){
    var dashboardCharts = [];
    var dashboardFilters = [];
    jQuery.each(chartsSettings, function(key, value){
        var chartContainerId = "googlechart_view_" + value[0];
        var chartContainer = "<div id='" + chartContainerId + "'>chart</div>";
        jQuery(chartContainer).appendTo('#googlechart_view');

/*        var chartOpt = {}
        chartOpt.chartType = 'Table';

        var chart = new google.visualization.ChartWrapper(chartOpt);*/
        var chart = new google.visualization.ChartWrapper(value[1]);
        chart.setContainerId(chartContainerId);

        var column_nrs = [];
        var isTransformed = false;
        var originalColumns = [];
        jQuery.each(value[2].original, function(key,column){
            originalColumns.push(column.name);
        });
        var normalColumns = [];
        jQuery.each(value[2].prepared, function(key,column){
            if (column.status === 1){
                column_nrs.push(allColumns.find(column.name)[0]);
                if (originalColumns.find(column.name)){
                    normalColumns.push(allColumns.find(column.name)[0]);
                }
                else{
                    isTransformed = true;
                }
            }
        });

        chart.setView({"columns":column_nrs});
        var chartObj = {};
        chartObj.isTransformed = isTransformed;
        chartObj.chart = chart;
        chartObj.normalColumns = normalColumns;
        dashboardCharts.push(chartObj);
    });
    var hasFilters = false;
    jQuery.each(dashboardCharts, function(chart_key, chart){
        if (!hasFilters){
            chart.chart.setDataTable(chartsMergedTable);
            if (chart.isTransformed){
                removeDuplicated(chart.chart, chart.normalColumns);
            }
            chart.chart.draw();
        }
        else {
            jQuery.each(dashboardFilters, function(filter_key, filter){
                
            });
        }
    });
}