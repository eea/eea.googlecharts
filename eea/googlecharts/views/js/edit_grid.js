var grid;
var grid_colIds = {};
var grid_columnsHiddenById = {};
var grid_filters = {};
var grid_data_view;
var grid_data;
var grid_sort_columnId = "";
var grid_sort_asc = true;

function updateColumnHeaders(){
    generateNewTableForChart();
    jQuery("#newTable").find(".slick-column-name:contains(options)")
        .addClass("ui-icon")
        .addClass("ui-icon-gear")
        .click(function(){
            jQuery(this).parent().find('.slick-header-menubutton').click();
        }).bind("contextmenu",function(e){
            e.preventDefault();
            jQuery(this).click();
        });

    jQuery(".slick-column-search-icon").remove();
    jQuery(".slick-column-sort-icon").remove();
    jQuery.each(grid_colIds, function(colId, colName){
        if (grid_sort_columnId === colId){
            var slick_sort = jQuery("<span></span>").addClass("slick-column-sort-icon ui-icon");
            if (grid_sort_asc){
                slick_sort.addClass("ui-icon-carat-1-n");
            }
            else {
                slick_sort.addClass("ui-icon-carat-1-s");
            }
            jQuery("#newTable").find(".slick-column-name:contains("+colName+")").prepend(slick_sort);
        }
        if ((grid_filters[colId] !== undefined) && (grid_filters[colId].length !== 0)){
            var slick_search = jQuery("<span></span>").addClass("slick-column-search-icon ui-icon ui-icon-search");
            jQuery("#newTable").find(".slick-column-name:contains("+colName+")").prepend(slick_search);
        }
    });
}

