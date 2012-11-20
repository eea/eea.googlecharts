var grid;
var grid_colnames = [];
var grid_columnsHiddenById = {};
var grid_filters = {};
var grid_data_view;
var grid_data;

function updateColumnHeaders(){
    for (var colId in grid_colnames){
        if ((grid_filters[grid_colnames[colId]] !== undefined) && (grid_filters[grid_colnames[colId]].length !== 0)){
            jQuery(".slick-column-name:contains("+grid_colnames[colId]+")").addClass("filtered-column");
        }
        else {
            jQuery(".slick-column-name:contains("+grid_colnames[colId]+")").removeClass("filtered-column");
        }
    };
}

function gridFilter(item) {
    for (var colId in grid_colnames){
        if (jQuery.inArray(item[grid_colnames[colId]], grid_filters[grid_colnames[colId]]) !== -1){
            return false;
        }
    }
    return true;
}

function hiddenFormatter(row, cell, value, columnDef, dataContext){
    if (grid_columnsHiddenById[columnDef.id]) {
        return "<div class='grid-column-hidden'>" + value + "</div>";
    } else {
        return value;
    }
}

function menuOnCommandHandler(e, args){
    var column = args.column;
    var command = args.command;
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
    if (command == "showPivots"){
        jQuery(".pivotingTable").toggle();
    }
    if (command == "hideAll"){
        for (var colId in grid_colnames){
            grid_columnsHiddenById[grid_colnames[colId]] = true;
        }
        grid.invalidate();
    }
    if (command == "showAll"){
        grid_columnsHiddenById = {};
        grid.invalidate();
    }
    if (command == "reverse"){
        for (var colId in grid_colnames){
            if (grid_columnsHiddenById[grid_colnames[colId]]){
                delete grid_columnsHiddenById[grid_colnames[colId]];
            }
            else {
                grid_columnsHiddenById[grid_colnames[colId]] = true;
            }
        }

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
    updateColumnHeaders()
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
        if (item[c.field].toLowerCase().indexOf(filter_grid_filter.toLowerCase()) < 0 ) {
          return false;
        }
      }
    return true;
}

function filterApplyFlags() {
    for (var i = 0; i < filter_grid.getDataLength(); i++){
        var element = jQuery(filter_grid.getCellNode(i,0))
        element.removeClass("filter_item_ignored").removeClass("filter_item_selected")
        element.removeClass("filter_item_selected").removeClass("filter_item_ignored")
        var value = element.text();
        if (jQuery.inArray(value, filter_grid_filters) !== -1){
            element.removeClass("filter_item_selected").addClass("filter_item_ignored")
        }
        else{
            element.removeClass("filter_item_ignored").addClass("filter_item_selected")
        }
    }
}

