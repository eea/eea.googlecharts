function drawGoogleChart(chartDashboard, chartViewDiv, chartFiltersDiv, chartId, chartJson, chartDataTable, chartFilters, chartWidth, chartHeight, chartFilterPosition, chartOptions, availableColumns, chartReadyEvent, chartErrorEvent){
    chartJson.options.width = chartWidth;
    chartJson.options.height = chartHeight;

    jQuery.each(chartOptions, function(key, value){
        chartJson.options[key] = value;
    });

    chartJson.dataTable = [];

    chartJson.containerId = chartViewDiv;

    var chart = new google.visualization.ChartWrapper(chartJson);

    filtersArray = [];

    if (chartFilters){
        jQuery.each(chartFilters, function(key, value){
            filter_div_id = chartFiltersDiv + "_" + key;
            filter_div = "<div id='" + filter_div_id + "'></div>";
            jQuery(filter_div).appendTo("#" + chartFiltersDiv);

            filterSettings = {};
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
            filter = new google.visualization.ControlWrapper(filterSettings);
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