jQuery(document).bind("multiplesConfigEditorReady", function(evt, view){
    var current_widget = ".googlechart-widget-" + view;
    jQuery(current_widget + " select").change(function(){
        if (view === "add"){
            jQuery(".add-edit-widget-dialog input.textType[name*='charts']").attr("value", "[]");
            jQuery(".add-edit-widget-dialog input.textType[name*='settings']").attr("value", "{}");
        }
        jQuery(".multiples-config").empty();
        if ((jQuery(current_widget + " select").attr("value") !== undefined) &&
            (jQuery(current_widget + " select").attr("value") !== "")){
            jQuery("<div>")
                .addClass("multiples-base-preview")
                .appendTo(".multiples-config");

            jQuery("<div>")
                .addClass("multiples-matrix")
                .appendTo(".multiples-config");

            chart_path = jQuery(current_widget + " select").attr("value").split("/");
            var chart_id = chart_path[chart_path.length - 1];
            var absolute_url = jQuery(".multiples-config").attr("absolute_url");
            jQuery("<iframe>")
                .addClass("base-chart-iframe")
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
                            .addClass("small-container")
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
                                        .addClass("small-container")
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
                    var options = {
                        chartAreaWidth: 65,
                        chartAreaHeight: 65,
                        chartAreaLeft: 1,
                        chartAreaTop: 1
                    };
                    var options_str = encodeURIComponent(JSON.stringify(options));
                    jQuery("<iframe>")
                        .addClass("small-chart")
                        .attr("src", absolute_url + "/chart-full?chart=" + chart_id + "&width=67&height=67&interactive=false&columns=" + columns_str + "&options=" + options_str + "&title=''")
                        .appendTo(container);
                    var overlayed = jQuery("<div>")
                        .addClass("multiples-matrix-item-overlay")
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
        .appendTo("#multiples-resize");

    var options_str = encodeURIComponent(JSON.stringify(chartSettings));
    jQuery("<iframe>")
        .css("width",chartSettings.width+"px")
        .css("height",chartSettings.height+"px")
        .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width="+chartSettings.width+"&height="+chartSettings.height+"&interactive=false" + "&options=" + options_str + "&title='xxx'")
        .appendTo(".chartPreview");
    jQuery("<div>")
        .addClass("chartAreaResizable")
        .css("width",chartSettings.chartAreaWidth - 2  + "px")
        .css("height",chartSettings.chartAreaHeight - 2 + "px")
        .css("top",chartSettings.chartAreaTop - 1+ "px")
        .css("left",chartSettings.chartAreaLeft - 1 + "px")
        .appendTo(".chartPreview")
        .draggable({
            containment:".chartPreview",
            stop: function(){
                var chartSettings = jQuery("#multiples-resize").data("chartSettings");
                chartSettings.chartAreaTop = jQuery(this).position().top;
                chartSettings.chartAreaLeft = jQuery(this).position().left;
                redrawPreviewChart(base_chart, chartSettings);
            },
            drag: function(){
                jQuery(".settingsDiv .chartAreaTop").attr("value", jQuery(this).position().top);
                jQuery(".settingsDiv .chartAreaLeft").attr("value", jQuery(this).position().left);
            }
        })
        .resizable({
            containment:".chartPreview",
            stop: function(){
                var chartSettings = jQuery("#multiples-resize").data("chartSettings");
                chartSettings.chartAreaWidth = jQuery(this).width();
                chartSettings.chartAreaHeight = jQuery(this).height();
                redrawPreviewChart(base_chart, chartSettings);
            },
            resize: function(){
                jQuery(".settingsDiv .chartAreaWidth").attr("value", jQuery(this).width());
                jQuery(".settingsDiv .chartAreaHeight").attr("value", jQuery(this).height());
            }
        });
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
            chartAreaWidth: 98,
            chartAreaHeight: 98,
            chartAreaLeft: 1,
            chartAreaTop: 1,
            chartTitle: ""
        };
        jQuery.extend(true, chartSettings, common_settings);
        var previewDiv = jQuery("<div>")
                            .attr("id", "multiples-resize")
                            .data("chartSettings", chartSettings);
        var controlsDiv = jQuery("<div class='preview-controls'> </div>");
        controlsDiv.append("<input value='Cancel' class='btn btn-inverse' type='button'/>");
        controlsDiv.append("<input value='Save' class='btn btn-success' type='button'/>");
        controlsDiv.append("<div style='clear:both'> </div>");

        previewDiv.append(controlsDiv);
        var settingsDiv = jQuery("<div>")
            .addClass("settingsDiv")
            .appendTo(previewDiv);
        settingsDiv.append("<label>Area size</label>");
        settingsDiv.append("<input class='chartsize chartWidth' type='number'/>");
        settingsDiv.append("<span>x</span>");
        settingsDiv.append("<input class='chartsize chartHeight' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        settingsDiv.append("<label>Chart size</label>");
        settingsDiv.append("<input class='chartsize chartAreaWidth' type='number'/>");
        settingsDiv.append("<span>x</span>");
        settingsDiv.append("<input class='chartsize chartAreaHeight' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        settingsDiv.append("<label>Chart position</label>");
        settingsDiv.append("<span>Left: </span>");
        settingsDiv.append("<input class='chartsize chartAreaLeft' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");
        settingsDiv.append("<span>Top: </span>");
        settingsDiv.append("<input class='chartsize chartAreaTop' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        jQuery(".chartsize").change(function(){
            console.log("changed");
        });
        previewDiv.dialog({
            dialogClass: "googlechart-dialog googlechart-preview-dialog",
            modal: true,
            width: chartSettings.width + 200,
            height: chartSettings.height + 100,
            title: "Size adjustments",
            resize: function(){
                var elem = jQuery(this);
                var tmp_width = elem.width();
                var tmp_height = elem.height();

                var prevWidth = parseInt(jQuery(".settingsDiv").attr("previousWidth"), 10);
                var prevHeight = parseInt(jQuery(".settingsDiv").attr("previousHeight"), 10);
                jQuery(".settingsDiv .chartWidth").attr("value", parseInt(chartSettings.width - prevWidth + tmp_width, 10));
                jQuery(".settingsDiv .chartHeight").attr("value", parseInt(chartSettings.height - prevHeight + tmp_height, 10));
            },
            resizeStart: function(){
                var elem = jQuery(this);
                jQuery(".settingsDiv").attr("previousWidth", elem.width());
                jQuery(".settingsDiv").attr("previousHeight", elem.height());
            },
            resizeStop: function(){
                var prevWidth = chartSettings.width;
                var prevHeight = chartSettings.height;
                chartSettings.width = parseInt(jQuery(".settingsDiv .chartWidth").attr("value"), 10);
                chartSettings.height = parseInt(jQuery(".settingsDiv .chartHeight").attr("value"), 10);

                chartSettings.chartAreaLeft = chartSettings.chartAreaLeft / prevWidth * chartSettings.width;
                chartSettings.chartAreaWidth = chartSettings.chartAreaWidth / prevWidth * chartSettings.width;
                chartSettings.chartAreaTop = chartSettings.chartAreaTop / prevHeight * chartSettings.height;
                chartSettings.chartAreaHeight = chartSettings.chartAreaHeight / prevHeight * chartSettings.height;

                redrawPreviewChart(base_chart, chartSettings);
            },
            create: function(){
            },
            open: function(){
                redrawPreviewChart(base_chart, chartSettings);

                jQuery(".settingsDiv .chartWidth").attr("value", chartSettings.width);
                jQuery(".settingsDiv .chartHeight").attr("value", chartSettings.height);
                jQuery(".settingsDiv .chartAreaWidth").attr("value", chartSettings.chartAreaWidth);
                jQuery(".settingsDiv .chartAreaHeight").attr("value", chartSettings.chartAreaHeight);
                jQuery(".settingsDiv .chartAreaTop").attr("value", chartSettings.chartAreaTop);
                jQuery(".settingsDiv .chartAreaLeft").attr("value", chartSettings.chartAreaLeft);
                jQuery(".preview-controls .btn-success").bind("click", function(){
                    var widget = jQuery("#multiples_"+base_chart).data("widget");
                    widget.settings.settings = JSON.stringify(chartSettings);
                    jQuery("#multiples-resize").dialog("close");
                    widget.save(false, true);
                });
                jQuery(".preview-controls .btn-inverse").bind("click", function(){
                    jQuery("#multiples-resize").dialog("close");
                });
                jQuery(".chartsize").change(function(){
                    var prevWidth = chartSettings.width;
                    var prevHeight = chartSettings.height;
                    chartSettings.width = parseInt(jQuery(".settingsDiv .chartWidth").attr("value"), 10);
                    chartSettings.height = parseInt(jQuery(".settingsDiv .chartHeight").attr("value"), 10);
                    if (prevWidth === chartSettings.width && prevHeight === chartSettings.height){
                        chartSettings.chartAreaWidth = parseInt(jQuery(".settingsDiv .chartAreaWidth").attr("value"), 10);
                        chartSettings.chartAreaHeight = parseInt(jQuery(".settingsDiv .chartAreaHeight").attr("value"), 10);
                        chartSettings.chartAreaTop = parseInt(jQuery(".settingsDiv .chartAreaTop").attr("value"), 10);
                        chartSettings.chartAreaLeft = parseInt(jQuery(".settingsDiv .chartAreaLeft").attr("value"), 10);
                    }
                    else {
                        chartSettings.chartAreaLeft = parseInt(chartSettings.chartAreaLeft / prevWidth * chartSettings.width, 10);
                        chartSettings.chartAreaWidth = parseInt(chartSettings.chartAreaWidth / prevWidth * chartSettings.width, 10);
                        chartSettings.chartAreaTop = parseInt(chartSettings.chartAreaTop / prevHeight * chartSettings.height, 10);
                        chartSettings.chartAreaHeight = parseInt(chartSettings.chartAreaHeight / prevHeight * chartSettings.height, 10);
                        jQuery(".settingsDiv .chartAreaWidth").attr("value", chartSettings.chartAreaWidth);
                        jQuery(".settingsDiv .chartAreaHeight").attr("value", chartSettings.chartAreaHeight);
                        jQuery(".settingsDiv .chartAreaTop").attr("value", chartSettings.chartAreaTop);
                        jQuery(".settingsDiv .chartAreaLeft").attr("value", chartSettings.chartAreaLeft);
                        jQuery("#multiples-resize").dialog("option", "width", chartSettings.width + 200);
                        jQuery("#multiples-resize").dialog("option", "height", chartSettings.height + 100);
                    }

                    redrawPreviewChart(base_chart, chartSettings);
                });

            }
        });
      });

    container.empty();
    var settings = {
        width: 100,
        height: 100,
        chartAreaWidth: 98,
        chartAreaHeight: 98,
        chartAreaLeft: 1,
        chartAreaTop: 1,
        chartTitle: ""
    };
    jQuery.extend(settings, common_settings);
    var options_str = encodeURIComponent(JSON.stringify(settings));
    var absolute_url = container.attr("absolute_url");
    jQuery.each(charts, function(idx, columns){
        columns_str = encodeURIComponent(JSON.stringify(columns));
        jQuery("<iframe>")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width=" + settings.width + "&height=" + settings.height + "&interactive=false&columns=" + columns_str + "&options=" + options_str + "&title='xxx'")
            .appendTo(container);
    });

});
