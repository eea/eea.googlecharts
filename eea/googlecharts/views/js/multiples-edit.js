jQuery(document).bind("multiplesConfigEditorReady", function(evt, view){
    var current_widget = ".googlechart-widget-" + view;
    jQuery(current_widget + " select").change(function(){
        if (view === "add"){
            var empty_settings = {
                charts:[],
                settings:{}
            };
            jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(empty_settings));
        }
        jQuery(".multiples-config").empty();
        if ((jQuery(current_widget + " select").attr("value") !== undefined) &&
            (jQuery(current_widget + " select").attr("value") !== "")){
            jQuery("<div>")
                .addClass("multiples-base-preview")
                .appendTo(".multiples-config");

            jQuery("<div>")
                .addClass("multiples-matrix-config")
                .appendTo(".multiples-config");

            jQuery("<div>")
                .addClass("multiples-matrix")
                .appendTo(".multiples-config")
                .disableSelection();


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
//                    filters : JSON.parse(base_chart_settings.row_filters)
                    filters : {}
                };
                var transformedTable = transformTable(options);
                base_chart_config = JSON.parse(base_chart_settings.config);
                base_chart_options = JSON.parse(base_chart_settings.options);
                columns_config = JSON.parse(base_chart_settings.columns);

                var allCols = [];

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
                var base_filters = JSON.parse(base_chart_settings.row_filters);
                var allFilteredCols = [];
                patched_each(base_filters, function(col_id, filter_opt){
                    if ((filter_opt.type === 'visible') && (filter_opt.values.length === 1)){
                        var filter_options = [];

                        for (var i = 0; i < transformedTable.items.length; i++){
                            if (jQuery.inArray(transformedTable.items[i][col_id], filter_options) === -1){
                                filter_options.push(transformedTable.items[i][col_id]);
                            }
                        }
                        filter_options.sort();
                        allFilteredCols.push({id:col_id, options:filter_options});
                    }
                });
                allFilteredCols.sort(function(a, b){
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

                jQuery("<div>")
                    .text("Select column or row filter to be replaced on the horizontal axis")
                    .appendTo(".multiples-matrix-config");
                jQuery("<select>")
                    .addClass("multiples-horizontal-replaced")
                    .addClass("multiples-replaced")
                    .appendTo(".multiples-matrix-config");

                jQuery("<div>")
                    .text("Select column or row filter to be replaced on the vertical axis")
                    .appendTo(".multiples-matrix-config");

                jQuery("<select>")
                    .addClass("multiples-vertical-replaced")
                    .addClass("multiples-replaced")
                    .appendTo(".multiples-matrix-config");

                jQuery("<option>")
                    .text("(select column or row filter)")
                    .attr("value", "")
                    .appendTo(".multiples-horizontal-replaced")
                    .clone()
                    .appendTo(".multiples-vertical-replaced");
                jQuery(".multiples-matrix-config").data("original_columns", columnsFromSettings.columns);
                jQuery(".multiples-matrix-config").data("multiples_filters", allFilteredCols);
                jQuery(".multiples-matrix-config").data("original_filter", JSON.parse(base_chart_settings.row_filters));

                for (var i = 0; i < columnsFromSettings.columns.length; i++){
                    jQuery("<option>")
                        .addClass("multiples_option_column")
                        .attr("value", "col_" + columnsFromSettings.columns[i])
                        .text(transformedTable.properties[columnsFromSettings.columns[i]].label)
                        .appendTo(".multiples-horizontal-replaced")
                        .clone().appendTo(".multiples-vertical-replaced");
                }
                for (i = 0; i < allFilteredCols.length; i++){
                    jQuery("<option>")
                        .addClass("multiples_option_filter")
                        .attr("value", "flt_" + allFilteredCols[i].id)
                        .text("filter on column '" + transformedTable.properties[allFilteredCols[i].id].label + "'")
                        .appendTo(".multiples-horizontal-replaced")
                        .clone().appendTo(".multiples-vertical-replaced");
                }
                jQuery(".multiples-replaced").change(function(){
                    jQuery(".multiples-matrix .multiples-elements").remove();
                    var horizontal_replaceable = jQuery(".multiples-horizontal-replaced").attr("value");
                    var vertical_replaceable = jQuery(".multiples-vertical-replaced").attr("value");
                    var tmp_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                    tmp_settings.charts = [];
                    function setReplaceableSettings(replaceable){
                        var replaceable_settings = null;
                        if (replaceable !== ""){
                            replaceable_settings = {type:"Column", column:replaceable.substr(4)};
                            if (horizontal_replaceable.substr(0,4) !== "col_"){
                                replaceable_settings.type = "Filter";
                            }
                        }
                        return replaceable_settings;
                    }
                    tmp_settings.replaceables = {
                        horizontal:setReplaceableSettings(horizontal_replaceable),
                        vertical:setReplaceableSettings(vertical_replaceable)
                    };

                    jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(tmp_settings));
                    if ((horizontal_replaceable === "") && (vertical_replaceable === "")){
                        return;
                    }

                    function findReplacements(replaceable){
                        var replacements = {
                            cols : [],
                            filters : []
                        };
                        if (replaceable === ""){
                            replacements.cols.push(null);
                        }
                        var i;
                        var col_id = replaceable.substr(4);
                        if (replaceable.substr(0,4) === 'col_'){
                            var col_type = transformedTable.properties[col_id].columnType;
                            for (i = 0; i < allCols.length; i++){
                                if (allCols[i].type === col_type){
                                    replacements.cols.push(allCols[i].id);
                                }
                            }
                        }
                        else {
                            var filtered_cols = jQuery(".multiples-matrix-config").data("multiples_filters");
                            for (i = 0; i < filtered_cols.length; i++){
                                if (filtered_cols[i].id === col_id){
                                    replacements.filters = filtered_cols[i].options;
                                }
                            }
                        }
                        return replacements;
                    }
                    var horizontal_replacements = findReplacements(horizontal_replaceable);
                    var vertical_replacements = findReplacements(vertical_replaceable);

                    var vertical_type = "cols";
                    var horizontal_type = "cols";
                    var vertical_list = vertical_replacements.cols;
                    var horizontal_list = horizontal_replacements.cols;
                    if (horizontal_replacements.filters.length > 0){
                        horizontal_type = "filters";
                        horizontal_list = horizontal_replacements.filters;
                    }
                    if (vertical_replacements.filters.length > 0){
                        vertical_type = "filters";
                        vertical_list = vertical_replacements.filters;
                    }

                    jQuery("<div>")
                        .text("select all")
                        .addClass("multiples-header-item multiples-elements multiples-header-all")
                        .appendTo(".multiples-matrix");
                    for (var i = 0; i < horizontal_list.length; i++){
                        if (horizontal_list[i] !== null){
                            var label = horizontal_list[i];
                            if (horizontal_type === "cols"){
                                label = transformedTable.available_columns[label];
                            }
                            jQuery("<div>")
                                .text(label)
                                .addClass("multiples-header-item multiples-elements")
                                .appendTo(".multiples-matrix")
                                .attr("horizontal-column-id", horizontal_list[i]);
                        }
                    }
                    jQuery("<div>")
                        .addClass("multiples-elements")
                        .css("clear","both")
                        .appendTo(".multiples-matrix");
                    var originalColumns = jQuery(".multiples-matrix-config").data("original_columns");

                    for (i = 0; i < vertical_list.length; i++){
                        if (vertical_list[i] !== null){
                            var tmp_label = vertical_list[i];
                            if (vertical_type === "cols"){
                                tmp_label = transformedTable.available_columns[tmp_label];
                            }
                            jQuery("<div>")
                                .attr("vertical-column-id", vertical_list[i])
                                .text(tmp_label)
                                .addClass("multiples-header-item multiples-elements")
                                .appendTo(".multiples-matrix");
                        }
                        else{
                            jQuery("<div>")
                                .addClass("multiples-elements")
                                .css("width","69px")
                                .css("height","1px")
                                .css("float","left")
                                .appendTo(".multiples-matrix");
                        }
                        for (var j = 0; j < horizontal_list.length; j++){
                            var columns = [];
                            var hasColumns = false;
                            var hasFilters = false;
                            for (var k = 0; k < originalColumns.length; k++){
                                columns.push(originalColumns[k]);
                                if ((vertical_type === 'cols') && (originalColumns[k] === vertical_replaceable.substr(4))){
                                    hasColumns = true;
                                    columns[k] = vertical_replacements.cols[i];
                                }
                                if ((horizontal_type === 'cols') && (originalColumns[k] === horizontal_replaceable.substr(4))){
                                    hasColumns = true;
                                    columns[k] = horizontal_replacements.cols[j];
                                }
                            }
                            var filters = jQuery.extend(true, {}, jQuery(".multiples-matrix-config").data("original_filter"));
                            if (vertical_type === 'filters'){
                                hasFilters = true;
                                filters[vertical_replaceable.substr(4)].values = [vertical_list[i]];
                            }
                            if (horizontal_type === 'filters'){
                                hasFilters = true;
                                filters[horizontal_replaceable.substr(4)].values = [horizontal_list[j]];
                            }
                            var element = jQuery("<div>")
                                .addClass("small-container multiples-elements")
                                .appendTo(".multiples-matrix")
                                .attr("horizontal-column-id", horizontal_list[j])
                                .attr("vertical-column-id", vertical_list[i]);
                            if (hasColumns){
                                element.data("columns", columns);
                            }
                            if (hasFilters){
                                element.data("filters", filters);
                            }
                        }
                        jQuery("<div>")
                            .addClass("multiples-elements")
                            .css("clear","both")
                            .appendTo(".multiples-matrix");
                    }
                    jQuery("<input type='checkbox'>")
                        .appendTo(".multiples-header-item")
                        .change(function(){
                            var checked = jQuery(this).attr("checked");
                            var horizontal_col_id = jQuery(this).parent().attr("horizontal-column-id");
                            var vertical_col_id = jQuery(this).parent().attr("vertical-column-id");
                            var selector = "";
                            if (checked){
                                selector = ".multiples-matrix-item-overlay:not(.selected)";
                            }
                            else {
                                selector = ".multiples-matrix-item-overlay.selected";
                            }
                            if (horizontal_col_id !== undefined){
                                selector += "[horizontal-column-id='" + horizontal_col_id + "']";
                            }

                            if (vertical_col_id !== undefined){
                                selector += "[vertical-column-id='" + vertical_col_id + "']";
                            }
                            jQuery(selector).click();
                        });
                    var options = {
                        chartAreaWidth: 65,
                        chartAreaHeight: 65,
                        chartAreaLeft: 1,
                        chartAreaTop: 1
                    };
                    var options_str = encodeURIComponent(JSON.stringify(options));
                    jQuery(".small-container").each(function(idx, container){
                        var columns = jQuery(container).data("columns");
                        var filters = jQuery(container).data("filters");
                        var params = {
                            chart:chart_id,
                            width:67,
                            height:67,
                            interactive:false,
                            options:options_str
                        };
                        if (columns !== undefined){
                            params.columns = JSON.stringify(columns);
                        }
                        if (filters !== undefined){
                            params.filters = JSON.stringify(filters);
                        }
                        jQuery("<iframe>")
                            .addClass("small-chart")
                            .attr("src", absolute_url + "/chart-full?"+jQuery.param(params))
                            .appendTo(container);
                        var overlayed = jQuery("<div>")
                            .addClass("multiples-matrix-item-overlay")
                            .attr("horizontal-column-id", jQuery(container).attr("horizontal-column-id"))
                            .attr("vertical-column-id", jQuery(container).attr("vertical-column-id"))
                            .appendTo(container)
                            .click(function(){
                                var horizontal_col_id = jQuery(this).attr("horizontal-column-id");
                                var vertical_col_id = jQuery(this).attr("vertical-column-id");
                                if (jQuery(this).hasClass("selected")){
                                    jQuery(this)
                                        .removeClass("selected")
                                        .removeClass("eea-icon")
                                        .removeClass("eea-icon-check");
                                    jQuery(".multiples-header-all input").removeAttr("checked");
                                    jQuery(".multiples-header-item[horizontal-column-id='" + horizontal_col_id + "'] input").removeAttr("checked");
                                    jQuery(".multiples-header-item[vertical-column-id='" + vertical_col_id + "'] input").removeAttr("checked");
                                }
                                else{
                                    jQuery(this)
                                        .addClass("selected")
                                        .addClass("eea-icon")
                                        .addClass("eea-icon-check");
                                    if (jQuery(".multiples-matrix-item-overlay:not(.selected)").length === 0){
                                        jQuery(".multiples-header-all input").attr("checked", "checked");
                                    }
                                    if (jQuery(".multiples-matrix-item-overlay[horizontal-column-id='" + horizontal_col_id + "']:not(.selected)").length === 0){
                                        jQuery(".multiples-header-item[horizontal-column-id='" + horizontal_col_id + "'] input").attr("checked", "checked");
                                    }
                                    if (jQuery(".multiples-matrix-item-overlay[vertical-column-id='" + vertical_col_id + "']:not(.selected)").length === 0){
                                        jQuery(".multiples-header-item[vertical-column-id='" + vertical_col_id + "'] input").attr("checked", "checked");
                                    }
                                }
                                var selected_columns = [];
                                jQuery.each(jQuery(".multiples-matrix-item-overlay.selected"), function(idx, item){
                                    selected_columns.push({columns:jQuery(item).parent().data("columns"),filters:jQuery(item).parent().data("filters")});
                                });
                                var tmp_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                                tmp_settings.charts = selected_columns;
                                jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(tmp_settings));
                            });
                    });
                });
                var loaded_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                if ((loaded_settings.replaceables.horizontal !== undefined) && (loaded_settings.replaceables.horizontal !== null)){
                    var horizontal_option = loaded_settings.replaceables.horizontal.column;
                    if (loaded_settings.replaceables.horizontal.type === 'Filter'){
                        horizontal_option = "flt_" + horizontal_option;
                    }
                    else{
                        horizontal_option = "col_" + horizontal_option;
                    }
                    jQuery(".multiples-horizontal-replaced").attr("value", horizontal_option);
                }
                if ((loaded_settings.replaceables.vertical !== undefined) && (loaded_settings.replaceables.vertical !== null)){
                    var vertical_option = loaded_settings.replaceables.vertical.column;
                    if (loaded_settings.replaceables.vertical.type === 'Filter'){
                        vertical_option = "flt_" + vertical_option;
                    }
                    else{
                        vertical_option = "col_" + vertical_option;
                    }
                    jQuery(".multiples-vertical-replaced").attr("value", vertical_option);
                }
                var default_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                jQuery(".multiples-horizontal-replaced").trigger("change");
                jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(default_settings));
                jQuery(".small-container").each(function(idx, container){
                    container = jQuery(container);
                    var container_settings = {filters:jQuery.extend(true, {}, container.data("filters")), columns:jQuery.extend(true, {}, container.data("columns"))};
                    for (var i = 0; i < default_settings.charts.length; i++){
                        var chart_settings = {filters:jQuery.extend(true, {}, default_settings.charts[i].filters), columns:jQuery.extend(true, {}, default_settings.charts[i].columns)};
                        if (_.isEqual(container_settings, chart_settings)){
                            container.find(".multiples-matrix-item-overlay")
                                .addClass("selected eea-icon eea-icon-check");
                            var horizontal_col_id = jQuery(container).attr("horizontal-column-id");
                            var vertical_col_id = jQuery(container).attr("vertical-column-id");

                            if (jQuery(".multiples-matrix-item-overlay:not(.selected)").length === 0){
                                jQuery(".multiples-header-all input").attr("checked", "checked");
                            }
                            if (jQuery(".multiples-matrix-item-overlay[horizontal-column-id='" + horizontal_col_id + "']:not(.selected)").length === 0){
                                jQuery(".multiples-header-item[horizontal-column-id='" + horizontal_col_id + "'] input").attr("checked", "checked");
                            }
                            if (jQuery(".multiples-matrix-item-overlay[vertical-column-id='" + vertical_col_id + "']:not(.selected)").length === 0){
                                jQuery(".multiples-header-item[vertical-column-id='" + vertical_col_id + "'] input").attr("checked", "checked");
                            }
                        }
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

jQuery(document).bind("multiplesEditPreviewReady", function(evt, base_chart, multiples_settings){
    var charts = multiples_settings.charts;
    var common_settings = multiples_settings.settings;
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
//                        filters : JSON.parse(base_chart_settings.row_filters)
                        filters : {}
                    };
                    var transformedTable = transformTable(options);
                    var titles = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_settings).settings.chartTitle;
                    if (titles !== ""){
                        sort_options.push({
                            value:"asc_by_title",
                            text:"Asc by Title",
                            type:"title",
                            direction:"asc"
                        });
                        sort_options.push({
                            value:"desc_by_title",
                            text:"Desc by Title",
                            type:"title",
                            direction:"desc"
                        });
                    }
                    var i;
                    if (JSON.parse(base_chart_settings.config).chartType === 'PieChart'){
                        var base_columns = JSON.parse(base_chart_settings.columns).prepared;
                        var first_column = "";
                        for (i = 0; i < base_columns.length; i++){
                            if ((base_columns[i].status === 1) && (first_column === "")){
                                first_column = base_columns[i].name;
                            }
                        }
                        for (i = 0; i < transformedTable.items.length; i++){
                            sort_options.push({
                                value:"asc_by_row_" + transformedTable.items[i][first_column],
                                text:"Asc by row " + transformedTable.items[i][first_column],
                                type:"row",
                                direction:"asc",
                                column:first_column,
                                row: transformedTable.items[i][first_column]
                            });
                            sort_options.push({
                                value:"desc_by_row_" + transformedTable.items[i][first_column],
                                text:"Desc by row " + transformedTable.items[i][first_column],
                                type:"row",
                                direction:"desc",
                                column:first_column,
                                row: transformedTable.items[i][first_column]
                            });
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
                        .data("sort_settings", {type:"nothing"})
                        .attr("selected", "selected")
                        .appendTo(".multiples-sort-types");
                    for (i = 0; i < sort_options.length; i++){
                        jQuery("<option>")
                            .text(sort_options[i].text)
                            .attr("value", sort_options[i].value)
                            .data("sort_settings", sort_options[i])
                            .appendTo(".multiples-sort-types");
                    }
                    jQuery(".sort-controls .btn-success").data("transformedTable", transformedTable);
                });
                jQuery(".sort-controls .btn-success").bind("click", function(){
                    var i;
                    var selectedSort = jQuery(".multiples-sort-types option:selected").attr("value");
                    var selectedSortSettings = jQuery(".multiples-sort-types option:selected").data("sort_settings");
                    var charts = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_settings).charts;
                    var charts_for_sort = [];
                    chart_title = JSON.parse(jQuery("#multiples_"+base_chart).data("widget").settings.multiples_settings).settings.chartTitle;
                    var transformedTable = jQuery(".sort-controls .btn-success").data("transformedTable");
                    jQuery.each(charts, function(idx, chart){
                        var tmp_chart = {};
                        tmp_chart.chart = chart;
                        tmp_chart.sort_value = chart_title;
                        jQuery.each(chart, function(idx2, value){
                            tmp_chart.sort_value = tmp_chart.sort_value.split("{column_"+idx2+"}").join(transformedTable.available_columns[value]);
                        });
                        charts_for_sort.push(tmp_chart);
                    });
                    if (selectedSortSettings.type === "row"){
                        var selectedRow;
                        for (i = 0; i < transformedTable.items.length; i++){
                            if ((transformedTable.items[i][selectedSortSettings.column] === selectedSortSettings.row) && (selectedRow === undefined)){
                                selectedRow = transformedTable.items[i];
                            }
                        }
                        for (i = 0; i < charts_for_sort.length; i++){
                            charts_for_sort[i].sort_value = selectedRow[charts_for_sort[i].chart[1]];
                        }
                    }
                    charts_for_sort.sort(function(a, b){
                        if (a.sort_value > b.sort_value){
                            return 1;
                        }
                        if (a.sort_value < b.sort_value){
                            return -1;
                        }
                        if (a.sort_value === b.sort_value){
                            return 0;
                        }
                    });
                    for (i = 0; i < charts_for_sort.length; i++){
                        delete charts_for_sort[i].sort_value;
                    }
                    var sorted_charts = [];
                    for (i = 0; i < charts_for_sort.length; i++){
                        sorted_charts.push(charts_for_sort[i].chart);
                    }
                    if (selectedSortSettings.direction === "desc"){
                        sorted_charts.reverse();
                    }
                    var widget = jQuery("#multiples_"+base_chart).data("widget");
                    var tmp_settings = JSON.parse(widget.settings.multiples_settings);
                    tmp_settings.charts = sorted_charts;
                    widget.settings.multiples_settings = JSON.stringify(tmp_settings);
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
                    var tmp_settings = JSON.parse(widget.settings.multiples_settings);
                    tmp_settings.settings = chartSettings;
                    widget.settings.multiples_settings = JSON.stringify(tmp_settings);
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
    jQuery.each(charts, function(idx, chart){
//        columns_str = encodeURIComponent(JSON.stringify(columns));
        var iframeContainer = jQuery("<div>")
            .addClass("multiples-iframe-container")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
//            .attr("used_columns", JSON.stringify(columns))
            .appendTo(container);
        var params = {
            chart: base_chart,
            width: settings.width,
            height: settings.height,
            interactive: false,
            options: options_str
        };
        if (chart.columns !== undefined) {
            params.columns = JSON.stringify(chart.columns);
            iframeContainer.attr("used_columns", params.columns);
        }
        if (chart.filters !== undefined) {
            params.filters = JSON.stringify(chart.filters);
        }
        jQuery("<iframe>")
            .css("position", "absolute")
            .css("width", settings.width + "px")
            .css("height", settings.height + "px")
            .css("z-index", "1")
//            .attr("src", absolute_url + "/chart-full?chart=" + base_chart + "&width=" + settings.width + "&height=" + settings.height + "&interactive=false&columns=" + columns_str + "&options=" + options_str)
            .attr("src", absolute_url + "/chart-full?" + jQuery.param(params))
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
        var tmp_settings = JSON.parse(widget.settings.multiples_settings);
        tmp_settings.charts = sorted_charts;
        widget.settings.multiples_settings = JSON.stringify(tmp_settings);
        widget.save(false, true);
      }
    });

});
