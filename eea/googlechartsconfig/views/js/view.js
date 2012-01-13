jQuery(document).ready(function($){

    $("ul.googlechart_tabs").tabs("div.googlechart_tab_panes > div");
    jQuery(googlechart_config_array).each(function(index, value){
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

        /*chart_json['containerId']="googlechart_image_view_"+chart_id;
        chart_json.chartType = "ImageChart";
        var chart = new google.visualization.ChartWrapper(chart_json);
        chart.draw();*/
    });
});