jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    jQuery("ul.googlechart_tabs").tabs("div.googlechart_tab_panes > div");

    jQuery(googlechart_config_array).each(function(index, value){
        jQuery("#googlechart_types_tabs_"+value[0]).tabs("#googlechart_types_panes_"+value[0]+" > div");

        chart_id = value[0];
        chart_json = value[1];
        chart_columns = value[2];
        chart_filters = value[3];

        columnlabels = [];
        jQuery(chart_columns).each(function(index,chart_token){
            columnlabels.push(available_columns[chart_token]);
        });
        dataTable = [];
        dataTable.push(columnlabels);
        jQuery(merged_rows.items).each(function(index, merged_row){
            row = [];
            jQuery(chart_columns).each(function(index,chart_token){
                row.push(merged_row[chart_token]);
            });
            dataTable.push(row);
        });
        chart_json.options.width = 800;
        chart_json.options.height = 600;
        chart_json.dataTable = [];

        chart_json.containerId = "googlechart_view_"+chart_id;
        var originalChart = new google.visualization.ChartWrapper(
            chart_json
        );


        chart_json_img = JSON.parse(JSON.stringify(chart_json));

        chartType = chart_json_img.chartType;
        charts_array = [];
        charts_array.push(originalChart);
        switch(chartType){
            case 'BarChart':
                chart_json_img.chartType = "ImageChart";
                if (chart_json_img.options.isStacked){
                    chart_json_img.options.cht = "bhs";
                }
                else{
                    chart_json_img.options.cht = "bhg";
                }
                break;
            case 'ColumnChart':
                chart_json_img.chartType = "ImageChart";
                if (chart_json_img.options.isStacked){
                    chart_json_img.options.cht = "bvs";
                }
                else{
                    chart_json_img.options.cht = "bvg";
                }
                break;
            case 'PieChart':
                chart_json_img.chartType = "ImageChart";
                if (chart_json_img.options.is3D){
                    chart_json_img.options.cht = "p3";
                }
                else{
                    chart_json_img.options.cht = "p";
                }
                break;
            case 'LineChart':
                chart_json_img.chartType = "ImageChart";
                chart_json_img.options.cht = "lc";
                break;

            case 'AreaChart':
                if (!chart_json_img.options.isStacked){
                    chart_json_img.chartType = "ImageAreaChart";
                }
                break;
            case 'ScatterChart':
                if (!chart_json_img.options.isStacked){
                    chart_json_img.chartType = "ImageChart";
                    chart_json_img.options.cht = "s";
                }
                break;
        }
        if (chartType != chart_json_img.chartType){
            chart_json_img.containerId = "googlechart_image_view_"+chart_id;
            var imageChart = new google.visualization.ChartWrapper(
                chart_json_img
            );
           charts_array.push(imageChart);
        }
        else{
            jQuery("#googlechart_types_tabs_"+value[0]).hide();
        }

        filters_array = [];
        if (chart_filters){
            jQuery.each(chart_filters,function(key, value){
                filters_div = "googlechart_filters_"+chart_id;
                filter_div_id = "googlechart_filters_"+chart_id+"_"+key;
                filter_div = "<div id='"+filter_div_id+"'></div>";
                jQuery("#"+filter_div).appendTo("#"+filters_div);
                filterSettings = {};
                filterSettings.options = {};
                filterSettings.options.ui = {};
                filterSettings.options.filterColumnLabel = available_columns[key];
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
                filters_array.push(filter);
            });
        }

        if (filters_array.length > 0){
            var dashboard = new google.visualization.Dashboard(
              document.getElementById('googlechart_types_panes_'+chart_id));

            dashboard.bind(filters_array, charts_array);

            dashboard.draw(dataTable);
        }

        else{
            chart_json_simple = value[1];
            chart_json_simple.options.width = 800;
            chart_json_simple.options.height = 600;
            chart_json_simple.containerId = "googlechart_view_"+chart_id;

            chart_json_simple.dataTable = dataTable;
            var originalChart_simple = new google.visualization.ChartWrapper(
                chart_json_simple
            );

            originalChart_simple.draw();

            if (charts_array.length == 2){
                chart_json_img.dataTable = dataTable;
                var imageChart_simple = new google.visualization.ChartWrapper(
                    chart_json_img
                );
                imageChart_simple.draw();
            }
        }
    });
});