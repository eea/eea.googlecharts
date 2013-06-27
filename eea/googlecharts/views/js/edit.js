var charteditor_css = null;
var previewChartObj = null;
var chartEditor = null;
var chartId = '';
var drawing = false;
var chartWrapper;

var defaultChart = {
           'chartType':'LineChart',
           "dataTable": [["column1", "column2"], ["A", 1], ["B", 2], ["C", 3], ["D", 2]],
           'options': {'legend':'none'}
    };

var available_filter_types = {  0:'Number Range Filter',
                            1:'String Filter',
                            2:'Simple Category Filter',
                            3:'Multiple Category Filter'};

var defaultAdvancedOptions = '{"fontName":"Verdana",'+
                              '"fontSize":12,'+
                              '"state":"{\\"showTrails\\":false}"' +
                              ',"showChartButtons":false' +
                              '}';

var availableChartsForMatrix = {'BarChart':'bar',
                                'ColumnChart':'column',
                                'LineChart':'line',
                                'PieChart':'pie'};

var chartsWithoutSVG = ['motionchart',
                        'organizational',
                        'imagechart',
                        'sparkline',
                        'table',
                        'annotatedtimeline',
                        'treemap'];

var resizableCharts = ['LineChart',
                        'ComboChart',
                        'AreaChart',
                        'SteppedAreaChart',
                        'ColumnChart',
                        'BarChart',
                        'ScatterChart',
                        'BubbleChart',
                        'PieChart'];

var matrixChartMatrixMaxDots = 200;
var matrixChartMinDots = 30;
var matrixChartSize = 73;
var matrixChartOptions = {
            'width':matrixChartSize - 4 - 2,
            'height':matrixChartSize - 4 - 2,
            'enableInteractivity':false,
            'pointSize':2,
            'chartArea':{
                'left':1,
                'top':1,
                'width':matrixChartSize - 4 - 4,
                'height':matrixChartSize - 4 - 4
            },
            'legend':{
                'position':'none'
            },
            'hAxis':{
                'baselineColor':'#FFFFFF',
                'textPosition':'none',
                'gridlines':{
                    'count':2,
                    'color':'#FFFFFF'
                }
            },
            'vAxis':{
                'baselineColor':'#FFFFFF',
                'textPosition':'none',
                'gridlines':{
                    'count':2,
                    'color':'#FFFFFF'
                }
            }
};

function updateCounters(){
    jQuery(".googlechart").each(function(){
        var columnFiltersNr = jQuery(this).find(".googlechart-columnfilters-box").find("li").length;
        var notesNr = jQuery(this).find(".googlechart-notes-box").find("li").length;
        var filtersNr = jQuery(this).find(".googlechart_filters_list").find("li").length;
        if (JSON.parse(jQuery(this).find(".googlechart_configjson").attr("value")).chartType === 'Table'){
            jQuery(this).find(".googlechart_sort").hide();
        }
        else {
            jQuery(this).find(".googlechart_sort").show();
            filtersNr += jQuery(this).find(".googlechart-filters-box").find(".ui-icon-hide").length;
        }
        jQuery(this).find(".googlechart-columnfilters-box").find(".items_counter").text("("+columnFiltersNr+")");
        jQuery(this).find(".googlechart-notes-box").find(".items_counter").text("("+notesNr+")");
        jQuery(this).find(".googlechart-filters-box").find(".items_counter").text("("+filtersNr+")");
    });
}

function resizeGooglecharts(){
    var listwidth = jQuery("#googlecharts_list").width();
    var chartwidth = jQuery(".googlechart").width();
    jQuery(".googlechart").removeClass("googlechart_firstchartinrow");
    var chartsinrow = parseInt((listwidth - 34) / chartwidth, 10);
    var ordered = jQuery('#googlecharts_list').sortable('toArray');
    jQuery(ordered).each(function(index, value){
        if ((index + 1)% chartsinrow === 1){
            jQuery("#"+value).addClass("googlechart_firstchartinrow");
        }
    });
}

function checkSVG(id){
    var tmp_config_str = jQuery("#googlechartid_"+id).find(".googlechart_configjson").attr("value");
    var tmp_config = JSON.parse(tmp_config_str);
    if (jQuery.inArray(tmp_config.chartType.toLowerCase(), chartsWithoutSVG) === -1){//xxx
        jQuery("#googlechart_thumb_id_"+id).show();
        jQuery("#googlechart_thumb_text_"+id).show();
        return true;
    }
    else{
        jQuery("#googlechart_thumb_id_"+id).hide();
        jQuery("#googlechart_thumb_text_"+id).hide();
        jQuery("#googlechart_thumb_id_"+id).attr("checked",false);
        return false;
    }
}

function checkSVG_withThumb(id){
    if (checkSVG(id)){
        var charts = jQuery('#googlecharts_list').sortable('toArray');
        hasThumb = false;
        jQuery(charts).each(function(index, value){
            var chartObj = jQuery("#"+value);
            if (chartObj.find(".googlechart_thumb_checkbox").attr("checked")){
                hasThumb = true;
            }
        });
        if (!hasThumb){
            jQuery("#googlechart_thumb_id_"+id).attr("checked",true);
        }
    }
}

function markChartAsModified(id){
    var chartObj = jQuery("#googlechartid_"+id);
    chartObj.addClass("googlechart_modified");
    updateCounters();
}

function changeChartHiddenState(id){
    var chartObj = jQuery("#googlechartid_"+id);
    if (chartObj.hasClass("googlechart_hidden")){
        chartObj.removeClass("googlechart_hidden");
    }
    else{
        chartObj.addClass("googlechart_hidden");
    }
}

function addFilter(id, column, filtertype, columnName){
    var filter = jQuery("<li class='googlechart_filteritem' id='googlechart_filter_"+id+"_"+column+"'>" +
                "<h1 class='googlechart_filteritem_"+id+"'><div style='float:left;width:90%;height:20px;overflow:hidden' class='googlechart_filteritem_id'></div><div class='ui-icon ui-icon-close remove_filter_icon' title='Delete filter'>x</div><div style='clear:both'></div></h1>" +
                '<span>' + available_filter_types[filtertype] + '</span>' +
                "<input type='hidden' class='googlechart_filteritem_type'/>" +
                "<input type='hidden' class='googlechart_filteritem_column'/>" +
             "</li>");
    filter.find(".googlechart_filteritem_id").text(columnName);
    filter.find(".googlechart_filteritem_type").attr("value", filtertype);
    filter.find(".googlechart_filteritem_column").attr("value", column);
    filter.appendTo("#googlechart_filters_"+id);
}

function initializeChartTinyMCE(form){
    // tinyMCE not supported
    if(!window.tinyMCE){
      return false;
    }
    if(!window.TinyMCEConfig){
      return false;
    }

    var textarea = jQuery('textarea', form).addClass('mce_editable');
    var name = textarea.attr('id');
    var exists = tinyMCE.get(name);
    if(exists !== undefined){
      delete InitializedTinyMCEInstances[name];
    }

    form = jQuery('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@tinymce-jsonconfiguration';

    jQuery.getJSON(action, {fieldname: name}, function(data){
      data.autoresize = true;
      data.resizing = false;
      // XXX Remove some buttons as they have bugs
      data.buttons = jQuery.map(data.buttons, function(button){
        if(button === 'save'){
          return;
        }else{
          return button;
        }
      });
      textarea.attr('title', JSON.stringify(data));
      var config = new TinyMCEConfig(name);
      config.init();
    });

    return true;
}

function reloadChartNotes(id){
    var context = jQuery('#googlechartid_' + id);
    if(!context.length){
        return;
    }

    var box = jQuery('.googlechart-notes-box', context);
    var ul = jQuery('.body ul', box).empty();

    var notes = context.data('notes') || [];
    jQuery.each(notes, function(index, note){
        var li = jQuery('<li>').text(note.title).appendTo(ul);
        li.data('note', note);

        // Note edit button
        jQuery('<div>')
            .addClass('ui-icon')
            .addClass('ui-icon-pencil')
            .attr('title', 'Edit note')
            .text('e')
            .prependTo(li)
            .click(function(){
                jQuery(".googlecharts_note_config").remove();

                var editDialog = jQuery('' +
                '<div class="googlecharts_note_config">' +
                    '<div class="field">' +
                        '<label>Title</label>' +
                        '<div class="formHelp">Note title</div>' +
                        '<input type="text" value="' + note.title + '"/>' +
                    '</div>' +
                    '<div class="field">' +
                        '<label>Text</label>' +
                        '<div class="formHelp">Note body</div>' +
                        '<textarea id="googlechart_note_add_' + id + '">' + note.text + '</textarea>' +
                    '</div>' +
                '</div>');

                var isTinyMCE = false;
                editDialog.dialog({
                    title: 'Edit note',
                    dialogClass: 'googlechart-dialog',
                    modal: true,
                    minHeight: 600,
                    minWidth: 950,
                    open: function(evt, ui){
                        var buttons = jQuery(this).parent().find('button');
                        buttons.attr('class', 'btn');
                        jQuery(buttons[0]).addClass('btn-inverse');
                        jQuery(buttons[1]).addClass('btn-success');
                        isTinyMCE = initializeChartTinyMCE(editDialog);
                    },
                    buttons: {
                        Cancel: function(){
                            jQuery(this).dialog('close');
                        },
                        Save: function(){
                            if(isTinyMCE){
                                tinyMCE.triggerSave(true, true);
                            }

                            var newNote = {
                                title: jQuery('input[type="text"]', editDialog).val(),
                                text: jQuery('textarea', editDialog).val()
                            };

                            var newNotes = jQuery.map(context.data('notes'), function(value, index){
                                if(value.title != note.title){
                                    return value;
                                }else{
                                    return newNote;
                                }
                            });
                            context.data('notes', newNotes);
                            reloadChartNotes(id);
                            markChartAsModified(id);
                            jQuery(this).dialog('close');
                        }
                    }
                });
            });

        // Note delete button
        jQuery('<div>')
            .addClass('ui-icon')
            .addClass('ui-icon-close')
            .attr('title', 'Delete note')
            .text('x')
            .prependTo(li)
            .click(function(){
                var deleteButton = jQuery(this);
                var removeDialog = jQuery([
                "<div>Are you sure you want to delete chart note: ",
                    "<strong>", note.title, "</strong>" ,
                "</div>"
                ].join('\n'));
                removeDialog.dialog({
                    title: "Remove note",
                    modal: true,
                    dialogClass: 'googlechart-dialog',
                    open: function(evt, ui){
                        var buttons = jQuery(this).parent().find('button');
                        buttons.attr('class', 'btn');
                        jQuery(buttons[0]).addClass('btn-danger');
                        jQuery(buttons[1]).addClass('btn-inverse');
                    },
                    buttons:{
                        Remove: function(){
                            var li = deleteButton.closest('li');
                            li.remove();
                            context.data('notes', []);
                            jQuery('li', ul).each(function(){
                                context.data('notes').push(jQuery(this).data('note'));
                            });
                            markChartAsModified(id);
                            jQuery(this).dialog("close");
                        },
                        Cancel: function(){
                            jQuery(this).dialog("close");
                        }
                    }
                });
            });
    });

    try {
        ul.sortable('destroy');
    } catch(err) {}

    ul.sortable({
        items: 'li',
        opacity: 0.7,
        delay: 300,
        placeholder: 'ui-state-highlight',
        forcePlaceholderSize: true,
        cursor: 'crosshair',
        tolerance: 'pointer',
        update: function(){
            context.data('notes', []);
            jQuery('li', ul).each(function(){
                context.data('notes').push(jQuery(this).data('note'));
            });
            markChartAsModified(id);
        }
    });
}

function validateColumnFilter(columnfilter_titles, columnfilter, checktitle){
    var errorMsg = "";
    if ((columnfilter.title.length === 0) && (checktitle)){
        errorMsg = "Title is mandatory";
    }
    else{
        if ((columnfilter_titles.indexOf(columnfilter.title) !== -1) && (checktitle)){
            errorMsg = "Title already in use";
        }
        else {
            if (columnfilter.type === "0"){
                if (columnfilter.settings.defaults.length !== 1){
                    errorMsg = "1 column should be selected as default column!";
                }
                else {
                    if (columnfilter.settings.selectables.length < 2){
                        errorMsg = "At least 2 columns must be selected as selectable columns!";
                    }
                }
            }
            else {
                if (columnfilter.settings.defaults.length < 1){
                    errorMsg = "At least 1 column should be selected as default column!";
                }
                else {
                    if (columnfilter.settings.selectables.length < 2){
                        errorMsg = "At least 2 columns must be selected as selectable columns!";
                    }
                }
            }
        }
    }
    return errorMsg;
}

function reloadColumnFilters(id){
    var context = jQuery('#googlechartid_' + id);
    if(!context.length){
        return;
    }

    var box = jQuery('.googlechart-columnfilters-box', context);
    var ul = jQuery('.body ul', box).empty();

    var columnfilters = context.data('columnfilters') || [];

    jQuery.each(columnfilters, function(index, columnfilter){
        var li = jQuery('<li>').text(columnfilter.title).appendTo(ul);
        li.data('columnfilter', columnfilter);

        // Columnfilter edit button
        jQuery('<div>')
            .addClass('ui-icon')
            .addClass('ui-icon-pencil')
            .attr('title', 'Edit columnfilter')
            .text('e')
            .prependTo(li)
            .click(function(){
                var cols = [];
                var chartcolumns = JSON.parse(jQuery("#googlechartid_" + id).find(".googlechart_columns").attr("value")).prepared;
                jQuery.each(chartcolumns, function(index, column){
                    var col = {};
                    col.name = column.name;
                    col.friendlyname = column.fullname;
                    col.visible = false;
                    col.defaultcol = false;
                    col.selectable = false;

                    if (column.status === 1){
                        col.visible = true;
                    }

                    if (columnfilter.settings.defaults.indexOf(col.name) !== -1){
                        col.defaultcol = true;
                    }

                    if (columnfilter.settings.selectables.indexOf(col.name) !== -1){
                        col.selectable = true;
                    }

                    cols.push(col);
                });

                jQuery(".googlecharts_columnfilter_config").remove();

                var editDialog = jQuery('' +
                    '<div class="googlecharts_columnfilter_config">' +
                        '<div class="field">' +
                            '<label>Title</label>' +
                            '<div class="formHelp">Filter title</div>' +
                            '<input type="text" class="googlecharts_columnfilter_title" value="' + columnfilter.title + '"/>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label>Type</label>' +
                            '<div class="formHelp">Filter type</div>' +
                            '<select class="googlecharts_columnfilter_type">'+
                                '<option value="0" ' + ((columnfilter.type === '0') ? "selected='selected'": "") + '>Simple select</option>'+
                                '<option value="1" ' + ((columnfilter.type === '1') ? "selected='selected'": "") + '>Multi select</option>'+
                            '</select>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label>Allow disabled</label>' +
                            '<div class="formHelp">Allow column to be disabled</div>' +
                            '<input type="checkbox" class="googlecharts_columnfilter_allowempty" '+ (columnfilter.allowempty ? 'checked="checked"' : '') +'/>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label>Dynamic columns</label>' +
                            '<div class="formHelper">'+
                                '<ul class="columnfilters-helper">'+
                                    '<li>Only visible columns can be default columns for filters</li>'+
                                    '<li>Default filter columns are automatically selectable columns</li>'+
                                '</ul>'+
                            '</div>'+
                            '<div class="googlecharts_columnfilter_slickgrid daviz-data-table daviz-slick-table slick_newTable" style="width:450px;height:200px"></div>'+
                        '</div>' +
                    '</div>');


                editDialog.dialog({
                    title: 'Edit Column filter',
                    dialogClass: 'googlechart-dialog',
                    modal: true,
                    minWidth: 500,
                    open: function(evt, ui){
                        var buttons = jQuery(this).parent().find('button');
                        buttons.attr('class', 'btn');
                        jQuery(buttons[0]).addClass('btn-inverse');
                        jQuery(buttons[1]).addClass('btn-success');
                        drawColumnFiltersGrid(".googlecharts_columnfilter_slickgrid", cols);
                    },
                    buttons: {
                        Cancel: function(){
                            jQuery(this).dialog('close');
                        },
                        Save: function(){
                            var modified_columnfilter = {};
                            modified_columnfilter.title = jQuery('.googlecharts_columnfilter_title').val();
                            modified_columnfilter.type = jQuery('.googlecharts_columnfilter_type').val();
                            modified_columnfilter.allowempty = jQuery('.googlecharts_columnfilter_allowempty').is(':checked') ? true : false;
                            modified_columnfilter.settings = {};
                            modified_columnfilter.settings.defaults = [];
                            modified_columnfilter.settings.selectables = [];
                            jQuery.each(columnfilter_data, function(index, row){
                                if (row.defaultcol){
                                    modified_columnfilter.settings.defaults.push(row.colid);
                                }
                                if (row.selectable){
                                    modified_columnfilter.settings.selectables.push(row.colid);
                                }
                            });
                            var columnfilter_titles = [];
                            jQuery.each(context.data('columnfilters'), function(index, cfilter){
                                columnfilter_titles.push(cfilter.title);
                            });

                            var checktitle = true;
                            if (modified_columnfilter.title === columnfilter.title){
                                checktitle = false;
                            }

                            var errorMsg = validateColumnFilter(columnfilter_titles, modified_columnfilter, checktitle);
                            if (errorMsg.length > 0){
                                alert(errorMsg);
                                return;
                            }
                            var newColumnFilters = jQuery.map(context.data('columnfilters'), function(value, index){
                                if(value.title != columnfilter.title){
                                    return value;
                                }else{
                                    return modified_columnfilter;
                                }
                            });
                            context.data('columnfilters', newColumnFilters);
                            reloadColumnFilters(id);
                            markChartAsModified(id);
                            jQuery(this).dialog('close');
                        }
                    }
                });
            });

        // Columnfilter delete button
        jQuery('<div>')
            .addClass('ui-icon')
            .addClass('ui-icon-close')
            .attr('title', 'Delete column filter')
            .text('x')
            .prependTo(li)
            .click(function(){
                var deleteButton = jQuery(this);
                var removeDialog = jQuery([
                "<div>Are you sure you want to delete column filter: ",
                    "<strong>", columnfilter.title, "</strong>" ,
                "</div>"
                ].join('\n'));
                removeDialog.dialog({
                    title: "Remove column filter",
                    modal: true,
                    dialogClass: 'googlechart-dialog',
                    open: function(evt, ui){
                        var buttons = jQuery(this).parent().find('button');
                        buttons.attr('class', 'btn');
                        jQuery(buttons[0]).addClass('btn-danger');
                        jQuery(buttons[1]).addClass('btn-inverse');
                    },
                    buttons:{
                        Remove: function(){
                            var li = deleteButton.closest('li');
                            li.remove();
                            context.data('columnfilters', []);
                            jQuery('li', ul).each(function(){
                                context.data('columnfilters').push(jQuery(this).data('columnfilter'));
                            });
                            markChartAsModified(id);
                            jQuery(this).dialog("close");
                        },
                        Cancel: function(){
                            jQuery(this).dialog("close");
                        }
                    }
                });
            });
    });

    try{
        ul.sortable('destroy');
    } catch(err) {}
    ul.sortable({
        items: 'li',
        opacity: 0.7,
        delay: 300,
        placeholder: 'ui-state-highlight',
        forcePlaceholderSize: true,
        cursor: 'crosshair',
        tolerance: 'pointer',
        update: function(){
            context.data('columnfilters', []);
            jQuery('li', ul).each(function(){
                context.data('columnfilters').push(jQuery(this).data('columnfilter'));
            });
            markChartAsModified(id);
        }
    });
}

function saveThumb(value, useName){
    var chart_id = value[0];
    var chart_json = value[1];
    var chart_columns = value[2];
    var chart_filters = value[3];
    var chart_width = value[4];
    var chart_height = value[5];
    var chart_filterposition = value[6];
    var chart_options = value[7];
    var chart_row_filters = value[8];
    var chart_sortBy = value[9];
    var chart_sortAsc = value[10];

    var columnsFromSettings = getColumnsFromSettings(chart_columns);
    var options = {
        originalTable : all_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : available_columns,
        filters : chart_row_filters

    };
    var transformedTable = transformTable(options);

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : chart_sortBy,
        sortAsc : chart_sortAsc
    };
    var tableForChart = prepareForChart(options);

    var thumb_id = "googlechart_thumb_zone";
    if (!useName){
        thumb_id += "_cover";
    }
    else {
        thumb_id += "_" + value[0];
    }

    jQuery("<div></div>")
        .attr("id", thumb_id)
        .addClass("googlechart_thumb_zone")
        .appendTo("#googlecharts_config");

    var googlechart_params = {
        chartViewDiv : thumb_id,
        chartId : chart_id,
        chartJson : chart_json,
        chartDataTable : tableForChart,
        chartFilters : '',
        chartWidth : chart_width,
        chartHeight : chart_height,
        chartOptions : chart_options,
        availableColumns : transformedTable.available_columns,
        chartReadyEvent : function(){
                            var filename;
                            var thumb_id = "#googlechart_thumb_zone";
                            if (!useName){
                                filename = "cover.png";
                                thumb_id += "_cover";
                            }
                            else {
                                filename = value[0];
                                thumb_id += "_" + value[0];
                            }
                            var svg = jQuery(thumb_id).find("svg").parent().html();
                            jQuery(thumb_id).remove();
                            var form = jQuery('.daviz-view-form:has(#googlecharts_config)');
                            var action = form.length ? form.attr('action') : '';
                            if (useName){
                                action = action.split('@@')[0] + "@@googlechart.savepngchart";
                            }
                            else {
                                action = action.split('@@')[0] + "@@googlechart.setthumb";
                            }
                            jQuery.ajax({
                                type: 'POST',
                                url: action,
                                data: {"svg":svg, "filename":filename},
                                async: false,
                                success: function(data){
                                    if (data !== "Success"){
                                        DavizEdit.Status.stop("Can't generate thumb from the chart called: " + chart_json.options.title);
                                    }
                                 }
                            });
                        },

        chartErrorEvent : function(){
                            DavizEdit.Status.stop("Can't generate thumb from the chart called: " + chart_json.options.title);
                        },
        showSort : false,
        hideNotes: true
    };
    drawGoogleChart(googlechart_params);
}

