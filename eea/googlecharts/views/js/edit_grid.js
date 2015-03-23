var grid;
var grid_colIds = {};
var grid_columnsHiddenById = {};
var grid_filters = {};
var grid_data_view;
var grid_data;
var grid_sort_columnId = "";
var grid_sort_asc = true;
var ranges_grid;
var ranges_data = [];

function updateColumnHeaders(){
    generateNewTableForChart();
    jQuery("#newTable").find(".slick-column-name:contains(options)")
        .addClass("eea-icon")
        .addClass("eea-icon-gear")
        .text("")
        .click(function(){
            jQuery(this).parent().find('.slick-header-menubutton').click();
        }).bind("contextmenu",function(e){
            e.preventDefault();
            jQuery(this).click();
        });

    jQuery(".slick-column-search-icon").remove();
    jQuery(".slick-column-sort-icon").remove();
    patched_each(grid_colIds, function(colId, colName){
        if (grid_sort_columnId === colId){
            var slick_sort = jQuery("<span></span>").addClass("slick-column-sort-icon eea-icon");
            if (grid_sort_asc){
                slick_sort.addClass("eea-icon-sort-alpha-asc");
            }
            else {
                slick_sort.addClass("eea-icon-sort-alpha-desc");
            }
            jQuery("#newTable").find(".slick-column-name").filter(function(){
                return jQuery(this).text() === colName;
            }).prepend(slick_sort);
        }
        if (grid_filters[colId] !== undefined){
            if (((grid_filters[colId].type === 'hidden') && (grid_filters[colId].values.length !== 0)) || (grid_filters[colId].type === 'visible')){
                var slick_search = jQuery("<span></span>").addClass("slick-column-search-icon eea-icon eea-icon-search");
                jQuery("#newTable").find(".slick-column-name").filter(function(){
                    return jQuery(this).text() === colName;
                }).prepend(slick_search);
            }
        }
    });
}

function gridFilter(item) {
    var retVal = true;
    patched_each(grid_colIds, function(colId, colName){
        var val = "";
        try{
            val = decodeStr(item[colId].toString());
        }
        catch(err){}
        if (grid_filters[colId] !== undefined){
            var filtertype = (grid_filters[colId].type?grid_filters[colId].type:'hidden');
            if (filtertype === 'hidden'){
                if (jQuery.inArray(val, grid_filters[colId].values) !== -1){
                    retVal = false;
                }
            }
            else{
                if (jQuery.inArray(val, grid_filters[colId].values) === -1){
                    retVal = false;
                }
            }
        }
    });
    return retVal;
}

function hiddenFormatter(row, cell, value, columnDef, dataContext){
    if (grid_columnsHiddenById[columnDef.id]) {
        return "<div class='grid-column-hidden'>" + value + "</div>";
    } else {
        return value;
    }
}

function sortById(id, asc){
    grid_data_view.sort(function(row1, row2){
        var val1 = row1[id];
        var val2 = row2[id];
        if (val1 > val2){
            return 1;
        }
        if (val1 === val2){
            return 0;
        }
        if (val1 < val2){
            return -1;
        }
    },asc);
}

function menuOnCommandHandler(e, args){
    var column = args.column;
    var command = args.command;
    if (command == "sortasc") {
        grid_sort_columnId = column.id;
        grid_sort_asc = true;
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value", column.id);
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value", "asc");
        sortById(column.field, true);
        grid_data_view.refresh();
        grid.updateRowCount();
        grid.invalidateAllRows();
        grid.render();
    }
    if (command == "sortdesc") {
        grid_sort_columnId = column.id;
        grid_sort_asc = false;
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value", column.id);
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value", "desc");
        sortById(column.field, false);
        grid_data_view.refresh();
        grid.updateRowCount();
        grid.invalidateAllRows();
        grid.render();
    }
    if (command == "origord") {
        grid_sort_columnId = "";
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value", "");
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value", "asc");
        sortById("id", true);
        grid_data_view.refresh();
        grid.updateRowCount();
        grid.invalidateAllRows();
        grid.render();
    }
    if (command == "showColumn") {
        delete grid_columnsHiddenById[column.id];
        grid.invalidate();
    }
    if (command == "hideColumn") {
        grid_columnsHiddenById[column.id] = true;
        grid.invalidate();
    }
    if (command == "showOriginal"){
        jQuery("#googlechart_overlay").overlay().load();
    }

    var colId;
    if (command == "hideAll"){
        patched_each(grid_colIds, function(colId, colName){
            grid_columnsHiddenById[colId] = true;
        });
        grid.invalidate();
    }
    if (command == "showAll"){
        grid_columnsHiddenById = {};
        grid.invalidate();
    }
    if (command == "reverse"){
        patched_each(grid_colIds, function(colId, colName){
            if (grid_columnsHiddenById[colId]){
                delete grid_columnsHiddenById[colId];
            }
            else {
                grid_columnsHiddenById[colId] = true;
            }
        });

        grid.invalidate();
    }
    if (command == "scatterplots"){
        columnsMatrixChart('ScatterChart');
        grid.invalidate();
    }

    if (command == "otherMatrices"){
        columnsMatrixChart();
        grid.invalidate();
    }
    if (command == "resetFilters"){
        grid_filters = {};
        jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value","{}");

        grid_data_view.refresh();
        grid.updateRowCount();
        grid.invalidateAllRows();
        grid.render();
    }
    if (command == 'enableEmptyRows'){
        var options = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
        options.enableEmptyRows = !options.enableEmptyRows;
        jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value",JSON.stringify(options));
    }
    updateColumnHeaders();
}

function gridOnColumnsReorderedHandler(e, args){
    var oldColumns = args.grid.getColumns();
    if (oldColumns[0].id !== 'options'){
        var newColumns = [];
        jQuery(oldColumns).each(function(){
            if (this.id !== 'options'){
                newColumns.push(this);
            }
            else{
                newColumns.unshift(this);
            }
        });
        args.grid.setColumns(newColumns);
    }
    updateColumnHeaders();
}

var filter_grid;
var filter_grid_filter = "";
var filter_grid_clicked = false;
var filter_data_view;
var filter_grid_filters = [];
var filter_grid_colId;
var filter_type;

function filterGridFilter(item) {
    if (filter_grid_filter !== "") {
        var c = filter_grid.getColumns()[0];
        var tmp_val = "";
        try{
            tmp_val = item[c.field].toString().toLowerCase();
        }
        catch(err){}
        if (tmp_val.indexOf(filter_grid_filter.toLowerCase()) < 0 ) {
          return false;
        }
      }
    return true;
}

function filterApplyFlags() {
    for (var i = 0; i < filter_grid.getDataLength(); i++){
        var element = jQuery(filter_grid.getCellNode(i,0));
        element.removeClass("filter_item_ignored").removeClass("filter_item_selected");
        element.removeClass("filter_item_selected").removeClass("filter_item_ignored");
        var value = element.text();
        if (jQuery.inArray(value, filter_grid_filters) !== -1){
            element.removeClass("filter_item_selected").addClass("filter_item_ignored");
        }
        else{
            element.removeClass("filter_item_ignored").addClass("filter_item_selected");
        }
    }
}

