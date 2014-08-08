jQuery(document).bind("multiplesConfigEditorReady", function(evt, view){
    var current_widget = ".googlechart-widget-" + view;
    jQuery(current_widget + " select").change(function(){
        if (view === "add"){
            jQuery(".add-edit-widget-dialog input.textType[name*='multiples_charts']").attr("value", "[]");
            jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", "{}");
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
                    if (transformedTable.available_columns[a.id] > transformedTable.available_columns[b.id]){
                        return 1;
                    }
                    if (transformedTable.available_columns[a.id] < transformedTable.available_columns[b.id]){
                        return -1;
                    }
                    if (transformedTable.available_columns[a.id] === transformedTable.available_columns[b.id]){
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
                    if (pos < orig_cols.length){
                        jQuery("<div>")
                            .css("clear","both")
                            .appendTo(".multiples-matrix");
                        if (pos > 0){
                            var row_label = transformedTable.available_columns[new_cols[pos - 1]];
                            if (pos < orig_cols.length - 1){
                                row_label = "Column: " + transformedTable.available_columns[orig_cols[pos - 1].id] + " replaced with " + row_label;
                            }
                            jQuery("<div>")
                                .addClass("matrix-row-header-label")
                                .addClass("matrix-row-header-level-" + (orig_cols.length - pos - 1))
                                .text(row_label)
                                .attr("title", row_label)
                                .appendTo(".multiples-matrix");
                        }
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
                labels_for_matrix = [];
                for (i = 0; i < column_combinations[0].length; i++){
                    labels_for_matrix.push([]);
                }
                for (i = 0; i < column_combinations.length; i++){
                    for (var j = 0; j < column_combinations[i].length; j++){
                        if (jQuery.inArray(transformedTable.available_columns[column_combinations[i][j]], labels_for_matrix[j]) === -1){
                            labels_for_matrix[j].push(transformedTable.available_columns[column_combinations[i][j]]);
                        }
                    }
                }
                for (i = 0; i < labels_for_matrix.length; i++){
                    labels_for_matrix[i].sort();
                }
                var matrix_header = jQuery("<div>")
                    .addClass("matrix-column-header");
                jQuery(".multiples-matrix").prepend(matrix_header);
                jQuery("<div>")
                    .css("clear","both")
                    .insertAfter(".matrix-column-header");
                for (i = 0; i < labels_for_matrix[labels_for_matrix.length - 1].length; i++){
                    jQuery("<div>")
                        .addClass("matrix-column-header-label")
                        .text(labels_for_matrix[labels_for_matrix.length - 1][i])
                        .attr("title", labels_for_matrix[labels_for_matrix.length - 1][i])
                        .appendTo(".matrix-column-header");
                }
                var loaded_settings = jQuery(".add-edit-widget-dialog input.textType[name*='multiples_charts']").attr("value");
                jQuery.each(column_combinations, function(idx, tmp_columns){
                    var container = jQuery(".multiples-matrix").find("div").filter(function(){return $(this).data("columns") === tmp_columns;});
                    columns_str = encodeURIComponent(JSON.stringify(tmp_columns));
                    var columns_title = "Used columns: ";
                    for (var i = 0; i < tmp_columns.length; i++){
                        columns_title += transformedTable.available_columns[tmp_columns[i]];
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
                        .attr("src", absolute_url + "/chart-full?chart=" + chart_id + "&width=67&height=67&interactive=false&columns=" + columns_str + "&options=" + options_str)
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
                            jQuery(".add-edit-widget-dialog input.textType[name*='multiples_charts']").attr("value", JSON.stringify(selected_columns));
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
        .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width="+chartSettings.width+"&height="+chartSettings.height+"&interactive=false" + "&options=" + options_str)
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
    var absolute_url = container.attr("absolute_url");
    var header = container.closest(".dashboard-chart").find(".dashboard-header");
    var removeSpan = header.find(".eea-icon-trash-o");

    header.find(".eea-icon-sort-alpha-asc").remove();
    jQuery("<span>")
      .attr('title', 'Sort options')
      .addClass('eea-icon daviz-menuicon').addClass('eea-icon-sort-alpha-asc')
      .insertAfter(removeSpan)
      .click(function(){
        jQuery("#multiples-sort").remove();
        var sortDialog = jQuery("<div>")
            .attr("id","multiples-sort");
        var controlsDiv = jQuery("<div class='sort-controls'> </div>");
        controlsDiv.append("<input value='Cancel' class='btn btn-inverse' type='button'/>");
        controlsDiv.append("<input value='Apply sort' class='btn btn-success' type='button'/>");
        controlsDiv.append("<div style='clear:both'> </div>");
        controlsDiv.appendTo(sortDialog);
        sortDialog.dialog({
            dialogClass: "googlechart-dialog googlechart-preview-dialog",
            modal: true,
            title: "Sort options",
            open: function(){

                jQuery.getJSON(absolute_url + "/googlechart.get_charts", function (data){
                    var sort_options = [];
                    var base_chart_settings;
                    jQuery.each(data.charts, function(idx, chart){
                        if (chart.id === base_chart){
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
                    var titles = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_settings).chartTitle;
                    if (titles !== ""){
                        sort_options.push({value:"asc_by_title", text:"Asc by Title"});
                        sort_options.push({value:"desc_by_title", text:"Desc by Title"});
                    }
                    if (JSON.parse(base_chart_settings.config).chartType === 'PieChart'){
                        var base_columns = JSON.parse(base_chart_settings.columns).prepared;
                        var first_column = "";
                        for (var i = 0; i < base_columns.length; i++){
                            if ((base_columns[i].status === 1) && (first_column === "")){
                                first_column = base_columns[i].name;
                            }
                        }
                        for (i = 0; i < transformedTable.items.length; i++){
                            sort_options.push({value:"asc_by_row_" + transformedTable.items[i][first_column], text:"Asc by " + transformedTable.items[i][first_column]});
                            sort_options.push({value:"desc_by_row_" + transformedTable.items[i][first_column], text:"Desc by " + transformedTable.items[i][first_column]});
                        }
                    }
                    jQuery("<label>")
                        .text("Sort small multiple charts by:")
                        .appendTo("#multiples-sort");
                    jQuery("<select>")
                        .addClass("multiples-sort-types")
                        .appendTo("#multiples-sort");
                    jQuery("<option>")
                        .text("(nothing selected)")
                        .attr("selected", "selected")
                        .appendTo(".multiples-sort-types");
                    for (var i = 0; i < sort_options.length; i++){
                        jQuery("<option>")
                            .text(sort_options[i].text)
                            .attr("value", sort_options[i].value)
                            .appendTo(".multiples-sort-types");
                    }
                    jQuery(".sort-controls .btn-success").data("transformedTable", transformedTable);
                });
                jQuery(".sort-controls .btn-success").bind("click", function(){
                    var selectedSort = jQuery(".multiples-sort-types option:selected").attr("value");
                    var charts = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_charts);
                    var charts_for_sort = [];
                    chart_title = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_settings).chartTitle;
                    var transformedTable = jQuery(".sort-controls .btn-success").data("transformedTable");
                    jQuery.each(charts, function(idx, chart){
                        var tmp_chart = {};
                        tmp_chart.chart = chart;
                        tmp_chart.title = chart_title;
                        jQuery.each(chart, function(idx2, value){
                            tmp_chart.title = tmp_chart.title.split("{column_"+idx2+"}").join(transformedTable.available_columns[value]);
                        });
                        charts_for_sort.push(tmp_chart);
                    });
                    charts_for_sort.sort(function(a, b){
                        if (a.title > b.title){
                            return 1;
                        }
                        if (a.title < b.title){
                            return -1;
                        }
                        if (a.title === b.title){
                            return 0;
                        }
                    });
                    var sorted_charts = [];
                    for (var i = 0; i < charts_for_sort.length; i++){
                        sorted_charts.push(charts_for_sort[i].chart);
                    }
                    var widget = jQuery("#multiples_"+base_chart).data("widget");
                    widget.settings.multiples_charts = JSON.stringify(sorted_charts);
                    jQuery("#multiples-sort").dialog("close");
                    widget.save(false, true);
                });
                jQuery(".sort-controls .btn-inverse").bind("click", function(){
                    jQuery("#multiples-sort").dialog("close");
                });
            }
         });
      });
    header.find(".eea-icon-gear").remove();
    jQuery("<span>")
      .attr('title', 'Size adjustments')
      .addClass('eea-icon daviz-menuicon').addClass('eea-icon-gear')
      .insertAfter(removeSpan)
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
        settingsDiv.append("<label>Title</label>");
        settingsDiv.append("<label class='help'>ex: {column_0} - {column_1}</label>");
        settingsDiv.append("<input class='chartsettings chartTitle' type='text'/>");
        settingsDiv.append("<label>Area size</label>");
        settingsDiv.append("<input class='chartsettings chartWidth' type='number'/>");
        settingsDiv.append("<span>x</span>");
        settingsDiv.append("<input class='chartsettings chartHeight' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        settingsDiv.append("<label>Chart size</label>");
        settingsDiv.append("<input class='chartsettings chartAreaWidth' type='number'/>");
        settingsDiv.append("<span>x</span>");
        settingsDiv.append("<input class='chartsettings chartAreaHeight' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        settingsDiv.append("<label>Chart position</label>");
        settingsDiv.append("<span>Left: </span>");
        settingsDiv.append("<input class='chartsettings chartAreaLeft' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");
        settingsDiv.append("<span>Top: </span>");
        settingsDiv.append("<input class='chartsettings chartAreaTop' type='number'/>");
        settingsDiv.append("<span>px</span>");
        settingsDiv.append("<div style='clear:both'> </div>");

        previewDiv.dialog({
            dialogClass: "googlechart-dialog googlechart-preview-dialog",
            modal: true,
            width: chartSettings.width + 200,
            height: chartSettings.height + 260,
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

                chartSettings.chartAreaLeft = parseInt(chartSettings.chartAreaLeft / prevWidth * chartSettings.width, 10);
                chartSettings.chartAreaWidth = parseInt(chartSettings.chartAreaWidth / prevWidth * chartSettings.width, 10);
                chartSettings.chartAreaTop = parseInt(chartSettings.chartAreaTop / prevHeight * chartSettings.height, 10);
                chartSettings.chartAreaHeight = parseInt(chartSettings.chartAreaHeight / prevHeight * chartSettings.height, 10);

                jQuery(".settingsDiv .chartAreaWidth").attr("value", chartSettings.chartAreaWidth);
                jQuery(".settingsDiv .chartAreaHeight").attr("value", chartSettings.chartAreaHeight);
                jQuery(".settingsDiv .chartAreaTop").attr("value", chartSettings.chartAreaTop);
                jQuery(".settingsDiv .chartAreaLeft").attr("value", chartSettings.chartAreaLeft);

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
                jQuery(".settingsDiv .chartTitle").attr("value", chartSettings.chartTitle);
                jQuery(".preview-controls .btn-success").bind("click", function(){
                    var widget = jQuery("#multiples_"+base_chart).data("widget");
                    widget.settings.multiples_settings = JSON.stringify(chartSettings);
                    jQuery("#multiples-resize").dialog("close");
                    widget.save(false, true);
                });
                jQuery(".preview-controls .btn-inverse").bind("click", function(){
                    jQuery("#multiples-resize").dialog("close");
                });
                jQuery(".chartsettings").change(function(){
                    var prevWidth = chartSettings.width;
                    var prevHeight = chartSettings.height;
                    chartSettings.width = parseInt(jQuery(".settingsDiv .chartWidth").attr("value"), 10);
                    chartSettings.height = parseInt(jQuery(".settingsDiv .chartHeight").attr("value"), 10);
                    chartSettings.chartTitle = jQuery(".settingsDiv .chartTitle").attr("value");
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
                        jQuery("#multiples-resize").dialog("option", "height", chartSettings.height + 260);
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
    jQuery.each(charts, function(idx, columns){
        columns_str = encodeURIComponent(JSON.stringify(columns));
        var iframeContainer = jQuery("<div>")
            .addClass("multiples-iframe-container")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .attr("used_columns", JSON.stringify(columns))
            .appendTo(container);
        jQuery("<iframe>")
            .css("position", "absolute")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .css("z-index", "1")
            .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width=" + settings.width + "&height=" + settings.height + "&interactive=false&columns=" + columns_str + "&options=" + options_str)
            .appendTo(iframeContainer);
        jQuery("<div>")
            .css("position", "absolute")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .css("z-index", "2")
            .appendTo(iframeContainer);
    });
    container.sortable({
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      start: function(event, ui){
        jQuery(".dashboard-chart:hover .dashboard-header")
            .css("opacity", "0");
      },
      stop: function(event, ui){
        jQuery(".dashboard-chart:hover .dashboard-header")
            .css("opacity", "");
      },
      update: function(event, ui){
        var sorted_charts_str = container.sortable('toArray',{attribute:'used_columns'});
        var sorted_charts = [];
        for (var i = 0; i < sorted_charts_str.length; i++){
            sorted_charts.push(JSON.parse(sorted_charts_str[i]));
        }
        var widget = jQuery("#multiples_"+base_chart).data("widget");
        widget.settings.multiples_charts = JSON.stringify(sorted_charts);
        widget.save(false, true);
      }
    });

});