function drawChart(elementId, readyEvent){
    readyEvent(elementId);
    var chartConfig = JSON.parse(jQuery("#googlechartid_"+elementId).find(".googlechart_configjson").attr("value"));
    var chartType = chartConfig.chartType.toLowerCase();
    var chartClass = "googlechart-preview-"+chartType;
    if (chartType === "linechart"){
        if (chartConfig.options.curveType === 'function'){
            chartClass += "-smooth";
        }
    }
    if (chartType === "imagechart"){
        if (chartConfig.options.cht[0] === "r"){
            chartClass += "-radar";
        }
    }
    if ((chartType === "areachart") || (chartType === 'barchart') || (chartType === 'columnchart')){
        if (chartConfig.options.isStacked){
            chartClass += "-stacked";
        }
    }
    if (chartType === "piechart"){
        if (chartConfig.options.is3D){
            chartClass += "-3d";
        }
        else{
            if (chartConfig.options.pieHole !== 0){
                chartClass += "-donut";
            }
        }
    }
    if (chartType === "geochart"){
        if (chartConfig.options.displayMode === 'markers'){
            chartClass += "-markers";
        }
    }
    jQuery("#googlechart_chart_div_"+elementId).attr("class", chartClass);
    return;
}

function openAdvancedOptions(id){
    var errorMsgJSON = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input must be a valid JSON" +
        "</div>";

    var chartObj = jQuery("#googlechartid_"+id);
    var options = chartObj.find(".googlechart_options").attr("value");

    jQuery(".googlecharts_advancedoptions_dialog").remove();

    var advancedOptionsDialog = jQuery(""+
        "<div class='googlecharts_advancedoptions_dialog'>"+
            "<div class='googlechart_dialog_options_div field'>" +
                "<label>Options</label>" +
                "<div class='formHelp'><a href='http://code.google.com/apis/chart/interactive/docs/gallery.html'>See GoogleChart documentation</a></div>" +
                "<textarea rows='10' cols='30' class='googlechart_dialog_options'>" +
                "</textarea>" +
            "</div>" +
        "<div>");
    advancedOptionsDialog.find(".googlechart_dialog_options").text(options);
    advancedOptionsDialog.dialog({title:"Advanced Options",
            dialogClass: 'googlechart-dialog',
            modal:true,
            minWidth: 600,
            minHeight: 480,
            open: function(evt, ui){
                var buttons = jQuery(this).parent().find('button');
                buttons.attr('class', 'btn');
                jQuery(buttons[0]).addClass('btn-success');
                jQuery(buttons[1]).addClass('btn-inverse');
            },
            buttons:[
                {
                    text: "Save",
                    click: function(){
                        advancedOptions = jQuery(".googlechart_dialog_options").val();
                        try{
                            var tmpOptions = JSON.parse(advancedOptions);
                            chartObj.find(".googlechart_options").attr("value",advancedOptions);
                            markChartAsModified(id);
                            drawChart(id, function(){});
                            jQuery(this).dialog("close");
                        }
                        catch(err){
                            jQuery('.googlechart_dialog_options_div').addClass('error');
                            jQuery('.googlechart_dialog_options').before(errorMsgJSON);
                        }
                    }
                },
                {
                    text: "Cancel",
                    click: function(){
                        jQuery(this).dialog("close");
                    }
                }
            ]});
}

function markAllChartsAsModified(){
    jQuery(".googlechart").each(function(){
        jQuery(this).addClass("googlechart_modified");
    });
}

function markChartAsThumb(id){
    jQuery(".googlechart_thumb_checkbox").each(function(){
        var checkObj = jQuery(this);
        if (checkObj.attr("id") !== "googlechart_thumb_id_"+id){
            checkObj.attr("checked",false);
        }
        else {
            checkObj.attr("checked",true);
        }
    });
    markChartAsModified(id);
}


function addChart(options){
    var settings = {
        id : "",
        name : "",
        config : "",
        columns : "",
        showSort : false,
        filters : {},
        notes: [],
        width : 800,
        height : 600,
        filter_pos : 0,
        options : defaultAdvancedOptions,
        isThumb : false,
        dashboard : {},
        hidden : false,
        row_filters : "",
        sortBy : "",
        sortAsc : "",
        columnfilters : []
    };

    jQuery.extend(settings, options);

    settings.filter_pos = parseInt(settings.filter_pos, 0);

    var shouldMark = false;
    var chart;
    if (settings.config === ""){
        shouldMark = true;
        chart = defaultChart;
        chart.options.title = settings.name;
        settings.config = JSON.stringify(chart);
    }
    var googlechart = jQuery("" +
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+settings.id+"'>" +
            "<input class='googlechart_id' type='hidden' value='"+settings.id+"'/>" +
            "<input class='googlechart_configjson' type='hidden'/>" +
            "<input class='googlechart_columns' type='hidden'/>" +
            "<input class='googlechart_options' type='hidden'/>" +
            "<input class='googlechart_row_filters' type='hidden' value='"+settings.row_filters+"'/>" +
            "<input class='googlechart_sortBy' type='hidden' value='"+settings.sortBy+"'/>" +
            "<input class='googlechart_sortAsc' type='hidden' value='"+settings.sortAsc+"'/>" +

            "<h1 class='googlechart_handle'>"+
            "<div style='float:left;width:75%;height:20px;overflow:hidden;'>"+
                "<input style='float: left' class='googlechart_name' type='text' onchange='markChartAsModified(\""+settings.id+"\");drawChart(\""+settings.id+"\",function(){});'/>" +
//                "<span style='font-weight:normal;padding: 0 0.5em;float:right;'>px</span>"+
                "<input class='googlechart_height' type='text' onchange='markChartAsModified(\""+settings.id+"\");'/>" +
//                "<span style='font-weight:normal;padding: 0 0.5em;float:right;'>x</span>"+
                "<input class='googlechart_width' type='text' onchange='markChartAsModified(\""+settings.id+"\");'/>" +
            "</div>"+
            "<div class='ui-icon ui-icon-trash remove_chart_icon' title='Delete chart'>x</div>"+
            "<div class='ui-icon ui-icon-gear' title='Advanced Options' onclick='openAdvancedOptions(\""+settings.id+"\");'>a</div>"+
            "<div class='ui-icon ui-icon-" + (settings.hidden?"show":"hide") + " googlechart_hide_chart_icon' title='Hide/Show chart'>x</div>"+
            "<div style='clear:both'> </div>"+
            "</h1>" +
            "<fieldset>" +
                "<div style='float:left; width:110px;'>" +
                    "<a style='float:right' class='preview_button img-polaroid'>" +
                    "<span id='googlechart_chart_div_"+settings.id+"'></span>" +
                    "<span>Preview and size adjustments</span></a>"+
                "</div>" +
                "<div class='googlechart-filters-box'>" +
                    '<div class="header">' +
                        '<span class="label"><span style="float: left" class="ui-icon ui-icon-circlesmall-plus">e</span>Row filters <span class="items_counter"></span></span>' +
                        '<span title="Add new filter" class="ui-icon ui-icon-plus ui-corner-all addgooglechartfilter">+</span>' +
                    '</div>' +
                    '<div style="padding: 1em" class="body">' +
                        "<ul class='googlechart_sort'  id='googlechart_sort_"+settings.id+"'>" +
                            "<li class='googlechart_filteritem'>" +
                                "<h1>"+
                                    "<div style='float:left;'>sort by column</div>"+
                                    "<div class='ui-icon ui-icon-" + (!settings.showSort?"show":"hide") + " googlechart_hide_sort_icon' title='Hide/Show sort on view'>x</div>"+
                                    "<div style='clear:both'> </div>" +
                                "</h1>"+
                            "</li>" +
                        "</ul>" +
                        "<ul class='googlechart_filters_list'  id='googlechart_filters_"+settings.id+"'>" +
                        "</ul>" +
                        "<span>Position</span>"+
                        "<select name='googlechart_filterposition' onchange='markChartAsModified(\"" + settings.id + "\")'>" +
                            "<option value='0' " + ((settings.filter_pos === 0) ? "selected='selected'": "") + ">Top</option>" +
                            "<option value='1' " + ((settings.filter_pos === 1) ? "selected='selected'": "") + ">Left</option>" +
                            "<option value='2' " + ((settings.filter_pos === 2) ? "selected='selected'": "") + ">Bottom</option>" +
                            "<option value='3' " + ((settings.filter_pos === 3) ? "selected='selected'": "") + ">Right</option>" +
                        "</select>" +
                    '</div>' +
                "</div>" +
                "<div class='googlechart-columnfilters-box'>" +
                    '<div class="header">' +
                        '<span class="label"><span style="float: left" class="ui-icon ui-icon-circlesmall-plus">e</span>Column filters <span class="items_counter"></span></span>' +
                        '<span title="Add column filter" class="ui-icon ui-icon-plus ui-corner-all addgooglechartcolumnfilter">+</span>' +
                        '<br/><span>Note: If row filters for pivoted columns are used, column filters using pivoted columns will be ignored</span>'+
                    '</div>' +
                    '<div style="padding: 1em" class="body">' +
                        "<ul class='googlechart_columnfilters_list'  id='googlechart_columnfilter_"+settings.id+"'>" +
                        "</ul>" +
                    '</div>' +
                "</div>" +
                "<div class='googlechart-notes-box'>" +
                    '<div class="header">' +
                        '<span class="label"><span style="float: left" class="ui-icon ui-icon-circlesmall-plus">e</span>Chart notes <span class="items_counter"></span></span>' +
                        '<span title="Add chart note" class="ui-icon ui-icon-plus ui-corner-all addgooglechartnote">+</span>' +
                    '</div>' +
                    '<div style="padding: 1em" class="body">' +
                        "<ul class='googlechart_notes_list'  id='googlechart_notes_"+settings.id+"'>" +
                        "</ul>" +
                    '</div>' +
                "</div>" +
                "<div style='clear:both'> </div>" +
                "<input type='button' style='float:right; margin-top:0.5em;' class='context btn btn-warning' value='Edit' onclick='openEditChart(\""+settings.id+"\");'/>" +
                "<div style='font-weight:normal;font-size:0.9em;margin-right:10px; padding-top:1em;' id='googlechart_thumb_text_"+settings.id+"'>" +
                  "<input style='float: left; margin:3px' type='checkbox' class='googlechart_thumb_checkbox' id='googlechart_thumb_id_"+settings.id+"' onChange='markChartAsThumb(\""+settings.id+"\");' "+(settings.isThumb?"checked='checked'":"")+"/>"+
                  "<label>Use this chart as thumb</label>" +
                "</div>"+
            "</fieldset>" +
        "</li>");

    // Filters

    googlechart.find('.googlechart-filters-box .body').hide();
    googlechart.find('.googlechart-filters-box .header .ui-icon-plus').hide();
    googlechart.find('.googlechart-filters-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-filters-box .body');
        var button = googlechart.find('.googlechart-filters-box .ui-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-filters-box .ui-icon-circlesmall-minus', googlechart)
                .removeClass('ui-icon-circlesmall-minus')
                .addClass('ui-icon-circlesmall-plus');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-filters-box .ui-icon-circlesmall-plus', googlechart)
                .removeClass('ui-icon-circlesmall-plus')
                .addClass('ui-icon-circlesmall-minus');
        }
    });

    // Column Filters
    googlechart.find('.googlechart-columnfilters-box .body').hide();
    googlechart.find('.googlechart-columnfilters-box .header .ui-icon-plus').hide();
    googlechart.find('.googlechart-columnfilters-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-columnfilters-box .body');
        var button = googlechart.find('.googlechart-columnfilters-box .ui-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-columnfilters-box .ui-icon-circlesmall-minus', googlechart)
                .removeClass('ui-icon-circlesmall-minus')
                .addClass('ui-icon-circlesmall-plus');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-columnfilters-box .ui-icon-circlesmall-plus', googlechart)
                .removeClass('ui-icon-circlesmall-plus')
                .addClass('ui-icon-circlesmall-minus');
        }
    });

    // Notes
    googlechart.find('.googlechart-notes-box .body').hide();
    googlechart.find('.googlechart-notes-box .header .ui-icon-plus').hide();
    googlechart.find('.googlechart-notes-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-notes-box .body');
        var button = googlechart.find('.googlechart-notes-box .ui-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-notes-box .ui-icon-circlesmall-minus', googlechart)
                .removeClass('ui-icon-circlesmall-minus')
                .addClass('ui-icon-circlesmall-plus');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-notes-box .ui-icon-circlesmall-plus', googlechart)
                .removeClass('ui-icon-circlesmall-plus')
                .addClass('ui-icon-circlesmall-minus');
        }
    });

    googlechart.find(".googlechart_columns").attr("value", settings.columns);
    googlechart.find(".googlechart_configjson").attr("value", settings.config);
    googlechart.find(".googlechart_options").attr("value", settings.options);
    googlechart.find(".googlechart_name").attr("value", settings.name);
    googlechart.find(".googlechart_height").attr("value", settings.height);
    googlechart.find(".googlechart_width").attr("value", settings.width);
    googlechart.find(".googlechart_row_filters").attr("value", settings.row_filters);
    googlechart.find(".googlechart_sortBy").attr("value", settings.sortBy);
    googlechart.find(".googlechart_sortAsc").attr("value", settings.sortAsc);
    jQuery('#googlecharts_list').append(googlechart);

    jQuery.data(googlechart[0], 'dashboard', settings.dashboard);
    googlechart.data('notes', settings.notes);
    reloadChartNotes(settings.id);

    googlechart.data('columnfilters', settings.columnfilters);
    reloadColumnFilters(settings.id);


    if (settings.hidden){
        changeChartHiddenState(settings.id);
    }

    jQuery("#googlechart_filters_"+settings.id).sortable({
        handle : '.googlechart_filteritem_'+settings.id,
        delay: 300,
        opacity: 0.7,
        placeholder: 'ui-state-highlight',
        forcePlaceholderSize: true,
        cursor: 'crosshair',
        tolerance: 'pointer',
        stop: function(event,ui){
            markChartAsModified(settings.id);
        }
    });

    drawChart(settings.id, checkSVG);

    var chartColumns = {};
    if (settings.columns === ""){
        chartColumns.original = {};
        chartColumns.prepared = {};
    }
    else{
        chartColumns = JSON.parse(settings.columns);
    }

    jQuery.each(settings.filters,function(key,value){
        if (key.indexOf('pre_config_') === -1){
            jQuery(chartColumns.prepared).each(function(idx, column){
                if (column.name === key){
                    addFilter(settings.id, key, value, column.fullname);
                }
            });
        }
        else {
            addFilter(settings.id, key, value, available_columns[key.substr(11)]);
        }
    });
    if (shouldMark){
        markChartAsModified(settings.id);
    }
    resizeGooglecharts();
    updateCounters();
}

