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
    jQuery("#"+settings.chartViewDiv).attr("style", "width:" + settings.chartWidth + "px;height:" + settings.chartHeight + "px");
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

function removeDuplicated(options) {
    var settings = {
        chart : '',
        cols : ''
    };
    jQuery.extend(settings, options);

    var columns = settings.chart.getView().columns;
    var dataTable = settings.chart.getDataTable();
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
        jQuery(settings.cols).each(function(key,value){
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
    settings.chart.setView({"columns":columns,"rows":newRows});
}

function drawGoogleDashboard(options){
    var settings = {
        chartsDashboard : '',
        chartViewsDiv : '',
        chartFiltersDiv : '',
        chartsSettings : '',
        chartsMergedTable : '',
        allColumns : '',
        filters : ''
    };
    jQuery.extend(settings, options);

    var dashboardCharts = [];

    // Dashboard charts
    jQuery.each(settings.chartsSettings, function(key, value){
        var chartContainerId = "googlechart_view_" + value[0];
        var chartContainer = jQuery('<div>')
            .attr('id', chartContainerId)
            .css('float', 'left')
            .addClass('googledashboard-chart')
            .text('chart')
            .appendTo('#googlechart_view');
        chartContainer.data('dashboard', value[8]);
        chartContainer.attr("style", "width:" + value[8].width + "px;height:" + value[8].height + "px");
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
                //column_nrs.push(allColumns.indexOf(column.name));
                column_nrs.push(jQuery.inArray(column.name, settings.allColumns));
                //if (originalColumns.indexOf(column.name !== -1)){
                if (jQuery.inArray(column.name, originalColumns) !== -1){
                    //normalColumns.push(allColumns.indexOf(column.name));
                    normalColumns.push(jQuery.inArray(column.name, settings.allColumns));
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

    // Dashboard widgets
    var dashboardWidgets = googledashboard_filters.widgets;
    dashboardWidgets = dashboardWidgets !== undefined ? dashboardWidgets : [];
    var dashboardLink = jQuery('.eea-googlecharts-dashboard').attr('data-link');
    dashboardLink = dashboardLink !== undefined ? dashboardLink + '/' : '';
    jQuery.each(dashboardWidgets, function(key, widget){
        if(widget.dashboard.hidden){
            return;
        }
        var widgetDiv = jQuery('<div>')
            .css('float', 'left')
            .addClass('googledashboard-chart')
            .addClass('googledashboard-widget')
            .attr('id', widget.name)
            .attr('title', widget.title)
            .width(widget.dashboard.width)
            .height(widget.dashboard.height)
            .data('dashboard', widget.dashboard)
            .load(dashboardLink + '@@' + widget.wtype, {name: widget.name});

        var widgetAdded = false;
        jQuery('.googledashboard-chart').each(function(){
            var chartDashboard = jQuery(this).data('dashboard');
            if(chartDashboard.order !== undefined && widget.dashboard.order < chartDashboard.order){
                widgetAdded = true;
                jQuery(this).before(widgetDiv);
                return false;
            }
        });
        if(!widgetAdded){
            widgetDiv.appendTo('#googlechart_view');
        }
    });

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