function enableGridFilters(){
    jQuery(".slick-header-menu").remove();
    filter_grid_filters = [];
    jQuery("body").delegate("#slick-menu-cancel","click", function(){
        jQuery(".slick-header-menu").remove();
        jQuery(".slick-header-column-active").removeClass("slick-header-column-active");
    });

    jQuery("body").delegate("#slick-menu-ok","click", function(){
        if (jQuery("input[name='slick-filter-type']:checked").val()){
            grid_filters[filter_grid_colId] = {};
            grid_filters[filter_grid_colId].type = jQuery("input[name='slick-filter-type']:checked").val();
            if (grid_filters[filter_grid_colId].type === "visible"){
                var new_filter_grid_filters = [];
                for (var i = 0; i < filter_grid.getDataLength(); i++){
                    var element = filter_grid.getDataItem(i);
                    var value = "";
                    try {
                        value = element[filter_grid_colId].toString();
                    }
                    catch(err){}
                    if (jQuery.inArray(value, filter_grid_filters) === -1){
                        new_filter_grid_filters.push(value);
                    }
                }
                filter_grid_filters = new_filter_grid_filters;
            }

            grid_filters[filter_grid_colId].values = filter_grid_filters.slice();

            jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value", JSON.stringify(grid_filters));
            grid_data_view.refresh();
            grid.updateRowCount();
            grid.invalidateAllRows();
            grid.render();
            updateColumnHeaders();
            jQuery(".slick-header-menu").remove();
            jQuery(".slick-header-column-active").removeClass("slick-header-column-active");
        }
    });

    jQuery("body").delegate("#slick-menu-all","click", function(){
        for (var i = 0; i < filter_grid.getDataLength(); i++){
            var element = filter_grid.getDataItem(i);
            var value = "";
            try {
                value = element[filter_grid_colId].toString();
            }
            catch(err){}
            pos = jQuery.inArray(value, filter_grid_filters);
            if (pos !== -1){
                filter_grid_filters.splice(pos,1);
            }
        }
        filterApplyFlags();
    });

    jQuery("body").delegate("#slick-menu-clear","click", function(){
        for (var i = 0; i < filter_grid.getDataLength(); i++){
            var element = filter_grid.getDataItem(i);
            var value = "";
            try {
                value = element[filter_grid_colId].toString();
            }
            catch(err){}
            pos = jQuery.inArray(value, filter_grid_filters);
            if (pos === -1){
                filter_grid_filters.push(value);
            }
        }
        filterApplyFlags();
    });

    jQuery("body").delegate("#slick-menu-revert","click", function(){
        var new_filter_grid_filters = [];
        for (var i = 0; i < filter_grid.getDataLength(); i++){
            var element = filter_grid.getDataItem(i);
            var value = "";
            try {
                value = element[filter_grid_colId].toString();
            }
            catch(err){}
            if (jQuery.inArray(value, filter_grid_filters) === -1){
                new_filter_grid_filters.push(value);
            }
        }
        filter_grid_filters = new_filter_grid_filters;
        filterApplyFlags();
    });

    jQuery("body").delegate("#slick-menu-quicksearch","keyup", function (e) {
        if (e.which == 27) {
            this.value = "";
        }
        filter_grid_filter = this.value;
        filter_data_view.refresh();
    });

    jQuery("#newTable").delegate(".slick-header-menubutton","click", function(e, args){
        filter_grid_filter = "";
        var colName = jQuery(this.parentElement).find("span").text();
        var colId;
        jQuery(grid.getColumns()).each(function(){
            if (this.name === colName){
                colId = this.id;
            }
        });
        var switchToVisible = false;
        if (grid_filters[colId] === undefined){
            filter_grid_filters = [];
            filter_type = "hidden";
            switchToVisible = true;
        }
        else {
            filter_type = grid_filters[colId].type?grid_filters[colId].type:"hidden";
            filter_grid_filters = grid_filters[colId].values.slice();
        }
        filter_grid_colId = colId;
        var colNr = self.grid.getColumnIndex(colId);
        var filter_element = jQuery(".slick-header-menuitem").find("span:contains(-filter-)");
        if (filter_element.length === 0){
            var options = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
            var icon = jQuery(".slick-header-menuitem:contains('Enable empty rows')").find(".slick-header-menuicon");
            icon.removeClass("slick-menu-enabled");
            if (options.enableEmptyRows){
                icon.addClass("slick-menu-enabled");
            }
            return;
        }
        filter_element.parent().hide();
        var menu = filter_element.parent().parent();
        jQuery(".slick-filter-title").remove();
        jQuery('.slick-filter-body').remove();
        var filters_title = jQuery('<div>').addClass('slick-filter-title').text('Filter...').appendTo(menu);
        var filters = jQuery('<div>').addClass('slick-filter-body').appendTo(menu);
        jQuery("<input id='slick-menu-revert' type='button' value='Revert' class='btn btn-link' />").appendTo(filters);
        jQuery("<input id='slick-menu-clear' type='button' value='Clear' class='btn btn-link' />").appendTo(filters);
        jQuery("<input id='slick-menu-all' type='button' value='Select all' class='btn btn-link' />").appendTo(filters);
        jQuery("<div style='clear:both' class='slick-menu-clearboth'> </div>").appendTo(filters);
        jQuery("<input type='text' id='slick-menu-quicksearch' placeholder='Search...'/>").appendTo(filters);
        jQuery("<div style='clear:both' class='slick-menu-clearboth'> </div>").appendTo(filters);
        jQuery("<div id='filter_grid'></div>").appendTo(filters);
        jQuery("<div class='slick-filter-type'><input type='radio' name='slick-filter-type' value='hidden'"+(filter_type==='hidden'?' checked="checked"':'')+">Store Hidden Values</div>").appendTo(filters);
        jQuery("<div class='slick-filter-type'><input type='radio' name='slick-filter-type' value='visible'"+(filter_type==='visible'?' checked="checked"':'')+">Store Visible Values</div>").appendTo(filters);
        jQuery("<input id='slick-menu-ok' type='button' value='ok' class='btn'/>").appendTo(filters);
        jQuery("<input id='slick-menu-cancel' type='button' value='cancel' class='btn'/>").appendTo(filters);

        if (switchToVisible){
            jQuery(".slick-filter-type [value='visible']").attr("checked", "checked");
        }
        filters.hide();
        filters_title.click(function(){
            filters.toggle('blind');
        });

        var filter_columns = [
            {id: colId, name: colId, field: colId, cssClass:"filter_item"}
        ];

        var filter_options = {
            enableCellNavigation: true,
            enableColumnReorder: false
        };

        var filter_data_array = [];
        var i;
        for (i = 0; i < self.grid_data.length; i++){
            var newItem = self.grid_data[i][colId];
            var decodedNewItem = decodeStr(newItem);
            if (jQuery.inArray(decodedNewItem, filter_data_array) === -1){
                filter_data_array.push(decodedNewItem);
            }
        }
        filter_data_array.sort();
        var filter_data = [];
        filter_data_view = new Slick.Data.DataView();

        filter_data_view.onRowCountChanged.subscribe(function (e, args) {
            filter_grid.updateRowCount();
            filter_grid.render();
            filterApplyFlags();
        });

        filter_data_view.onRowsChanged.subscribe(function (e, args) {
            filter_grid.invalidateRows(args.rows);
            filter_grid.render();
            filterApplyFlags();
        });


        for (i = 0; i < filter_data_array.length; i++){
            var tmp_data = {};
            tmp_data.id = i;
            tmp_data[colId] = filter_data_array[i];
            filter_data.push(tmp_data);
        }

        filter_grid = new Slick.Grid("#filter_grid", filter_data_view, filter_columns, filter_options);
        filter_grid.init();
        filter_data_view.beginUpdate();
        filter_data_view.setItems(filter_data);

        if (filter_type === 'visible'){
            var new_filter_grid_filters = [];
            for (i = 0; i < filter_data.length; i++){
                var element = filter_data[i];
                var value = "";
                try {
                    value = element[filter_grid_colId].toString();
                }
                catch(err){}
                if (jQuery.inArray(value, filter_grid_filters) === -1){
                    new_filter_grid_filters.push(value);
                }
            }
            filter_grid_filters = new_filter_grid_filters;
        }


        filter_data_view.setFilter(filterGridFilter);

        filter_data_view.endUpdate();
        filter_grid.autosizeColumns();
        jQuery("#filter_grid").find(".slick-viewport").height(jQuery("#filter_grid").height());
        filter_grid.onClick.subscribe(function(e, args){
            args.grid.setActiveCell(null);
            self.filter_clicked = true;
        });
        filter_grid.onActiveCellChanged.subscribe(function(e, args){
            if (self.filter_clicked){
                var selectedValue = "";
                if (args.grid.getActiveCell()){
                    var selectedRow = args.grid.getActiveCell().row;
                    try{
                        selectedValue = args.grid.getDataItem(selectedRow)[filter_grid_colId].toString();
                    }
                    catch(err){}
                }

                var pos = jQuery.inArray(selectedValue, filter_grid_filters);
                if (pos === -1){
                    filter_grid_filters.push(selectedValue);
                }
                else {
                    filter_grid_filters.splice(pos, 1);
                }
                filterApplyFlags();
            }
            self.filter_clicked = false;
        });

        filter_grid.onViewportChanged.subscribe(function (e, args) {
            filter_grid.invalidateRows(args.rows);
            filter_grid.render();
            filterApplyFlags();
        });
    });
}

function setUpFormatterFormButtons(form){
    jQuery("<div style='clear:both'></div>").appendTo(form);
    jQuery("<input class='slick-menu-disable btn' type='button' value='disable'/>").appendTo(form);
    jQuery("<input class='slick-menu-enable btn' type='button' value='update and enable formatter'/>").appendTo(form);
}

function setUpArrowFormatterForm(form){
    form.addClass("arrowformatter");
    jQuery("<label class='slick-menu-arrowformatter-base-label slick-formatter-label'>base</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-arrowformatter-base slick-formatter-textinput' placeholder='Default 0'/>").appendTo(form);
}