var isFirstEdit = true;
var editedChartStatus = false;

function moveIfFirst(){
    if (isFirstEdit){
        if (jQuery(".google-visualization-charteditor-dialog").length > 0){
            jQuery(".google-visualization-charteditor-dialog").appendTo("#googlechart_editor_container");
            jQuery(".google-visualization-charteditor-dialog").removeClass("modal-dialog");
            jQuery(".google-visualization-charteditor-dialog").addClass("googlechart-editor");
            isFirstEdit = false;
        }
        else{
            setTimeout(moveIfFirst, 500);
        }
    }
}

function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    var chartObj = jQuery("#googlechartid_"+chartId);
    chartType = chartEditor.getChartWrapper().getChartType();
    chartObj.find(".googlechart_configjson").attr('value',jsonString);
    chartObj.find(".googlechart_name").attr('value',chartEditor.getChartWrapper().getOption('title'));
    if (chartType === "MotionChart"){
        chartObj.find(".googlechart_options").attr('value', '{"state":"{\\"showTrails\\":false}"}');
    }
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
}

function redrawEditorChart() {
    var tmpwrapper = chartEditor.getChartWrapper();
    var chartOptions = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
    jQuery.each(chartOptions, function(key, value){
        tmpwrapper.setOption(key,value);
    });

    tmpwrapper.draw(document.getElementById("google-visualization-charteditor-preview-div-chart"));

    chartWrapper = tmpwrapper;
}

function setConfiguratorMessage(message_key) {
    var messageZone = jQuery(".googlechart_config_messagezone");
    messageZone.html("");
    if (message_key !== ""){
        var message = configurator_messages[message_key];
        if (!message){
            message = configurator_messages['default'];
        }
        messageZone.append('<div class="googlechart_config_messagezone_title"></div>');
        messageZone.append('<div class="googlechart_config_messagezone_message"></div>');
        jQuery(".googlechart_config_messagezone_title").html(message.title);
        jQuery(".googlechart_config_messagezone_message").html(message.message);
    }
}

function openEditor(elementId) {
    isFirstEdit = true;
    jQuery(".google-visualization-charteditor-dialog").remove();
    chartId = elementId;
    var chartObj = jQuery("#googlechartid_"+elementId);
    var title = chartObj.find(".googlechart_name").attr("value");

    var wrapperString = chartObj.find(".googlechart_configjson").attr('value');
    var chart;
    var wrapperJSON;
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }

    var chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();

    var chartColumns = {};
    if (chartColumns_str === ""){
        chartColumns.original = {};
        chartColumns.prepared = {};
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    var row_filters_str = chartObj.find(".googlechart_row_filters").attr('value');
    var row_filters = {};
    if (row_filters_str.length > 0){
        row_filters = JSON.parse(row_filters_str);
    }
    var sortBy = chartObj.find(".googlechart_sortBy").attr('value');
    var sortAsc_str = chartObj.find(".googlechart_sortAsc").attr('value');
    var sortAsc = true;
    if (sortAsc_str === 'desc'){
        sortAsc = false;
    }

    var columnsFromSettings = getColumnsFromSettings(chartColumns);

    var options = {
        originalTable : all_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : available_columns,
        filters: row_filters
    };

    var transformedTable = transformTable(options);

    jQuery("#googlechartid_tmp_chart").attr("columnproperties", JSON.stringify(transformedTable.properties));

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : sortBy,
        sortAsc : sortAsc,
        preparedColumns: chartColumns.prepared
    };

    // check if table contains 2 string columns & 1 or 2 numeric columns (for treemap)
    var isPossibleTreemap = true;
    if ((columnsFromSettings.columns.length < 3) || (columnsFromSettings.columns.length > 4)){
        isPossibleTreemap = false;
    }
    else {
        if (transformedTable.properties[columnsFromSettings.columns[0]].valueType !== 'text'){
            isPossibleTreemap = false;
        }
        if (transformedTable.properties[columnsFromSettings.columns[1]].valueType !== 'text'){
            isPossibleTreemap = false;
        }
        if (transformedTable.properties[columnsFromSettings.columns[2]].valueType !== 'number'){
            isPossibleTreemap = false;
        }
        if ((columnsFromSettings.columns.length === 4) && (transformedTable.properties[columnsFromSettings.columns[3]].valueType !== 'number')){
            isPossibleTreemap = false;
        }
    }
    if (!isPossibleTreemap){
        options.limit = 100;
    }

    var tableForChart = prepareForChart(options);

    chart.dataTable = tableForChart;

    chart.options.title = title;
    chart.options.allowHtml = true;
    chartWrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);


    google.visualization.events.addListener(chartEditor, 'ready', function(event){
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = true;
        setTimeout(function(){
            redrawEditorChart();
        },100);
        setConfiguratorMessage("");
        jQuery(".googlechart_editor_loading").addClass("googlechart_editor_loaded");
        jQuery(".googlechart_palette_loading").removeClass("googlechart_palette_loading");

    });
    google.visualization.events.addListener(chartEditor, 'error', function(event){
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = false;
        setConfiguratorMessage(JSON.parse(settings_str).chartType);
    });
    moveIfFirst();

    setTimeout(function(){
        chartEditor.openDialog(chartWrapper, {});
    },100);
}

function generateSortedColumns() {
    var sortedColumns = [];
    var columns_tmp = jQuery("#newColumns").find("th");
    jQuery.each(columns_tmp, function(idx, value){
        var columnName = jQuery(value).attr("column_id");
        var columnVisible = jQuery(value).attr("column_visible");
        sortedColumns.push([columnName, columnVisible]);
    });
    return (sortedColumns);
}

function generateNewTableForChart(){
    var tmp_chart = jQuery("#googlechartid_tmp_chart");

    var columnsSettings = {};
    columnsSettings.original = [];
    columnsSettings.prepared = [];
    var hasNormal = false;
    var hasPivot = false;
    var hasValue = false;
    jQuery("#originalColumns").find("th").each(function(){
        var original = {};
        original.name = jQuery(this).attr("column_id");
        original.status = parseInt(jQuery(this).find("select").attr("value"),10);
        if (original.status === 1){
            hasNormal = true;
        }
        if (original.status === 2){
            hasPivot = true;
        }
        if (original.status === 3){
            hasValue = true;
        }
        columnsSettings.original.push(original);
    });
    jQuery(grid.getColumns()).each(function(){
        if (this.id !== "options"){
            var preparedColumn = {};
            preparedColumn.name = this.id;
            if (grid_columnsHiddenById[this.id]){
                preparedColumn.status = 0;
            }
            else {
                preparedColumn.status = 1;
            }
            preparedColumn.fullname = this.name;
            columnsSettings.prepared.push(preparedColumn);
        }
    });
    var isOK = true;
    if (!hasNormal){
        jQuery("#googlechart_chart_div_tmp_chart").html("At least 1 visible column must be selected!");
        isOK = false;
    }
    if (hasPivot != hasValue){
        jQuery("#googlechart_chart_div_tmp_chart").html("If you want pivot table, you must select at least 1 pivot volumn and 1 value column");
        isOK = false;
    }
    prevColumnsSettings = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value"));
    if(isOK){
        jQuery.each(columnsSettings.prepared, function(idx, newColumn){
            jQuery.each(prevColumnsSettings.prepared, function(idx, prevColumn){
                if (((newColumn.name === prevColumn.name) || (newColumn.name.indexOf(prevColumn.name+"_") === 0)) && (prevColumn.hasOwnProperty("formatters"))){
                    newColumn.formatters = prevColumn.formatters;
                }
            });
        });
        var columns_str = JSON.stringify(columnsSettings);
        jQuery("#googlechartid_tmp_chart .googlechart_columns").val(columns_str);
    }
    openEditor("tmp_chart");
}

function generateNewTable(sortOrder, isFirst){
    var columns = jQuery("#originalColumns").find("th");

    var normalColumns = [];
    var pivotColumns = [];
    var valueColumn = '';
    jQuery.each(columns, function(idx, value){
        var columnType = jQuery(value).find("select").attr("value");
        var columnName = jQuery(value).attr("column_id");
        switch(columnType){
            case "0":
                break;
            case "1":
                normalColumns.push(columnName);
                break;
            case "2":
                pivotColumns.push(columnName);
                break;
            case "3":
                valueColumn = columnName;
                break;
        }
    });

    var row_filters_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value");
    var row_filters = {};
    if (row_filters_str.length > 0){
        row_filters = JSON.parse(row_filters_str);
    }
    var sortBy = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value");
    var sortAsc_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value");
    var sortAsc = true;
    if (sortAsc_str === 'desc'){
        sortAsc = false;
    }

    var options = {
        originalTable : all_rows,
        normalColumns : normalColumns,
        pivotingColumns : pivotColumns,
        valueColumn : valueColumn,
        availableColumns : available_columns
//        filters : row_filters
    };

    var transformedTable = transformTable(options);
    var tmpSortOrder = [];
    jQuery.each(transformedTable.available_columns,function(col_key, col){
        tmpSortOrder.push([col_key, "visible"]);
    });
    sortOrder = typeof(sortOrder) === 'undefined' ? tmpSortOrder : sortOrder;

    var filterable_columns = [];
    jQuery.each(transformedTable.properties, function(column, properties){
        filterable_columns.push(column);
    });
    if (!isFirst){
        jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value", "{}");
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value", "");
        jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value", "asc");

        drawGrid("#newTable", transformedTable.items, transformedTable.available_columns, filterable_columns);
        setGridColumnsOrder(sortOrder);
        generateNewTableForChart();
    }
    else{
        drawGrid("#newTable", transformedTable.items, transformedTable.available_columns, filterable_columns);
        setGridColumnsOrder(sortOrder);
    }
}

function isAvailableChart(chartType){
    return true;
}

var columnsForPivot = {};
var pivotDragStatus = 0;
var pivotDraggedColumn = -1;
var pivotDroppedColumn = -1;
var pivotTmpDroppedColumn = -1;

function updateStatus(){
    jQuery.each(columnsForPivot,function(key, value){
        if (value.nr === parseInt(pivotDroppedColumn, 10)){
            value.status = 1;
        }
        if (value.nr === parseInt(pivotDraggedColumn, 10)){
            value.status = 2;
        }
    });
}

function showHeader(nr){
    var current;
    jQuery(".draggable").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).show();
    jQuery(".columnheader").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).show();
    jQuery(".columnpivot").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).show();
}

function showDropZone(nr){
    var current;
    jQuery(".droppable").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).show();
}

function hideDropZone(nr){
    var current;
    jQuery(".droppable").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).hide();
}

function hideColumn(nr){
    var current;
    jQuery(".columnheader").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).hide();

    jQuery(".columnpivot").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(current).hide();
}

function setPivotsForColumn(nr, pivots){
    var current;
    jQuery(".droppable").each(function(idx,value){
        if (nr === parseInt(jQuery(value).attr("columnnr"), 10)){
            current = value;
        }
    });
    jQuery(pivots).insertBefore(current);
}

