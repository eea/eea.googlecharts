function drawChart(value, other_options){
    var other_settings = {
        merged_rows : '',
        available_columns : '',
        googlechart_config_array: [],
        GoogleChartsConfig : null,
        main_title : '',
        baseurl : '',
        qr_pos : '',
        qr_size : '',
        wm_pos : '',
        wm_path : '',
        vhash : '',
        name : '',
        isInline : 'False'
    };
    jQuery.extend(other_settings, other_options);

    var embedchart_id = value[0];
    var embedchart_json = value[1];
    var embedchart_columns = value[2];
    var embedchart_filters = value[3];
    var embedchart_width = value[4];
    var embedchart_height = value[5];
    var embedchart_filterposition = value[6];
    var embedchart_options = value[7];
    var embedchart_sortFilter = value[9];
    var embedchart_hasPNG = (value[10]==='True'?true:false);
    var embedchart_row_filters_str = value[11];
    var embedchart_sortBy = value[12];
    var embedchart_sortAsc = true;

    var query_params = getQueryParams("#googlechart_table_" + other_settings.vhash);
    patched_each(embedchart_filters, function(key, value){
        if (query_params.rowFilters[key] !== undefined){
            value.defaults = query_params.rowFilters[key];
        }
    });

    if (query_params.sortFilter !== undefined){
        embedchart_sortFilter = query_params.sortFilter[0];
    }

    var sortAsc_str = value[13];
    if (sortAsc_str === 'desc'){
        embedchart_sortAsc = false;
    }

    var embedchart_columnFilters = value[14];
    var embedchart_unpivotSettings = value[15];

    jQuery("#googlechart_filters_"+other_settings.vhash).remove();
    jQuery("#googlechart_view_"+other_settings.vhash).remove();
    jQuery("#googlechart_table_"+other_settings.vhash).remove();
    var filters = '<div id="googlechart_filters_'+other_settings.vhash+'" class="googlechart_filters"></div>';
    var view = '<div id="googlechart_view_'+other_settings.vhash+'" class="googlechart embedded-chart"></div>';
    var googlechart_table;
    if (embedchart_filterposition === 0){
        googlechart_table = ""+
            "<div id='googlechart_table_"+other_settings.vhash+"' class='googlechart_table googlechart_table_top'>"+
                "<div id='googlechart_top_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_"+other_settings.vhash+"' class='googlechart_filters'></div>"+
                "<div id='googlechart_view_"+other_settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 1){
        googlechart_table = ""+
            "<div id='googlechart_table_"+other_settings.vhash+"' class='googlechart_table googlechart_table_left'>"+
                "<div id='googlechart_top_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_filters_"+other_settings.vhash+"' class='embedded-side-filters googlechart_filters googlechart_filters_side'></div>"+
                "<div id='googlechart_view_"+other_settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 2){
        googlechart_table = ""+
            "<div id='googlechart_table_"+other_settings.vhash+"' class='googlechart_table googlechart_table_bottom'>"+
                "<div id='googlechart_top_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_"+other_settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters_"+other_settings.vhash+"' class='googlechart_filters'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    if (embedchart_filterposition === 3){
        googlechart_table = ""+
            "<div id='googlechart_table_"+other_settings.vhash+"' class='googlechart_table googlechart_table_right'>"+
                "<div id='googlechart_top_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_view_"+other_settings.vhash+"' class='googlechart embedded-chart'></div>"+
                "<div id='googlechart_filters_"+other_settings.vhash+"' class='embedded-side-filters googlechart_filters googlechart_filters_side'></div>"+
                "<div style='clear: both'></div>" +
                "<div id='googlechart_bottom_images_"+other_settings.vhash+"'></div>"+
                "<div style='clear: both'></div>" +
            "</div>";
    }
    jQuery(googlechart_table).appendTo('#googlechart_dashboard_'+other_settings.vhash);
    jQuery('#googlechart_dashboard_'+other_settings.vhash).data('other_settings', other_settings);

    jQuery("#googlechart_view_"+other_settings.vhash).attr("chart_id", embedchart_id);
    jQuery("#googlechart_view_"+other_settings.vhash).addClass("googlechart_view");
    if (other_settings.isInline !== 'True'){
        var chart_url = other_settings.baseurl + "#tab-" + embedchart_id;
        putImageDivInPosition("googlechart_qr_"+other_settings.vhash, other_settings.qr_pos, other_settings.vhash);

        var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs="+other_settings.qr_size+"x"+other_settings.qr_size+"&chl=" + encodeURIComponent(chart_url);
        var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";

        if (other_settings.qr_pos !== "Disabled"){
            jQuery(googlechart_qr).appendTo("#googlechart_qr_"+other_settings.vhash);
            jQuery("#googlechart_qr_"+other_settings.vhash).removeClass("eea-googlechart-hidden-image");
        }

        putImageDivInPosition("googlechart_wm_"+other_settings.vhash, other_settings.wm_pos, other_settings.vhash);

        var googlechart_wm = "<img alt='Watermark' src='" + other_settings.wm_path + "'/>";
        if (other_settings.wm_pos !== "Disabled"){
            jQuery(googlechart_wm).appendTo("#googlechart_wm_"+other_settings.vhash);
            jQuery("#googlechart_wm_"+other_settings.vhash).removeClass("eea-googlechart-hidden-image");
        }
    }
    var row_filters = {};
    if (embedchart_row_filters_str.length > 0){
        row_filters = JSON.parse(embedchart_row_filters_str);
    }

    var columnsFromSettings = getColumnsFromSettings(embedchart_columns);

    var tmp_columns_and_rows = getAvailable_columns_and_rows(embedchart_unpivotSettings, other_settings.available_columns, other_settings.merged_rows);

    var options = {
        originalTable : other_settings.merged_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : tmp_columns_and_rows.available_columns,
        unpivotSettings : embedchart_unpivotSettings,
        filters : row_filters
    };

    var transformedTable = transformTable(options);

    other_settings.merged_rows = tmp_columns_and_rows.all_rows;
    other_settings.available_columns = tmp_columns_and_rows.available_columns;

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : embedchart_sortBy,
        sortAsc : embedchart_sortAsc,
        preparedColumns : embedchart_columns.prepared,
        enableEmptyRows : embedchart_options.enableEmptyRows,
        chartType : embedchart_json.chartType,
        focusTarget : embedchart_json.options.focusTarget
    };

    var tableForChart = prepareForChart(options);

    embedchart_json.options.title = other_settings.name + " — " + other_settings.main_title;

    var googlechart_params = {
        chartDashboard : 'googlechart_dashboard_'+other_settings.vhash,
        chartViewDiv : 'googlechart_view_'+other_settings.vhash,
        chartFiltersDiv : 'googlechart_filters_'+other_settings.vhash,
        chartId : embedchart_id,
        chartJson : embedchart_json,
        chartDataTable : tableForChart,
        chartFilters : embedchart_filters,
        chartWidth : embedchart_width,
        chartHeight : embedchart_height,
        chartFilterPosition : embedchart_filterposition,
        chartOptions : embedchart_options,
        availableColumns : transformedTable.available_columns,
        sortFilter : embedchart_sortFilter,
        columnFilters : embedchart_columnFilters,
        columnTypes: transformedTable.properties,
        originalTable : other_settings.merged_rows,
        visibleColumns : columnsFromSettings.columns
    };
    drawGoogleChart(googlechart_params);

}