function setUpBarFormatterForm(form){
    form.addClass("barformatter");
    jQuery("<label class='slick-menu-barformatter-base-label slick-formatter-label'>base</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-barformatter-base slick-formatter-textinput' placeholder='Default 0'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-colornegative-label slick-formatter-label'>colorNegative</label>").appendTo(form);
    jQuery("<select class='slick-menu-barformatter-colornegative slick-formatter-select'>"+
                "<option value='red' selected='selected'>red</option>"+
                "<option value='green'>green</option>"+
                "<option value='blue'>blue</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-colorpositive-label slick-formatter-label'>colorPositive</label>").appendTo(form);
    jQuery("<select class='slick-menu-barformatter-colorpositive slick-formatter-select'>"+
                "<option value='red'>red</option>"+
                "<option value='green'>green</option>"+
                "<option value='blue' selected='selected'>blue</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-zeroline-label slick-formatter-label'>drawZeroLine</label>").appendTo(form);
    jQuery("<select class='slick-menu-barformatter-zeroline slick-formatter-select'>"+
                "<option value='true'>true</option>"+
                "<option value='false' selected='selected'>false</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-max-label slick-formatter-label'>max</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-barformatter-max slick-formatter-textinput' placeholder='highest value'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-min-label slick-formatter-label'>min</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-barformatter-min slick-formatter-textinput' placeholder='lowest value'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-showvalue-label slick-formatter-label'>showValue</label>").appendTo(form);
    jQuery("<select class='slick-menu-barformatter-showvalue slick-formatter-select'>"+
                "<option value='true' selected='selected'>true</option>"+
                "<option value='false'>false</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-barformatter-width-label slick-formatter-label'>width</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-barformatter-width slick-formatter-textinput' placeholder='Default 100'/>").appendTo(form);
}

function eeaDeleteMarkFormatter(row, cell, value, columnDef, dataContext){
    return "<span class='eea-icon eea-icon-trash-o'></span>";
}

function eeaColorFormatter(row, cell, value, columnDef, dataContext){
    if (value){
        return "<span style='float:left;'>"+value+"</span><div style='background-color:"+value+"; height:100%; width:20px; float:right;'></div>";
    }
    return "<span></span>";
}

function getFontColorForColor(hexStr){
    var tmp_color = hexToRgb(hexStr);
    if (tmp_color.r * 0.3 + tmp_color.g * 0.59 + tmp_color.b * 0.11 > 128){
        return "#000000";
    }
    return "#ffffff";
}

function eeaColorEditor(args){
    var $color;
    var scope = this;
    this.init = function(){
        $color = jQuery("<input type=text class='editor-text edit-color-text' />")
                  .appendTo(args.container)
                  .bind("keydown", scope.handleKeyDown);
        scope.focus();
    };
    this.handleKeyDown = function (e) {
        if (e.keyCode == jQuery.ui.keyCode.LEFT || e.keyCode == jQuery.ui.keyCode.RIGHT || e.keyCode == jQuery.ui.keyCode.TAB){
            e.stopImmediatePropagation();
        }
    };
    this.destroy = function(){
        jQuery(args.container).empty();
    };
    this.focus = function () {
        if (args.item[args.column.field]){
            jQuery('.colorpickerfield').ColorPickerSetColor(hexToRgb(args.item[args.column.field]));
        }
        jQuery('.colorpickerfield').ColorPickerShow();
        var fieldOffset = $color.offset();
        var pickerOffset = jQuery(".colorpickerfield").offset();
        jQuery('.colorpicker').css("top", (fieldOffset.top-pickerOffset.top + 25).toString() + "px");
        jQuery('.colorpicker').css("left", (fieldOffset.left-pickerOffset.left).toString() + "px");
        jQuery('.colorpicker').css("z-index", "9999");
    };
    this.serializeValue = function () {
        return $color.val();
    };
    this.applyValue = function (item, state) {
        item[args.column.field] = state;
        if ((args.column.field === 'bgcolor') && (!item.bgcolor2)){
            item.bgcolor2 = state;
        }
        if (args.column.field === 'bgcolor'){
            item.color = getFontColorForColor(state);
        }
    };
    this.loadValue = function (item) {
        $color.val(item[args.column.field]);
    };
    this.isValueChanged = function(){
        return args.item[args.column.field] !== $color.val();
    };
    this.validate = function(){
        var result = /^#(?:[0-9a-f]{3}){1,2}$/i.exec($color.val());
        if (result !== null){
            jQuery(".slickgrid_errormsg").text("");
            return {valid: true, msg: null};
        }
        else {
            return {valid: false, msg: 'Please insert a valid color with the Hex Color Syntax (ex.  "#34ffa6")'};
        }
    };
    this.init();
}

function setUpColorFormatterForm(form){
    form.addClass("colorformatter");
    jQuery("<div class='slickgrid_errormsg eea_formatter_errormsg'></div>").appendTo(form);
    jQuery("<div>").addClass("slick-menu-colorsgrid daviz-slick-table").appendTo(form);
    var ranges_columns = [
        {id: "from", name: "From", field: "from", editor: Slick.Editors.Text, sortable: false, selectable: true, resizable: true, focusable: true},
        {id: "to", name: "To", field: "to", editor: Slick.Editors.Text, sortable: false, selectable: true, resizable: true, focusable: true},
        {id: "bgcolor", name: "bgColor", field: "bgcolor", editor: eeaColorEditor, sortable: false, selectable: true, resizable: true, focusable: true, formatter: eeaColorFormatter},
        {id: "bgcolor2", name: "bgColor2", field: "bgcolor2", editor: eeaColorEditor, sortable: false, selectable: true, resizable: true, focusable: true, formatter: eeaColorFormatter, toolTip: "If bgColor2 differs from bgColor, a gradient will be used from bgColor to bgColor2 for the specified range"},
        {id: "color", name: "Color", field: "color", editor: eeaColorEditor, sortable: false, selectable: true, resizable: true, focusable: true, formatter: eeaColorFormatter},
        {id: "delete", name: "Delete", field: "delete", formatter: eeaDeleteMarkFormatter, width:40}
        ];
    var ranges_options = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        editable: true,
        autoEdit: true,
        enableAddRow: true,
        forceFitColumns: true
    };

    ranges_data = [];
    ranges_grid = new Slick.Grid(".slick-menu-colorsgrid", ranges_data, ranges_columns, ranges_options);
    ranges_grid.onAddNewRow.subscribe(function (e, args) {
        var item = args.item;
        ranges_grid.invalidateRow(ranges_data.length);
        ranges_data.push(item);
        ranges_grid.updateRowCount();
        ranges_grid.render();
    });

    ranges_grid.onClick.subscribe(function (e) {
        var cell = ranges_grid.getCellFromEvent(e);
        if (ranges_grid.getColumns()[cell.cell].id == 'delete') {
            if (cell.row === ranges_data.length){
                return;
            }
            if (confirm('Delete range?')){
                ranges_grid.invalidateAllRows();
                ranges_data.splice(cell.row, 1);
                ranges_grid.updateRowCount();
                ranges_grid.render();
            }
        }
    });

    ranges_grid.onActiveCellChanged.subscribe(function (e, args) {
        jQuery(".slickgrid_errormsg").text("");
    });

    ranges_grid.onValidationError.subscribe(function (e, args) {
        jQuery(".slickgrid_errormsg").text(args.validationResults.msg);
    });

    jQuery("<p class='colorpickerfield'</p>").appendTo(form);
    jQuery('.colorpickerfield').ColorPicker({
        flat: true,
        onChange: function (hsb, hex, rgb) {
            jQuery('.edit-color-text').val("#"+hex);
        }
    });

    jQuery('<div>').addClass("colorpicker-palette").appendTo('.colorpicker');
    jQuery('<p>Pick from default palette</p>').appendTo('.colorpicker-palette');
    jQuery(chartPalettes['default'].colors).each(function(idx, color){
        var tmpObj = jQuery("<div class='googlechart_preview_color colorpicker-color' style='background-color:"+color+"'> </div>");
        tmpObj.attr("hexcolor", color);
        tmpObj.appendTo(".colorpicker-palette");
    });
    jQuery("<div style='clear:both;'> </div>").appendTo(".colorpicker-palette");

    jQuery('.colorpicker-color').bind('click', function(){
        jQuery('.colorpickerfield').ColorPickerSetColor(jQuery(this).attr("hexcolor"));
        jQuery('.edit-color-text').val(jQuery(this).attr("hexcolor"));
        getFontColorForColor(jQuery(this).attr("hexcolor"));
    });

    jQuery('.colorpickerfield').ColorPickerHide();
}

