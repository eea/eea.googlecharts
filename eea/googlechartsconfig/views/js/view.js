jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    jQuery("ul.googlechart_tabs").tabs("div.googlechart_tab_panes > div");

    jQuery(googlechart_config_array).each(function(index, value){
        jQuery("#googlechart_types_tabs_"+value[0]).tabs("#googlechart_types_panes_"+value[0]+" > div");

        chart_id = value[0]
        chart_json = value[1]
        chart_columns = value[2]
        chart_json['containerId']="googlechart_view_"+chart_id;

        columnlabels = []
        jQuery(chart_columns).each(function(index,chart_token){
            columnlabels.push(available_columns[chart_token]);
        });
        dataTable = [];
        dataTable.push(columnlabels);
        jQuery(merged_rows.items).each(function(index, merged_row){
            row = []
            jQuery(chart_columns).each(function(index,chart_token){
                row.push(merged_row[chart_token]);
            });
            dataTable.push(row);
        });
        chart_json.options.width = 800;
        chart_json.options.height = 600;

        chart_json.dataTable = dataTable;
        var chart = new google.visualization.ChartWrapper(chart_json);
        chart.draw();

        hasImg = false;
        chartType = chart_json.chartType;
        switch(chartType){
            case 'BarChart':
                hasImg = true;
                chart_json.chartType = "ImageChart";
                if (chart_json.options.isStacked){
                    chart_json.options.cht = "bhs";
                }
                else{
                    chart_json.options.cht = "bhg";
                }
                break;
            case 'ColumnChart':
                hasImg = true;
                chart_json.chartType = "ImageChart";
                if (chart_json.options.isStacked){
                    chart_json.options.cht = "bvs";
                }
                else{
                    chart_json.options.cht = "bvg";
                }
                break;
            case 'PieChart':
                hasImg = true;
                chart_json.chartType = "ImageChart";
                if (chart_json.options.is3D){
                    chart_json.options.cht = "p3";
                }
                else{
                    chart_json.options.cht = "p";
                }
        }
        if (hasImg){
            chart_json['containerId']="googlechart_image_view_"+chart_id;
            var chart = new google.visualization.ChartWrapper(chart_json);
            chart.draw();
        }
        else{
            jQuery("#googlechart_types_tabs_"+value[0]).hide()
        }
    });
});