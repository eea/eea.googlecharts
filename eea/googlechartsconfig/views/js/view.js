var current_chart_id;

function drawChart(value){
        chart_id = value[0];
        chart_json = value[1];
        chart_columns = value[2];
        chart_filters = value[3];
        position = value[6];

        jQuery("#googlechart_filters").remove();
        jQuery("#googlechart_view").remove();
        filters = '<div id="googlechart_filters"></div>';
        view = '<div id="googlechart_view" class="googlechart"></div>';

        if (position == 0){
            jQuery(filters).appendTo('#googlechart_dashboard');
            jQuery(view).appendTo('#googlechart_dashboard');
        }
        if (position == 1){
            jQuery(filters).appendTo('#googlechart_dashboard');
            jQuery(view).appendTo('#googlechart_dashboard');
            jQuery("#googlechart_filters").attr("style","float:left");
            jQuery("#googlechart_view").attr("style","float:left");
        }
        if (position == 2){
            jQuery(view).appendTo('#googlechart_dashboard');
            jQuery(filters).appendTo('#googlechart_dashboard');
        }
        if (position == 3){
            jQuery(view).appendTo('#googlechart_dashboard');
            jQuery(filters).appendTo('#googlechart_dashboard');
            jQuery("#googlechart_filters").attr("style","float:left");
            jQuery("#googlechart_view").attr("style","float:left");
        }

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
        chart_json.options.width = 600;
        chart_json.options.height = 400;
        chart_json.dataTable = [];

        chart_json.containerId = "googlechart_view";
        var chart = new google.visualization.ChartWrapper(
            chart_json
        );

        filters_array = [];
        if (chart_filters){
            jQuery.each(chart_filters,function(key, value){
                filters_div = "googlechart_filters";
                filter_div_id = "googlechart_filters_"+key;
                filter_div = "<div id='"+filter_div_id+"'></div>";
                jQuery(filter_div).appendTo("#"+filters_div);
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
              document.getElementById('googlechart_dashboard'));

            dashboard.bind(filters_array, chart);

            dashboard.draw(dataTable);
        }

        else{
            chart.setDataTable(dataTable);
            chart.draw();
        }

        width = value[4];
        height = value[5];
        name = value[1].options.title;
        configjson = JSON.stringify(value[1]);
        columns = JSON.stringify(value[2]);
        filters = JSON.stringify(value[3]);
        filterposition = value[6];
        params = "?json="+encodeURIComponent(configjson);
        params += "&columns="+encodeURIComponent(columns);
        params += "&width="+width;
        params += "&height="+height;
        params += "&name="+encodeURIComponent(name);
        params += "&filters="+encodeURIComponent(filters);
        params += "&filterposition="+filterposition;
        jQuery("#fullsize-button").attr("href", "chart-full"+params);
        jQuery("#fullsize-button").fancybox({type:'iframe', width:parseInt(width, 10), height:parseInt(height, 10), autoDimensions:false});
}

jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    jQuery(".googlechart_tabs").delegate("li", "click", function(){
        if (jQuery(this).attr("chart_id") !== current_chart_id){
            current_chart_id = jQuery(this).attr("chart_id");
            jQuery(".googlechart_tabs li").removeClass("current");
            jQuery(this).addClass("current");

            var index_to_use;
            jQuery(googlechart_config_array).each(function(index, value){
                if (value[0] == current_chart_id){
                    index_to_use = index;
                }
            });

            jQuery("#googlechart_filters").html('');
            jQuery("#googlechart_view").html('');

            drawChart(googlechart_config_array[index_to_use]);
        }
    });

    value=googlechart_config_array[0];
    current_chart_id = value[0];
    drawChart(value);
});