function setUpDateFormatterForm(form){
    form.addClass("dateformatter");
    jQuery("<label class='slick-menu-dateformatter-type-label slick-formatter-label'>use pattern</label>").appendTo(form);
    jQuery("<select class='slick-menu-dateformatter-type slick-formatter-select'>"+
                "<option value='no'>no</option>"+
                "<option value='yes'>yes</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery(".slick-menu-dateformatter-type").change(function(){
        jQuery(".slick-menu-dateformatter-pattern-label").toggle();
        jQuery(".slick-menu-dateformatter-pattern").toggle();
        jQuery(".slick-menu-dateformatter-formattype-label").toggle();
        jQuery(".slick-menu-dateformatter-formattype").toggle();
    });

    jQuery("<label class='slick-menu-dateformatter-formattype-label slick-formatter-label'>formatType</label>").appendTo(form);
    jQuery("<select class='slick-menu-dateformatter-formattype slick-formatter-select'>"+
                "<option value='short'>short</option>"+
                "<option value='medium'>medium</option>"+
                "<option value='long'>long</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-dateformatter-pattern-label slick-formatter-label'>pattern</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-dateformatter-pattern slick-formatter-textinput'/>").appendTo(form);
    jQuery(".slick-menu-dateformatter-pattern-label").hide();
    jQuery(".slick-menu-dateformatter-pattern").hide();
}

function showColorPicker(){
    if (jQuery('.slick-menu-numberformatter-negativecolor').val()){
        jQuery('.numbercolorpickerfield').ColorPickerSetColor(jQuery('.slick-menu-numberformatter-negativecolor').val());
    }

    jQuery('.numbercolorpickerfield').ColorPickerShow();

    var fieldOffset = jQuery('.slick-menu-numberformatter-negativecolor').offset();
    var pickerOffset = jQuery(".numbercolorpickerfield").offset();
    jQuery('.colorpicker').css("top", (fieldOffset.top-pickerOffset.top + 25).toString() + "px");
    jQuery('.colorpicker').css("left", (fieldOffset.left-pickerOffset.left).toString() + "px");
    jQuery('.colorpicker').css("z-index", "9999");
}