function gridFilter(item) {
    var retVal = true;
    jQuery.each(grid_colIds, function(colId, colName){
        if (jQuery.inArray(item[colId], grid_filters[colId]) !== -1){
            retVal = false;
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
        jQuery.each(grid_colIds, function(colId, colName){
            grid_columnsHiddenById[colId] = true;
        });
        grid.invalidate();
    }
    if (command == "showAll"){
        grid_columnsHiddenById = {};
        grid.invalidate();
    }
    if (command == "reverse"){
        jQuery.each(grid_colIds, function(colId, colName){
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

function filterGridFilter(item) {
    if (filter_grid_filter !== "") {
        var c = filter_grid.getColumns()[0];
        var tmp_val = "";
        if (item[c.field]){
            tmp_val = item[c.field].toLowerCase();
        }
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
    filter_grid_filters = [];
    jQuery("body").delegate("#slick-menu-cancel","click", function(){
        jQuery(".slick-header-menu").remove();
        jQuery(".slick-header-column-active").removeClass("slick-header-column-active");
    });

    jQuery("body").delegate("#slick-menu-ok","click", function(){
        grid_filters[filter_grid_colId] = filter_grid_filters.slice();
        jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value", JSON.stringify(grid_filters));
        grid_data_view.refresh();
        grid.updateRowCount();
        grid.invalidateAllRows();
        grid.render();
        updateColumnHeaders();
        jQuery(".slick-header-menu").remove();
        jQuery(".slick-header-column-active").removeClass("slick-header-column-active");
    });

    jQuery("body").delegate("#slick-menu-all","click", function(){
        for (var i = 0; i < filter_grid.getDataLength(); i++){
            var element = filter_grid.getDataItem(i);
            var value = element[filter_grid_colId];
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
            var value = element[filter_grid_colId];
            pos = jQuery.inArray(value, filter_grid_filters);
            if (pos === -1){
                filter_grid_filters.push(value);
            }
        }
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
        if (grid_filters[colId] === undefined){
            filter_grid_filters = [];
        }
        else {
            filter_grid_filters = grid_filters[colId].slice();
        }
        filter_grid_colId = colId;
        var colNr = self.grid.getColumnIndex(colId);
        var filter_element = jQuery(".slick-header-menuitem").find("span:contains(-filter-)");
        if (filter_element.length === 0){
            return;
        }
        filter_element.parent().hide();
        var menu = filter_element.parent().parent();
        jQuery("#slick-menu-quicksearch").remove();
        jQuery(".slick-menu-clearboth").remove();
        jQuery("#slick-menu-all").remove();
        jQuery("#slick-menu-clear").remove();
        jQuery("#filter_grid").remove();
        jQuery("#slick-menu-ok").remove();
        jQuery("#slick-menu-cancel").remove();
        jQuery(".slick-filter-title").remove();
        jQuery(".slick-filter-hr").remove();
        jQuery("<hr class='slick-filter-hr'>").appendTo(menu);
        jQuery("<div class='slick-filter-title'>Filter:</div>").appendTo(menu);
        jQuery("<input id='slick-menu-all' type='button' value='all'/>").appendTo(menu);
        jQuery("<input id='slick-menu-clear' type='button' value='clear'/>").appendTo(menu);
        jQuery("<div style='clear:both' class='slick-menu-clearboth'> </div>").appendTo(menu);
        jQuery("<input type='text' id='slick-menu-quicksearch'/>").appendTo(menu);
        jQuery("<div style='clear:both' class='slick-menu-clearboth'> </div>").appendTo(menu);
        jQuery("<div id='filter_grid'></div>").appendTo(menu);
        jQuery("<input id='slick-menu-ok' type='button' value='ok'/>").appendTo(menu);
        jQuery("<input id='slick-menu-cancel' type='button' value='cancel'/>").appendTo(menu);

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
            if (jQuery.inArray(newItem, filter_data_array) === -1){
                filter_data_array.push(newItem);
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
                var selectedRow = args.grid.getActiveCell().row;
                var selectedValue = args.grid.getDataItem(selectedRow)[filter_grid_colId];
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
                {title:'sort ascending',
                 command:'sortasc'},
                {title:'sort descending',
                 command:'sortdesc'},
                {title:'show column',
                 command:'showColumn'},
                {title:'hide column',
                 command:'hideColumn'}
            ]
        }
    };
    var header_filter = {
        menu: {
            items: [
                {title:'sort ascending',
                 command:'sortasc'},
                {title:'sort descending',
                 command:'sortdesc'},
                {title:'show column',
                 command:'showColumn'},
                {title:'hide column',
                 command:'hideColumn'},
                {title:'-filter-',
                 command:'filter',
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
                        {title:'show original table',
                        command:'showOriginal'},
                        {title:'hide all columns',
                        command:'hideAll'},
                        {title:'show all columns',
                        command:'showAll'},
                        {title:'reverse selection',
                        command:'reverse'},
                        {title:'reset sort',
                         command:'origord'},
                        {title:'reset filters',
                        command:'resetFilters'},
                        {title:'scatterplots matrix',
                        command:'scatterplots'},
                        {title:'other matrices',
                        command:'otherMatrices'}
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

    jQuery.each(data[0], function(key,value){
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

    var headerMenuPlugin = new Slick.Plugins.HeaderMenu();

    headerMenuPlugin.onCommand.subscribe(menuOnCommandHandler);
    grid.registerPlugin(headerMenuPlugin);

    if (grid_sort_columnId !== ""){
        sortById(grid_sort_columnId, grid_sort_asc);
    }

    enableGridFilters();
}

var columnfilter_data;

function drawColumnFiltersGrid(divId, columns_list){
    var grid;
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
        formatter: Slick.Formatters.Checkmark
    });

    columns.push({
        id: 'defaultcol',
        name: "Default",
        field: 'defaultcol',
        width: 50,
        cssClass: 'columnfilters-grid-checkbox',
        formatter: Slick.Formatters.Checkmark
    });

    columns.push({
        id: 'selectable',
        name: "Selectable",
        field: 'selectable',
        width: 75,
        cssClass: 'columnfilters-grid-checkbox',
        formatter: Slick.Formatters.Checkmark
    });

    grid = new Slick.Grid(divId, columnfilter_data, columns, options);
    grid.onClick.subscribe(function (e) {
        var cell = grid.getCellFromEvent(e);
        if (grid.getColumns()[cell.cell].id == 'defaultcol') {
            if (!columnfilter_data[cell.row].visible){
                return;
            }
            if (columnfilter_data[cell.row].defaultcol){
                columnfilter_data[cell.row].defaultcol = false;
            }
            else{
                columnfilter_data[cell.row].defaultcol = true;
                columnfilter_data[cell.row].selectable = true;
            }
            grid.updateRow(cell.row);
            e.stopPropagation();
        }
        if (columnfilter_data[cell.row].defaultcol){
            return;
        }
        if (grid.getColumns()[cell.cell].id == 'selectable') {
            if (columnfilter_data[cell.row].selectable){
                columnfilter_data[cell.row].selectable = false;
            }
            else{
                columnfilter_data[cell.row].selectable = true;
            }
            grid.updateRow(cell.row);
            e.stopPropagation();
        }
    });
}
