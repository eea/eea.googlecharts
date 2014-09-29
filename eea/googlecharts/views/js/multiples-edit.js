jQuery(document).bind("multiplesConfigEditorReady", function(evt, view){
    function checkIfPossibleMatrix(){
        var possible_matrix = true;
        if (jQuery(".multiples-matrix-item-overlay.selected").length > 0){
            jQuery(".multiples-matrix-item-overlay:not(.selected)").each(function(idx, overlay){
                var horizontal_col_id = jQuery(overlay).attr("horizontal-column-id");
                var vertical_col_id = jQuery(overlay).attr("vertical-column-id");
                if ((jQuery(".multiples-matrix-item-overlay.selected[horizontal-column-id='" + horizontal_col_id + "']").length > 0) &&
                    (jQuery(".multiples-matrix-item-overlay.selected[vertical-column-id='" + vertical_col_id + "']").length > 0)){
                    possible_matrix = false;
                }
            });
        }
        else {
            possible_matrix = false;
        }
        var tmp_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
        tmp_settings.possibleMatrix = possible_matrix;
        jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(tmp_settings));
    }

    var current_widget = ".googlechart-widget-" + view;
    function updateDragAndDrops(){
        jQuery(".multiples-matrix-config-column-horizontal")
            .remove();
        jQuery(".multiples-matrix-config-column-vertical")
            .remove();
        jQuery("<div>")
            .addClass("multiples-matrix-config-column-horizontal droppable-column")
            .text("drop here column for X")
            .appendTo(".multiples-matrix-config-column-horizontal-droppable-container");
        jQuery("<div>")
            .addClass("multiples-matrix-config-column-vertical droppable-column")
            .text("drop here column for Y")
            .css("float", "left")
            .width(100)
            .css("height", "auto")
            .appendTo(".multiples-matrix-config-column-vertical-droppable-container");

        jQuery(".multiples-original-columns")
            .empty();
        var selectedHorizontal = jQuery(".multiples-horizontal-replaced").attr("value");
        var selectedVertical = jQuery(".multiples-vertical-replaced").attr("value");
        jQuery(".multiples-horizontal-replaced option").each(function(idx, option){
            if (jQuery(option).attr("value") !== ""){
                if ((jQuery(option).attr("value") !== selectedHorizontal) && (jQuery(option).attr("value") !== selectedVertical)){
                    jQuery("<div>")
                        .addClass("draggable-column")
                        .text(jQuery(option).text())
                        .attr("value", jQuery(option).attr("value"))
                        .appendTo(".multiples-original-columns");
                }
                if (jQuery(option).attr("value") === selectedHorizontal){
                    jQuery(".multiples-matrix-config-column-horizontal").empty();
                    jQuery("<div>")
                        .addClass("removable-title")
                        .text("Column on X:")
                        .appendTo(".multiples-matrix-config-column-horizontal");
                    jQuery("<div>")
                        .text(jQuery(option).text())
                        .addClass("removable-column removable-column-x")
                        .appendTo(".multiples-matrix-config-column-horizontal");
                    jQuery("<span>")
                        .attr("title", "Remove column")
                        .addClass("eea-icon eea-icon-trash-o removable-column-remove remove-column-x")
                        .appendTo(".removable-column-x");
                    jQuery("<div>")
                        .css("clear","both")
                        .appendTo(".multiples-matrix-config-column-horizontal");
                    jQuery(".multiples-matrix-config-column-horizontal")
                        .removeClass("droppable-column");
                }
                if (jQuery(option).attr("value") === selectedVertical){
                    jQuery(".multiples-matrix-config-column-vertical").empty();
                    jQuery("<div>")
                        .addClass("removable-title")
                        .text("Column on Y:")
                        .appendTo(".multiples-matrix-config-column-vertical");
                    jQuery("<div>")
                        .text(jQuery(option).text())
                        .addClass("removable-column removable-column-y")
                        .appendTo(".multiples-matrix-config-column-vertical");
                    jQuery("<span>")
                        .attr("title", "Remove column")
                        .addClass("eea-icon eea-icon-trash-o removable-column-remove remove-column-y")
                        .appendTo(".removable-column-y");
                    jQuery("<div>")
                        .css("clear","both")
                        .appendTo(".multiples-matrix-config-column-vertical");
                    jQuery(".multiples-matrix-config-column-vertical")
                        .removeClass("droppable-column");
                }
            }
        });
        jQuery(".draggable-column").draggable({
            revert:"invalid",
            start: function(event, ui){
                jQuery(this)
                    .addClass("optionDragging");
            },
            stop: function(event, ui){
                jQuery(this)
                    .removeClass("optionDragging");
            }
        });
        jQuery(".droppable-column").droppable({
            hoverClass:"hoveredDrop",
            drop: function(event, ui){
                var value = jQuery(".optionDragging").attr("value");
                if (jQuery(this).hasClass("multiples-matrix-config-column-horizontal")){
                    jQuery(".multiples-horizontal-replaced").attr("value", value);
                    jQuery(".multiples-horizontal-replaced").trigger("change");
                }
                if (jQuery(this).hasClass("multiples-matrix-config-column-vertical")){
                    jQuery(".multiples-vertical-replaced").attr("value", value);
                    jQuery(".multiples-vertical-replaced").trigger("change");
                }
            }
        });
        jQuery(".removable-column-remove").click(function(){
            if (jQuery(this).hasClass("remove-column-x")){
                jQuery(".multiples-horizontal-replaced").attr("value", "");
                jQuery(".multiples-horizontal-replaced").trigger("change");
            }
            if (jQuery(this).hasClass("remove-column-y")){
                jQuery(".multiples-vertical-replaced").attr("value", "");
                jQuery(".multiples-vertical-replaced").trigger("change");
            }
        });

    }
    jQuery(current_widget + " select").change(function(){
        if (view === "add"){
            var empty_settings = {
                charts:[],
                settings:{}
            };
            jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(empty_settings));
        }
        jQuery(".multiples-config").each(function(idx, conf){
            if (jQuery(conf).closest(".ui-dialog").length === 0){
                jQuery(conf).remove();
            }
        });
        jQuery(".multiples-config").empty();
        if ((jQuery(current_widget + " select").attr("value") !== undefined) &&
            (jQuery(current_widget + " select").attr("value") !== "")){
            jQuery("<div>")
                .addClass("multiples-base-preview")
                .appendTo(".multiples-config");

            jQuery(".multiples-matrix-config").remove();
            jQuery("<div>")
                .addClass("multiples-matrix-config")
                .css("display","none")
                .appendTo(".multiples-config");
            jQuery("<div>")
                .addClass("multiples-matrix")
                .height(jQuery(".multiples-config").closest(".googlechart-widget-edit").height()-120)
                .width(jQuery(".multiples-config").width() - jQuery(".multiples-base-preview").width() - 10)
                .css("overflow", "scroll")
                .appendTo(".multiples-config")
                .disableSelection();

            var chart_path = jQuery(current_widget + " select").attr("value").split("/");
            var chart_id = chart_path[chart_path.length - 1];
            var absolute_url = jQuery(".multiples-config").attr("absolute_url");
            jQuery("<iframe>")
                .addClass("base-chart-iframe")
                .attr("src", absolute_url + "/chart-full?chart=" + chart_id + "&width=300&height=300")
                .appendTo(".multiples-base-preview");
            jQuery.getJSON(absolute_url + "/googlechart.get_data", function (data){
                var chart_path = jQuery(current_widget + " select").attr("value").split("/");
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
                if (base_chart_settings.row_filters.length === 0){
                    base_chart_settings.row_filters = "[]";
                }
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
                    .text("Configure the small multiples charts by selecting with drag and drop which columns to be used for the X and Y axis. Than you can select the charts to be displayed.")
                    .addClass("multiples-config-title portalMessage ideaMessage")
                    .appendTo(".multiples-matrix");

                jQuery("<div>")
                    .text("Columns used by the chart:")
                    .addClass("multiples-columns-title")
                    .appendTo(".multiples-matrix");
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

                jQuery("<div>")
                    .addClass("multiples-original-columns")
                    .appendTo(".multiples-matrix");

                jQuery("<option>")
                    .text("(select column or row filter)")
                    .attr("value", "")
                    .appendTo(".multiples-horizontal-replaced")
                    .clone()
                    .appendTo(".multiples-vertical-replaced");
                jQuery(".multiples-matrix-config").data("original_columns", columnsFromSettings.columns);
                jQuery(".multiples-matrix-config").data("multiples_filters", allFilteredCols);
                jQuery(".multiples-matrix-config").data("original_filter", JSON.parse(base_chart_settings.row_filters));

                for (var i = 0; i < allFilteredCols.length; i++){
                    jQuery("<option>")
                        .addClass("multiples_option_filter")
                        .attr("value", "flt_" + allFilteredCols[i].id)
                        .text(transformedTable.properties[allFilteredCols[i].id].label)
                        .appendTo(".multiples-horizontal-replaced")
                        .clone().appendTo(".multiples-vertical-replaced");
                }
                for (i = 0; i < columnsFromSettings.columns.length; i++){
                    if (jQuery(".multiples_option_filter[value='flt_"+ columnsFromSettings.columns[i] +"']").length === 0){
                        jQuery("<option>")
                            .addClass("multiples_option_column")
                            .attr("value", "col_" + columnsFromSettings.columns[i])
                            .text(transformedTable.properties[columnsFromSettings.columns[i]].label)
                            .appendTo(".multiples-horizontal-replaced")
                            .clone().appendTo(".multiples-vertical-replaced");
                    }
                }

                jQuery("<div>")
                    .css("clear", "both")
                    .appendTo(".multiples-matrix");

                jQuery("<div>")
                    .addClass("multiples-matrix-config-column-horizontal-droppable-container")
                    .appendTo(".multiples-matrix");
                jQuery("<div>")
                    .css("clear", "both")
                    .appendTo(".multiples-matrix");
                jQuery("<div>")
                    .addClass("multiples-matrix-container")
                    .width(10000)
                    .appendTo(".multiples-matrix");
                jQuery("<div>")
                    .addClass("multiples-matrix-config-column-vertical-droppable-container")
                    .appendTo(".multiples-matrix-container");
            jQuery("<div>")
                .addClass("multiples-matrix-elements")
                .css("float", "left")
                .appendTo(".multiples-matrix-container");
                jQuery(".multiples-replaced").change(function(){
                    updateDragAndDrops();
                    jQuery(".multiples-matrix .multiples-elements").remove();
                    jQuery(".multiples-matrix-elements .smc-widget").remove();
                    var horizontal_replaceable = jQuery(".multiples-horizontal-replaced").attr("value");
                    var vertical_replaceable = jQuery(".multiples-vertical-replaced").attr("value");
                    var tmp_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                    tmp_settings.charts = [];
                    tmp_settings.possibleMatrix = false;
                    function setReplaceableSettings(replaceable){
                        var replaceable_settings = null;
                        if (replaceable !== ""){
                            replaceable_settings = {type:"Column", column:replaceable.substr(4)};
                            if (replaceable.substr(0,4) !== "col_"){
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
                    jQuery(".multiples-matrix-elements").width(69);
                    jQuery("<div>")
                        .text("select all")
                        .addClass("multiples-header-item multiples-elements multiples-header-all")
                        .appendTo(".multiples-matrix-elements");

                    for (var i = 0; i < horizontal_list.length; i++){
                        jQuery(".multiples-matrix-elements").width(jQuery(".multiples-matrix-elements").width() + 69);
                        if (horizontal_list[i] !== null){
                            var label = horizontal_list[i];
                            if (horizontal_type === "cols"){
                                label = transformedTable.available_columns[label];
                            }
                            jQuery("<div>")
                                .text(label)
                                .addClass("multiples-header-item multiples-elements")
                                .appendTo(".multiples-matrix-elements")
                                .attr("horizontal-column-id", horizontal_list[i]);
                        }
                    }
                    jQuery("<div>")
                        .addClass("multiples-elements")
                        .css("clear","both")
                        .appendTo(".multiples-matrix-elements");
                    var originalColumns = jQuery(".multiples-matrix-config").data("original_columns");

                    var default_possibleLabels = {
                        vertical : {
                                type : null,
                                value : null
                            },
                        horizontal : {
                                type : null,
                                value : null
                        }
                    };
                    var multiples_settings;
                    var smc_charts = [];
                    var left_labels = jQuery("<div>")
                        .addClass("left-labels")
                        .css("width","69px")
                        .css("float","left")
                        .appendTo(".multiples-matrix-elements");
                    for (i = 0; i < vertical_list.length; i++){
                        var vertical_possibleLabels = {};
                        jQuery.extend(true, vertical_possibleLabels, default_possibleLabels);
                        if (vertical_list[i] !== null){
                            var tmp_label = vertical_list[i];
                            vertical_possibleLabels.vertical.type = "filter";
                            vertical_possibleLabels.vertical.value = tmp_label;
                            if (vertical_type === "cols"){
                                vertical_possibleLabels.vertical.type = "column";
                                tmp_label = transformedTable.available_columns[tmp_label];
                            }
                            jQuery("<div>")
                                .attr("vertical-column-id", vertical_list[i])
                                .text(tmp_label)
                                .addClass("multiples-header-item multiples-elements")
                                .css("height","61px")
                                .appendTo(left_labels);
                        }
                        else{
                            jQuery("<div>")
                                .addClass("multiples-elements")
                                .css("width","69px")
                                .css("height","1px")
                                .css("float","left")
                                .appendTo(left_labels);
                        }
                        for (var j = 0; j < horizontal_list.length; j++){
                            var final_possibleLabels = {};
                            jQuery.extend(true, final_possibleLabels, vertical_possibleLabels);
                            var tmp_horizontal_label = horizontal_list[j];
                            final_possibleLabels.horizontal.type = "filter";
                            if (horizontal_type === "cols"){
                                final_possibleLabels.horizontal.type = "column";
                            }
                            final_possibleLabels.horizontal.value = tmp_horizontal_label;
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
                            var smc_chart = {
                                possibleLabels: final_possibleLabels
                            };
                            if (hasColumns){
                                smc_chart.columns = columns;
                            }
                            if (hasFilters){
                                smc_chart.filters = filters;
                            }
                            smc_charts.push(smc_chart);
                        }
                    }
                    multiples_settings = {
                        charts: smc_charts,
                        settings: {
                            chartAreaHeight: 65,
                            chartAreaLeft: 1,
                            chartAreaTop: 1,
                            chartAreaWidth: 65,
                            displayLegend: false,
                            height: 67,
                            width: 67
                        }
                    };
                    var adv_options = jQuery.extend(true, {}, JSON.parse(base_chart_settings.options));
                    adv_options.chartArea = {
                        width: multiples_settings.settings.chartAreaWidth,
                        height: multiples_settings.settings.chartAreaHeight,
                        top: multiples_settings.settings.chartAreaTop,
                        left: multiples_settings.settings.chartAreaLeft
                    };
                    var chartConfig = [
                        base_chart_settings.id,
                        JSON.parse(base_chart_settings.config),
                        JSON.parse(base_chart_settings.columns),
                        JSON.parse(base_chart_settings.filters),
                        JSON.parse(base_chart_settings.width),
                        JSON.parse(base_chart_settings.height),
                        JSON.parse(base_chart_settings.filterposition),
                        JSON.parse(base_chart_settings.options),
                        {},
                        "__disabled__",
                        "False",
                        JSON.parse(base_chart_settings.row_filters),
                        "",
                        "",
                        [],
                        {}
                    ];
                    var settings = {
                        chartFiltersDiv: '',
                        chartViewsDiv: '',
                        chartsDashboard: '',
                        charts: [chartConfig],
                        rows: all_rows
                    };
                    var smcharts_settings = {
                        container: jQuery('.multiples-matrix-elements'),
                        smc_item_settings: null,
                        sm_chart_width: multiples_settings.settings.chartAreaWidth,
                        sm_chart_height: multiples_settings.settings.chartAreaWidth,
                        multiples_settings: multiples_settings,
                        settings: settings,
                        transformedTable: transformedTable,
                        chartConfig: chartConfig,
                        adv_options: adv_options,
                        chartFiltersId: null,
                        dashboard_filters: null,
                        interactive: false
                    };
                    drawSMCharts(smcharts_settings);

                    jQuery(".multiples-matrix-elements .smc-widget").each(function(idx, container){
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
                                    selected_columns.push({
                                        columns: JSON.parse(jQuery(item).parent().attr("used_columns")),
                                        filters: JSON.parse(jQuery(item).parent().attr("filters")),
                                        possibleLabels: JSON.parse(jQuery(item).parent().attr("possible_labels"))
                                    });
                                });
                                var tmp_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                                tmp_settings.charts = selected_columns;
                                jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(tmp_settings));
                                checkIfPossibleMatrix();
                            });
                    });

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
                });
                var loaded_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                if (loaded_settings.replaceables !== undefined){
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
                }
                var default_settings = JSON.parse(jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value"));
                jQuery(".multiples-horizontal-replaced").trigger("change");
                jQuery(".add-edit-widget-dialog input.textType[name*='multiples_settings']").attr("value", JSON.stringify(default_settings));
                jQuery(".multiples-matrix-elements .smc-widget").each(function(idx, container){
                    container = jQuery(container);
                    var container_settings = {
                        filters:jQuery.extend(true, {}, JSON.parse(container.attr("filters"))),
                        columns:jQuery.extend(true, {}, JSON.parse(container.attr("used_columns")))
                    };
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
                checkIfPossibleMatrix();
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
        .appendTo("#multiples-resize")
        .resizable({
            containement: "#multiples-resize",
            resize: function(){
                jQuery(".settingsDiv .chartWidth").attr("value", jQuery(this).width());
                jQuery(".settingsDiv .chartHeight").attr("value", jQuery(this).height());
                jQuery("#multiples-resize").dialog("option", "minWidth", jQuery(this).width() + 200);
                jQuery("#multiples-resize").dialog("option", "minHeight", jQuery(this).height() + 340);
            },
            stop: function(){
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
                jQuery("#multiples-resize").dialog("option", "minWidth", chartSettings.width + 200);
                jQuery("#multiples-resize").dialog("option", "minHeight", chartSettings.height + 340);
            }
        });
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
                jQuery.getJSON(absolute_url + "/googlechart.get_charts_json", function(data){
                    var sort_options = [];
                    var base_chart_settings;
                    jQuery.each(data, function(idx, chart){
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
                        var vertical_str = tmp_chart.chart.possibleLabels.vertical.value;
                        if (tmp_chart.chart.possibleLabels.vertical.type === "column"){
                            vertical_str = transformedTable.available_columns[vertical_str];
                        }
                        var horizontal_str = tmp_chart.chart.possibleLabels.horizontal.value;
                        if (tmp_chart.chart.possibleLabels.horizontal.type === "column"){
                            horizontal_str = transformedTable.available_columns[horizontal_str];
                        }

                        tmp_chart.sort_value = tmp_chart.sort_value.split("{vertical}").join(vertical_str).split("{horizontal}").join(horizontal_str);
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
            chartTitle: "",
            displayLegend : false
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
        settingsDiv.append("<label class='help'>ex: {vertical} - {horizontal}</label>");
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

        settingsDiv.append("<label>Display legend</label>");
        settingsDiv.append("<input class='chartsettings chartLegend' type='checkbox'/>");
        settingsDiv.append("<div style='clear:both'> </div>");

        previewDiv.dialog({
            dialogClass: "googlechart-dialog googlechart-preview-dialog",
            modal: true,
            width: chartSettings.width + 200,
            height: chartSettings.height + 340,
            minWidth: chartSettings.width + 200,
            minHeight: chartSettings.height + 340,
            title: "Size adjustments",
            resize: function(){
/*                var elem = jQuery(this);
                var tmp_width = elem.width();
                var tmp_height = elem.height();

                var prevWidth = parseInt(jQuery(".settingsDiv").attr("previousWidth"), 10);
                var prevHeight = parseInt(jQuery(".settingsDiv").attr("previousHeight"), 10);
                jQuery(".settingsDiv .chartWidth").attr("value", parseInt(chartSettings.width - prevWidth + tmp_width, 10));
                jQuery(".settingsDiv .chartHeight").attr("value", parseInt(chartSettings.height - prevHeight + tmp_height, 10));*/
            },
            resizeStart: function(){
/*                var elem = jQuery(this);
                jQuery(".settingsDiv").attr("previousWidth", elem.width());
                jQuery(".settingsDiv").attr("previousHeight", elem.height());*/
            },
            resizeStop: function(){
/*                var prevWidth = chartSettings.width;
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

                redrawPreviewChart(base_chart, chartSettings);*/
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
                if (chartSettings.displayLegend === true){
                    jQuery(".settingsDiv .chartLegend").attr("checked", "checked");
                }
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
                    chartSettings.displayLegend = false;
                    if (jQuery(".settingsDiv .chartLegend").attr("checked") === "checked"){
                        chartSettings.displayLegend = true;
                    }
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
    jQuery.getJSON(absolute_url + "/googlechart.get_data", function (data){
        var chart_id = base_chart;
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
            filters : {}
        };
        var transformedTable = transformTable(options);
        var adv_options = jQuery.extend(true, {}, JSON.parse(base_chart_settings.options));
        adv_options.chartArea = {
            width: multiples_settings.settings.chartAreaWidth,
            height: multiples_settings.settings.chartAreaHeight,
            top: multiples_settings.settings.chartAreaTop,
            left: multiples_settings.settings.chartAreaLeft
        };
        var chartConfig = [
            base_chart_settings.id,
            JSON.parse(base_chart_settings.config),
            JSON.parse(base_chart_settings.columns),
            JSON.parse(base_chart_settings.filters),
            JSON.parse(base_chart_settings.width),
            JSON.parse(base_chart_settings.height),
            JSON.parse(base_chart_settings.filterposition),
            JSON.parse(base_chart_settings.options),
            {},
            "__disabled__",
            "False",
            JSON.parse(base_chart_settings.row_filters),
            "",
            "",
            [],
            {}
        ];
        var smcharts_settings = {
            container: jQuery('.multiples-preview'),
            smc_item_settings: {
                'css_class': 'multiples-iframe-container'
            },
            sm_chart_width: multiples_settings.settings.chartAreaWidth,
            sm_chart_height: multiples_settings.settings.chartAreaWidth,
            multiples_settings: multiples_settings,
            settings: settings,
            transformedTable: transformedTable,
            chartConfig: chartConfig,
            adv_options: adv_options,
            chartFiltersId: null,
            dashboard_filters: null,
            interactive: false
        };
        drawSMCharts(smcharts_settings);
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
        var sorted_charts_columns_str = container.sortable('toArray',{attribute:'used_columns'});
        var sorted_charts_possible_labels_str = container.sortable('toArray',{attribute:'possible_labels'});
        var sorted_charts_filters_str = container.sortable('toArray',{attribute:'filters'});
        var sorted_charts = [];
        for (var i = 0; i < sorted_charts_columns_str.length; i++){
            sorted_charts.push({columns:JSON.parse(sorted_charts_columns_str[i]),
                                filters: JSON.parse(sorted_charts_filters_str[i]),
                                possibleLabels:JSON.parse(sorted_charts_possible_labels_str[i])
                                });
        }
        var widget = jQuery("#multiples_"+base_chart).data("widget");
        var tmp_settings = JSON.parse(widget.settings.multiples_settings);
        tmp_settings.charts = sorted_charts;
        widget.settings.multiples_settings = JSON.stringify(tmp_settings);
        widget.save(false, true);
      }
    });

});
