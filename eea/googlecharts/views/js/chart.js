function drawGoogleChart(options){
    var settings = {
        chartDashboard : '',
        chartViewDiv : '',
        chartFiltersDiv : '',
        chartId : '',
        chartJson : '',
        chartDataTable : '',
        chartFilters : '',
        chartWidth : '',
        chartHeight : '',
        chartFilterPosition : '',
        chartOptions : '',
        availableColumns : '',
        chartReadyEvent : function(){},
        chartErrorEvent : function(){},
        showSort : false
    };
    jQuery.extend(settings, options);
    jQuery("#"+settings.chartViewDiv).width(settings.chartWidth).height(settings.chartHeight);
    settings.chartJson.options.width = settings.chartWidth;
    settings.chartJson.options.height = settings.chartHeight;

    jQuery.each(settings.chartOptions, function(key, value){
        settings.chartJson.options[key] = value;
    });

    settings.chartJson.dataTable = [];

    settings.chartJson.containerId = settings.chartViewDiv;

    var chart = new google.visualization.ChartWrapper(settings.chartJson);

    var filtersArray = [];
    var usedColumnNames = [];
    for (i = 0; i < settings.chartDataTable.getNumberOfColumns(); i++){
        usedColumnNames.push(settings.chartDataTable.getColumnLabel(i));
    }
    if (settings.chartFilters){
        jQuery.each(settings.chartFilters, function(key, value){
            if (!settings.availableColumns[key]){
                return;
            }
//            if (usedColumnNames.indexOf(availableColumns[key]) === -1){
            if (jQuery.inArray(settings.availableColumns[key], usedColumnNames) === -1){
                return;
            }
            var filter_div_id = settings.chartFiltersDiv + "_" + key;
            var filter_div = "<div id='" + filter_div_id + "'></div>";
            jQuery(filter_div).appendTo("#" + settings.chartFiltersDiv);

            var filterSettings = {};
            filterSettings.options = {};
            filterSettings.options.ui = {};
            filterSettings.options.filterColumnLabel = settings.availableColumns[key];
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

    var dataView = new google.visualization.DataView(settings.chartDataTable);

    if (filtersArray.length > 0){
        var dashboard = new google.visualization.Dashboard(
            document.getElementById(settings.chartDashboard));

        dashboard.bind(filtersArray, chart);

        google.visualization.events.addListener(dashboard, 'ready', function(event){
            settings.chartReadyEvent();
        });

        google.visualization.events.addListener(dashboard, 'error', function(event){
            settings.chartErrorEvent();
        });

        jQuery(filtersArray).each(function(key,value){
            google.visualization.events.addListener(value, 'statechange', function(event){
                applyCustomFilters();
            });
        });


        dashboard.draw(dataView);
    }
    else {
        chart.setDataTable(dataView);
        google.visualization.events.addListener(chart, 'ready', function(event){
            settings.chartReadyEvent();
        });

        google.visualization.events.addListener(chart, 'error', function(event){
            settings.chartErrorEvent();
        });

        chart.draw();
    }
    if (settings.showSort){
        var options2 = {
            filtersDiv : settings.chartFiltersDiv,
            filterTitle : 'sort by',
            filterDataTable : settings.chartDataTable,
            filterChart : chart
        };

        addSortFilter(options2);
    }
}

function drawGoogleDashboard(options){
    var settings = {
        chartsDashboard : '',
        chartViewsDiv : '',
        chartFiltersDiv : '',
        chartsSettings : '',
        filters : '',
        rows : {},
        columns : {},
        charts : []
    };
    jQuery.extend(settings, options);

    var dashboardCharts = [];
    var dashboardLink = jQuery('#googlechart_dashboard').attr('data-link');
    dashboardLink = dashboardLink !== undefined ? dashboardLink + '/' : '';

    // Dashboard charts
    jQuery.each(settings.chartsSettings, function(key, value){
        if (value.wtype === 'googlecharts.widgets.chart'){
            var chartConfig;
            jQuery(settings.charts).each(function(idx, config){
                if (config[0] === value.name){
                    chartConfig = config;
                }
            });
            var chartContainerId = "googlechart_view_" + value.name;
            var chartContainer = jQuery('<div>')
                .attr('id', chartContainerId)
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .text('chart')
                .appendTo('#googlechart_view');

            var columnsFromSettings = getColumnsFromSettings(chartConfig[2]);

            var chart_sortBy = chartConfig[12];
            var chart_sortAsc = true;
            var chart_row_filters = {};

            var row_filters_str = chartConfig[11];
            var sortAsc_str = chartConfig[13];
            if (row_filters_str.length > 0){
                chart_row_filters = JSON.parse(row_filters_str);
            }
            if (sortAsc_str === 'desc'){
                chart_sortAsc = false;
            }

            var options = {
                originalTable : settings.rows,
                normalColumns : columnsFromSettings.normalColumns,
                pivotingColumns : columnsFromSettings.pivotColumns,
                valueColumn : columnsFromSettings.valueColumn,
                availableColumns : settings.columns,
                filters : chart_row_filters
            };

            var transformedTable = transformTable(options);

            options = {
                originalDataTable : transformedTable,
                columns : columnsFromSettings.columns,
                sortBy : chart_sortBy,
                sortAsc : chart_sortAsc
            };

            var tableForChart = prepareForChart(options);

            chart_options = {
                chartDashboard : 'googlechart_dashboard',
                chartViewDiv : chartContainerId,
                chartFiltersDiv : '',
                chartId : chartConfig[0],
                chartJson: chartConfig[1],
                chartDataTable : tableForChart,
                chartFilters : '',
                chartWidth: chartConfig[4],
                chartHeight: chartConfig[5],
                chartFilterPosition : '',
                chartOptions : chartConfig[7],
                availableColumns : transformedTable.available_columns,
                chartReadyEvent : function(){},
                showSort:false
            };
            drawGoogleChart(chart_options);
        }
        else{
            if(value.dashboard.hidden){
                return;
            }
            var widgetDiv = jQuery('<div>')
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .addClass('googledashboard-widget')
                .attr('id', value.name)
                .attr('title', value.title)
                .width(value.dashboard.width)
                .height(value.dashboard.height)
                .data('dashboard', value.dashboard)
                .load(dashboardLink + '@@' + value.wtype, {name: value.name});

                widgetDiv.appendTo('#googlechart_view');
        }
    });


    return;
    // Dashboard filters
    var dashboardFilters = [];
    jQuery.each(settings.filters, function(key, value){
        var filter_div_id = settings.chartFiltersDiv + "_" + key;
        var filter_div = "<div id='" + filter_div_id + "'></div>";
        jQuery(filter_div).appendTo("#" + settings.chartFiltersDiv);

        var filterSettings = {};
        filterSettings.options = {};
        filterSettings.options.ui = {};
        //filterSettings.options.filterColumnIndex = allColumns.indexOf(key);
        filterSettings.options.filterColumnIndex = jQuery.inArray(key, settings.allColumns);
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
            chart.chart.setDataTable(settings.chartsMergedTable);
            if (chart.isTransformed){
                var options = {
                    chart : chart.chart,
                    cols : chart.normalColumns
                };
                removeDuplicated(options);
            }
            chart.chart.draw();
        });
    }
    else{
        var dashboard = new google.visualization.Dashboard(
            document.getElementById(settings.chartsDashboard));
        var tmpDashboardCharts = [];
        jQuery.each(dashboardCharts, function(chart_key, chart){
            tmpDashboardCharts.push(chart.chart);
        });
        dashboard.bind(dashboardFilters, tmpDashboardCharts);

        jQuery.each(dashboardCharts, function(chart_key, chart){
            jQuery.each(dashboardFilters, function(filter_key, filter){
                if (chart.isTransformed){
                    google.visualization.events.addListener(filter, 'statechange', function(event){
                        var options = {
                            chart : chart.chart,
                            cols : chart.normalColumns
                        };
                        removeDuplicated(options);
                    });
                    google.visualization.events.addListener(filter, 'ready', function(event){
                        var options = {
                            chart : chart.chart,
                            cols : chart.normalColumns
                        };
                        removeDuplicated(options);
                    });
                }
            });
            if (chart.isTransformed){
                google.visualization.events.addListener(chart.chart, 'ready', function(event){
                    var options = {
                        chart : chart.chart,
                        cols : chart.normalColumns
                    };
                    removeDuplicated(options);
                });
            }
        });
        google.visualization.events.addListener(dashboard, 'ready', function(event){
            jQuery.each(dashboardCharts, function(chart_key, chart){
                if (chart.isTransformed){
                    var options = {
                        chart : chart.chart,
                        cols : chart.normalColumns
                    };
                    removeDuplicated(options);
                }
            });
        });

        dashboard.draw(settings.chartsMergedTable);
    }
}