function updateWithStatus(){
    jQuery("#originalColumns").find("th").each(function(idx, value){
        jQuery(value).find("select").attr("value",1);
    });

    var valueColumn = -1;
    var pivots = [];
    var hidden = [];
    jQuery("#pivots").remove();
    var pivotsHtml = "<div id='pivots'>";
    jQuery.each(columnsForPivot,function(key, value){
        var originalColumn = jQuery("#originalColumns").find("[column_id='"+key+"']").find("select");
        if (value.status === 1){
            valueColumn = value.nr;
            jQuery(originalColumn).attr("value",3);
        }
        if (value.status === 2){
            pivots.push(value.nr);
            pivotsHtml += "<div class='pivotedColumn'>"+value.name+"<a style='float:right' href='#' onclick='removePivot("+value.nr+")'><span title='Delete pivot' class='ui-icon ui-icon-trash'>x</span></a></div><div style='clear:both'></div>";
            jQuery(originalColumn).attr("value",2);
        }
        if (value.status === 3){
            hidden.push(value.nr);
            jQuery(originalColumn).attr("value",0);
        }
    });
    pivotsHtml += "</div>";
    if (valueColumn === -1){
        jQuery(".columnheader").each(function(idx,value){
            jQuery(value).show();
        });
        jQuery(".columnpivot").each(function(idx,value){
            jQuery(value).show();
        });
        jQuery(".draggable").each(function(idx,value){
            jQuery(value).show();
        });
        jQuery(".droppable").each(function(idx,value){
            jQuery(value).show();
        });
    }
    else {
        jQuery(".columnheader").each(function(idx,value){
            var columnnr = parseInt(jQuery(value).attr("columnnr"), 10);
            if (columnnr === valueColumn){
                setPivotsForColumn(columnnr, pivotsHtml);
                showHeader(columnnr);
            }
            else {
                if (jQuery.inArray(columnnr, pivots) !== -1){
                    hideColumn(columnnr);
                }
                else {
                    showHeader(columnnr);
                    hideDropZone(columnnr);
                }
            }
        });
    }
    jQuery(".columnheader").each(function(idx,value){
        var columnnr = parseInt(jQuery(value).attr("columnnr"), 10);
        var pivoticonflag = jQuery(".columnheader [columnnr='"+columnnr+"']").find(".pivothidecolumn ");
        pivoticonflag.removeClass("ui-icon-placeholder").removeClass("ui-icon-hide").removeClass("ui-icon-show");
        if (jQuery.inArray(columnnr, hidden) !== -1){
            pivoticonflag.addClass("ui-icon-show");
            hideDropZone(columnnr);
        }
        else {
            if (columnnr !== valueColumn){
                pivoticonflag.addClass("ui-icon-hide");
            }
            else {
                pivoticonflag.addClass("ui-icon-placeholder");
            }
        }
    });
}

function removePivot(nr){
    var hasPivot = false;
    var valueColumn = -1;
    jQuery.each(columnsForPivot,function(key, value){
        if (value.nr === nr){
            value.status = 0;
        }
        if (value.status === 2){
            hasPivot = true;
        }
        if (value.status === 1){
            valueColumn = value;
        }
    });
    if (!hasPivot){
        valueColumn.status = 0;
    }
    updateWithStatus();
    generateNewTable();
}

function checkVisiblePivotValueColumns(){
    var visibleColumns = 0;
    jQuery.each(columnsForPivot,function(key, value){
        if (value.status === 0){
            visibleColumns++;
        }
    });
    return visibleColumns;
}

function populateTableForPivot(){
    jQuery.each(columnsForPivot,function(key, value){
        var th =
                "<th class='columnheader' columnnr='"+value.nr+"'>"+
                "<div class='draggable' columnnr='"+value.nr+"'>"+
                  "<div style='float:right' class='pivothidecolumn ui-icon ui-icon-placeholder'><!-- --></div>"+
                  "<div'>"+ value.name + "</div>" +
                "</div>"+
                "</th>";
        jQuery(th).appendTo(jQuery("#pivotConfigHeader"));
        var td =
                "<td class='columnpivot' columnnr='"+value.nr+"'>"+
                "<div class='droppable' columnnr='"+value.nr+"'>Drop here pivoting column</div>"+
                "</td>";
        jQuery(td).appendTo(jQuery("#pivotConfigDropZones"));
    });

    jQuery(".pivotGooglechartTable .ui-icon").click(function(){
        var col_nr =  parseInt(jQuery(this).parent().attr("columnnr"), 10);
        var column;
        jQuery.each(columnsForPivot,function(key, value){
            if (value.nr === col_nr){
                column = value;
            }
        });
        if (jQuery(this).hasClass("ui-icon-hide")){
            if (checkVisiblePivotValueColumns() > 1){
                column.status = 3;
            }
            else {
                alert("At least one visible column is required");
            }
        }
        else{
            column.status = 0;
        }
        updateWithStatus();
        generateNewTable();
    });
}

var editorDialog;

