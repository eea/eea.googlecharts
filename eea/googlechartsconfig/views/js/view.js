jQuery(document).ready(function($){
    if (typeof(googlechart_config_array) == 'undefined'){
        return;
    }
    jQuery(".googlechart_tab_panes").delegate("a.fullsize-button", "hover", function(){
        var width, height, name, configjson, columns;
        id = jQuery(this).closest('.googlechart').attr('chart_id');
        var aobj = this;
        jQuery(googlechart_config_array).each(function(index, value){
            if (value[0] == id){
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
                jQuery(aobj).attr("href", "chart-full"+params);
                jQuery(aobj).fancybox({type:'iframe', width:parseInt(width, 10), height:parseInt(height, 10), autoDimensions:false});
            }
        });
    });

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
        chart_json.options.width = 600;
        chart_json.options.height = 400;
        chart_json.dataTable = [];

        chart_json.containerId = "googlechart_view_"+chart_id;
        var chart = new google.visualization.ChartWrapper(
            chart_json
        );

        filters_array = [];
        if (chart_filters){
            jQuery.each(chart_filters,function(key, value){
                filters_div = "googlechart_filters_"+chart_id;
                filter_div_id = "googlechart_filters_"+chart_id+"_"+key;
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
              document.getElementById('googlechart_types_panes_'+chart_id));
            dashboard.bind(filters_array, chart);

            dashboard.draw(dataTable);
        }

        else{
            chart.setDataTable(dataTable);
            chart.draw();
        }
    });
});