function setUpNumberFormatterForm(form){
    form.addClass("numberformatter");
    jQuery("<label class='slick-menu-numberformatter-type-label slick-formatter-label'>use pattern</label>").appendTo(form);
    jQuery("<select class='slick-menu-numberformatter-type slick-formatter-select'>"+
                "<option value='no'>no</option>"+
                "<option value='yes'>yes</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);


    jQuery(".slick-menu-numberformatter-type").change(function(){
        jQuery(".slick-menu-numberformatter-pattern-label").toggle();
        jQuery(".slick-menu-numberformatter-pattern").toggle();

        jQuery(".slick-menu-numberformatter-decimalsymbol-label").toggle();
        jQuery(".slick-menu-numberformatter-decimalsymbol").toggle();

        jQuery(".slick-menu-numberformatter-fractiondigits-label").toggle();
        jQuery(".slick-menu-numberformatter-fractiondigits").toggle();

        jQuery(".slick-menu-numberformatter-groupingsymbol-label").toggle();
        jQuery(".slick-menu-numberformatter-groupingsymbol").toggle();

        jQuery(".slick-menu-numberformatter-negativeparens-label").toggle();
        jQuery(".slick-menu-numberformatter-negativeparens").toggle();

        jQuery(".slick-menu-numberformatter-prefix-label").toggle();
        jQuery(".slick-menu-numberformatter-prefix").toggle();

        jQuery(".slick-menu-numberformatter-suffix-label").toggle();
        jQuery(".slick-menu-numberformatter-suffix").toggle();
    });

    jQuery("<label class='slick-menu-numberformatter-decimalsymbol-label slick-formatter-label'>decimalSymbol</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-decimalsymbol slick-formatter-textinput' placeholder='Default (.)'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-numberformatter-fractiondigits-label slick-formatter-label'>fractionDigits</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-fractiondigits slick-formatter-textinput' placeholder='Default 2'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-numberformatter-groupingsymbol-label slick-formatter-label'>groupingSymbol</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-groupingsymbol slick-formatter-textinput' placeholder='Default (,)'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<div class='colorpicker_errormsg eea_formatter_errormsg'></div>").appendTo(form);
    jQuery("<label class='slick-menu-numberformatter-negativecolor-label slick-formatter-label'>negativeColor</label>").appendTo(form);
    jQuery("<div class='slick-formatter-colorpreview'></div>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-negativecolor slick-formatter-colorinput'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);
    jQuery("<p class='numbercolorpickerfield'</p>").appendTo(form);
    jQuery('.numbercolorpickerfield').ColorPicker({
        flat: true,
        onChange: function (hsb, hex, rgb) {
            jQuery('.slick-menu-numberformatter-negativecolor').val("#"+hex);
            jQuery('.slick-formatter-colorpreview').css('background-color',jQuery('.slick-menu-numberformatter-negativecolor').val());
        }
    });
    jQuery('.numbercolorpickerfield').ColorPickerHide();
    jQuery('.slick-menu-numberformatter-negativecolor').focus(function(){
        showColorPicker();
    });
    jQuery('.slick-formatter-colorpreview').click(function(){
        showColorPicker();
    });
    jQuery('.slick-menu-numberformatter-negativecolor').bind('keyup', function(){
        if (jQuery('.slick-menu-numberformatter-negativecolor').val().trim() === ""){
            jQuery(".colorpicker_errormsg").text("");
            jQuery('.slick-formatter-colorpreview').css('background-color', "#FFFFFF");
            return;
        }

        jQuery('.numbercolorpickerfield').ColorPickerSetColor(this.value);
        jQuery('.slick-formatter-colorpreview').css('background-color',jQuery('.slick-menu-numberformatter-negativecolor').val());
    });

    jQuery('.slick-menu-numberformatter-negativecolor').bind('change', function(){
        if (jQuery('.slick-menu-numberformatter-negativecolor').val().trim() === ""){
            jQuery(".colorpicker_errormsg").text("");
            jQuery('.slick-formatter-colorpreview').css('background-color', "#FFFFFF");
            return;
        }
        var result = /^#(?:[0-9a-f]{3}){1,2}$/i.exec(jQuery('.slick-menu-numberformatter-negativecolor').val());
        if (result !== null){
            jQuery(".colorpicker_errormsg").text("");
        }
        else{
            jQuery(".colorpicker_errormsg").text('Please insert a valid color with the Hex Color Syntax (ex.  "#34ffa6")');
            jQuery('.slick-menu-numberformatter-negativecolor').focus();
        }
    });

    jQuery("<label class='slick-menu-numberformatter-negativeparens-label slick-formatter-label'>negativeParens</label>").appendTo(form);
    jQuery("<select class='slick-menu-numberformatter-negativeparens slick-formatter-select'>"+
                "<option value='true' selected='selected'>true</option>"+
                "<option value='false'>false</option>"+
            "</select>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-numberformatter-prefix-label slick-formatter-label'>prefix</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-prefix slick-formatter-textinput'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-numberformatter-suffix-label slick-formatter-label'>suffix</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-suffix slick-formatter-textinput'/>").appendTo(form);
    jQuery("<div style='clear:both'></div>").appendTo(form);

    jQuery("<label class='slick-menu-numberformatter-pattern-label slick-formatter-label'>pattern</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-numberformatter-pattern slick-formatter-textinput'/>").appendTo(form);
    jQuery(".slick-menu-numberformatter-pattern-label").hide();
    jQuery(".slick-menu-numberformatter-pattern").hide();
}

function setUpPatternFormatterForm(form){
    form.addClass("patternformatter");
    jQuery("<label class='slick-menu-patternformatter-pattern-label slick-formatter-label'>pattern</label>").appendTo(form);
    jQuery("<input type='text' class='slick-menu-patternformatter-pattern slick-formatter-textinput' placeholder='Default {0}'/>").appendTo(form);
}

function applyFormatters(button, enabled){
    var properties = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value"));
    var columnFriendlyName = jQuery(".slick-header-column-active").attr("title");
    var columnProperty = {};
    patched_each(properties.prepared, function(idx, property){
        if (property.fullname === columnFriendlyName){
            columnProperty = property;
        }
    });
    if (!columnProperty.hasOwnProperty("formatters")){
        columnProperty.formatters = {};
    }

    if (jQuery(button).parent().hasClass("arrowformatter")){
        columnProperty.formatters.arrowformatter = {};
        columnProperty.formatters.arrowformatter.base = jQuery(".slick-menu-arrowformatter-base").attr("value");
        columnProperty.formatters.arrowformatter.enabled = enabled;
    }

    if (jQuery(button).parent().hasClass("barformatter")){
        columnProperty.formatters.barformatter = {};
        columnProperty.formatters.barformatter.base = jQuery(".slick-menu-barformatter-base").attr("value");
        columnProperty.formatters.barformatter.colornegative = jQuery(".slick-menu-barformatter-colornegative").attr("value");
        columnProperty.formatters.barformatter.colorpositive = jQuery(".slick-menu-barformatter-colorpositive").attr("value");
        columnProperty.formatters.barformatter.zeroline = jQuery(".slick-menu-barformatter-zeroline").attr("value")==="true"?true:false;
        columnProperty.formatters.barformatter.min = jQuery(".slick-menu-barformatter-min").attr("value");
        columnProperty.formatters.barformatter.max = jQuery(".slick-menu-barformatter-max").attr("value");
        columnProperty.formatters.barformatter.showvalue = jQuery(".slick-menu-barformatter-showvalue").attr("value")==="true"?true:false;
        columnProperty.formatters.barformatter.width = jQuery(".slick-menu-barformatter-width").attr("value");
        columnProperty.formatters.barformatter.enabled = enabled;
    }

    if (jQuery(button).parent().hasClass("colorformatter")){
        columnProperty.formatters.colorformatter = {};
        var ranges = [];
        patched_each(ranges_grid.getData(), function(idx, row){
            var range = {};
            range.from = row.from;
            range.to = row.to;
            range.color = row.color;
            range.bgcolor = row.bgcolor;
            range.bgcolor2 = row.bgcolor2;
            ranges.push(range);
        });
        columnProperty.formatters.colorformatter.ranges = ranges;
        columnProperty.formatters.colorformatter.enabled = enabled;
    }

    if (jQuery(button).parent().hasClass("dateformatter")){
        columnProperty.formatters.dateformatter = {};
        columnProperty.formatters.dateformatter.usepattern = jQuery(".slick-menu-dateformatter-type").attr("value")==='yes'?true:false;
        columnProperty.formatters.dateformatter.formattype = jQuery(".slick-menu-dateformatter-formattype").attr("value");
        columnProperty.formatters.dateformatter.pattern = jQuery(".slick-menu-dateformatter-pattern").attr("value");
        columnProperty.formatters.dateformatter.enabled = enabled;
    }

    if (jQuery(button).parent().hasClass("numberformatter")){
        columnProperty.formatters.numberformatter = {};
        columnProperty.formatters.numberformatter.usepattern = jQuery(".slick-menu-numberformatter-type").attr("value")==='yes'?true:false;
        columnProperty.formatters.numberformatter.decimalsymbol = jQuery(".slick-menu-numberformatter-decimalsymbol").attr("value");
        columnProperty.formatters.numberformatter.fractiondigits = jQuery(".slick-menu-numberformatter-fractiondigits").attr("value");
        columnProperty.formatters.numberformatter.groupingsymbol = jQuery(".slick-menu-numberformatter-groupingsymbol").attr("value");
        columnProperty.formatters.numberformatter.negativecolor = jQuery(".slick-menu-numberformatter-negativecolor").attr("value");
        columnProperty.formatters.numberformatter.negativeparens = jQuery(".slick-menu-numberformatter-negativeparens").attr("value");
        columnProperty.formatters.numberformatter.prefix = jQuery(".slick-menu-numberformatter-prefix").attr("value");
        columnProperty.formatters.numberformatter.suffix = jQuery(".slick-menu-numberformatter-suffix").attr("value");
        columnProperty.formatters.numberformatter.pattern = jQuery(".slick-menu-numberformatter-pattern").attr("value");

        columnProperty.formatters.numberformatter.enabled = enabled;
    }

    if (jQuery(button).parent().hasClass("patternformatter")){
        columnProperty.formatters.patternformatter = {};
        columnProperty.formatters.patternformatter.pattern = jQuery(".slick-menu-patternformatter-pattern").attr("value");
        columnProperty.formatters.patternformatter.enabled = enabled;
    }
    jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value", JSON.stringify(properties));
    generateNewTableForChart();
}

function loadFormatters(colFullName){
    var prepared = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
    var columnProps = JSON.parse(jQuery("#googlechartid_tmp_chart").attr("columnproperties"));
    var colType = "text";
    patched_each(columnProps, function(key, columnProp){
        if (columnProp.label === colFullName || key){
            colType = columnProp.valueType;
        }
    });
    if (colType === "text"){
        jQuery(".slick-menu-arrowformat").hide();
        jQuery(".slick-menu-barformat").hide();
        jQuery(".slick-menu-colorformat").hide();
        jQuery(".slick-menu-dateformat").hide();
        jQuery(".slick-menu-numberformat").hide();
    }

    if (colType === "date"){
        jQuery(".slick-menu-arrowformat").hide();
        jQuery(".slick-menu-barformat").hide();
        jQuery(".slick-menu-colorformat").hide();
        jQuery(".slick-menu-numberformat").hide();
        jQuery(".slick-menu-patternformat").hide();
    }

    if (colType === "number"){
        jQuery(".slick-menu-dateformat").hide();
        jQuery(".slick-menu-patternformat").hide();
    }

    jQuery(".slick-format-menu").removeClass("slick-format-menu-enabled");
    patched_each(prepared, function(idx, col){
        if (col.fullname === colFullName){
            if (col.hasOwnProperty("formatters")){
                var formatter;
                if (col.formatters.hasOwnProperty("arrowformatter")){
                    formatter = col.formatters.arrowformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-arrowformat").addClass('slick-format-menu-enabled');
                    }
                    jQuery(".slick-menu-arrowformatter-base").attr("value", formatter.base);
                }
                if (col.formatters.hasOwnProperty("barformatter")){
                    formatter = col.formatters.barformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-barformat").addClass('slick-format-menu-enabled');
                    }
                    jQuery(".slick-menu-barformatter-base").attr("value", formatter.base);
                    jQuery(".slick-menu-barformatter-colornegative").attr("value", formatter.colornegative);
                    jQuery(".slick-menu-barformatter-colorpositive").attr("value", formatter.colorpositive);
                    jQuery(".slick-menu-barformatter-zeroline").attr("value", (formatter.zeroline?"true":"false"));
                    jQuery(".slick-menu-barformatter-min").attr("value", formatter.min);
                    jQuery(".slick-menu-barformatter-max").attr("value", formatter.max);
                    jQuery(".slick-menu-barformatter-showvalue").attr("value", (formatter.showvalue?"true":"false"));
                    jQuery(".slick-menu-barformatter-width").attr("value", formatter.width);
                }
                if (col.formatters.hasOwnProperty("colorformatter")){
                    formatter = col.formatters.colorformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-colorformat").addClass('slick-format-menu-enabled');
                    }

                    ranges_grid.invalidateRow(ranges_data.length);
                    patched_each(formatter.ranges, function(idx, range){
                        var row = {};
                        row.from = range.from;
                        row.to = range.to;
                        row.color = range.color;
                        row.bgcolor = range.bgcolor;
                        row.bgcolor2 = range.bgcolor2;
                        ranges_data.push(row);
                    });
                    ranges_grid.updateRowCount();
                    ranges_grid.render();

                }
                if (col.formatters.hasOwnProperty("dateformatter")){
                    formatter = col.formatters.dateformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-dateformat").addClass('slick-format-menu-enabled');
                    }
                    jQuery(".slick-menu-dateformatter-type").attr("value", (formatter.usepattern?"yes":"no"));
                    jQuery(".slick-menu-dateformatter-formattype").attr("value", formatter.formattype);
                    jQuery(".slick-menu-dateformatter-pattern").attr("value", formatter.pattern);
                    if (formatter.usepattern){
                        jQuery(".slick-menu-dateformatter-pattern-label").show();
                        jQuery(".slick-menu-dateformatter-pattern").show();
                        jQuery(".slick-menu-dateformatter-formattype-label").hide();
                        jQuery(".slick-menu-dateformatter-formattype").hide();
                    }
                }
                if (col.formatters.hasOwnProperty("numberformatter")){
                    formatter = col.formatters.numberformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-numberformat").addClass('slick-format-menu-enabled');
                    }

                    jQuery(".slick-menu-numberformatter-type").attr("value", (formatter.usepattern?"yes":"no"));
                    jQuery(".slick-menu-numberformatter-decimalsymbol").attr("value", formatter.decimalsymbol);
                    jQuery(".slick-menu-numberformatter-fractiondigits").attr("value", formatter.fractiondigits);
                    jQuery(".slick-menu-numberformatter-groupingsymbol").attr("value", formatter.groupingsymbol);
                    jQuery(".slick-menu-numberformatter-negativecolor").attr("value", formatter.negativecolor);
                    if (formatter.negativecolor.indexOf("#") === 0){
                        jQuery('.slick-formatter-colorpreview').css('background-color', formatter.negativecolor);
                    }

                    jQuery(".slick-menu-numberformatter-negativeparens").attr("value", formatter.negativeparens);
                    jQuery(".slick-menu-numberformatter-prefix").attr("value", formatter.prefix);
                    jQuery(".slick-menu-numberformatter-suffix").attr("value", formatter.suffix);
                    jQuery(".slick-menu-numberformatter-pattern").attr("value", formatter.pattern);

                    if (formatter.usepattern){
                        jQuery(".slick-menu-numberformatter-pattern-label").show();
                        jQuery(".slick-menu-numberformatter-pattern").show();

                        jQuery(".slick-menu-numberformatter-decimalsymbol-label").hide();
                        jQuery(".slick-menu-numberformatter-decimalsymbol").hide();

                        jQuery(".slick-menu-numberformatter-fractiondigits-label").hide();
                        jQuery(".slick-menu-numberformatter-fractiondigits").hide();

                        jQuery(".slick-menu-numberformatter-groupingsymbol-label").hide();
                        jQuery(".slick-menu-numberformatter-groupingsymbol").hide();

                        jQuery(".slick-menu-numberformatter-negativeparens-label").hide();
                        jQuery(".slick-menu-numberformatter-negativeparens").hide();

                        jQuery(".slick-menu-numberformatter-prefix-label").hide();
                        jQuery(".slick-menu-numberformatter-prefix").hide();

                        jQuery(".slick-menu-numberformatter-suffix-label").hide();
                        jQuery(".slick-menu-numberformatter-suffix").hide();
                    }


                }
                if (col.formatters.hasOwnProperty("patternformatter")){
                    formatter = col.formatters.patternformatter;
                    if (formatter.enabled){
                        jQuery(".slick-menu-patternformat").addClass('slick-format-menu-enabled');
                    }

                    jQuery(".slick-menu-patternformatter-pattern").attr("value", formatter.pattern);
                }
            }
        }
    });
}

