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
    var usedColumnNames = [];
    for (i = 0; i < chartDataTable.getNumberOfColumns(); i++){
        usedColumnNames.push(chartDataTable.getColumnLabel(i));
    }
    if (chartFilters){
        jQuery.each(chartFilters, function(key, value){
            if (!availableColumns[key]){
                return;
            }
//            if (usedColumnNames.indexOf(availableColumns[key]) === -1){
            if (jQuery.inArray(availableColumns[key], usedColumnNames) === -1){
                return;
            }
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
    var dataTable = chart.getDataTable();
    if (!dataTable){
        return;
    }
    var rows_nr = dataTable.getNumberOfRows();
//    var table = dataTable.toDataTable();
    var table = dataTable;
    var newRows = [];
    var distinctRows = [];
    for (var i = 0; i < rows_nr; i++){
        var newRow = {};
        jQuery(cols).each(function(key,value){
            newRow[key] = table.getValue(i,value);
        });
        var isNewRow = true;

        jQuery(distinctRows).each(function(distinct_key, distinct_row){
            var foundRow = true;
            jQuery.each(distinct_row,function(row_key, row_value){
                if (newRow[row_key] !== row_value){
                    foundRow = false;
                }
            });
            if (foundRow){
                isNewRow = false;
            }
        });
        if (isNewRow){
            distinctRows.push(newRow);
            newRows.push(i);
        }
    }
    chart.setView({"columns":columns,"rows":newRows});
}

function drawGoogleDashboard(chartsDashboard, chartViewsDiv, chartFiltersDiv, chartsSettings, chartsMergedTable, allColumns, filters){
    var dashboardCharts = [];
    jQuery.each(chartsSettings, function(key, value){
        var chartContainerId = "googlechart_view_" + value[0];
        var chartContainer = "<div id='" + chartContainerId + "' style='float:left'>chart</div>";
        jQuery(chartContainer).appendTo('#googlechart_view');

        var chart = new google.visualization.ChartWrapper(value[1]);
        chart.setContainerId(chartContainerId);
        if (value[8].width){
            chart.setOption("width",value[8].width);
        }
        else{
            chart.setOption("width",value[4]);
        }
        if (value[8].height){
            chart.setOption("height",value[8].height);
        }
        else{
            chart.setOption("height",value[5]);
        }

        jQuery.each(value[7], function(key, value){
            chart.setOption(key, value);
        });

        var column_nrs = [];
        var isTransformed = false;
        var originalColumns = [];
        jQuery.each(value[2].original, function(key,column){
            originalColumns.push(column.name);
        });
        var normalColumns = [];
        jQuery.each(value[2].prepared, function(key,column){
            if (column.status === 1){
//                column_nrs.push(allColumns.indexOf(column.name));
                column_nrs.push(jQuery.inArray(column.name, allColumns));
//                if (originalColumns.indexOf(column.name !== -1)){
                if (jQuery.inArray(column.name, originalColumns) !== -1){
//                    normalColumns.push(allColumns.indexOf(column.name));
                    normalColumns.push(jQuery.inArray(column.name, allColumns));
                }
            }
            else{
                isTransformed = true;
            }
        });

        chart.setView({"columns":column_nrs});
        var chartObj = {};
        chartObj.isTransformed = isTransformed;
        chartObj.chart = chart;
        chartObj.normalColumns = normalColumns;
        dashboardCharts.push(chartObj);
    });
    var dashboardFilters = [];

    jQuery.each(filters, function(key, value){
        var filter_div_id = chartFiltersDiv + "_" + key;
        var filter_div = "<div id='" + filter_div_id + "'></div>";
        jQuery(filter_div).appendTo("#" + chartFiltersDiv);

        var filterSettings = {};
        filterSettings.options = {};
        filterSettings.options.ui = {};
//        filterSettings.options.filterColumnIndex = allColumns.indexOf(key);
        filterSettings.options.filterColumnIndex = jQuery.inArray(key, allColumns);
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
        dashboardFilters.push(filter);
    });
    if (dashboardFilters.length === 0){
        jQuery.each(dashboardCharts, function(chart_key, chart){
            chart.chart.setDataTable(chartsMergedTable);
            if (chart.isTransformed){
                removeDuplicated(chart.chart, chart.normalColumns);
            }
            chart.chart.draw();
        });
    }
    else{
        var dashboard = new google.visualization.Dashboard(
            document.getElementById(chartsDashboard));
        var tmpDashboardCharts = [];
        jQuery.each(dashboardCharts, function(chart_key, chart){
            tmpDashboardCharts.push(chart.chart);
        });
        dashboard.bind(dashboardFilters, tmpDashboardCharts);

        jQuery.each(dashboardCharts, function(chart_key, chart){
            jQuery.each(dashboardFilters, function(filter_key, filter){
                if (chart.isTransformed){
                    google.visualization.events.addListener(filter, 'statechange', function(event){
                        removeDuplicated(chart.chart, chart.normalColumns);
                    });
                    google.visualization.events.addListener(filter, 'ready', function(event){
                        removeDuplicated(chart.chart, chart.normalColumns);
                    });
                }
            });
            if (chart.isTransformed){
                google.visualization.events.addListener(chart.chart, 'ready', function(event){
                    removeDuplicated(chart.chart, chart.normalColumns);
                });
            }
        });
        google.visualization.events.addListener(dashboard, 'ready', function(event){
            jQuery.each(dashboardCharts, function(chart_key, chart){
                if (chart.isTransformed){
                    removeDuplicated(chart.chart, chart.normalColumns);
                }
            });
        });

        dashboard.draw(chartsMergedTable);
    }
}