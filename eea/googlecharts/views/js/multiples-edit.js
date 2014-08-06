jQuery(document).bind("multiplesConfigEditorReady", function(evt, view){
    var current_widget = ".googlechart-widget-" + view;
    jQuery(current_widget + " select").change(function(){
        if (view === "add"){
            jQuery(".add-edit-widget-dialog input.textType[name*='charts']").attr("value", "[]");
            jQuery(".add-edit-widget-dialog input.textType[name*='settings']").attr("value", "{}");
        }
        jQuery(".multiples-config").empty();
        jQuery(".multiples-config")
           .css("width", "100%")
           .css("height", "100%");
        if ((jQuery(current_widget + " select").attr("value") !== undefined) &&
            (jQuery(current_widget + " select").attr("value") !== "")){
            jQuery("<div>")
                .addClass("multiples-base-preview")
                .css("width","300px")
                .css("height","300px")
                .css("float", "left")
                .appendTo(".multiples-config");

            jQuery("<div>")
                .addClass("multiples-matrix")
                .css("float", "left")
                .appendTo(".multiples-config");

            chart_path = jQuery(current_widget + " select").attr("value").split("/");
            var chart_id = chart_path[chart_path.length - 1];
            var absolute_url = jQuery(".multiples-config").attr("absolute_url");
            jQuery("<iframe>")
                .css("width","300px")
                .css("height","300px")
                .attr("src", absolute_url + "/chart-full?chart=" + chart_id + "&width=300&height=300")
                .appendTo(".multiples-base-preview");
            jQuery.getJSON(absolute_url + "/googlechart.get_charts", function (data){
                chart_path = jQuery(current_widget + " select").attr("value").split("/");
                var chart_id = chart_path[chart_path.length - 1];
                var base_chart_settings;
                jQuery.each(data.charts, function(idx, chart){
                    if (chart.id === chart_id){
                        base_chart_settings = chart;
                    }
                });
                var columnsFromSettings = getColumnsFromSettings(JSON.parse(base_chart_settings.columns));
                var options = {
                    originalTable : all_rows,
                    normalColumns : columnsFromSettings.normalColumns,
                    pivotingColumns : columnsFromSettings.pivotColumns,
                    valueColumn : columnsFromSettings.valueColumn,
                    availableColumns : getAvailable_columns_and_rows(base_chart_settings.unpivotsettings, available_columns, all_rows).available_columns,
                    unpivotSettings : base_chart_settings.unpivotsettings || {},
                    filters : base_chart_settings.rowFilters || null
                };
                var transformedTable = transformTable(options);
                base_chart_config = JSON.parse(base_chart_settings.config);
                base_chart_options = JSON.parse(base_chart_settings.options);
                columns_config = JSON.parse(base_chart_settings.columns);

                var originalCols = [];
                var allCols = [];
                for (var i = 0; i < columnsFromSettings.columns.length; i++){
                    originalCols.push({id:columnsFromSettings.columns[i], type:transformedTable.properties[columnsFromSettings.columns[i]].columnType});
                }

                patched_each(transformedTable.properties,function(col_id, col_opt){
                    allCols.push({id:col_id, type:col_opt.columnType});
                });
                allCols.sort(function(a, b){
                    if (a.id > b.id){
                        return 1;
                    }
                    if (a.id < b.id){
                        return -1;
                    }
                    if (a.id === b.id){
                        return 0;
                    }
                });
                var column_combinations = [];
                function build_column_combinations(pos, orig_cols, all_cols, new_cols, column_combinations){
                    if (pos === orig_cols.length){
                        column_combinations.push(new_cols.slice(0));
                        jQuery("<div>")
                            .css("float","left")
                            .css("width","67px")
                            .css("height","67px")
                            .css("border", "1px solid gray")
                            .css("position", "relative")
                            .data("columns", column_combinations[column_combinations.length - 1])
                            .appendTo(".multiples-matrix");
                        return;
                    }
                    if( pos < orig_cols.length){
                        jQuery("<div>")
                            .css("clear","both")
                            .appendTo(".multiples-matrix");
                    }
                    for (var i = 0; i < all_cols.length; i++){
                        if (orig_cols[pos].type === all_cols[i].type){
                            if (jQuery.inArray(all_cols[i].id, new_cols) === -1){
                                new_cols.push(all_cols[i].id);
                                build_column_combinations(pos + 1, orig_cols, all_cols, new_cols, column_combinations);
                                new_cols.pop();
                            }
                            else {
                                if (pos === orig_cols.length - 1){
                                    jQuery("<div>")
                                        .css("float","left")
                                        .css("width","67px")
                                        .css("height","67px")
                                        .css("border", "1px solid gray")
                                        .css("position", "relative")
                                        .appendTo(".multiples-matrix");
                                }
                            }
                        }
                    }
                }
                build_column_combinations(0, originalCols, allCols, [], column_combinations);
                var loaded_settings = jQuery(".add-edit-widget-dialog input.textType[name*='charts']").attr("value");
                jQuery.each(column_combinations, function(idx, tmp_columns){
                    var container = jQuery(".multiples-matrix").find("div").filter(function(){return $(this).data("columns") === tmp_columns;});
                    columns_str = encodeURIComponent(JSON.stringify(tmp_columns));
                    var columns_title = "";
                    for (var i = 0; i < tmp_columns.length; i++){
                        columns_title += tmp_columns[i];
                        if (i < tmp_columns.length - 1){
                            columns_title += ", ";
                        }
                    }
                    jQuery("<iframe>")
                        .css("width","67px")
                        .css("height","67px")
                        .css("position","absolute")
                        .css("z-index",1)
                        .attr("src", absolute_url + "/chart-full?chart=" + chart_id + "&width=67&height=67&maximized=true&columns=" + columns_str)
                        .appendTo(container);
                    var overlayed = jQuery("<div>")
                        .addClass("multiples-matrix-item-overlay")
                        .css("width","67px")
                        .css("height","67px")
                        .css("position","absolute")
                        .css("top",0)
                        .css("left",0)
                        .css("z-index",2)
                        .css("cursor","pointer")
                        .attr("title", columns_title)
                        .appendTo(container)
                        .click(function(){
                            if (jQuery(this).hasClass("selected")){
                                jQuery(this)
                                    .removeClass("selected")
                                    .removeClass("eea-icon")
                                    .removeClass("eea-icon-check");
                            }
                            else{
                                jQuery(this)
                                    .addClass("selected")
                                    .addClass("eea-icon")
                                    .addClass("eea-icon-check");
                            }
                            var selected_columns = [];
                            jQuery.each(jQuery(".multiples-matrix-item-overlay.selected"), function(idx, item){
                                selected_columns.push(jQuery(item).parent().data("columns"));
                            });
                            jQuery(".add-edit-widget-dialog input.textType[name*='charts']").attr("value", JSON.stringify(selected_columns));
                        });
                    if (loaded_settings.indexOf(JSON.stringify(tmp_columns)) > -1){
                        overlayed
                            .addClass("selected eea-icon eea-icon-check");
                    }
                });
            });
        }
    });
    jQuery(current_widget + " select:visible").trigger("change");
});

