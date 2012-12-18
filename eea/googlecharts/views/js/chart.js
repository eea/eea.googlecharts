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
        showSort : false,
        customFilterHandler : function(){},
        notes: [],
        hideNotes: false
    };

    jQuery.extend(settings, options);

    // XXX Use GoogleChartsConfig for options instead of googlechart_config_array
    if(window.GoogleChartsConfig){
        jQuery.each(GoogleChartsConfig, function(index, value){
            if((value.id == settings.chartId) && value.notes){
                settings.notes = value.notes;
            }
        });
    }

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

            google.visualization.events.addListener(filter, 'statechange', function(event){
                settings.customFilterHandler();
            });

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

    // Notes
    if (!settings.hideNotes){
        var notes = jQuery('<div>')
            .addClass('googlechart-notes')
            .width(settings.chartWidth);

        jQuery.each(settings.notes, function(index, note){
            jQuery('<div>')
                .addClass('googlecharts-note')
                .html(note.text)
                .appendTo(notes);
        });
        jQuery('#' + settings.chartViewDiv).after(notes);
    }
    return {'chart': chart, 'filters': filtersArray};

}

var hiddenDashboardFilters;
var dashboardFilters;

function dashboardFilterChanged(){
    var filtersStates = {};
    jQuery(dashboardFilters).each(function(idx, filter){
        var filterName = filter.getOption("filterColumnLabel");
        var filterState = filter.getState();
        filtersStates[filterName] = filterState;
    });
    jQuery(hiddenDashboardFilters).each(function(idx, filter){
        var filterName = filter.getOption("filterColumnLabel");
        filter.setState(filtersStates[filterName]);
        filter.draw();
    });
    return;
}
function drawGoogleDashboard(options){
    hiddenDashboardFilters = [];
    dashboardFilters = [];
    var settings = {
        chartsDashboard : '',
        chartViewsDiv : '',
        chartFiltersDiv : '',
        chartsSettings : '',
        filters : '',
        rows : {},
        columns : {},
        charts : [],
        dashboardName : ""
    };
    jQuery.extend(settings, options);

    var dashboardCharts = [];
    var dashboardLink = jQuery('#googlechart_dashboard').attr('data-link');
    dashboardLink = dashboardLink !== undefined ? dashboardLink + '/' : '';

    var dashboard_filters = {};
    jQuery.each(settings.filters, function(key, value){
        dashboard_filters[value.column] = value.type;
    });
    // Dashboard charts
    jQuery.each(settings.chartsSettings, function(key, value){
        if(value.dashboard.hidden){
            return;
        }
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

            var chartFiltersId = "googlechart_hidden_filters_" + value.name;
            var chartFilters = jQuery('<div>')
                .attr('id', chartFiltersId)
                .addClass('googledashboard-hidden-helper-filters')
                .css('float', 'left')
                .appendTo('#'+settings.chartFiltersDiv);

            var columnsFromSettings = getColumnsFromSettings(chartConfig[2]);

            var chart_sortBy = chartConfig[12];
            var chart_sortAsc = true;
            var chart_row_filters = chartConfig[11];

            var sortAsc_str = chartConfig[13];
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

            var chart_width = chartConfig[4];
            var chart_height = chartConfig[5];
            if (value.dashboard.width){
                chart_width = value.dashboard.width;
            }
            if (value.dashboard.height){
                chart_height = value.dashboard.height;
            }
            chart_options = {
                chartDashboard : 'googlechart_dashboard',
                chartViewDiv : chartContainerId,
                chartFiltersDiv : chartFiltersId,
                chartId : chartConfig[0],
                chartJson: chartConfig[1],
                chartDataTable : tableForChart,
                chartFilters : dashboard_filters,
                chartWidth: chart_width,
                chartHeight: chart_height,
                chartFilterPosition : '',
                chartOptions : chartConfig[7],
                availableColumns : transformedTable.available_columns,
                chartReadyEvent : function(){},
                showSort:false,
                hideNotes:true
            };
            var tmp_chart = drawGoogleChart(chart_options);
            hiddenDashboardFilters = hiddenDashboardFilters.concat(tmp_chart.filters);
        }
        else{
            var widgetDiv = jQuery('<div>')
                .css('float', 'left')
                .addClass('googledashboard-chart')
                .addClass('googledashboard-widget')
                .attr('id', value.name)
                .attr('title', value.title)
                .width(value.dashboard.width)
                .height(value.dashboard.height)
                .data('dashboard', value.dashboard)
                .load(dashboardLink + '@@' + value.wtype, {name: value.name, dashboard: settings.dashboardName});

                widgetDiv.appendTo('#googlechart_view');
        }
    });

    // Dashboard filters
    if (settings.filters.length > 0){
            filters_chart_id = 'filters_helper_tablechart';
            var chartContainerId = "googlechart_view_" + filters_chart_id;

            var chartContainer = jQuery('<div>')
                .attr('id', chartContainerId)
                .addClass('googlechart_dashboard_filters_helper')
                .prependTo('#googlechart_view');

            var normalColumns = [];
            jQuery.each(settings.columns, function(key,value){
                normalColumns.push(key);
            });
            options = {
                originalTable : settings.rows,
                normalColumns : normalColumns,
                pivotingColumns : [],
                valueColumn : "",
                availableColumns : settings.columns
            };

            var transformedTable = transformTable(options);

            options = {
                originalDataTable : transformedTable,
                columns : normalColumns
            };

            var tableForChart = prepareForChart(options);
            var filtersHelperChart = {'chartType': 'Table',
                                      'options': {'height': '13em', 'width': '20em'}};
            chart_options = {
                chartDashboard : 'googlechart_dashboard',
                chartViewDiv : chartContainerId,
                chartFiltersDiv : settings.chartFiltersDiv,
                chartId : filters_chart_id,
                chartJson: filtersHelperChart,
                chartDataTable : tableForChart,
                chartFilters : dashboard_filters,
                chartWidth: 200,
                chartHeight: 200,
                chartFilterPosition : '',
                availableColumns : transformedTable.available_columns,
                chartReadyEvent : function(){},
                showSort : false,
                customFilterHandler : dashboardFilterChanged
            };
            var tmp_chart = drawGoogleChart(chart_options);
            dashboardFilters = tmp_chart.filters;
    }
}