function chartEditorSave(id){
    if (!editedChartStatus){
        alert("Chart is not properly configured");
        return;
    }
    var settings_str = chartEditor.getChartWrapper().toJSON();
    chartEditor.closeDialog();
    var columnsSettings = {};
    columnsSettings.original = [];
    columnsSettings.prepared = [];
    var hasNormal = false;
    var hasPivot = false;
    var hasValue = false;
    var tmpPreparedColumns = JSON.parse($("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
    jQuery("#originalColumns").find("th").each(function(){
        var original = {};
        original.name = jQuery(this).attr("column_id");
        original.status = parseInt(jQuery(this).find("select").attr("value"),10);
        if (original.status === 1){
            hasNormal = true;
        }
        if (original.status === 2){
            hasPivot = true;
        }
        if (original.status === 3){
            hasValue = true;
        }
        columnsSettings.original.push(original);
    });
//    jQuery("#newColumns").find("th").each(function(){
    jQuery(grid.getColumns()).each(function(){
        if (this.id !== "options"){
            var preparedColumn = {};
            preparedColumn.name = this.id;
            if (grid_columnsHiddenById[this.id]){
                preparedColumn.status = 0;
            }
            else {
                preparedColumn.status = 1;
            }
            preparedColumn.fullname = this.name;
            jQuery.each(tmpPreparedColumns, function(idx, tmpPreparedColumn){
                if (tmpPreparedColumn.fullname === preparedColumn.fullname){
                    if (tmpPreparedColumn.hasOwnProperty("formatters")){
                        preparedColumn.formatters = JSON.parse(JSON.stringify(tmpPreparedColumn.formatters));
                    }
                }
            });
            columnsSettings.prepared.push(preparedColumn);
        }
    });

    if (!hasNormal){
        alert("At least 1 visible column must be selected!");
        return;
    }
    if (hasPivot != hasValue){
        alert("If you want pivot table, you must select at least 1 pivot volumn and 1 value column");
        return;
    }
    var columns_str = JSON.stringify(columnsSettings);

//    var settings_str = jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value");
    var settings_json = JSON.parse(settings_str);
    settings_json.paletteId = jQuery("#googlechart_palettes").attr("value");
    settings_json.dataTable = [];
    var settings_str2 = JSON.stringify(settings_json);

    var options_str = jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value");
    var options_json = JSON.parse(options_str);

    var selectedPalette = chartPalettes[settings_json.paletteId].colors;
    var newColors = [];
    jQuery(selectedPalette).each(function(idx, color){
        newColors.push(color);
    });
    options_json.colors = newColors;

    delete options_json.state;
    var motion_state = chartWrapper.getState();
    if (typeof(motion_state) === 'string'){
        options_json.state = motion_state;
    }

    var options_str2 = JSON.stringify(options_json);

    var name_str = jQuery("#googlechartid_tmp_chart .googlechart_name").attr("value");
    var row_filters_str = jQuery("#googlechartid_tmp_chart .googlechart_row_filters").attr("value");
    var sortBy_str = jQuery("#googlechartid_tmp_chart .googlechart_sortBy").attr("value");
    var sortAsc_str = jQuery("#googlechartid_tmp_chart .googlechart_sortAsc").attr("value");

    jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value",columns_str);
    jQuery("#googlechartid_"+id+" .googlechart_configjson").attr("value",settings_str2);
    jQuery("#googlechartid_"+id+" .googlechart_options").attr("value",options_str2);
    jQuery("#googlechartid_"+id+" .googlechart_name").attr("value",name_str);
    jQuery("#googlechartid_"+id+" .googlechart_row_filters").attr("value",row_filters_str);
    jQuery("#googlechartid_"+id+" .googlechart_sortBy").attr("value",sortBy_str);
    jQuery("#googlechartid_"+id+" .googlechart_sortAsc").attr("value",sortAsc_str);
    markChartAsModified(id);
    editorDialog.dialog("close");
    drawChart(id, checkSVG_withThumb);
    //remove invalid filters
    var filtersPrefix = "googlechart_filters_"+id;
    var columnsForFilters = [];
    jQuery(columnsSettings.prepared).each(function(idx,value){
        if (value.status === 1){
            columnsForFilters.push(value.name);
        }
    });
    jQuery(columnsSettings.original).each(function(idx, value){
        if (value.status === 2){
            columnsForFilters.push("pre_config_" + value.name);
        }
    });
    jQuery("#"+filtersPrefix).find(".googlechart_filteritem").each(function(idx,value){
        var filterColumnName = jQuery(value).attr("id").substr(filtersPrefix.length);
        if (jQuery.inArray(filterColumnName, columnsForFilters) === -1){
            jQuery(value).remove();
        }
    });
}

function chartEditorCancel(){
    editorDialog.dialog("close");
}

function updatePalette() {
    var selectedPaletteId = jQuery("#googlechart_palettes").attr("value");

    jQuery(".googlechart_preview_color").remove();
    var selectedPalette = chartPalettes[selectedPaletteId].colors;
    jQuery(selectedPalette).each(function(idx, color){
        var tmp_color = "<div class='googlechart_preview_color' style='background-color:"+color+"'> </div>";
        jQuery(tmp_color).appendTo("#googlechart_preview_palette");
    });
    var clear = "<div style='clear:both;'> </div>";
    jQuery(clear).appendTo("#googlechart_preview_palette");

    var options_str = jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value");
    var options_json = JSON.parse(options_str);

    var newColors = [];
    jQuery(selectedPalette).each(function(idx, color){
        newColors.push(color);
    });
    options_json.colors = newColors;
    var options_str2 = JSON.stringify(options_json);

    jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value", options_str2);

    jQuery("#googlechartid_tmp_chart").find(".googlechart_paletteid").attr("value",selectedPaletteId);
    if (chartEditor){
        redrawEditorChart();
    }
}

function updateMatrixChartScrolls(){
    var pos = $(".matrixCharts_zone").position();
    $("#matrixCharthorizontalscroll").css("left",pos.left);
    $("#matrixChartverticalscroll").css("top",pos.top);
}

function redrawMatrixCharts(data, matrixColumns, matrixRows, chartType){
    jQuery(".matrixChart_container").remove();
    jQuery.each(matrixRows, function(idx, rowValue){
        jQuery.each(matrixColumns, function(idx, colValue){
            if ((chartType === 'ScatterChart') && (rowValue === colValue)){
                return false;
            }
            if (rowValue === colValue){
                var emptyMatrixChartId = "matrixChart_id_" + colValue + "_" + rowValue;
                var emptyMatrixChartDiv = "<div class='matrixChart_container'>" +
                                     "<div class='matrixChart_item' "+
                                                "id='" + emptyMatrixChartId + "' "+
                                                "style='width:"+(matrixChartSize - 4 - 2) +"px;"+
                                                        "height:"+(matrixChartSize - 4 - 2) +"px;'>" +
                                     "</div>"+
                                     "</div>";
                jQuery(".matrixCharts_zone").append(emptyMatrixChartDiv);
                return;
            }

            var matrixChartId = "matrixChart_id_" + colValue + "_" + rowValue;
            var matrixChartDiv = "<div class='matrixChart_container'>" +
                                     "<div class='matrixChart_overlay' "+
                                                "row_nr='" + rowValue + "' "+
                                                "col_nr='" + colValue + "' " +
                                                "style='width:"+(matrixChartSize - 4 - 2)+"px;"+
                                                       "height:"+(matrixChartSize - 4 - 2)+"px;'>"+
                                     "</div>"+
                                     "<div class='matrixChart_item' "+
                                                "id='" + matrixChartId + "' "+
                                                "style='width:"+(matrixChartSize - 4 - 2)+"px;"+
                                                        "height:"+(matrixChartSize - 4 - 2)+"px;'>" +
                                     "</div>"+
                                     "<div style='clear:both'></div>"+
                                  "</div>";
            jQuery(".matrixCharts_zone").append(matrixChartDiv);
            var tmp_matrixChart = new google.visualization.ChartWrapper({
                            'chartType': chartType,
                            'containerId': matrixChartId,
                            'options': matrixChartOptions
            });
            tmp_matrixChart.setDataTable(data);

            if (chartType === 'ScatterChart'){
                tmp_matrixChart.setView({"columns":[colValue, rowValue]});
            }
            else {
                tmp_matrixChart.setView({"columns":[rowValue, colValue]});
            }
            tmp_matrixChart.draw();
        });
        jQuery(".matrixCharts_zone").append("<div style='clear:both'></div>");
    });
}

function columnsMatrixChart(chartType){
    DavizEdit.Status.start("Updating Tables");
    var old_conf_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value");
    var tmp_conf_json = JSON.parse(old_conf_str);

    var tmp_chart_type = typeof(chartType) !== 'undefined' ? chartType : tmp_conf_json.chartType;

    var columns = jQuery("#originalColumns").find("th");

    var normalColumns = [];
    var pivotColumns = [];
    var valueColumn = '';
    jQuery.each(columns, function(idx, value){
        var columnType = jQuery(value).find("select").attr("value");
        var columnName = jQuery(value).attr("column_id");
        switch(columnType){
            case "0":
                break;
            case "1":
                normalColumns.push(columnName);
                break;
            case "2":
                pivotColumns.push(columnName);
                break;
            case "3":
                valueColumn = columnName;
                break;
        }
    });
    var row_filters_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_row_filters").attr("value");
    var row_filters = {};
    if (row_filters_str.length > 0){
        row_filters = JSON.parse(row_filters_str);
    }
    var sortBy = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortBy").attr("value");
    var sortAsc_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_sortAsc").attr("value");
    var sortAsc = true;
    if (sortAsc_str === 'desc'){
        sortAsc = false;
    }
    var options = {
        originalTable : all_rows,
        normalColumns : normalColumns,
        pivotingColumns : pivotColumns,
        valueColumn : valueColumn,
        availableColumns : available_columns,
        filters: row_filters
    };

    var transformedTable = transformTable(options);

    var columnsForMatrix = [];
    var columns_tmp = grid.getColumns();
    var columnNamesForMatrix = [];
    var columnNiceNamesForMatrix = [];
    var key_idx = 0;

    var allColumnsForMatrix = [];
    var allColumnNamesForMatrix = [];
    var allColumnNiceNamesForMatrix = [];
    var allKey_idx = 0;

    var allAllowedColumnsForMatrix = [];
    var allAllowedColumnNamesForMatrix = [];
    var allAllowedColumnNiceNamesForMatrix = [];

    var unAllowedTypes = ['number', 'boolean', 'date', 'datetime', 'timeofday'];

    jQuery.each(columns_tmp, function(idx, value){
        var columnName = value.id;
        if ((grid_columnsHiddenById[value.id]) || (columnName === 'options')){
            return;
        }
        else{
            if (transformedTable.properties[columnName].valueType === 'number'){

                if (chartType === 'ScatterChart'){
                    columnsForMatrix.push(key_idx);
                }
                else {
                    columnsForMatrix.push(allKey_idx);
                }
                columnNamesForMatrix.push(columnName);
                columnNiceNamesForMatrix.push(value.name);
                key_idx++;
            }

            if (jQuery.inArray(transformedTable.properties[columnName].valueType, unAllowedTypes) === -1){
                allAllowedColumnsForMatrix.push(allKey_idx);
                allAllowedColumnNamesForMatrix.push(columnName);
                allAllowedColumnNiceNamesForMatrix.push(value.name);
            }

            allColumnsForMatrix.push(allKey_idx);
            allColumnNamesForMatrix.push(columnName);
            allColumnNiceNamesForMatrix.push(value.name);
            allKey_idx++;
        }
    });
    var tmp_columns = JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_columns").attr("value"));
    var cols_nr = columnsForMatrix.length;
    var rows_nr = allAllowedColumnsForMatrix.length;
    if ((chartType === 'ScatterChart') && (cols_nr < 2)){
        DavizEdit.Status.stop("Done");
        alert("At least 2 visible numeric columns are required!");
        return;
    }

    if ((chartType !== 'ScatterChart') && ((cols_nr < 1) || (rows_nr < 1))){
        DavizEdit.Status.stop("Done");
        alert("At least 1 string and 1 numeric columns have to be visible!");
        return;
    }

    var dotsForMatrixChart;
    var data;
    if (chartType === 'ScatterChart'){
        dotsForMatrixChart = Math.max(Math.round(matrixChartMatrixMaxDots / ((cols_nr * cols_nr - cols_nr) / 2)), matrixChartMinDots);

        options = {
            originalDataTable : transformedTable,
            columns : columnNamesForMatrix,
            limit : dotsForMatrixChart,
            sortBy : sortBy,
            sortAsc : sortAsc
        };

        data = prepareForChart(options);
    }
    else {
        dotsForMatrixChart = 30;
        //Math.max(Math.round(matrixChartMatrixMaxDots / (rows_nr * cols_nr)), matrixChartMinDots);
        options = {
            originalDataTable : transformedTable,
            columns : allColumnNamesForMatrix,
            limit : dotsForMatrixChart,
            sortBy : sortBy,
            sortAsc : sortAsc
        };
        data = prepareForChart(options);
    }

    jQuery(".matrixChart_dialog").remove();
    var width = jQuery(window).width() * 0.85;
    var height = jQuery(window).height() * 0.85;

    var matrixChart_zone_size_width;
    var matrixChart_zone_size_height;

    if (chartType === 'ScatterChart'){
        matrixChart_zone_size_width = (columnNamesForMatrix.length - 1) * matrixChartSize + 20;
        matrixChart_zone_size_height = (columnNamesForMatrix.length - 1) * matrixChartSize + 20;
    }
    else {
        matrixChart_zone_size_width = columnNamesForMatrix.length * matrixChartSize + 20;
        matrixChart_zone_size_height = allAllowedColumnNamesForMatrix.length * matrixChartSize + 20;
    }
    var container_width = (matrixChart_zone_size_width + matrixChartSize + 60 > width) ? width - matrixChartSize - 60 : matrixChart_zone_size_width;
    var container_height = (matrixChart_zone_size_height + matrixChartSize + 40 > height) ? height - matrixChartSize - 40: matrixChart_zone_size_height;
    var matrixChartDialog = "" +
        "<div class='matrixChart_dialog'>" +
            "<div id='matrixChart_type_selector' style='display:table-cell;vertical-align:middle;float:left;width:" + matrixChartSize + "px;height:" + matrixChartSize + "px'>"+
            "<div style='width:" + matrixChartSize + "px;height:" + matrixChartSize + "px'><select></select></div>"+
            "</div>"+
            "<div id='horizontalscrollcontainer' "+
                "style='width:" + container_width + "px;"+
                       "height:" + matrixChartSize + "px;"+
                       "'>"+
                    "<div id='matrixCharthorizontalscroll' "+
                        "style='width:" + matrixChart_zone_size_width + "px;"+
                                "height:" + matrixChartSize + "px;'>"+
                    "</div>"+
            "</div>"+
            "<div style='clear:both'></div>"+
            "<div id='verticalscrollcontainer' "+
                "style='width:" + matrixChartSize + "px;"+
                       "height:" + container_height + "px'>"+
                    "<div id='matrixChartverticalscroll' "+
                        "style='height:" + matrixChart_zone_size_height + "px;"+
                        "width:" + matrixChartSize + "px'>"+
                    "</div>"+
            "</div>"+
            "<div id='matrixCharts_container' "+
                "style='width:" + container_width + "px;"+
                       "height:" + container_height + "px;'>" +
                    "<div class='matrixCharts_zone' "+
                        "style='width:" + matrixChart_zone_size_width + "px;"+
                        "height:" + matrixChart_zone_size_height + "px;'>" +
                    "</div>"+
            "</div>"+
        "</div>";
    var matrixColumns;
    var matrixRows;
    if (chartType === 'ScatterChart'){
        matrixColumns = columnsForMatrix.slice(0, columnsForMatrix.length - 1);
        matrixRows = columnsForMatrix.slice(1, columnsForMatrix.length);
    }
    else {
        matrixColumns = columnsForMatrix;
        matrixRows = allAllowedColumnsForMatrix;
    }
    jQuery(matrixChartDialog).dialog({title:"Charts Matrix",
            dialogClass: 'googlechart-dialog',
            modal:true,
            width:width,
            height:height,
            resizable:false,
            create:function(){
                if (chartType === 'ScatterChart'){
                    jQuery("#matrixChart_type_selector").find("select").remove();
                }
                else{
                    jQuery.each(availableChartsForMatrix, function(key,value){
                        var tmp_option = "<option value='" + key + "'" + ((tmp_chart_type===key)?'selected="selected"':'') +">" + value + "</option>";
                        jQuery("#matrixChart_type_selector").find("select").append(tmp_option);
                    });
                }

                jQuery("#matrixChart_type_selector").find("select").change(function(){
                    redrawMatrixCharts(data, matrixColumns, matrixRows, jQuery("#matrixChart_type_selector").find("select").attr("value"));
                });

                jQuery.each(matrixRows, function(idx, rowValue){
                    var matrixChartScrollDiv = "<div class='matrixChartScrollItem verticalScrollItem' "+
                                                "style='width:"+(matrixChartSize-2)+"px;"+
                                                       "height:"+(matrixChartSize-2)+"px'"+
                                                "col_nr='"+rowValue+"'>"+
                                                    "<div class='scrollName' "+
                                                        "style='width:"+(matrixChartSize-2)+"px;"+
                                                        "height:"+(matrixChartSize-2)+"px;' >" +
                                                        "<div>"+
                                                        ((chartType === 'ScatterChart')?columnNiceNamesForMatrix[rowValue]:allColumnNiceNamesForMatrix[rowValue])+
                                                        "</div>"+
                                                    "</div>"+
                                            "</div>";
                    jQuery("#matrixChartverticalscroll").append(matrixChartScrollDiv);
                });
                jQuery.each(matrixColumns, function(idx, colValue){
                    var matrixChartScrollDiv = "<div class='matrixChartScrollItem horizontalScrollItem' "+
                                                "style='width:"+(matrixChartSize-2)+"px;"+
                                                       "height:"+(matrixChartSize-2)+"px"+
                                                "'"+
                                                "col_nr='"+colValue+"'>"+
                                                    "<div class='scrollName' "+
                                                        "style='width:"+(matrixChartSize-2)+"px;"+
                                                                "height:"+(matrixChartSize-2)+"px;"+
                                                        "'"+
                                                        ">" +
                                                        "<div>"+
                                                                ((chartType === 'ScatterChart')?columnNiceNamesForMatrix[colValue]:allColumnNiceNamesForMatrix[colValue])+
//                                                                columnNiceNamesForMatrix[colValue] +
                                                        "</div>"+
                                                    "</div>"+
                                            "</div>";
                    jQuery("#matrixCharthorizontalscroll").append(matrixChartScrollDiv);
                });

                if (chartType === 'ScatterChart'){
                    redrawMatrixCharts(data, matrixColumns, matrixRows, chartType);
                }
                else {
                    redrawMatrixCharts(data, matrixColumns, matrixRows, jQuery("#matrixChart_type_selector").find("select").attr("value"));
                }
                if (matrixChart_zone_size_width < width){
                    jQuery('.matrixChart_dialog').dialog('option','width', 'auto');
                }
                if (matrixChart_zone_size_height < height){
                    jQuery('.matrixChart_dialog').dialog('option','height', 'auto');
                }
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","hover",function(){
                    var col_nr = jQuery(this).attr("col_nr");
                    var row_nr = jQuery(this).attr("row_nr");
                    jQuery(".horizontalScrollItem[col_nr='"+col_nr+"']").find(".scrollName").find("div").addClass("selectedScrollItem");
                    jQuery(".verticalScrollItem[col_nr='"+row_nr+"']").find(".scrollName").find("div").addClass("selectedScrollItem");
                });
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","mouseout",function(){
                    jQuery(".horizontalScrollItem").find(".scrollName").find("div").removeClass("selectedScrollItem");
                    jQuery(".verticalScrollItem").find(".scrollName").find("div").removeClass("selectedScrollItem");
                });
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","click",function(){
                    jQuery("#matrixChart_chart_dialog").remove();
                    var col_nr = parseInt(jQuery(this).attr("col_nr"), 10);
                    var row_nr = parseInt(jQuery(this).attr("row_nr"), 10);
                    var sc_col_name1;
                    var sc_col_name2;
                    var sc_col1;
                    var sc_col2;
                    var chart_data;
                    var options = {};
                    if (chartType === 'ScatterChart'){
                        sc_col_name1 = columnNiceNamesForMatrix[col_nr];
                        sc_col_name2 = columnNiceNamesForMatrix[row_nr];
                        sc_col1 = columnNamesForMatrix[col_nr];
                        sc_col2 = columnNamesForMatrix[row_nr];
                        options = {
                            originalDataTable : transformedTable,
                            columns : columnNamesForMatrix,
                            sortBy : sortBy,
                            sortAsc : sortAsc
                        };

                        chart_data = prepareForChart(options);
                    }
                    else {
                        sc_col_name1 = allColumnNiceNamesForMatrix[row_nr];
                        sc_col_name2 = allColumnNiceNamesForMatrix[col_nr];
                        sc_col1 = allColumnNamesForMatrix[row_nr];
                        sc_col2 = allColumnNamesForMatrix[col_nr];
                        options = {
                            originalDataTable : transformedTable,
                            columns : allColumnNamesForMatrix,
                            sortBy : sortBy,
                            sortAsc : sortAsc
                        };
                        chart_data = prepareForChart(options);
                    }

                    var matrixChartChartDialog = ""+
                        "<div id='matrixChart_chart_dialog'>"+
                            "<div id='matrix_tmp_chart'></div>"+
                        "</div>";
                    var width = jQuery(window).width() * 0.80;
                    var height = jQuery(window).height() * 0.80;
                    jQuery(matrixChartChartDialog).dialog({
                        title:sc_col_name1 + " - " + sc_col_name2,
                        dialogClass: 'googlechart-dialog',
                        modal:true,
                        width:width,
                        height:height,
                        resizable:false,
                        buttons:[
                            {
                                text: "Use this chart",
                                click: function(){
                                    jQuery(this).dialog("close");
                                    jQuery(".matrixChart_dialog").dialog("close");
                                    var sortOrder = [];
                                    sortOrder.push([sc_col1, "visible"]);
                                    sortOrder.push([sc_col2, "visible"]);
                                    jQuery(grid.getColumns()).each(function(idx, column){
                                        if ((column.id !== sc_col1) && (column.id !== sc_col2) && (column.id !== 'options')){
                                            sortOrder.push([column.id, "hidden"]);
                                        }
                                    });
                                    var old_conf_str = jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value");
                                    var tmp_conf_json = JSON.parse(old_conf_str);
                                    tmp_conf_json.chartType = typeof(chartType) !== 'undefined' ? chartType : jQuery("#matrixChart_type_selector").find("select").attr("value");
                                    if (tmp_conf_json.chartType !== 'ScatterChart'){
                                        tmp_conf_json.options.pointSize = 0;
                                        tmp_conf_json.options.lineWidth = 2;
                                    }
                                    else {
                                        tmp_conf_json.options.pointSize = 7;
                                    }
                                    var new_conf_str = JSON.stringify(tmp_conf_json);
                                    jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value",new_conf_str);
                                    jQuery("#googlechartid_tmp_chart").find(".googlechart_name").attr("value",sc_col_name1 + " / " + sc_col_name2);
                                    setGridColumnsOrder(sortOrder);
                                }
                            },
                            {
                                text: "Cancel",
                                click: function(){
                                    jQuery(this).dialog("close");
                                }
                            }],
                        open:function(){
                            // Buttons
                            var buttons = jQuery(this).parent().find('button');
                            buttons.attr('class', 'btn');
                            jQuery(buttons[0]).addClass('btn-success');
                            jQuery(buttons[1]).addClass('btn-inverse');

                            var tmp_options = {};
//                            jQuery.extend(tmp_options, matrixChartOptions);
                            tmp_options = JSON.parse(JSON.stringify(matrixChartOptions));
                            tmp_options.width = jQuery("#matrix_tmp_chart").width();
                            tmp_options.height = jQuery("#matrix_tmp_chart").height();
                            tmp_options.chartArea.width = jQuery("#matrix_tmp_chart").width() - 2;
                            tmp_options.chartArea.height = jQuery("#matrix_tmp_chart").height() - 2;
                            tmp_options.hAxis.baselineColor = '#CCC';
                            tmp_options.vAxis.baselineColor = '#CCC';
                            if (chartType !== 'ScatterChart'){
                                tmp_options.pointSize = 0;
                                tmp_options.lineWidth = 2;
                                tmp_options.chartArea.top = 'auto';
                                tmp_options.chartArea.left = 'auto';
                                tmp_options.chartArea.width = 'auto';
                                tmp_options.chartArea.height = 'auto';
                                tmp_options.hAxis.textPosition = 'out';
                                tmp_options.vAxis.textPosition = 'out';
                            }
                            var preview_tmp_chart_type = typeof(chartType) !== 'undefined' ? chartType : jQuery("#matrixChart_type_selector").find("select").attr("value");
                            var tmp_matrixChart = new google.visualization.ChartWrapper({
                                'chartType': preview_tmp_chart_type,
                                'containerId': 'matrix_tmp_chart',
                                'options': tmp_options
                            });
                            tmp_matrixChart.setDataTable(chart_data);
                            if (chartType === 'ScatterChart'){
                                tmp_matrixChart.setView({"columns":[col_nr, row_nr]});
                            }
                            else{
                                tmp_matrixChart.setView({"columns":[row_nr, col_nr]});
                            }
                            tmp_matrixChart.draw();
                        }
                        });
                });
            }
    });
    $("#matrixCharts_container").scroll(updateMatrixChartScrolls);
    updateMatrixChartScrolls();
    DavizEdit.Status.stop("Done");
}
function resizeTableConfigurator(forced){
    if ((jQuery(".googlechart_table_config_scaleable_maximized").length > 0) || forced){
        var fullheight = jQuery(".googlecharts_columns_config").height();
        var container_heightstr = 'height:'+(fullheight-200)+'px;';
        var accordion_heightstr = 'height:'+(fullheight-200)+'px;';
        var accordion_container_heightstr = 'height:'+(fullheight-200)+'px;';
        jQuery(".googlechart_table_config_scaleable").removeClass("googlechart_transition").attr("style",container_heightstr);
        jQuery(".googlechart_accordion_table").attr("style",accordion_heightstr);
        jQuery(".googlechart_accordion_container").attr("style",accordion_container_heightstr);
        jQuery("#newTable").height(fullheight-250);
        grid.resizeCanvas();
    }
}