function enableGridFormatters(){
    jQuery("body").delegate(".slick-menu-disable", "click", function(){
        jQuery(this).parent().prev().removeClass('slick-format-menu-enabled');
        applyFormatters(this, false);
    });
    jQuery("body").delegate(".slick-menu-enable", "click", function(){
        jQuery(this).parent().prev().addClass('slick-format-menu-enabled');
        applyFormatters(this, true);
    });
    jQuery("#newTable").delegate(".slick-header-menubutton","click", function(e, args){
        var format_element = jQuery(".slick-header-menuitem").find("span:contains(-format-)");
        if (format_element.length === 0){
            return;
        }
        format_element.parent().hide();
        jQuery(".slick-format-title").remove();
        jQuery(".slick-format-body").remove();
        var menu = format_element.parent().parent();
        var format_title = jQuery('<div>').addClass('slick-format-title').text('Format...').appendTo(menu);
        var formatters = jQuery('<div>').addClass('slick-format-body').appendTo(menu);
        var arrowformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-arrowformat').text('ArrowFormat...').appendTo(formatters);
        var arrowformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        var barformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-barformat').text('BarFormat...').appendTo(formatters);
        var barformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        var colorformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-colorformat').text('ColorFormat...').appendTo(formatters);
        var colorformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        var dateformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-dateformat').text('DateFormat...').appendTo(formatters);
        var dateformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        var numberformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-numberformat').text('NumberFormat...').appendTo(formatters);
        var numberformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        var patternformatter = jQuery('<div>').addClass('slick-format-menu slick-menu-patternformat').text('PatternFormat...').appendTo(formatters);
        var patternformatterform = jQuery('<div>').addClass('slick-format-form').appendTo(formatters);

        setUpArrowFormatterForm(arrowformatterform);
        setUpFormatterFormButtons(arrowformatterform);

        setUpBarFormatterForm(barformatterform);
        setUpFormatterFormButtons(barformatterform);

        setUpColorFormatterForm(colorformatterform);
        setUpFormatterFormButtons(colorformatterform);

        setUpDateFormatterForm(dateformatterform);
        setUpFormatterFormButtons(dateformatterform);

        setUpNumberFormatterForm(numberformatterform);
        setUpFormatterFormButtons(numberformatterform);

        setUpPatternFormatterForm(patternformatterform);
        setUpFormatterFormButtons(patternformatterform);

        formatters.hide();
        arrowformatterform.hide();
        barformatterform.hide();
        colorformatterform.hide();
        dateformatterform.hide();
        numberformatterform.hide();
        patternformatterform.hide();

        format_title.click(function(){
            formatters.toggle('blind');
        });
        arrowformatter.click(function(){
            arrowformatterform.toggle('blind');
        });
        barformatter.click(function(){
            barformatterform.toggle('blind');
        });
        colorformatter.click(function(){
            colorformatterform.toggle('blind');
        });
        dateformatter.click(function(){
            dateformatterform.toggle('blind');
        });
        numberformatter.click(function(){
            numberformatterform.toggle('blind');
        });
        patternformatter.click(function(){
            patternformatterform.toggle('blind');
        });

        loadFormatters(jQuery(this).parent().attr("title"));
    });
}

function applyCustomTooltip(button, enabled){
    var properties = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value"));
    var columnFriendlyName = jQuery(".slick-header-column-active").attr("title");
    var columnProperty = {};
    patched_each(properties.prepared, function(idx, property){
        if (property.fullname === columnFriendlyName){
            columnProperty = property;
        }
    });

    columnProperty.customTooltip = {tooltip: jQuery("#customtooltip_field").attr("value"),
                                    enabled: enabled};

    jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value", JSON.stringify(properties));
    generateNewTableForChart();
}

function loadCustomTooltip(colFullName){
    var prepared = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
    var columnProps = JSON.parse(jQuery("#googlechartid_tmp_chart").attr("columnproperties"));

    jQuery(".slick-customtooltip-title").removeClass("slick-customtooltip-menu-enabled");
    patched_each(prepared, function(idx, col){
        if (col.fullname === colFullName){
            if (col.hasOwnProperty("customTooltip")){
                customTooltip = col.customTooltip;
                if (customTooltip.enabled){
                    jQuery(".slick-customtooltip-title").addClass("slick-customtooltip-menu-enabled");
                }
                jQuery("#customtooltip_field").attr("value", customTooltip.tooltip);
            }
        }
    });
}

function insertTextAtTextareaCursor(txtarea,text) {
    //var txtarea = document.getElementById(areaId);
    //var txtarea = $("#"+ID).next('textarea')[0];
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false ) );
    var range;
    if (br == "ie") {
        txtarea.focus();
        range = document.selection.createRange();
        range.moveStart('character', -txtarea.value.length);
        strPos = range.text.length;
    }
    else if (br == "ff") {
            strPos = txtarea.selectionStart;
    }

    var front = (txtarea.value).substring(0,strPos);
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") {
        txtarea.focus();
        range = document.selection.createRange();
        range.moveStart('character', -txtarea.value.length);
        range.moveStart('character', strPos);
        range.moveEnd('character', 0);
        range.select();
    }
    else if (br == "ff") {
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}