function enableGridFilters(){
    grid_filters = {};
    filter_grid_filters = [];
    jQuery("body").delegate("#slick-menu-cancel","click", function(){
        jQuery(".slick-header-menu").remove();
        jQuery(".slick-header-column-active").removeClass("slick-header-column-active");
    });

    jQuery("body").delegate("#slick-menu-ok","click", function(){
        grid_filters[filter_grid_colId] = filter_grid_filters.slice();
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
        var filter_element = jQuery(".slick-header-menuitem").find("span:contains(filter)");
        if (filter_element.length === 0){
            return;
        }
        filter_element.parent().hide();
        var menu = filter_element.parent().parent();
        jQuery("#slick-menu-quicksearch").remove();
        jQuery("#slick-menu-clearboth").remove();
        jQuery("#slick-menu-all").remove();
        jQuery("#slick-menu-clear").remove();
        jQuery("#filter_grid").remove();
        jQuery("#slick-menu-ok").remove();
        jQuery("#slick-menu-cancel").remove();
        jQuery("<hr class='slick-filter-hr'>").appendTo(menu);
        jQuery("<div class='slick-filter-title'>Filter:</div>").appendTo(menu);
        jQuery("<input id='slick-menu-all' type='button' value='all'/>").appendTo(menu);
        jQuery("<input id='slick-menu-clear' type='button' value='clear'/>").appendTo(menu);
        jQuery("<div style='clear:both' id='slick-menu-clearboth'> </div>").appendTo(menu);
        jQuery("<input type='text' id='slick-menu-quicksearch'/>").appendTo(menu);
        jQuery("<div style='clear:both' id='slick-menu-clearboth'> </div>").appendTo(menu);
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
        for (var i = 0; i < self.grid_data.length; i++){
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
            filterApplyFlags()
        });

        filter_data_view.onRowsChanged.subscribe(function (e, args) {
            filter_grid.invalidateRows(args.rows);
            filter_grid.render();
            filterApplyFlags()
        });


        for (var i = 0; i < filter_data_array.length; i++){
            var tmp_data = {};
            tmp_data['id'] = i;
            tmp_data[colId] = filter_data_array[i]
            filter_data.push(tmp_data);
        }

        filter_grid = new Slick.Grid("#filter_grid", filter_data_view, filter_columns, filter_options);

        filter_grid.init()
        filter_data_view.beginUpdate();
        filter_data_view.setItems(filter_data);

        filter_data_view.setFilter(filterGridFilter);

        filter_data_view.endUpdate();
        filter_grid.autosizeColumns()
        jQuery("#filter_grid").find(".slick-viewport").height(jQuery("#filter_grid").height());
        filter_grid.onClick.subscribe(function(e, args){
            args.grid.setActiveCell(null);
            self.filter_clicked = true;
        });
        filter_grid.onActiveCellChanged.subscribe(function(e, args){
            if (self.filter_clicked){
                var selectedRow = args.grid.getActiveCell().row;
                var selectedValue = args.grid.getDataItem(selectedRow)[filter_grid_colId];
                var pos = jQuery.inArray(selectedValue, filter_grid_filters)
                if (pos === -1){
                    filter_grid_filters.push(selectedValue);
                }
                else {
                    filter_grid_filters.splice(pos, 1);
                }
                filterApplyFlags()
            }
            self.filter_clicked = false;
        });

        filter_grid.onViewportChanged.subscribe(function (e, args) {
            filter_grid.invalidateRows(args.rows);
            filter_grid.render();
            filterApplyFlags()
        });
    });
}

function drawGrid(divId, data, data_colnames){
    self.grid_data = data.slice();
    var options = {
        enableCellNavigation: false,
        enableColumnReorder: true
    };

    var header = {
        menu: {
            items: [
                {title:'show column',
                 command:'showColumn',},
                {title:'hide column',
                 command:'hideColumn'},
                {title:'filter',
                 command:'filter',
                 disabled:true},
            ]
        }
    }

    var columns = [
        {
            id: "options",
            name: "options",
            field: "",
            width: 60,
            resizable: false,
            header: {
                menu: {
                    items: [
                        {title:'show original table',
                        command:'showOriginal'},
                        {title:'table pivots',
                        command:'showPivots'},
                        {title:'hide all columns',
                        command:'hideAll'},
                        {title:'show all columns',
                        command:'showAll'},
                        {title:'reverse selection',
                        command:'reverse'},
                        {title:'scatterplots matrix',
                        command:'scatterplots'},
                        {title:'other matrices',
                        command:'otherMatrices'},
                        {title:'reset table',
                        command:'resetTable'},
                    ]
                }
            }
        }
    ];
    grid_filters = {};
    grid_colnames = [];
    jQuery.each(data[0], function(key,value){
        grid_colnames.push(key);
        columns.push({id: key, name: data_colnames[key], field: key,
                    formatter: hiddenFormatter,
                    header: header});

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

    grid.init()
    var grid_data = [];
    for (var i = 0; i < data.length; i++){
        var tmp_row = {'id': i};
        jQuery.extend(tmp_row, data[i]);
        grid_data.push(tmp_row);
    }
    grid_data_view.beginUpdate();
    grid_data_view.setItems(grid_data);

    grid_data_view.setFilter(gridFilter);

    grid_data_view.endUpdate();

    grid.onColumnsReordered.subscribe(gridOnColumnsReorderedHandler);
    var headerMenuPlugin = new Slick.Plugins.HeaderMenu(/*{
        buttonImage: "http://mleibman.github.com/SlickGrid/images/down.gif",
    }*/);

    headerMenuPlugin.onCommand.subscribe(menuOnCommandHandler);
    grid.registerPlugin(headerMenuPlugin);

    enableGridFilters();
}