function fillEditorDialog(){
    var id = jQuery(".googlecharts_columns_config").attr("chart_id");
    var tmp_paletteId = jQuery(".googlecharts_columns_config").attr("palette_id");
    var columns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value");
    var columnsSettings = {};
    if (!columns_str){
        columnsSettings.prepared = [];
    }
    else{
        columnsSettings = JSON.parse(jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value"));
    }
    var columnCount = 0;
    jQuery.each(chartPalettes, function(paletteId, paletteSettings){
        if (tmp_paletteId === ""){
            tmp_paletteId = paletteId;
        }
        var option = "<option value='"+paletteId+"' "+ ((tmp_paletteId === paletteId) ? 'selected="selected"':'')+">"+paletteSettings.name+"</option>";
        jQuery(option).appendTo("#googlechart_palettes");
    });
    updatePalette();
    jQuery.each(available_columns, function(column_key,column_name){
        var originalStatus = 0;
        jQuery(columnsSettings.original).each(function(idx, original){
            if (original.name === column_key){
                originalStatus = original.status;
            }
        });
        var columnSettings = {};
        columnSettings.nr = columnCount;
        if (originalStatus === 0){
            columnSettings.status = 3;
        }
        if (originalStatus === 1){
            columnSettings.status = 0;
        }
        if (originalStatus === 2){
            columnSettings.status = 2;
        }
        if (originalStatus === 3){
            columnSettings.status = 1;
        }
        columnSettings.name = column_name;
        columnsForPivot[column_key] = columnSettings;
        columnCount++;
        var column = '<th column_id="' + column_key + '">' +
                    '<span>' + column_name + '</span>' +
                    '<select onchange="generateNewTable();" style="display:none">' +
                        '<option value="0" ' + ((originalStatus === 0) ? 'selected="selected"':'')+ '>Hidden</option>' +
                        '<option value="1" ' + ((originalStatus === 1) ? 'selected="selected"':'')+ '>Visible</option>' +
                        '<option value="2" ' + ((originalStatus === 2) ? 'selected="selected"':'')+ '>Pivot</option>' +
                        '<option value="3" ' + ((originalStatus === 3) ? 'selected="selected"':'')+ '>Value</option>' +
                    '</select>' +
                 '</th>';
        jQuery(column).appendTo("#originalColumns");
    });

    jQuery.each(all_rows.items, function(row_index,row){
        var tableRow = "<tr>";
        jQuery.each(available_columns, function(column_key,column_name){
            tableRow += "<td>" + row[column_key] + "</td>";
        });
        tableRow += "</tr>";
        jQuery(tableRow).appendTo("#originalTable");
    });

    var loadedSortOrder = [];
    jQuery(columnsSettings.prepared).each(function(idx, prepared){
        loadedSortOrder.push([prepared.name, (prepared.status === 1?'visible':'hidden')]);
    });
    generateNewTable(loadedSortOrder, true);

    populateTableForPivot();
    $(".draggable").draggable({
            containment:"#headers",
            delay: 300,
            revert:false,
            start: function(event, ui){
                if (checkVisiblePivotValueColumns() < 2){
                    alert("At least 2 visible column are required");
                    return false;
                }
                pivotDraggedColumn = parseInt($(ui.helper).attr("columnnr"),10);
                hideDropZone(pivotDraggedColumn);
            },
            stop:function(event, ui){
                $(ui.helper).attr("style","position:relative");
                if (pivotDragStatus === 1){
                    updateStatus();
                }
                updateWithStatus();
                generateNewTable();
                pivotDragStatus = 0;
            }
    });
    $(".droppable").droppable({
      hoverClass: "hoveredDrop",
      drop: function(event, ui){
        pivotDragStatus = 1;
        pivotDroppedColumn = pivotTmpDroppedColumn;
      },
      over: function(event, ui){
        pivotTmpDroppedColumn = jQuery(".hoveredDrop").attr("columnnr");
      }
    });
    updateWithStatus();

    jQuery("#pivotingTableLabel").click(function(){
        var tmp_icon = jQuery("#pivotingTableLabel").find(".ui-icon");
        if (tmp_icon.hasClass("ui-icon-circlesmall-plus")){
            tmp_icon.removeClass("ui-icon-circlesmall-plus").addClass("ui-icon-circlesmall-minus");
        }
        else {
            tmp_icon.removeClass("ui-icon-circlesmall-minus").addClass("ui-icon-circlesmall-plus");
        }
        jQuery(".pivotingTable").toggle();
    });

    jQuery("#googlechart_overlay").overlay({
        mask: 'black'
    });
}

function openEditChart(id){
    jQuery("html").append(charteditor_css);
    chartEditor = null;
    var tmp_config = jQuery("#googlechartid_"+id+" .googlechart_configjson").attr('value');
    var tmp_paletteId = typeof(JSON.parse(tmp_config).paletteId) !== 'undefined' ? JSON.parse(tmp_config).paletteId : "";
    var tmp_columns = jQuery("#googlechartid_"+id+" .googlechart_columns").attr('value');
    var tmp_name = jQuery("#googlechartid_"+id+" .googlechart_name").attr('value');
    var tmp_options = jQuery("#googlechartid_"+id+" .googlechart_options").attr('value');
    var tmp_row_filters = jQuery("#googlechartid_"+id+" .googlechart_row_filters").attr('value');
    var tmp_sortBy = jQuery("#googlechartid_"+id+" .googlechart_sortBy").attr('value');
    var tmp_sortAsc = jQuery("#googlechartid_"+id+" .googlechart_sortAsc").attr('value');
    isFirstEdit = true;

    jQuery(".googlecharts_columns_config").remove();
    var editcolumnsdialog = jQuery(
    '<div class="googlecharts_columns_config">' +
//        '<div id="googlechart_overlay" style="display:none; background: transparent;"><div class="contentWrap" style="width:200px;height:200px; border:1px solid red; background-color:#fff">xxx</div></div>'+
        '<div class="chart_config_tabs" style="padding-top:10px;">'+
            '<div class="googlechart_maximize_chart_config googlechart_config_head googlechart_config_head_selected" style="float:left">Chart Configurator</div>'+
            '<div class="googlechart_maximize_table_config googlechart_config_head" style="float:left;left:341px" title="Click to enlarge Table Configurator">Table Configurator</div>'+
            "<div style='float:right;'>"+
                '<div class="buttons">' +
                "<input type='button' class='btn btn-success' value='Save' onclick='chartEditorSave(\""+id+"\");'/>" +
                "<input type='button' class='btn btn-inverse' value='Cancel' onclick='chartEditorCancel();'/>" +
                "</div>" +
            "</div>"+
        '</div>'+
        "<div style='clear:both;'> </div>" +
        '<div class="googlechart_config_clickable googlechart_chart_config_clickable googlechart_maximize_chart_config"> </div>' +
        '<div class="googlechart_config_clickable googlechart_table_config_clickable googlechart_maximize_table_config" title="Click to enlarge Table Configurator"> </div>' +
        '<div class="googlechart_config_messagezone">'+
        '</div>'+
        '<div class="googlechart_chart_config_scaleable googlechart_chart_config_scaleable_maximized">'+
            '<div id="googlechartid_tmp_chart" style="float:left">' +
                "<input class='googlechart_configjson' type='hidden'/>" +
                "<input class='googlechart_columns' type='hidden'/>" +
                "<input class='googlechart_paletteid' type='hidden'/>" +
                "<input class='googlechart_options' type='hidden'/>" +
                "<input class='googlechart_name' type='hidden'/>" +
                "<input class='googlechart_row_filters' type='hidden'/>" +
                "<input class='googlechart_sortBy' type='hidden'/>" +
                "<input class='googlechart_sortAsc' type='hidden'/>" +

                "<div id='googlechart_editor_container'>"+
                    "<div class='googlechart_editor_loading'>Loading Chart..."+
                        "<div class='googlechart_loading_img'></div>"+
                    "</div>"+
                "</div>" +

            '</div>' +
            "<div id='googlechart_palette_select' class='googlechart_palette_loading' style='width:168px;float:left'>"+
                "<strong style='float:left;'>Select Palette:</strong>"+
                "<select id='googlechart_palettes' style='float:left;' onchange='updatePalette();'>"+
                "</select>"+
                "<div style='clear:both;'> </div>" +
                "<div id='googlechart_preview_palette'> </div>"+
            "</div>"+
        "</div>"+
        "<div style='clear:both;'> </div>" +
        '<div id="googlechart_table_accordion" class="googlechart_table_config_scaleable googlechart_table_config_scaleable_minimized">' +
            '<h3 style="display:none;"><a href="#">Table Editor</a></h3>' +
            '<div class="googlechart_accordion_container">' +
                '<div class="googlechart_accordion_table">' +
                    '<div id="pivotingTableLabel" class="label">Table pivots' + //xxx
                        '<div class="ui-icon ui-icon-circlesmall-plus">expand</div>'+
                    '</div>'+
                    '<div class="pivotingTable">' +
                    '<table id="pivotingTable" class="googlechartTable pivotGooglechartTable table">'+
                        '<tr id="pivotConfigHeader"></tr>'+
                        '<tr id="pivotConfigDropZones"></tr>'+
                    '</table>'+
                    '</div>' +
                    '<div style="clear:both"></div>'+
                    '<div>'+
                        '<span class="label">Table for chart</span>' +
//                        '<div class="buttons-bar">'+
//                      '<input type="button" class="column-show-hide-button context btn" value="Table pivots" id="tablePivots"/>' +
//                      '</div>' +
                    '</div>'+
                    "<div style='clear:both;'> </div>" +
                    '<div id="newTable" class="daviz-data-table slick_newTable" style="height:300px;">'+
                        "Loading Table..."+
                        "<div class='googlechart_loading_img'></div>"+
                    '</div>'+
                    '<div style="clear:both"></div>'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</div>');

    jQuery('#googlechart_overlay').remove();
    jQuery('<div id="googlechart_overlay" style="display:none;">'+
        '<div class="contentWrap">'+
            '<table id="originalTable" class="googlechartTable">'+
                '<tr id="originalColumns">'+
                '</tr>'+
            '</table>'+
        '</div>'+
    '</div>').appendTo('body');

    editcolumnsdialog.attr("chart_id", id);
    editcolumnsdialog.attr("palette_id", tmp_paletteId);

    editcolumnsdialog.find(".googlechart_configjson").attr("value", tmp_config);
    editcolumnsdialog.find(".googlechart_columns").attr("value", tmp_columns);
    editcolumnsdialog.find(".googlechart_paletteid").attr("value", tmp_paletteId);
    editcolumnsdialog.find(".googlechart_options").attr("value", tmp_options);
    editcolumnsdialog.find(".googlechart_name").attr("value", tmp_name);
    editcolumnsdialog.find(".googlechart_row_filters").attr("value", tmp_row_filters);
    editcolumnsdialog.find(".googlechart_sortBy").attr("value", tmp_sortBy);
    editcolumnsdialog.find(".googlechart_sortAsc").attr("value", tmp_sortAsc);
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config","click", function(){
        jQuery(".googlechart_table_config_scaleable").removeClass("googlechart_transition").attr("style","");
        editcolumnsdialog.find(".googlechart_table_config_scaleable").addClass("googlechart_transition").removeClass("googlechart_table_config_scaleable_maximized").addClass("googlechart_table_config_scaleable_minimized");
        editcolumnsdialog.find(".googlechart_chart_config_scaleable").addClass("googlechart_transition").removeClass("googlechart_chart_config_scaleable_minimized").addClass("googlechart_chart_config_scaleable_maximized");
        jQuery(".googlechart_maximize_chart_config").addClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").attr("title","");
        jQuery(".googlechart_maximize_table_config").attr("title","Click to enlarge Table Configurator");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_hover");
    });
    editcolumnsdialog.delegate(".googlechart_maximize_table_config","click", function(){
        resizeTableConfigurator(true);
        editcolumnsdialog.find(".googlechart_chart_config_scaleable").addClass("googlechart_transition").removeClass("googlechart_chart_config_scaleable_maximized").addClass("googlechart_chart_config_scaleable_minimized");
        editcolumnsdialog.find(".googlechart_table_config_scaleable").addClass("googlechart_transition").removeClass("googlechart_table_config_scaleable_minimized").addClass("googlechart_table_config_scaleable_maximized");
        jQuery(".googlechart_maximize_table_config").addClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").attr("title","Click to enlarge Chart Configurator");
        jQuery(".googlechart_maximize_table_config").attr("title","");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_hover");
    });
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config", "hover", function(){
        if (jQuery(".googlechart_chart_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_chart_config").addClass("googlechart_config_hover");
        }
    });
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config", "mouseout", function(){
        if (jQuery(".googlechart_chart_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        }
    });
    editcolumnsdialog.delegate(".googlechart_maximize_table_config", "hover", function(){
        if (jQuery(".googlechart_table_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_table_config").addClass("googlechart_config_hover");
        }
    });
    editcolumnsdialog.delegate(".googlechart_maximize_table_config", "mouseout", function(){
        if (jQuery(".googlechart_table_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_hover");
        }
    });
    var width = jQuery(window).width() * 0.95;
    var height = jQuery(window).height() * 0.95;
    editcolumnsdialog.dialog({title:"Chart Editor",
                dialogClass: 'googlechart-dialog',
                modal:true,
                width: width,
                minWidth:990,
                height: height,
                resizable:true,
                closeOnEscape:false,
                create:function(){
                    editorDialog = jQuery(this);
                },
                close:function(){
                    charteditor_css.remove();
                },
                resize:function(){
                    resizeTableConfigurator(false);
                },
                open:function(){
                    setTimeout(fillEditorDialog, 500);
                }
                });
}

function openAddChartFilterDialog(id){
    jQuery(".googlecharts_filter_config").remove();

    var addfilterdialog = jQuery('' +
    '<div class="googlecharts_filter_config">' +
        '<div class="field">' +
            '<label>Column</label>' +
            '<div class="formHelp">Filter Column</div>' +
            '<select class="googlecharts_filter_columns">' +
            '</select>' +
        '</div>' +
        '<div class="field">' +
            '<label>Type</label>' +
            '<div class="formHelp">Filter Type</div>' +
            '<select class="googlecharts_filter_type">' +
            '</select>' +
        '</div>' +
    '</div>');

    var orderedFilters = jQuery("#googlechart_filters_"+id).sortable('toArray');
    var used_columns = [];

    jQuery(orderedFilters).each(function(index,value){
        used_columns.push(jQuery("#"+value+" .googlechart_filteritem_column").attr("value"));
    });

    var empty = true;
    var chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    var filter_columns = [];
    if (chartColumns_str !== ""){
        var preparedColumns = JSON.parse(chartColumns_str).prepared;
        jQuery(preparedColumns).each(function(index, value){
            if ((value.status === 1) && (used_columns.indexOf(value.name) === -1)){
                filter_columns.push(value.name);
                var column = jQuery('<option></option>');
                column.attr("value", value.name);
                column.text(value.fullname);
                jQuery(".googlecharts_filter_columns", addfilterdialog).append(column);
                empty = false;
            }
        });

        var originalColumns = JSON.parse(chartColumns_str).original;
        jQuery(originalColumns).each(function(index, value){
            if ((used_columns.indexOf("pre_config_"+value.name) === -1) && (filter_columns.indexOf(value.name) === -1) && (value.status === 2)){
                filter_columns.push(value.name);
                var column = jQuery('<option style="background-color:gray"></option>');
                column.attr("value", "pre_config_" + value.name);
                column.text(available_columns[value.name] + " (pre-pivot)");
                jQuery(".googlecharts_filter_columns", addfilterdialog).append(column);
                empty = false;
            }
        });

    }

    if(empty){
        return alert("You've added all possible filters!");
    }

    jQuery.each(available_filter_types,function(key,value){
        var column = jQuery('<option></option>');
        column.attr("value", key);
        column.text(value);
        jQuery(".googlecharts_filter_type", addfilterdialog).append(column);
    });

    addfilterdialog.dialog({title:"Add Filter",
        dialogClass: 'googlechart-dialog',
        modal:true,
        open: function(evt, ui){
            var buttons = jQuery(this).parent().find('button');
            buttons.attr('class', 'btn');
            jQuery(buttons[0]).addClass('btn-inverse');
            jQuery(buttons[1]).addClass('btn-success');
            jQuery(".googlecharts_filter_columns").bind("change", function(){
                jQuery(".googlecharts_filter_type").find("option:selected").removeAttr("selected");
                if (jQuery(".googlecharts_filter_columns").attr("value").indexOf("pre_config_") === 0){
                    jQuery(".googlecharts_filter_type").find("option[value='0']").hide();
                    jQuery(".googlecharts_filter_type").find("option[value='1']").hide();
                    jQuery(".googlecharts_filter_type").find("option[value='2']").attr("selected", "selected");
                }
                else{
                    jQuery(".googlecharts_filter_type").find("option[value='0']").show();
                    jQuery(".googlecharts_filter_type").find("option[value='1']").show();
                    jQuery(".googlecharts_filter_type").find("option[value='0']").attr("selected", "selected");
                }
            });
        },
        buttons:[
            {
                text: "Cancel",
                click: function(){
                    jQuery(this).dialog("close");
                }
            },
            {
                text: "Add",
                click: function(){
                    var selectedColumn = jQuery(".googlecharts_filter_columns").val();
                    var selectedFilter = jQuery(".googlecharts_filter_type").val();
                    var selectedColumnName = "";
                    jQuery(".googlecharts_filter_columns").find("option").each(function(idx, filter){
                        if (jQuery(filter).attr("value") === selectedColumn){
                            selectedColumnName = jQuery(filter).html();
                            if (selectedColumnName.indexOf("(pre-pivot)") !== -1){
                                selectedColumnName = selectedColumnName.substr(0,selectedColumnName.length - 12);
                            }
                        }
                    });
                    if ((selectedColumn === '-1') || (selectedFilter === '-1')){
                        alert("Please select column and filter type!");
                    }
                    else{
                        addFilter(id, selectedColumn, selectedFilter, selectedColumnName);
                        markChartAsModified(id);
                        jQuery(this).dialog("close");
                    }
                }
            }
        ]
    });
}