function redrawPreviewChart(base_chart, chartSettings){
    var container = jQuery(".multiples-preview[base_chart='" + base_chart + "']");
    var absolute_url = container.attr("absolute_url");
    jQuery(".chartPreview").remove();
    jQuery("<div>")
        .addClass("chartPreview")
        .width(chartSettings.width)
        .height(chartSettings.height)
        .css("border", "2px solid green")
        .appendTo("#multiples-resize");

    jQuery("<iframe>")
        .css("width",chartSettings.width+"px")
        .css("height",chartSettings.height+"px")
        .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width="+chartSettings.width+"&height="+chartSettings.height+"&maximized=true")
        .appendTo(".chartPreview");

}

jQuery(document).bind("multiplesEditPreviewReady", function(evt, base_chart, charts, common_settings){
    var container = jQuery(".multiples-preview[base_chart='" + base_chart + "']");
    var header = container.closest(".dashboard-chart").find(".dashboard-header");
    header.find(".eea-icon-gear").remove();
    jQuery("<span>")
      .attr('title', 'Size adjustments')
      .addClass('eea-icon daviz-menuicon').addClass('eea-icon-gear')
      .prependTo(header)
      .click(function(){
        jQuery("#multiples-resize").remove();
        var chartSettings = {
            width: 100,
            height: 100,
            chartWidth: "100%",
            chartHeight: "100%",
            chartLeft: "0%",
            chartTop: "0%",
            chartTitle: ""
        };
        jQuery.extend(true, chartSettings, common_settings);
        var previewDiv = jQuery("<div>")
                            .attr("id", "multiples-resize");
        controlsDiv = jQuery("<div class='preview-controls'> </div>");
        controlsDiv.append("<input class='chartsize chartWidth' type='number'/>");
        controlsDiv.append("<span>x</span>");
        controlsDiv.append("<input class='chartsize chartHeight' type='number'/>");
        controlsDiv.append("<span>px</span>");
        controlsDiv.append("<input value='Cancel' class='btn btn-inverse' type='button'/>");
        controlsDiv.append("<input value='Save' class='btn btn-success' type='button'/>");
        previewDiv.append(controlsDiv);
        previewDiv.dialog({
            dialogClass: "googlechart-dialog googlechart-preview-dialog",
            modal: true,
            width: chartSettings.width + 150,
            height: chartSettings.height + 100,
            title: "Size adjustments",
            resize: function(){
                var elem = jQuery(this);
                var tmp_width = elem.width();
                var tmp_height = elem.height();

                var prevWidth = jQuery(".preview-controls").attr("previousWidth");
                var prevHeight = jQuery(".preview-controls").attr("previousHeight");
                jQuery(".preview-controls .chartWidth").attr("value", chartSettings.width - prevWidth + tmp_width);
                jQuery(".preview-controls .chartHeight").attr("value", chartSettings.height - prevHeight + tmp_height);
            },
            resizeStart: function(){
                var elem = jQuery(this);
                jQuery(".preview-controls").attr("previousWidth", elem.width());
                jQuery(".preview-controls").attr("previousHeight", elem.height());
            },
            resizeStop: function(){
                chartSettings.width = parseInt(jQuery(".preview-controls .chartWidth").attr("value"), 10);
                chartSettings.height = parseInt(jQuery(".preview-controls .chartHeight").attr("value"), 10);

                redrawPreviewChart(base_chart, chartSettings);
            },
            create: function(){
            },
            open: function(){
                redrawPreviewChart(base_chart, chartSettings);

                jQuery(".preview-controls .chartWidth").attr("value", chartSettings.width);
                jQuery(".preview-controls .chartHeight").attr("value", chartSettings.height);
                jQuery(".preview-controls .btn-success").bind("click", function(){
                    var widget = jQuery("#multiples_"+base_chart).data("widget");
                    widget.settings.settings = JSON.stringify(chartSettings);
                    jQuery("#multiples-resize").dialog("close");
                    widget.save(false, true);
                });
                jQuery(".preview-controls .btn-inverse").bind("click", function(){
                    jQuery("#multiples-resize").dialog("close");
                });
            }
        });
      });

    container.empty();
    var settings = {
        width: 100,
        height: 100,
        chartWidth: "100%",
        chartHeight: "100%",
        chartLeft: "0%",
        chartTop: "0%",
        chartTitle: ""
    };
    jQuery.extend(settings, common_settings);
    var absolute_url = container.attr("absolute_url");
    jQuery.each(charts, function(idx, columns){
        columns_str = JSON.stringify(columns);
        jQuery("<iframe>")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width=" + settings.width + "&height=" + settings.height + "&maximized=true&columns=" + columns_str)
            .appendTo(container);
    });

});