function enableGridCustomTooltip(){
    jQuery("body").delegate(".slick-menu-disable-customtooltip", "click", function(){
        jQuery(this).parent().prev().removeClass('slick-customtooltip-menu-enabled');
        applyCustomTooltip(this, false);
    });
    jQuery("body").delegate(".slick-menu-enable-customtooltip", "click", function(){
        jQuery(this).parent().prev().addClass('slick-customtooltip-menu-enabled');
        applyCustomTooltip(this, true);
    });

    jQuery("#newTable").delegate(".slick-header-menubutton","click", function(e, args){
        var customtooltip_element = jQuery(".slick-header-menuitem").find("span:contains(-customtooltip-)");
        if (customtooltip_element.length === 0){
            return;
        }
        customtooltip_element.parent().hide();
        jQuery(".slick-customtooltip-title").remove();
        jQuery(".slick-customtooltip-body").remove();

        var menu = customtooltip_element.parent().parent();
        var customtooltip_title = jQuery('<div>').addClass('slick-customtooltip-title').text('Custom Tooltip...').appendTo(menu);
        var customtooltip = jQuery('<div>').addClass('slick-customtooltip-body').appendTo(menu);
        jQuery("<label>")
            .text("Template for tooltip")
            .appendTo(customtooltip);

        jQuery("<label>")
            .addClass("label-for-column-select")
            .text("Select column")
            .appendTo(customtooltip);

        jQuery("<select>")
            .addClass("columns-for-tooltip")
            .appendTo(customtooltip);
        jQuery("#newTable .slick-header .slick-header-columns .slick-header-column").each(function(idx, name){
            if (jQuery(name).text() === ""){
                return;
            }
            jQuery("<option>")
                    .attr("value", jQuery(name).text())
                    .text(jQuery(name).text())
                    .appendTo(jQuery(".columns-for-tooltip"));
        });
        jQuery("<input class='slick-menu-insert-customtooltip btn' type='button' value='insert in template'/>").appendTo(customtooltip);
        jQuery("<div>")
            .addClass("textareacontainer")
            .appendTo(customtooltip);
        jQuery("<textarea>")
            .attr("id", "customtooltip_field")
            .appendTo(".textareacontainer");

        var isTiniMCE = initializeChartTinyMCE(jQuery(".slick-customtooltip-body"));
        if (isTiniMCE){
            jQuery(".textareacontainer")
                .addClass("withtinymce");
        }

        jQuery("<input class='slick-menu-disable-customtooltip btn' type='button' value='disable'/>").appendTo(customtooltip);
        jQuery("<input class='slick-menu-enable-customtooltip btn' type='button' value='update and enable tooltip'/>").appendTo(customtooltip);

        customtooltip.hide();

        customtooltip_title.click(function(){
            customtooltip.toggle();
        });
        var tmp_title = jQuery(this).parent().attr("title");
        loadCustomTooltip(tmp_title);
        jQuery(".slick-menu-insert-customtooltip").bind("click", function(){
            var prepared = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
            var columnProps = JSON.parse(jQuery("#googlechartid_tmp_chart").attr("columnproperties"));
            var colFullName = jQuery(".columns-for-tooltip").attr("value");
            var colName = "";
            patched_each(prepared, function(idx, col){
                if (col.fullname === colFullName){
                    colName = "{" + col.name + "}";
                }
            });

            if (jQuery(".slick-customtooltip-body .textareacontainer").hasClass("withtinymce")){
                tinyMCE.activeEditor.execCommand('mceInsertContent', false, colName);
            }
            else{
                insertTextAtTextareaCursor(jQuery("#customtooltip_field")[0], colName);
            }
        });
    });

}

function loadRoles(colFullName){
    var prepared = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
    var columnProps = JSON.parse(jQuery("#googlechartid_tmp_chart").attr("columnproperties"));
    var colType = "text";
    patched_each(columnProps, function(key, columnProp){
        if (colFullName === (columnProp.label || key)){
            colType = columnProp.valueType;
        }
    });
    jQuery(".slick-role-menu").hide();

    var valid_roles = {
        "number" : ["", "data", "old-data", "interval", "annotation", "annotationText", "tooltip", "certainty", "emphasis", "scope"],
        "text" : ["", "data", "annotation", "annotationText", "tooltip", "style"],
        "date" : ["", "data", "annotation", "annotationText", "tooltip"],
        "boolean" : ["", "data", "annotation", "annotationText", "tooltip", "certainty", "emphasis", "scope"]
    };

    patched_each(valid_roles[colType], function(key, role){
        jQuery(".slick-role-" + role).show();
    });

    jQuery(".slick-role-menu-enabled").removeClass("slick-role-menu-enabled");
    patched_each(prepared, function(idx, col){
        if (colFullName === col.fullname){
            var role = "";
            if (col.hasOwnProperty("role")){
                role = col.role;
            }
            jQuery(".slick-role-" + role).addClass("slick-role-menu-enabled");
        }
    });
}

function saveRoles(colFullName){
    var columns = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value"));
    patched_each(columns.prepared, function(idx, col){
        if (col.fullname === colFullName){
            col.role = jQuery(".slick-role-menu-enabled").attr("role");
        }
    });
    jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value", JSON.stringify(columns));
    generateNewTableForChart();
}


function enableGridRoles(){
    jQuery("#newTable").delegate(".slick-header-menubutton","click", function(e, args){
        var available_roles = ["","data", "old-data", "interval", "annotation", "annotationText", "tooltip", "certainty", "emphasis", "scope", "style"];
        var role_element = jQuery(".slick-header-menuitem").find("span:contains(-role-)");
        if (role_element.length === 0){
            return;
        }
        role_element.parent().hide();
        jQuery(".slick-role-title").remove();
        jQuery(".slick-role-body").remove();

        var menu = role_element.parent().parent();
        var role_title = jQuery('<div>').addClass('slick-role-title').text('Role...').appendTo(menu);
        var roles = jQuery('<div>').addClass('slick-role-body').appendTo(menu);

        patched_each(available_roles, function(idx, role){
            var role_name = role;
            if (role_name === ""){
                role_name = "auto";
            }
            jQuery('<div>')
                .addClass("slick-role-menu")
                .addClass("slick-role-" + role)
                .text(role_name)
                .attr("role", role)
                .appendTo(roles);
        });

        roles.hide();
        role_title.click(function(){
            roles.toggle('blind');
        });
        var tmp_title = jQuery(this).parent().attr("title");
        jQuery(".slick-role-menu").click(function(){
            jQuery(".slick-role-menu-enabled").removeClass("slick-role-menu-enabled");
            jQuery(this).addClass("slick-role-menu-enabled");
            saveRoles(tmp_title);
        });
        loadRoles(tmp_title);
    });
}

function setGridColumnsOrder(sortOrder){
    grid_columnsHiddenById = {};
    var orig_cols = grid.getColumns();
    var tmp_cols = [];
    tmp_cols.push(orig_cols[0]);
    jQuery(sortOrder).each(function(idx_c, col){
        if (col[1] === "hidden"){
            grid_columnsHiddenById[col[0]] = true;
        }
        jQuery(orig_cols).each(function(idx_oc, orig_col){
            if (col[0] === orig_col.id){
                tmp_cols.push(orig_col);
            }
        });
    });
    grid.setColumns(tmp_cols);
    updateColumnHeaders();
}