function openAddChartColumnFilterDialog(id){
    var context = jQuery('#googlechartid_' + id);
    jQuery(".googlecharts_columnfilter_config").remove();

    var adddialog = jQuery('' +
    '<div class="googlecharts_columnfilter_config">' +
        '<div class="field">' +
            '<label>Title</label>' +
            '<div class="formHelp">Filter title</div>' +
            '<input type="text" class="googlecharts_columnfilter_title" />' +
        '</div>' +
        '<div class="field">' +
            '<label>Type</label>' +
            '<div class="formHelp">Filter type</div>' +
            '<select class="googlecharts_columnfilter_type" >'+
                '<option value="0">Simple select</option>'+
                '<option value="1">Multi select</option>'+
            '</select>' +
        '</div>' +
        '<div class="field">' +
            '<label>Allow disabled</label>' +
            '<div class="formHelp">Allow column to be disabled</div>' +
            '<input type="checkbox" class="googlecharts_columnfilter_allowempty" />' +
        '</div>' +
        '<div class="field">' +
            '<label>Dynamic columns</label>' +
            '<div class="formHelper">'+
                '<ul class="columnfilters-helper">'+
                    '<li>Only visible columns can be default columns for filters</li>'+
                    '<li>Default filter columns are automatically selectable columns</li>'+
                '</ul>'+
            '</div>'+
            '<div class="googlecharts_columnfilter_slickgrid daviz-data-table daviz-slick-table slick_newTable" style="width:450px;height:200px"></div>'+
        '</div>' +
    '</div>');

    var chartcolumns = JSON.parse(jQuery("#googlechartid_" + id).find(".googlechart_columns").attr("value")).prepared;
    var cols = [];
    jQuery.each(chartcolumns,function(index, column){
        var col = {};
        col.name = column.name;
        col.friendlyname = column.fullname;
        col.visible = false;
        col.defaultcol = false;
        col.selectable = false;
        if (column.status === 1){
            col.visible = true;
        }
        cols.push(col);
    });
    adddialog.dialog({
        title: 'Add Column filter',
        dialogClass: 'googlechart-dialog',
        modal:true,
        minWidth:500,
        open: function(evt, ui){
            var buttons = jQuery(this).parent().find('button');
            buttons.attr('class', 'btn');
            jQuery(buttons[0]).addClass('btn-inverse');
            jQuery(buttons[1]).addClass('btn-success');
            drawColumnFiltersGrid(".googlecharts_columnfilter_slickgrid", cols);
        },
        buttons: {
            Cancel: function(){
                jQuery(this).dialog('close');
            },
            Add: function(){
                var columnfilter = {};
                columnfilter.title = jQuery('.googlecharts_columnfilter_title').val();
                columnfilter.type = jQuery('.googlecharts_columnfilter_type').val();
                columnfilter.allowempty = jQuery('.googlecharts_columnfilter_allowempty').is(':checked') ? true : false;
                columnfilter.settings = {};
                columnfilter.settings.defaults = [];
                columnfilter.settings.selectables = [];
                jQuery.each(columnfilter_data, function(index, row){
                    if (row.defaultcol){
                        columnfilter.settings.defaults.push(row.colid);
                    }
                    if (row.selectable){
                        columnfilter.settings.selectables.push(row.colid);
                    }
                });

                var columnfilter_titles = [];
                jQuery.each(context.data('columnfilters'), function(index, cfilter){
                    columnfilter_titles.push(cfilter.title);
                });

                var errorMsg = validateColumnFilter(columnfilter_titles, columnfilter, true);
                if (errorMsg.length > 0){
                    alert(errorMsg);
                    return;
                }
                context.data('columnfilters').push(columnfilter);
                reloadColumnFilters(id);
                markChartAsModified(id);
                jQuery(this).dialog('close');
            }
        }
    });
    return;
}

function openAddChartNoteDialog(id){
    var context = jQuery('#googlechartid_' + id);
    jQuery(".googlecharts_note_config").remove();

    var adddialog = jQuery('' +
    '<div class="googlecharts_note_config">' +
        '<div class="field">' +
            '<label>Title</label>' +
            '<div class="formHelp">Note title</div>' +
            '<input type="text" class="googlecharts_note_title" />' +
        '</div>' +
        '<div class="field">' +
            '<label>Text</label>' +
            '<div class="formHelp">Note body</div>' +
            '<textarea class="googlecharts_note_text" id="googlechart_note_add_' + id + '"></textarea>' +
        '</div>' +
    '</div>');

    var isTinyMCE = false;
    adddialog.dialog({
        title: 'Add note',
        dialogClass: 'googlechart-dialog',
        modal:true,
        minHeight: 600,
        minWidth: 950,
        open: function(evt, ui){
            var buttons = jQuery(this).parent().find('button');
            buttons.attr('class', 'btn');
            jQuery(buttons[0]).addClass('btn-inverse');
            jQuery(buttons[1]).addClass('btn-success');
            isTinyMCE = initializeChartTinyMCE(adddialog);
        },
        buttons: {
            Cancel: function(){
                jQuery(this).dialog('close');
            },
            Add: function(){

                if(isTinyMCE){
                    tinyMCE.triggerSave(true, true);
                }

                var note = {
                    title: jQuery('input[type="text"]', adddialog).val(),
                    text: jQuery('textarea', adddialog).val()
                };

                if(!context.data('notes')){
                    context.data('notes', []);
                }

                context.data('notes').push(note);
                reloadChartNotes(id);
                markChartAsModified(id);
                jQuery(this).dialog('close');
            }
        }
    });
}

function saveCharts(){
    DavizEdit.Status.start("Saving Charts");
    var ordered = jQuery('#googlecharts_list').sortable('toArray');
    var jsonObj = {};
    var charts = [];
    var thumbId;
    jQuery(ordered).each(function(index, value){
        var chartObj = jQuery("#"+value);
        chartObj.removeClass("googlechart_modified");
        var chart = {};
        chart.id = chartObj.find(".googlechart_id").attr("value");
        chart.name = chartObj.find(".googlechart_name").attr("value");
        chart.config = chartObj.find(".googlechart_configjson").attr("value");
        chart.row_filters = chartObj.find(".googlechart_row_filters").attr("value");
        chart.sortBy = chartObj.find(".googlechart_sortBy").attr("value");
        chart.sortAsc = chartObj.find(".googlechart_sortAsc").attr("value");
        chart.width = chartObj.find(".googlechart_width").attr("value");
        chart.height = chartObj.find(".googlechart_height").attr("value");
        chart.filterposition = chartObj.find("[name='googlechart_filterposition']").val();
        chart.options = chartObj.find(".googlechart_options").attr("value");
        chart.isThumb = chartObj.find(".googlechart_thumb_checkbox").attr("checked");
        chart.dashboard = jQuery.data(chartObj[0], 'dashboard');
        chart.hidden = chartObj.find(".googlechart_hide_chart_icon").hasClass("ui-icon-show");
        chart.showSort = chartObj.find(".googlechart_hide_sort_icon").hasClass("ui-icon-hide");
        chart.hasPNG = chartObj.find(".googlechart_thumb_checkbox").is(":visible");

        config = JSON.parse(chart.config);
        config.options.title = chart.name;
        config.dataTable = [];
        chart.config = JSON.stringify(config);
        chart.columns = chartObj.find(".googlechart_columns").attr("value");
        var id = "googlechart_filters_"+chart.id;
        var orderedFilter = jQuery("#googlechart_filters_"+chart.id).sortable('toArray');
        var filters = {};

        jQuery(orderedFilter).each(function(index,filter){
            filters[jQuery("#"+filter+" .googlechart_filteritem_column").attr("value")] = jQuery("#"+filter+" .googlechart_filteritem_type").attr("value");
        });
        chart.filters = JSON.stringify(filters);
        chart.notes = chartObj.data('notes') || [];

        chart.columnfilters = chartObj.data('columnfilters') || [];

        charts.push(chart);
        if (chart.isThumb){
            thumbId = chart.id;
        }

    });
    jsonObj.charts = charts;
    var jsonStr = JSON.stringify(jsonObj);
    var query = {'charts':jsonStr};

    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.submit_charts",
        type:'post',
        data:query,
        success:function(data){
            // save static image charts for all charts if available
            var chartObjs = jQuery("#googlecharts_list li.googlechart");
            jQuery(chartObjs).each(function(idx, chartObj){
                chartObj = jQuery(chartObj);
                if (chartObj.find(".googlechart_thumb_checkbox").is(":visible")){
                    var chartSettings=[];
                    chartSettings[0] = chartObj.find(".googlechart_id").attr("value");
                    var config_str = chartObj.find(".googlechart_configjson").attr("value");

                    var row_filters_str = chartObj.find(".googlechart_row_filters").attr("value");
                    var row_filters = {};
                    if (row_filters_str.length > 0){
                        row_filters = JSON.parse(row_filters_str);
                    }
                    var sortBy = chartObj.find(".googlechart_sortBy").attr("value");
                    var sortAsc_str = chartObj.find(".googlechart_sortAsc").attr("value");
                    var sortAsc = true;
                    if (sortAsc_str === 'desc'){
                        sortAsc = false;
                    }

                    if (config_str){
                        chartSettings[1] = JSON.parse(config_str);
                        var columns_str = chartObj.find(".googlechart_columns").attr("value");
                        var columnsSettings = {};
                        if (!columns_str){
                            columnsSettings.prepared = [];
                            columnsSettings.original = [];
                        }
                        else{
                            columnsSettings = JSON.parse(columns_str);
                        }
                        chartSettings[2] = columnsSettings;
                        chartSettings[3] = "";
                        chartSettings[4] = chartObj.find(".googlechart_width").attr("value");
                        chartSettings[5] = chartObj.find(".googlechart_height").attr("value");
                        chartSettings[6] = "";
                        chartSettings[7] = JSON.parse(chartObj.find(".googlechart_options").attr("value"));
                        chartSettings[8] = row_filters;
                        chartSettings[9] = sortBy;
                        chartSettings[10] = sortAsc;

                        saveThumb(chartSettings, true);
                    }
                }
            });

            if (thumbId){
                var chartSettings=[];
                var chartObj = jQuery("#googlechartid_"+thumbId);
                chartSettings[0] = thumbId;
                var config_str = chartObj.find(".googlechart_configjson").attr("value");
                if (!config_str){
                    DavizEdit.Status.stop(data);
                }
                else{
                    chartSettings[1] = JSON.parse(config_str);
                    var columns_str = chartObj.find(".googlechart_columns").attr("value");

                    var row_filters_str = chartObj.find(".googlechart_row_filters").attr("value");
                    var row_filters = {};
                    if (row_filters_str.length > 0){
                        row_filters = JSON.parse(row_filters_str);
                    }
                    var sortBy = chartObj.find(".googlechart_sortBy").attr("value");
                    var sortAsc_str = chartObj.find(".googlechart_sortAsc").attr("value");
                    var sortAsc = true;
                    if (sortAsc_str === 'desc'){
                        sortAsc = false;
                    }

                    var columnsSettings = {};
                    if (!columns_str){
                        columnsSettings.prepared = [];
                        columnsSettings.original = [];
                    }
                    else{
                        columnsSettings = JSON.parse(columns_str);
                    }
                    chartSettings[2] = columnsSettings;
                    chartSettings[3] = "";
                    chartSettings[4] = chartObj.find(".googlechart_width").attr("value");
                    chartSettings[5] = chartObj.find(".googlechart_height").attr("value");
                    chartSettings[6] = "";
                    chartSettings[7] = JSON.parse(chartObj.find(".googlechart_options").attr("value"));
                    chartSettings[8] = row_filters;
                    chartSettings[9] = sortBy;
                    chartSettings[10] = sortAsc;

                    saveThumb(chartSettings);
                    DavizEdit.Status.stop(data);
                }
            }
            else {
                DavizEdit.Status.stop("There is no chart selected for thumbnail");
            }
            jQuery(document).trigger('google-charts-changed');
        }
    });
}

function loadCharts(){
    DavizEdit.Status.start("Loading Charts");
    jQuery.getJSON(ajax_baseurl+"/googlechart.get_charts", function(data){
        var jsonObj = data;
        var charts = jsonObj.charts;
        jQuery(charts).each(function(index, chart){
            var options = {
                id : chart.id,
                name : chart.name,
                config : chart.config,
                columns : chart.columns,
                showSort : chart.showSort,
                filters : JSON.parse(chart.filters),
                notes: chart.notes || [],
                columnfilters: chart.columnfilters || [],
                width : chart.width,
                height : chart.height,
                filter_pos : chart.filterposition,
                options : chart.options,
                isThumb : chart.isThumb,
                dashboard : chart.dashboard,
                hidden : chart.hidden,
                row_filters: chart.row_filters,
                sortBy : chart.sortBy,
                sortAsc : chart.sortAsc
            };

            addChart(options);
        });
        DavizEdit.Status.stop("Done");
        jQuery(document).trigger('google-charts-initialized');
    });
}

function addNewChart(){
    var chartName = "chart_";
    var max_id = 0;
    jQuery.each(jQuery(".googlechart_id"), function(){
        this_id = jQuery(this).attr("value");
        if (this_id.substr(0,chartName.length) === chartName){
            chartId = this_id.substr(chartName.length);
            if (parseInt(chartId,10) > max_id){
                max_id = parseInt(chartId,10);
            }
        }
    });
    var newChartId = chartName+(max_id+1);

    var newColumns = {};
    newColumns.original = [];
    newColumns.prepared = [];
    jQuery.each(available_columns,function(key,value){
        var newOriginal = {};
        newOriginal.name = key;
        newOriginal.status = 1;
        newColumns.original.push(newOriginal);

        var newPrepared = {};
        newPrepared.name = key;
        newPrepared.status = 1;
        newPrepared.fullname = value;
        newColumns.prepared.push(newPrepared);
    });

    var options = {
        id : newChartId,
        name : "New Chart",
        config : JSON.stringify({'chartType':'Table','options': {'legend':'none'}}),
        columns : JSON.stringify(newColumns),
        showSort : true
    };

    addChart(options);

    var newChart = jQuery("#googlechartid_"+newChartId);

    markChartAsModified(newChartId);

    jQuery('html, body').animate({
        scrollTop: newChart.offset().top
    });
}

function drawPreviewChart(chartObj, width, height){
    jQuery('#preview-iframe .preview-container').remove();
    var config_json = JSON.parse(chartObj.find(".googlechart_configjson").attr("value"));
    config_json.dataTable = [];

    var adv_options_str = chartObj.find(".googlechart_options").attr("value");
    var adv_options = JSON.parse(adv_options_str);
    var chartAreaLeft = JSON.parse(chartObj.attr("chartArea")).left;
    var chartAreaTop = JSON.parse(chartObj.attr("chartArea")).top;
    var chartAreaWidth = JSON.parse(chartObj.attr("chartArea")).width;
    var chartAreaHeight = JSON.parse(chartObj.attr("chartArea")).height;
    var useChartArea = chartObj.attr("hasChartArea");
    if (useChartArea === "true"){
        adv_options.chartArea = {};
        adv_options.chartArea.left = chartAreaLeft;
        adv_options.chartArea.top = chartAreaTop;
        adv_options.chartArea.width = chartAreaWidth;
        adv_options.chartArea.height = chartAreaHeight;
    }
    var modified_adv_options_str = JSON.stringify(adv_options);
    var config_str = JSON.stringify(config_json);
    var name = chartObj.find(".googlechart_name").attr("value");
    var row_filters_str = chartObj.find(".googlechart_row_filters").attr('value');
    var sortBy = chartObj.find(".googlechart_sortBy").attr('value');
    var sortAsc_str = chartObj.find(".googlechart_sortAsc").attr('value');
    var query = {
                "preview_id":chartObj.find(".googlechart_id").attr("value"),
                "preview_tmp_chart":'{"row_filters_str":"'+encodeURIComponent(row_filters_str)+'",'+
                                    '"sortBy":"'+encodeURIComponent(sortBy)+'",'+
                                    '"sortAsc_str":"'+encodeURIComponent(sortAsc_str)+'",'+
                                    '"json":"'+encodeURIComponent(config_str)+'",'+
                                    '"options":"'+encodeURIComponent(modified_adv_options_str)+'",'+
                                    '"columns":"'+encodeURIComponent(chartObj.find(".googlechart_columns").attr("value"))+'",'+
                                    '"width":'+width+','+
                                    '"height":'+height+','+
                                    '"name":"'+name+'"}'
                };
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.set_iframe_chart",
        type:'post',
        data:query,
        success:function(data){
            jQuery('#preview-iframe').append(
                jQuery('<div class="preview-container"></div>'));
            jQuery(".preview-container").width(width);
            jQuery(".preview-container").height(height);
            jQuery('.preview-container').append(
                jQuery('<iframe>')
                    .attr('src', chartObj.attr('preview_href')+"?preview_id="+data)
                    .attr('width', width)
                    .attr('height', height));


            jQuery('.preview-container').append(
                jQuery('<div class="preview-mask"></div>'));
            jQuery(".preview-mask").width(width);
            jQuery(".preview-mask").height(height);

            var chart_type = JSON.parse(chartObj.find(".googlechart_configjson").attr("value")).chartType;
            if (resizableCharts.indexOf(chart_type) === -1){
                return;
            }

            jQuery('.preview-container').append(
                jQuery('<div class="chartArea"><span>Drag & Resize Chart Area</span></div>'));
            var container_offset = jQuery(".preview-container").offset();
            jQuery(".chartArea").offset({left:container_offset.left + chartAreaLeft, top:container_offset.top + chartAreaTop});
            jQuery(".chartArea").width(chartAreaWidth);
            jQuery(".chartArea").height(chartAreaHeight);
            jQuery('.chartArea').draggable({
                containment:".preview-container",
                stop: function(){
                    var tmp_left = jQuery(this).offset().left - jQuery(".preview-container").offset().left;
                    var tmp_top = jQuery(this).offset().top - jQuery(".preview-container").offset().top;
                    var tmp_width = jQuery(this).width();
                    var tmp_height = jQuery(this).height();
                    chartObj.attr("chartArea", JSON.stringify({left:tmp_left, top:tmp_top, width:tmp_width, height:tmp_height}));
                    chartObj.attr("hasChartArea", true);
                    drawPreviewChart(chartObj, width, height);
                }
            });
            jQuery('.chartArea').resizable({
                containment:".preview-container",
                stop: function(){
                    var tmp_left = jQuery(this).offset().left - jQuery(".preview-container").offset().left;
                    var tmp_top = jQuery(this).offset().top - jQuery(".preview-container").offset().top;
                    var tmp_width = jQuery(this).width();
                    var tmp_height = jQuery(this).height();
                    chartObj.attr("chartArea", JSON.stringify({left:tmp_left, top:tmp_top, width:tmp_width, height:tmp_height}));
                    chartObj.attr("hasChartArea", true);
                    drawPreviewChart(chartObj, width, height);
                }
            });
        }
    });

}
function chartAreaAttribute2px(value, size){
    var pixels = 0;
    if (typeof(value) === "string"){
        if (value.indexOf("%") != -1){
            pixels = size / 100 * parseFloat(value, 10);
        }
    }
    else {
        if (typeof(value) === "number"){
            pixels = value;
        }
    }
    return pixels;
}
function init_googlecharts_edit(){
    if(!jQuery("#googlecharts_list").length){
        return;
    }

    jQuery("#googlecharts_list").sortable({
        handle : '.googlechart_handle',
        items: 'li.googlechart',
        opacity: 0.7,
        delay: 300,
        placeholder: 'ui-state-highlight',
        forcePlaceholderSize: true,
        cursor: 'crosshair',
        tolerance: 'pointer',
        stop: function(event,ui){
            var draggedItem = jQuery(ui.item[0]).attr('id');
            var liName = "googlechartid";
            if (draggedItem.substr(0,liName.length) == liName){
                var id = draggedItem.substr(liName.length+1);
                drawChart(id, function(){});
                markChartAsModified(id);
            }
            resizeGooglecharts();
        }
    });
    jQuery(window).resize(resizeGooglecharts);
    jQuery("#addgooglechart").click(addNewChart);
    jQuery("#googlecharts_list").delegate(".remove_chart_icon","click",function(){
        var chartId = jQuery(this).closest('.googlechart').attr('id');
        var chartToRemove = jQuery("#"+chartId).find(".googlechart_id").attr('value');
        var removeChartDialog = ""+
            "<div>Are you sure you want to delete chart: "+
            "<strong>"+chartToRemove+"</strong>"+
            "</div>";
        jQuery(removeChartDialog).dialog({title:"Remove Chart",
            modal:true,
            dialogClass: 'googlechart-dialog',
            open: function(evt, ui){
                var buttons = jQuery(this).parent().find('button');
                buttons.attr('class', 'btn');
                jQuery(buttons[0]).addClass('btn-danger');
                jQuery(buttons[1]).addClass('btn-inverse');
            },
            buttons:[
                {
                    text: "Remove",
                    click: function(){
                        jQuery("#"+chartId).remove();
                        markAllChartsAsModified();
                        jQuery(this).dialog("close");
                    }
                },
                {
                    text: "Cancel",
                    click: function(){
                        jQuery(this).dialog("close");
                    }
                }
        ]});
    });
    jQuery("#googlecharts_list").delegate(".googlechart_hide_chart_icon","click",function(){
        var oldClass = "ui-icon-hide";
        var newClass = "ui-icon-show";
        if (jQuery(this).hasClass(newClass)){
            oldClass = "ui-icon-show";
            newClass = "ui-icon-hide";
        }
        jQuery(this).removeClass(oldClass).addClass(newClass);
        var chartId = jQuery(this).closest('.googlechart').find('.googlechart_id').attr('value');
        markChartAsModified(chartId);
        changeChartHiddenState(chartId);
    });

    jQuery("#googlecharts_list").delegate(".googlechart_hide_sort_icon","click",function(){
        var oldClass = "ui-icon-hide";
        var newClass = "ui-icon-show";
        if (jQuery(this).hasClass(newClass)){
            oldClass = "ui-icon-show";
            newClass = "ui-icon-hide";
        }
        jQuery(this).removeClass(oldClass).addClass(newClass);
        var chartId = jQuery(this).closest('.googlechart').find('.googlechart_id').attr('value');
        markChartAsModified(chartId);
    });

    jQuery("#googlecharts_list").delegate(".remove_filter_icon","click",function(){
        var filterToRemove = jQuery(this).closest('.googlechart_filteritem');
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        var title = filterToRemove.find('.googlechart_filteritem_id').html();
        var removeFilterDialog = ""+
            "<div>Are you sure you want to delete filter: "+
            "<strong>"+title+"</strong>"+
            "</div>";
        jQuery(removeFilterDialog).dialog({title:"Remove filter",
            modal:true,
            dialogClass: 'googlechart-dialog',
            open: function(evt, ui){
                var buttons = jQuery(this).parent().find('button');
                buttons.attr('class', 'btn');
                jQuery(buttons[0]).addClass('btn-danger');
                jQuery(buttons[1]).addClass('btn-inverse');
            },
            buttons:[
                {
                    text: "Remove",
                    click: function(){
                        filterToRemove.remove();
                        markChartAsModified(id);
                        jQuery(this).dialog("close");
                    }
                },
                {
                    text: "Cancel",
                    click: function(){
                        jQuery(this).dialog("close");
                    }
                }
        ]});
    });

    jQuery("#googlecharts_list").delegate(".addgooglechartfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddChartFilterDialog(id);
    });

    jQuery("#googlecharts_list").delegate(".addgooglechartcolumnfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddChartColumnFilterDialog(id);
    });

    jQuery("#googlecharts_list").delegate(".addgooglechartnote","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddChartNoteDialog(id);
    });

    jQuery("input[name='googlechart.googlecharts.actions.save']").unbind('click');
    jQuery("input[name='googlechart.googlecharts.actions.save']").click(function(e){
        saveCharts();
    });

    jQuery("#googlecharts_list").delegate("a.preview_button", "click", function(){
        previewChartObj = jQuery(this).closest('.googlechart');
        var chartObj = previewChartObj;
        var width = parseInt(chartObj.find(".googlechart_width").val(),10);
        var height = parseInt(chartObj.find(".googlechart_height").val(),10);
        jQuery( '#preview-iframe').remove();
        previewDiv = jQuery("<div id='preview-iframe'></div>");
        controlsDiv = jQuery("<div class='preview-controls'> </div>");
        controlsDiv.append("<input class='chartsize chartWidth' type='number'/>");
        controlsDiv.append("<span>x</span>");
        controlsDiv.append("<input class='chartsize chartHeight' type='number'/>");
        controlsDiv.append("<span>px</span>");
        controlsDiv.append("<input value='Cancel' class='btn btn-inverse' type='button'/>");
        controlsDiv.append("<input value='Save' class='btn btn-success' type='button'/>");
        previewDiv.append(controlsDiv);
        previewDiv.dialog({
            dialogClass: 'googlechart-dialog googlechart-preview-dialog',
            modal:true,
            width:width + 35,
            height:height + 90,
            title:'Preview and size adjustments',
            resize: function() {
                var tmp_width = width + (jQuery(this).width() - jQuery(this).attr("widthOriginal"));
                var tmp_height = height + (jQuery(this).height() - jQuery(this).attr("heightOriginal"));
                jQuery(".preview-controls .chartWidth").attr("value", tmp_width);
                jQuery(".preview-controls .chartHeight").attr("value", tmp_height);
            },
            resizeStop: function(){
                var width_ratio = jQuery(this).width() / chartObj.attr("widthPrevious");
                var height_ratio = jQuery(this).height() / chartObj.attr("heightPrevious");
                var chartAreaLeft = JSON.parse(chartObj.attr("chartArea")).left * width_ratio;
                var chartAreaTop = JSON.parse(chartObj.attr("chartArea")).top * height_ratio;
                var chartAreaWidth = JSON.parse(chartObj.attr("chartArea")).width * width_ratio;
                var chartAreaHeight = JSON.parse(chartObj.attr("chartArea")).height * height_ratio;
                chartObj.attr("chartArea", JSON.stringify({left:chartAreaLeft, top:chartAreaTop, width:chartAreaWidth, height:chartAreaHeight}));
                drawPreviewChart(chartObj,
                         width + (jQuery(this).width() - jQuery(this).attr("widthOriginal")),
                         height + (jQuery(this).height() - jQuery(this).attr("heightOriginal"))
                        );
            },
            resizeStart: function(){
                chartObj.attr("widthPrevious", jQuery(this).width());
                chartObj.attr("heightPrevious", jQuery(this).height());
            },
            create: function(){
                var adv_options_str = chartObj.find(".googlechart_options").attr("value");
                var adv_options = JSON.parse(adv_options_str);
                var hasChartArea = true;
                if ((!adv_options.hasOwnProperty("chartArea")) || 
                    (!adv_options.chartArea.hasOwnProperty("left")) ||
                    (!adv_options.chartArea.hasOwnProperty("top")) ||
                    (!adv_options.chartArea.hasOwnProperty("width")) ||
                    (!adv_options.chartArea.hasOwnProperty("height"))){
                    hasChartArea = false;
                }
                var chartAreaLeft = width / 100 * 10;
                var chartAreaTop = height / 100 * 10;
                var chartAreaWidth = width / 100 * 80;
                var chartAreaHeight = height / 100 * 80;
                if (hasChartArea){
                    chartAreaLeft = chartAreaAttribute2px(adv_options.chartArea.left, width);
                    chartAreaTop = chartAreaAttribute2px(adv_options.chartArea.top, height);
                    chartAreaWidth = chartAreaAttribute2px(adv_options.chartArea.width, width);
                    chartAreaHeight = chartAreaAttribute2px(adv_options.chartArea.height, height);
                }
                chartObj.attr("chartArea", JSON.stringify({left: chartAreaLeft, top:chartAreaTop, width:chartAreaWidth, height: chartAreaHeight}));
                chartObj.attr("hasChartArea", hasChartArea);
                drawPreviewChart(chartObj,
                                width,
                                height);
            },
            open: function(){
                jQuery(".chartsize").change(function(){
                    var tmp_width = parseInt(jQuery(".preview-controls .chartWidth").attr("value"), 10);
                    var tmp_height = parseInt(jQuery(".preview-controls .chartHeight").attr("value"), 10);
                    var width_ratio = tmp_width / parseInt(chartObj.attr("widthPrevious"),10);
                    var height_ratio = tmp_height / parseInt(chartObj.attr("heightPrevious"),10);
                    var chartAreaLeft = JSON.parse(chartObj.attr("chartArea")).left * width_ratio;
                    var chartAreaTop = JSON.parse(chartObj.attr("chartArea")).top * height_ratio;
                    var chartAreaWidth = JSON.parse(chartObj.attr("chartArea")).width * width_ratio;
                    var chartAreaHeight = JSON.parse(chartObj.attr("chartArea")).height * height_ratio;
                    chartObj.attr("chartArea", JSON.stringify({left:chartAreaLeft, top:chartAreaTop, width:chartAreaWidth, height:chartAreaHeight}));
                    drawPreviewChart(chartObj, tmp_width, tmp_height);

                    jQuery("#preview-iframe").dialog("option", "width", tmp_width + 35);
                    jQuery("#preview-iframe").dialog("option", "height", tmp_height + 90);
                    chartObj.attr("widthPrevious", tmp_width);
                    chartObj.attr("heightPrevious", tmp_height);
                });
                jQuery(".chartsize").focus(function(){
                    chartObj.attr("widthPrevious", jQuery(".preview-controls .chartWidth").attr("value"));
                    chartObj.attr("heightPrevious", jQuery(".preview-controls .chartHeight").attr("value"));
                });
                jQuery("#preview-iframe .btn-inverse").click(function(){
                    jQuery("#preview-iframe").dialog("close");
                });
                jQuery("#preview-iframe .btn-success").click(function(){
                    var tmp_width = parseInt(jQuery(".preview-controls .chartWidth").attr("value"), 10);
                    var tmp_height = parseInt(jQuery(".preview-controls .chartHeight").attr("value"), 10);
                    chartObj.find(".googlechart_width").attr("value", tmp_width);
                    chartObj.find(".googlechart_height").attr("value", tmp_height);
                    if (chartObj.attr("hasChartArea") === "true"){
                        var adv_options_str = chartObj.find(".googlechart_options").attr("value");
                        var adv_options = JSON.parse(adv_options_str);
                        var chartAreaLeft = JSON.parse(chartObj.attr("chartArea")).left;
                        var chartAreaTop = JSON.parse(chartObj.attr("chartArea")).top;
                        var chartAreaWidth = JSON.parse(chartObj.attr("chartArea")).width;
                        var chartAreaHeight = JSON.parse(chartObj.attr("chartArea")).height;
                        adv_options.chartArea = {};
                        adv_options.chartArea.left = chartAreaLeft * 100 / tmp_width + "%";
                        adv_options.chartArea.top = chartAreaTop * 100 / tmp_height + "%";
                        adv_options.chartArea.width = chartAreaWidth * 100 / tmp_width + "%";
                        adv_options.chartArea.height = chartAreaHeight * 100 / tmp_height + "%";
                        var modified_adv_options_str = JSON.stringify(adv_options);
                        chartObj.find(".googlechart_options").attr("value", modified_adv_options_str);
                    }
                    jQuery("#preview-iframe").dialog("close");
                    markChartAsModified(chartObj.find(".googlechart_id").attr("value"));
                });
                jQuery(".preview-controls .chartWidth").attr("value", width);
                jQuery(".preview-controls .chartHeight").attr("value", height);
                jQuery(this).attr("widthOriginal", jQuery(this).width());
                jQuery(this).attr("heightOriginal", jQuery(this).height());
                chartObj.attr("widthPrevious", width);
                chartObj.attr("heightPrevious", height);
            }
        });
    });
    jQuery("#googlecharts_list").delegate("a.preview_button", "hover", function(){
        previewChartObj = jQuery(this).closest('.googlechart');
        var chartObj = previewChartObj;
        var width = chartObj.find(".googlechart_width").val();
        var height = chartObj.find(".googlechart_height").val();
        var name = chartObj.find(".googlechart_name").attr("value");
        var self = jQuery(this);
        var form = jQuery('.daviz-view-form:has(#googlecharts_config)');
        var action = form.length ? form.attr('action') : '';
        action = action.split('@@')[0] + "chart-full";

        chartObj.attr("preview_href", action);
    });
    loadCharts();
}


jQuery(document).ready(function(){
    charteditor_css = jQuery("link[rel='stylesheet'][href*='charteditor']");
    charteditor_css.remove();

    init_googlecharts_edit();
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        init_googlecharts_edit();
    });
});