function drawGrid(divId, data, data_colnames, filterable_columns){
    var options = {
        enableCellNavigation: false,
        enableColumnReorder: true,
        explicitInitialization: true
    };

    var header_nofilter = {
        menu: {
            items: [
                {title:'Sort A → Z',
                 command:'sortasc'},
                {title:'Sort Z → A',
                 command:'sortdesc'},
                {title:'Show column',
                 command:'showColumn'},
                {title:'Hide column',
                 command:'hideColumn'}
            ]
        }
    };
    var header_filter = {
        menu: {
            items: [
                {title:'Sort A → Z',
                 command:'sortasc'},
                {title:'Sort Z → A',
                 command:'sortdesc'},
                {title:'Show column',
                 command:'showColumn'},
                {title:'Hide column',
                 command:'hideColumn'},
                {title:'-customtooltip-',
                 command:'customtooltip',
                 tooltip:'Custom Tooltip',
                 disabled:true},
                {title:'-format-',
                 command:'format',
                 tooltip: 'Format',
                 disabled:true},
                {title:'-filter-',
                 command:'filter',
                 tooltip: 'Filter',
                 disabled:true},
                {title:'-role-',
                 command:'role',
                 tooltip: 'Role',
                 disabled:true}
            ]
        }
    };

    var columns = [
        {
            id: "options",
            name: "options",
            field: "id",
            width: 30,
            resizable: false,
            cssClass: "slickgrid-index-column",
            header: {
                menu: {
                    items: [
                        {title:'Show original table',
                        command:'showOriginal'},
                        {title:'Hide all columns',
                        command:'hideAll'},
                        {title:'Show all columns',
                        command:'showAll'},
                        {title:'Reverse selection',
                        command:'reverse'},
                        {title:'Reset sort',
                         command:'origord'},
                        {title:'Reset filters',
                        command:'resetFilters'},
                        {title:'Scatterplots matrix',
                        command:'scatterplots'},
                        {title:'Other matrices',
                        command:'otherMatrices'},
                        {title:'Enable empty rows',
                        command:'enableEmptyRows'}
                    ]
                }
            }
        }
    ];
    grid_colIds = {};
    grid_columnsHiddenById = {};

    var tmp_filters = jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value");
    grid_filters = {};
    if (tmp_filters.length > 0){
        grid_filters = JSON.parse(tmp_filters);
    }

    grid_sort_columnId = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value");

    var tmp_sortAsc = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value");
    grid_sort_asc = true;
    if (tmp_sortAsc === 'desc'){
        grid_sort_asc = false;
    }

    patched_each(data[0], function(key,value){
        grid_colIds[key] = data_colnames[key];
        var header = header_nofilter;
        if (jQuery.inArray(key, filterable_columns) !== -1){
            header = header_filter;
        }
        columns.push({id: key, name: data_colnames[key], field: key,
                    formatter: hiddenFormatter,
                    header: header,
                    toolTip: data_colnames[key]});

    });

    grid_data_view = new Slick.Data.DataView();

    grid_data_view.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
    });

    grid_data_view.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
    });

    grid = new Slick.Grid(divId, grid_data_view, columns, options);

    grid.onHeaderContextMenu.subscribe(function(e, args){
      e.preventDefault();
      jQuery('.slick-header-menubutton', e.srcElement).click();
    });

    grid.init();
    self.grid_data = [];
    for (var i = 0; i < data.length; i++){
        var tmp_row = {'id': i};
        jQuery.extend(tmp_row, data[i]);
        self.grid_data.push(tmp_row);
    }
    grid_data_view.beginUpdate();
    grid_data_view.setItems(self.grid_data);

    grid_data_view.setFilter(gridFilter);

    grid_data_view.endUpdate();

    grid.onColumnsReordered.subscribe(gridOnColumnsReorderedHandler);

    jQuery(document.body).bind("mousedown", function(e){
        var $menu = jQuery(".slick-header-menu");
        if ($menu.length > 0 && $menu[0] != e.target && !$.contains($menu[0], e.target)) {
            if (ranges_grid){
                ranges_grid.destroy();
            }
        }
    });


    var headerMenuPlugin = new Slick.Plugins.HeaderMenu();

    //fix for tinymce, the styles for tinymce are outside the slick menu, and by default clicking on it triggers the hideMenu method
    jQuery(document.body).bind("mousedown", function(e){
        if (jQuery(e.target).is("span") && jQuery(e.target).hasClass("mceText")){
            e.target = jQuery(".slick-header-menu")[0];
        }
    });

    headerMenuPlugin.onCommand.subscribe(menuOnCommandHandler);
    grid.registerPlugin(headerMenuPlugin);

    if (grid_sort_columnId !== ""){
        sortById(grid_sort_columnId, grid_sort_asc);
    }

    enableGridFormatters();
    enableGridFilters();
    enableGridRoles();
    enableGridCustomTooltip();
}

var columnfilter_data;

function eeaCheckMarkFormatter(row, cell, value, columnDef, dataContext){
    if (!value) {
        if (columnDef.name === 'Selectable'){
            return "<span class='eea-icon eea-icon-times'></span>";
        }
        if (columnDef.name === 'Visible'){
            return "<span class='eea-icon eea-icon-ban'></span>";
        }
        if (columnfilter_data[row].visible){
            return "<span class='eea-icon eea-icon-times'></span>";
        }
        else {
            return "<span class='eea-icon eea-icon-ban'></span>";
        }
    }
    return "<span class='eea-icon eea-icon-check'></span>";
}

var grid_columns;

function menuOnColumnsCommandHandler(e, args){
    var command = args.command;
    var newValue = false;
    if (command == "columnFiltersSelectAll"){
        newValue = true;
    }
    patched_each(columnfilter_data, function(idx, row){
        row.selectable = newValue;
    });
    grid_columns.invalidateAllRows();
    grid_columns.render();
}

function drawColumnFiltersGrid(divId, columns_list){
    columnfilter_data = [];
    var options = {
        editable: true,
        enableCellNavigation: true,
        asyncEditorLoading: false,
        autoEdit: true
    };
    var columns = [];

    for (var i = 0; i < columns_list.length; i++) {
        var d = (columnfilter_data[i] = {});
        d.colid = columns_list[i].name;
        d.column = columns_list[i].friendlyname;
        d.visible = columns_list[i].visible;
        d.defaultcol = columns_list[i].defaultcol;
        d.selectable = columns_list[i].selectable;
    }

    columns.push({
        id: 'column',
        name: "Column",
        field: 'column',
        width: 260
    });

    columns.push({
        id: 'visible',
        name: "Visible",
        field: 'visible',
        width: 50,
        cssClass: 'columnfilters-grid-checkbox',
        formatter: eeaCheckMarkFormatter
    });

    columns.push({
        id: 'defaultcol',
        name: "Default",
        field: 'defaultcol',
        width: 50,
        cssClass: 'columnfilters-grid-checkbox',
        formatter: eeaCheckMarkFormatter
    });

    columns.push({
        id: 'selectable',
        name: "Selectable",
        field: 'selectable',
        width: 75,
        cssClass: 'columnfilters-grid-checkbox',
        formatter: eeaCheckMarkFormatter,
        header:{
            menu: {
                items: [
                    {title:'select all',
                    command:'columnFiltersSelectAll'},
                    {title:'disable all',
                    command:'columnFiltersDisableAll'}
                ]
            }
        }
    });

    grid_columns = new Slick.Grid(divId, columnfilter_data, columns, options);

    var columnHeaderMenuPlugin = new Slick.Plugins.HeaderMenu();
    columnHeaderMenuPlugin.onCommand.subscribe(menuOnColumnsCommandHandler);
    grid_columns.registerPlugin(columnHeaderMenuPlugin);

    grid_columns.onClick.subscribe(function (e) {
        var cell = grid_columns.getCellFromEvent(e);
        if (grid_columns.getColumns()[cell.cell].id == 'defaultcol') {
            if ((!columnfilter_data[cell.row].visible) && (!columnfilter_data[cell.row].defaultcol)){
                return;
            }
            if (columnfilter_data[cell.row].defaultcol){
                columnfilter_data[cell.row].defaultcol = false;
            }
            else{
                columnfilter_data[cell.row].defaultcol = true;
                columnfilter_data[cell.row].selectable = true;
            }
            grid_columns.updateRow(cell.row);
            e.stopPropagation();
        }
        if (columnfilter_data[cell.row].defaultcol){
            return;
        }
        if (grid_columns.getColumns()[cell.cell].id == 'selectable') {
            if (columnfilter_data[cell.row].selectable){
                columnfilter_data[cell.row].selectable = false;
            }
            else{
                columnfilter_data[cell.row].selectable = true;
            }
            grid_columns.updateRow(cell.row);
            e.stopPropagation();
        }
    });
}

var defaultfilter_data;
function eeaDefaultsCheckMarkFormatter(row, cell, value, columnDef, dataContext){
    if (!value) {
        return "<span class='eea-icon eea-icon-times'></span>";
    }
    return "<span class='eea-icon eea-icon-check'>";
}

function drawDefaultValuesGrid(divId, values_list, multiselect){
    defaultfilter_data = [];
    options = {
        editable: true,
        enableCellNavigation: true,
        asyncEditorLoading: false,
        autoEdit: true
    };

    for (var i = 0; i < values_list.length; i++) {
        var d = (defaultfilter_data[i] = {});
        d.value = values_list[i].value;
        d.defaultval = values_list[i].defaultval;
    }

    var columns = [];
    columns.push({
        id: 'value',
        name: "Value",
        field: 'value',
        width: 205
    });
    columns.push({
        id: 'defaultval',
        name: "Default",
        field: 'defaultval',
        width: 50,
        cssClass: 'defaultfilters-grid-checkbox',
        formatter: eeaDefaultsCheckMarkFormatter
    });

    grid_defaults = new Slick.Grid(divId, defaultfilter_data, columns, options);

    grid_defaults.onClick.subscribe(function (e) {
        var cell = grid_defaults.getCellFromEvent(e);
        if (grid_defaults.getColumns()[cell.cell].id == 'defaultval') {
            if (defaultfilter_data[cell.row].defaultval){
                defaultfilter_data[cell.row].defaultval = false;
            }
            else{
                if (!multiselect){
                    for (i = 0; i < defaultfilter_data.length; i++){
                        defaultfilter_data[i].defaultval = false;
                        grid_defaults.updateRow(i);
                    }
                }
                defaultfilter_data[cell.row].defaultval = true;
            }
            for (i = 0; i < defaultfilter_data.length; i++){
                grid_defaults.updateRow(i);
            }
            e.stopPropagation();
        }
    });
}
