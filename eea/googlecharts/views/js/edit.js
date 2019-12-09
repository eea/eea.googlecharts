var charteditor_css = null;
var previewChartObj = null;
var chartEditor = null;
var chartId = '';
var drawing = false;
var chartWrapper;
var Templates = {};
var ChartNotes = [];

var NiceMessages = {};

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
                        'PieChart',
                        'ImageChart'];

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

// Functions that are used before their definition

var resizeTableConfigurator;
var openEditChart;
var markChartAsModified;
var reloadChartNotes;
var reloadAllChartNotes;
var markAllChartsAsModified;

//////


function get_notes_for_chart(chart_id){
  var notes = _.filter(ChartNotes, function(note){
    return note.global || note.charts.indexOf(chart_id) !== -1;
  });
  return notes || [];
}

function get_other_charts_for_note(note, exclude_id){
  return _.chain(jQuery('#googlecharts_list li.googlechart'))
    .map(function(chart){
      chart = jQuery(chart);
      var chart_id = chart.find('.googlechart_id').val();
      var chart_name = chart.find('.googlechart_name').val();
      var selected = note ? note.charts.indexOf(chart_id) !== -1 : false;
      return {
        id: chart_id,
        name: chart_name,
        selected: selected
      };
    })
    .filter(function(chart){
      return chart.id !== exclude_id;
    })
    .value();
}

function delete_note_with_id(note_id){
  ChartNotes = _.filter(ChartNotes, function(n){
    return n.id !== note_id;
  });
}

function remove_chart_from_note(chart_id, note){
  var new_note_charts = _.filter(note.charts, function(c_id){
    return c_id !== chart_id;
  });
  if (new_note_charts.length === 0){
    delete_note_with_id(note.id);
  } else {
    note.charts = new_note_charts;
    delete note.order[chart_id];
  }
  markChartAsModified(chart_id);
}

function remove_chart_update_notes(chart_id){
  _.each(get_notes_for_chart(chart_id), function(note){
    remove_chart_from_note(chart_id, note);
  });
}

function update_note_order(chart_id, note_id, position){
  _.findWhere(ChartNotes, {
    id: note_id
  }).order[chart_id] = position;
}

function delete_note(chart_id, note){
  if(note.global){
    delete_note_with_id(note.id);
    reloadAllChartNotes();
    markAllChartsAsModified();
  } else {
    remove_chart_from_note(chart_id, note);
  }
}

function edit_note(chart_id, note, note_data){
  oldNote = _.clone(note);

  note = _.findWhere(ChartNotes, {id: note.id});

  _.extend(note, note_data);

  note.charts = note.global ? [] : note.charts;

  if (note.global || note.global !== oldNote.global){
    reloadAllChartNotes();
    markAllChartsAsModified();
  } else {
    _.each(_.union(oldNote.charts, note.charts), function(c_id){
      reloadChartNotes(c_id);
      markChartAsModified(c_id);
    });
  }
}

function note_toggle_global_field(evt, dialog){
  var global = jQuery(evt.target);
  var share_field = dialog.find('.note-share-field');
  var hint_on = dialog.find('.note-global-on-hint');
  var hint_off = dialog.find('.note-global-off-hint');
  if (global.is(":checked")){
    share_field.fadeOut();
    hint_on.show();
    hint_off.hide();
  } else {
    share_field.fadeIn();
    hint_off.show();
    hint_on.hide();
  }
}

function add_note(chart_id, note_data){
  var note = {
    id: UUID.genV4().toString(),
    charts: [],
    order: {},
    title: '',
    text: '',
    global: false
  };

  note.order[chart_id] = get_notes_for_chart(chart_id).length;

  _.extend(note, note_data);

  ChartNotes.push(note);

  if(note.global){
    reloadAllChartNotes();
    markAllChartsAsModified();
  } else {
    _.each(note.charts, function(c_id){
      reloadChartNotes(c_id);
      markChartAsModified(c_id);
    });
  }
}

function checkReadyForSparklines(skipwrapper){
    if ((!skipwrapper) && (chartEditor.getChartWrapper().getChartType() !== 'ImageSparkLine')){
        return;
    }

    var preview_chart = jQuery("#google-visualization-charteditor-preview-div-chart");

    if (preview_chart
            .find("table.google-visualization-sparkline-default")
            .length === 1) {
        google.visualization.events.trigger(chartEditor, "ready", {});
        return;
    }
    if ((preview_chart
            .find("div.google-visualization-charteditor-data-mismatch")
            .length === 1) ||
        (preview_chart.text() === 'No Data')) {
        return;
    }

    setTimeout(function(){
        checkReadyForSparklines(skipwrapper);
    },100);
}

function svgCleanup(svg) {
    svg = jQuery(svg);
    svg.attr("xmlns","http://www.w3.org/2000/svg");
    var r_elems = svg.find("rect[fill^='url']");
    var g_elems = svg.find("g[clip-path^='url']");
    var elems = jQuery.merge(r_elems, g_elems);

    jQuery.each(elems, function(idx, elem){
        var fillVal = jQuery(elem).attr("fill");
        var clip_path = jQuery(elem).attr("clip-path");
        var elem_attr, url_val;
        if (fillVal === undefined){
            elem_attr = 'clip-path';
            url_val = jQuery(elem).attr("clip-path");
        } else if (clip_path === undefined) {
            elem_attr = 'fill';
            url_val = jQuery(elem).attr("fill");
        } else {
            return;
        }
        if (url_val.indexOf("url(") === 0){
            url_val = 'url(#' + url_val.split('#')[1].split('"').join('');
            jQuery(elem).attr(elem_attr, url_val);
        }
    });

    container = jQuery('<div/>');
    container.append(svg);
    return container.html();
}

function updateSortOptions(id){
    var values = JSON.parse(jQuery('#googlechartid_' + id + ' .googlechart_columns').val()).prepared;
    var body = jQuery("#googlechartid_" + id).find(".googlechart-sort-box").find("select").empty();
    var disabled_option = jQuery("<option></option>");
    var selected = body.attr("selected_value");
    body.attr("value", selected);
    disabled_option.attr("value", '__disabled__');
    disabled_option.text("Disabled");
    if (selected === '__disabled__'){
        disabled_option.attr("selected", "selected");
    }
    disabled_option.appendTo(body);
    var default_option = jQuery("<option></option>");
    default_option.attr("value", "__default__");
    default_option.text("Enabled, without anything selected");
    if (selected === '__default__'){
        default_option.attr("selected", "selected");
    }
    default_option.appendTo(body);
    jQuery.each(values, function(idx, value){
        if (value.status !== 0){
            var option = jQuery("<option></option>");
            if (selected === value.name){
                option.attr("selected", "selected");
            }
            option.attr("value", value.name);
            option.text(value.fullname);
            option.appendTo(body);
            var rev_option = jQuery("<option></option>");
            if (selected === value.name+"_reversed"){
                rev_option.attr("selected", "selected");
            }
            rev_option.attr("value", value.name+"_reversed");
            rev_option.text(value.fullname + " (reversed)");
            rev_option.appendTo(body);
        }
    });
}


function updateCounters(){
    jQuery(".googlechart").each(function(){
        var elem = jQuery(this);
        updateSortOptions(elem.find(".googlechart_id").attr("value"));
        var columnFiltersNr = elem.find(".googlechart-columnfilters-box").find("li").length;
        var notesNr = elem.find(".googlechart-notes-box").find("li").length;
        var filtersNr = elem.find(".googlechart_filters_list").find("li").length;
        if (JSON.parse(elem.find(".googlechart_configjson").attr("value")).chartType === 'Table'){
            elem.find(".googlechart-sort-box").hide();
            elem.find(".googlechart-sort-box select").attr("selected_value", "__disabled__");
            if (elem.find(".googlechart-sort-box-placeholder").length === 0){
                jQuery("<div class='googlechart-sort-box placeholder'></div>").insertAfter(elem.find(".googlechart-notes-box"));
            }
        }
        else{
            elem.find(".googlechart-sort-box").show();
        }
        elem.find(".googlechart-columnfilters-box").find(".items_counter").text("("+columnFiltersNr+")");
        elem.find(".googlechart-notes-box").find(".items_counter").text("("+notesNr+")");
        elem.find(".googlechart-filters-box").find(".items_counter").text("("+filtersNr+")");
    });
}

function checkSVG(id){
    var tmp_config_str = jQuery("#googlechartid_"+id).find(".googlechart_configjson").attr("value");
    var tmp_config = JSON.parse(tmp_config_str);
    var chart_thumb_id = jQuery("#googlechart_thumb_id_"+id);
    var chart_thumb_text = jQuery("#googlechart_thumb_text_"+id);
    if (jQuery.inArray(tmp_config.chartType.toLowerCase(), chartsWithoutSVG) === -1){//xxx
        chart_thumb_id.show();
        chart_thumb_text.show();
        return true;
    }
    else{
        chart_thumb_id.hide();
        chart_thumb_text.hide();
        chart_thumb_id.attr("checked",false);
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

markChartAsModified = function(id){
    var chartObj = jQuery("#googlechartid_"+id);
    chartObj.addClass("googlechart_modified");
    updateCounters();
};

function changeChartHiddenState(id){
    var chartObj = jQuery("#googlechartid_"+id);
    if (chartObj.hasClass("googlechart_hidden")){
        chartObj.removeClass("googlechart_hidden");
    }
    else{
        chartObj.addClass("googlechart_hidden");
    }
}

function addFilter(id, column, filtertype, columnName, defaults, filter_settings){
    filter_id = 'googlechart_filter_'+id+'_'+column;
    var filter = jQuery("#"+filter_id);
    var shouldAdd = false;
    if (filter.length === 0){
        shouldAdd = true;
        filter = jQuery("<li class='googlechart_filteritem'  id='"+filter_id+"'>" +
                      "<div class='googlechart_filteritem_"+id+"'>"+
                      "<div class='eea-icon daviz-menuicon eea-icon-trash-o remove_filter_icon' title='Delete filter'></div>"+
                      "<div class='eea-icon daviz-menuicon eea-icon-pencil edit_filter_icon' title='Edit filter'></div>"+
                      "<div class='googlechart_filteritem_id'></div>"+
                      "</div>"+
                    "<input type='hidden' class='googlechart_filteritem_type'/>" +
                    "<input type='hidden' class='googlechart_filteritem_column'/>" +
                    "<input type='hidden' class='googlechart_filteritem_defaults'/>" +
                    "<input type='hidden' class='googlechart_filteritem_settings'/>" +
                 "</li>");
    }
    filter.find(".googlechart_filteritem_id").text(columnName);
    filter.find(".googlechart_filteritem_type").attr("value", filtertype);
    filter.find(".googlechart_filteritem_column").attr("value", column);
    filter.find(".googlechart_filteritem_defaults").attr("value", JSON.stringify(defaults));
    filter.find(".googlechart_filteritem_settings").attr("value", JSON.stringify(filter_settings));
    if (shouldAdd){
        filter.appendTo("#googlechart_filters_"+id);
    }
}

function initializeChartTinyMCE(el){
    var textarea = jQuery('textarea', el).addClass('mce_editable');
    var name = textarea.attr('id');
    var $form = jQuery('.daviz-view-form');
    var action = $form.length ? $form.attr('action') : '';
    action = action.split('@@')[0] + '@@tinymce-jsonconfiguration';

    jQuery.getJSON(action, {field: name}, function(data){
      data.autoresize = true;
      data.resizing = false;
      // XXX Remove some buttons as they have bugs
      function removeSave(buttons){
        return jQuery.map(buttons, function(button){
          if(button === 'save'){
            return;
          }else{
            return button;
          }
        });
      }
      data.buttons = removeSave(data.buttons);
      var advanced_buttons = data.theme_advanced_buttons1.split(",");
      advanced_buttons = removeSave(advanced_buttons);
      data.theme_advanced_buttons1 = advanced_buttons.join(",");
      textarea.attr('data-mce-config', JSON.stringify(data));

      window.initTinyMCE(document);
    });

    return true;
}

reloadChartNotes = function(id){
    var context = jQuery('#googlechartid_' + id);
    if(!context.length){
        return;
    }

    var box = jQuery('.googlechart-notes-box', context);
    var ul = jQuery('.body ul', box).empty();

    var notes = _.sortBy(get_notes_for_chart(id), function(note){
      return note.order[id];
    });
    jQuery.each(notes, function(index, note){

      noteTemplate = Templates.noteTemplate({data: {
        note: note,
        edit_icon: note.global ? 'eea-icon-globe' : 'eea-icon-pencil',
        edit_title: note.global ? 'Edit global note' : 'Edit note'
      }});

      noteElement = jQuery(noteTemplate);
      noteElement.appendTo(ul);

      noteElement.data('note', note);
      noteElement.find('.note-edit-button')
        .on('click', function(){
          jQuery(".googlecharts_note_config").remove();

          var template = Templates.noteDialog({
            data: {
              chart_id: id,
              note_title: note.title,
              note_text: note.text,
              note_global: note.global,
              other_charts: get_other_charts_for_note(note, id)
            }
          });

          var editDialog = jQuery(template);

          editDialog.find('.note-global-field').on('change', function(evt){
            note_toggle_global_field(evt, editDialog);
          });

          var isTinyMCE = false;
          editDialog.dialog({
            title: 'Edit note',
            dialogClass: 'googlechart-dialog',
            modal: true,
            minHeight: 600,
            minWidth: 950,
            open: function(evt, ui){
              var buttons = jQuery(this).parent().find("button[title!='close']");
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

                var note_data = {
                  title: jQuery('input[name="title"]', editDialog).val(),
                  text: jQuery('textarea[name="text"]', editDialog).val(),
                  global: jQuery('input[name="global"]:checked', editDialog).length > 0,
                  charts: [id].concat(jQuery('select[name="other_charts"]', editDialog).val() || [])
                };

                edit_note(id, note, note_data);

                jQuery(this).dialog('close');
              }
            }
          });
        });

      // Note delete button
      noteElement.find('.note-delete-button')
        .on('click', function(){
          var deleteButton = jQuery(this);
          var removeChartNoteTemplate = Templates.removeDialog({data: {
            remove_type: "chart note",
            remove_text: note.title,
            extra_body: Templates.removeNoteDialogBody({data: {
              note: note,
              other_charts: _.where(get_other_charts_for_note(note, id), {selected: true})
            }})
          }});

          jQuery(removeChartNoteTemplate).dialog({
            title: "Remove note",
            modal: true,
            dialogClass: 'googlechart-dialog',
            open: function(evt, ui){
              var buttons = jQuery(this).parent().find("button[title!='close']");
              buttons.attr('class', 'btn');
              jQuery(buttons[0]).addClass('btn-danger');
              jQuery(buttons[1]).addClass('btn-inverse');
            },
            buttons:{
              Remove: function(){
                var li = deleteButton.closest('li');
                delete_note(id, note);
                li.remove();
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
            jQuery('li', ul).each(function(idx, elem){
              elem = jQuery(elem);
              note_id = elem.data('note').id;
              update_note_order(id, note_id, idx);
            });
            markChartAsModified(id);
        }
    });
};

reloadAllChartNotes = function(){
  jQuery("#googlecharts_list").find(".googlechart_id").each(function(idx, elem){
    elem = jQuery(elem);
    reloadChartNotes(elem.val());
  });
};

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
            .addClass('eea-icon daviz-menuicon')
            .addClass('eea-icon-pencil')
            .attr('title', 'Edit columnfilter')
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
                        var buttons = jQuery(this).parent().find("button[title!='close']");
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
            .addClass('eea-icon daviz-menuicon')
            .addClass('eea-icon-trash-o')
            .attr('title', 'Delete column filter')
            .prependTo(li)
            .click(function(){
                var deleteButton = jQuery(this);
                var removeColumnFilterTemplate = Templates.removeDialog({data: {
                  remove_type: "column filter",
                  remove_text: columnfilter.title
                }});
                jQuery(removeColumnFilterTemplate).dialog({
                    title: "Remove column filter",
                    modal: true,
                    dialogClass: 'googlechart-dialog',
                    open: function(evt, ui){
                        var buttons = jQuery(this).parent().find("button[title!='close']");
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
    var chart_unpivotsettings = value[11];

    var columnsFromSettings = getColumnsFromSettings(chart_columns);
    var options = {
        originalTable : all_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : getAvailable_columns_and_rows(chart_unpivotsettings, available_columns, all_rows).available_columns,
        filters : chart_row_filters,
        unpivotSettings : chart_unpivotsettings
    };
    var transformedTable = transformTable(options);

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : chart_sortBy,
        sortAsc : chart_sortAsc,
        enableEmptyRows: chart_options.enableEmptyRows,
        preparedColumns: chart_columns.prepared,
        chartType : 'editor'
    };
    options.errorbars = getErrorbarsFromSeries(chart_options.series);
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
                            var svg;
                            var img_url;
                            img_url = jQuery(thumb_id).find("img").attr("src");
                            if (img_url === undefined){
                                svg = jQuery(thumb_id).find("svg").parent().html();
                                svg = svgCleanup(svg);
                            }
                            else {
                                img_url = "http://"+img_url.substr(img_url.indexOf("chart.googleapis.com"));
                            }
                            jQuery(thumb_id).remove();
                            var form = jQuery('.daviz-view-form:has(#googlecharts_config)');
                            var action = form.length ? form.attr('action') : '';
                            if (useName){
                                action = action.split('@@')[0] + "@@googlechart.savepngchart";
                            }
                            else {
                                action = action.split('@@')[0] + "@@googlechart.setthumb";
                            }
                            var data = {"filename": filename};
                            if (img_url === undefined){
                                data.svg = svg;
                            }
                            else {
                                data.imageChart_url = img_url;
                            }
                            jQuery.ajax({
                                type: 'POST',
                                url: action,
                                data: data,
                                async: false,
                                success: function(data){
                                    if (data !== "Success"){
                                        DavizEdit.Status.stop("Can't generate thumb from the chart called: " + chart_json.options.title);
                                    }
                                    var saved_chart_id = "googlechartid_" + value[0];
                                    var action = this.url.split("@@")[1];
                                    if (action === "googlechart.setthumb") {
                                        jQuery("#" + saved_chart_id).attr("data-cover-persisted", true);
                                    } else if (action === "googlechart.savepngchart") {
                                        jQuery("#" + saved_chart_id).attr("data-persisted", true);
                                    }
                                    var available_charts = jQuery("#googlecharts_list").children();
                                    var cover_available = jQuery("#googlecharts_list").children("[data-cover-persisted]");
                                    var cover_persisted = jQuery("#googlecharts_list").children("[data-cover-persisted='true']");
                                    var saved_charts = jQuery("#googlecharts_list").children("[data-persisted='true']");
                                    if (available_charts.length === saved_charts.length) {
                                        var charts_assets = [];
                                        jQuery.each(available_charts, function(idx, val) {
                                            var chartconfig_input = jQuery(val).find(".googlechart_configjson");
                                            var chart_id_input = jQuery(val).find(".googlechart_id");
                                            if (chartconfig_input && chart_id_input) {
                                                var chart_config = JSON.parse(chartconfig_input.attr("value"));
                                                var chart_id = chart_id_input.attr("value");
                                                charts_assets.push(chart_id+'.png');
                                                if (chart_config.chartType !== 'ImageChart') {
                                                    charts_assets.push(chart_id+'.svg');
                                                }
                                            }
                                        });
                                        if ((cover_available.length > 0 && cover_persisted.length >0) || cover_available.length <= 0) {
                                            if (cover_available.length > 0 && cover_persisted.length >0) {
                                                charts_assets.push("cover.png");
                                            }
                                            var charts_assets_q ={'charts_assets': charts_assets.toString()};
                                            jQuery.ajax({
                                                   url:ajax_baseurl+"/googlechart.cleanup_thumbs",
                                                   data:charts_assets_q,
                                                   type:'post'
                                             });
                                        }
                                    }
                                 }
                            });
                        },

        chartErrorEvent : function(){
                            DavizEdit.Status.stop("Can't generate thumb from the chart called: " + chart_json.options.title);
                        },
        sortFilter : '__disabled__',
        hideNotes : true
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
                var buttons = jQuery(this).parent().find("button[title!='close']");
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

markAllChartsAsModified = function(){
    jQuery(".googlechart").each(function(){
        jQuery(this).addClass("googlechart_modified");
    });
    updateCounters();
};

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
        sortFilter : "__disabled__",
        filters : {},
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
        columnfilters : [],
        unpivotsettings : {}
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

    var googlechartTemplate = Templates.googlechartTemplate({data: {
      settings: settings
    }});
    var googlechart = jQuery(googlechartTemplate);

    googlechart.find('.chart-button-settings').on('click', function(){
      openAdvancedOptions(settings.id);
    });

    googlechart.find('.chart-button-edit').on('click', function(){
      openEditChart(settings.id);
    });

    var to_change = [
      '.googlechart_name',
      '.googlechart_height',
      '.googlechart_width',
      '.googlechart_filterposition'
    ].join(', ');

    googlechart.find(to_change).on('change', function(){
      markChartAsModified(settings.id);
    });

    googlechart.find('.googlechart_name').on('change', function(){
      drawChart(settings.id, function(){});
    });

    googlechart.find('.googlechart_thumb_checkbox').on('change', function(){
      markChartAsThumb(settings.id);
    });

    // Sort
    googlechart.find('.googlechart-sort-box .body').hide();
    googlechart.find('.googlechart-sort-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-sort-box .body');
        if(body.is(':visible')){
            body.slideUp();
            jQuery('.googlechart-sort-box .eea-icon-minus-square-o', googlechart)
                .removeClass('eea-icon-minus-square-o')
                .addClass('eea-icon-plus-square-o');
        }else{
            body.slideDown();
            jQuery('.googlechart-sort-box .eea-icon-plus-square-o', googlechart)
                .removeClass('eea-icon-plus-square-o')
                .addClass('eea-icon-minus-square-o');
        }
    });
    googlechart.find('.googlechart-sort-box select').attr("selected_value",settings.sortFilter);
    googlechart.find('.googlechart-sort-box select').change(function(){
        googlechart.find('.googlechart-sort-box select').attr('selected_value', googlechart.find('.googlechart-sort-box select').attr('value'));
        markChartAsModified(settings.id);
    });
//    updateSortOptions(settings.id);

    // Filters

    googlechart.find('.googlechart-filters-box .body').hide();
    googlechart.find('.googlechart-filters-box .header .eea-icon-plus').hide();
    googlechart.find('.googlechart-filters-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-filters-box .body');
        var button = googlechart.find('.googlechart-filters-box .eea-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-filters-box .eea-icon-minus-square-o', googlechart)
                .removeClass('eea-icon-minus-square-o')
                .addClass('eea-icon-plus-square-o');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-filters-box .eea-icon-plus-square-o', googlechart)
                .removeClass('eea-icon-plus-square-o')
                .addClass('eea-icon-minus-square-o');
        }
    });

    // Column Filters
    googlechart.find('.googlechart-columnfilters-box .body').hide();
    googlechart.find('.googlechart-columnfilters-box .header .eea-icon-plus').hide();
    googlechart.find('.googlechart-columnfilters-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-columnfilters-box .body');
        var button = googlechart.find('.googlechart-columnfilters-box .eea-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-columnfilters-box .eea-icon-minus-square-o', googlechart)
                .removeClass('eea-icon-minus-square-o')
                .addClass('eea-icon-plus-square-o');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-columnfilters-box .eea-icon-plus-square-o', googlechart)
                .removeClass('eea-icon-plus-square-o')
                .addClass('eea-icon-minus-square-o');
        }
    });

    // Notes
    googlechart.find('.googlechart-notes-box .body').hide();
    googlechart.find('.googlechart-notes-box .header .eea-icon-plus').hide();
    googlechart.find('.googlechart-notes-box .header .label').click(function(){
        var body = googlechart.find('.googlechart-notes-box .body');
        var button = googlechart.find('.googlechart-notes-box .eea-icon-plus');
        if(body.is(':visible')){
            body.slideUp();
            button.hide();
            jQuery('.googlechart-notes-box .eea-icon-minus-square-o', googlechart)
                .removeClass('eea-icon-minus-square-o')
                .addClass('eea-icon-plus-square-o');
        }else{
            body.slideDown();
            button.show();
            jQuery('.googlechart-notes-box .eea-icon-plus-square-o', googlechart)
                .removeClass('eea-icon-plus-square-o')
                .addClass('eea-icon-minus-square-o');
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

    googlechart.data('unpivotsettings', settings.unpivotsettings);

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
        var filter_settings = value.settings;
        if (filter_settings === undefined){
            filter_settings = {};
        }
        if (key.indexOf('pre_config_') === -1){
            jQuery(chartColumns.prepared).each(function(idx, column){
                if (column.name === key){
                    addFilter(settings.id, key, value.type, column.fullname, value.defaults, filter_settings);
                }
            });
        }
        else {
            addFilter(settings.id, key, value.type, getAvailable_columns_and_rows(settings.unpivotsettings, available_columns, all_rows).available_columns[key.substr(11)], value.defaults, filter_settings);
        }
    });
    if (shouldMark){
        markChartAsModified(settings.id);
    }
    updateCounters();
}

var isFirstEdit = true;
var editedChartStatus = false;

function moveIfFirst(){
    if (isFirstEdit){
        var charteditor_dialog = jQuery(".google-visualization-charteditor-dialog");
        if (charteditor_dialog.length > 0){
            charteditor_dialog.css("visibility", "visible");
            charteditor_dialog.appendTo("#googlechart_editor_container");
            charteditor_dialog.removeClass("modal-dialog");
            charteditor_dialog.addClass("googlechart-editor");
            isFirstEdit = false;
            if (jQuery(".google-visualization-charteditor-data-mismatch").length > 0){
                jQuery(".google-visualization-charteditor-panel-navigation-cell:contains('Start')").click();
            }
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

var backupColors = [];
var backupOptionColors = [];
function updateEditorColors(){
    var colorcontainers = jQuery(".google-visualization-charteditor-color .charts-flat-menu-button-indicator");
    jQuery.each(colorcontainers, function(idx, container){
        jQuery(container).css("background-color", backupColors[idx]);
    });

    var coloroptions = jQuery(".google-visualization-charteditor-select-series-color");
    jQuery.each(coloroptions, function(idx, option){
        jQuery(option).css("background-color", backupOptionColors[idx]);
    });

}

function saveEditorColors(){
    var colorcontainers = jQuery(".google-visualization-charteditor-color .charts-flat-menu-button-indicator");
    jQuery.each(colorcontainers, function(idx, container){
        backupColors.push(jQuery(container).css("background-color"));
    });
    var coloroptions = jQuery(".google-visualization-charteditor-select-series-color");
    jQuery.each(coloroptions, function(idx, option){
        backupOptionColors.push(jQuery(option).css("background-color"));
    });
}

function removeAutomaticColor(root,tree, path){
    if ((tree instanceof Object) || (tree instanceof Array)){
        jQuery.each(tree, function(key, subtree){
            path.push(key);
            if ((key === "color") && (subtree === "eea-automatic-color")){
                delete tree[key];
            }
            else{
                removeAutomaticColor(root,subtree, path);
            }
            path.pop();
        });
    }
/*    else {
        if (tree === "eea-automatic-color"){
            tree = "";
        }
    }*/
}

function validatePointRotation(rotation){
    try {
        if(isNaN(rotation)) {
            throw "Please enter a value betweet 0 and 360 degrees";
        }
        if(rotation > 360) {
            throw "Bigger than 360!Please enter a value betweet 0 and 360 degrees";
        }
        if(rotation < 0) {
            throw "Negative number! Please enter a value betweet 0 and 360 degrees";
        }
    }
    catch(err) {
        alert(err);
        return false;
    }
    return true;
}

function validatePointSides(sides){
    try {
        if(isNaN(sides)) {
            throw "Please enter a numeric positive value representing the number of sides";
        }
        if(sides < 0) {
            throw "Negative number! Please enter a numeric positive value representing the number of sides";
        }
    }
    catch(err) {
        alert(err);
        return false;
    }
    return true;
}

function getValidatedLineDashStyle(value){
    try {
        var values = value.split(',');
        var int_values = [];
        jQuery.each(values, function(idx, val){
            if(isNaN(val)) {
                throw "Please enter only numeric positive integers separated by , (comma)";
            }
            var int_val = parseInt(val, 10);
            if (int_val < 0) {
                throw "Please enter only numeric positive integers separated by , (comma)";
            }
            int_values.push(int_val);
        });
        return int_values;
    }
    catch(err) {
        alert(err);
        return false;
    }
}

function redrawEditorChart() {
    var tmpwrapper = chartEditor.getChartWrapper();
    tmpwrapper.setView();
    var tmpwrapper_json = JSON.parse(tmpwrapper.toJSON());
    delete tmpwrapper_json.options.intervals;
    delete tmpwrapper_json.options.interval;
    delete tmpwrapper_json.options.colors;
    tmpwrapper.setOption("intervals", {});
    tmpwrapper.setOption("interval", {});
    var tmp_chart = jQuery("#googlechartid_tmp_chart");
    var tmp_chart_options = tmp_chart.find(".googlechart_options").attr("value");
    var chartOptions = JSON.parse(tmp_chart_options);
    var dataTable = tmpwrapper_json.dataTable;
    var series = {};

    var def_opt = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value"));
    delete def_opt.options.colors;
    jQuery.each(chartOptions.series || {}, function(name, opt){
        jQuery.each(dataTable.cols, function(idx, col){
            if (def_opt.options.series !== undefined) {
                if (def_opt.options.series[idx] !== undefined) {
                    series[idx] = def_opt.options.series[idx];
                }
            }
            if (col.id === name){
                if (series[idx - 1] !== undefined) {
                    delete opt.lineWidth;
                    delete opt.pointSize;
                    delete opt.errorBars;
/*
                    delete opt.type;
BRANCH DAVIZTRAINING
*/
                    jQuery.extend(true, series[idx - 1], opt);
                } else {
                    series[idx - 1] = opt;
                }
            }
        });
    });
    jQuery.each(series, function(key, value){
        if (chartOptions.series[key] !== undefined){
            value.color = chartOptions.series[key].color;
        }
    });
    jQuery.each(tmpwrapper_json.options.series || {}, function(key, value){
        if ((value) && (value.color)){
            delete value.color;
        }
    });

//    jQuery.extend(true, series, tmpwrapper_json.options.series);
    jQuery.extend(true, chartOptions.series,  series);
    jQuery.extend(true, tmpwrapper_json.options, chartOptions);
    removeAutomaticColor(tmpwrapper_json, tmpwrapper_json, []);
    jQuery.each(tmpwrapper_json.options, function(key, value){
        tmpwrapper.setOption(key,value);
    });

    var row_filters_str = jQuery(".googlechart_row_filters", tmp_chart).attr('value');
    var row_filters = {};
    if (row_filters_str.length > 0){
        row_filters = JSON.parse(row_filters_str);
    }
    var sortBy = jQuery(".googlechart_sortBy", tmp_chart).attr('value');
    var sortAsc_str = jQuery(".googlechart_sortAsc", tmp_chart).attr('value');
    var sortAsc = true;
    if (sortAsc_str === 'desc'){
        sortAsc = false;
    }

    var chartColumns_str = jQuery(".googlechart_columns", tmp_chart).val();

    var chartColumns = {};
    if (chartColumns_str === ""){
        chartColumns.original = {};
        chartColumns.prepared = {};
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    var columnsFromSettings = getColumnsFromSettings(chartColumns);

    var options = {
        originalTable : all_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : getAvailable_columns_and_rows(tmp_chart.data("unpivotsettings"), available_columns, all_rows).available_columns,
        filters: row_filters,
        unpivotSettings : tmp_chart.data("unpivotsettings")
    };

    var transformedTable = transformTable(options);

    tmp_chart.attr("columnproperties", JSON.stringify(transformedTable.properties));

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : sortBy,
        sortAsc : sortAsc,
//        preparedColumns: chartColumns.prepared,
        preparedColumns: chartColumns.prepared,
        enableEmptyRows: JSON.parse(tmp_chart_options).enableEmptyRows
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
    options.chartType = 'editor';

    var settings_str = chartEditor.getChartWrapper().toJSON();
    var settings_json = JSON.parse(settings_str);
    var options_str = jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value");
    var options_json = JSON.parse(options_str);
    var tmp_dataTable = chartEditor.getChartWrapper().getDataTable();

    var tmp_series = {};
    var series_ids = [];
    var isFirst = true;
    for (var i = 0; i < tmp_dataTable.getNumberOfColumns(); i++){
        if ((tmp_dataTable.getColumnRole(i) === "") || (tmp_dataTable.getColumnRole(i) === "data")){
            if (!isFirst){
                series_ids.push(tmp_dataTable.getColumnId(i));
                tmp_series[tmp_dataTable.getColumnId(i)] = {};
            }
            isFirst = false;
        }
    }

    jQuery.each(options_json.series || {}, function(key, value){
        if (isNaN(key)){
            jQuery.extend(true, tmp_series[key], value);
        }
    });
    jQuery.each(settings_json.options.series || {}, function(key, value){
        if (value){
            delete value.lineDashStyle;
            if (value.pointShape !== undefined){
                delete value.pointShape.type;
                delete value.pointShape.rotation;
                delete value.pointShape.sides;
            }
            jQuery.extend(true, tmp_series[series_ids[parseInt(key, 10)]], value);
        }
    });
    jQuery.each(options_json.series || {}, function(key, value){
        if (!isNaN(key)){
            jQuery.extend(true, tmp_series[series_ids[parseInt(key, 10)]], value);
        }
    });

    jQuery.each(tmp_series || {}, function(key, value){
        if (jQuery.isEmptyObject(value)){
            delete tmp_series[key];
        }
    });
    options.errorbars = getErrorbarsFromSeries(tmp_series);
    var tableForChart = prepareForChart(options);

    // workaround for charteditor issue #17629
    for (var col_nr = 0; col_nr < tableForChart.getNumberOfColumns(); col_nr++){
        tableForChart.getColumnProperties(col_nr);
    }
    // end of workaround

    //chart.dataTable = tableForChart;
    tmpwrapper.setDataTable(tableForChart);
    google.visualization.events.addListener(tmpwrapper, 'ready', function(event){
        resizeTableConfigurator(false);
        fixSVG("#google-visualization-charteditor-preview-div-chart");
    });

    google.visualization.events.addListener(tmpwrapper, 'error', function(event){
        if (jQuery("#google-visualization-charteditor-preview-div-chart").find("div[id^='google-visualization-errors']")){
            jQuery("#google-visualization-charteditor-preview-div-chart").html(NiceMessages[chartEditor.getChartWrapper().getType()].split("Here's an example:").join(""));
        }
    });

    tmpwrapper.draw(document.getElementById("google-visualization-charteditor-preview-div-chart"));

    chartWrapper = tmpwrapper;
    updateEditorColors();

}

function setCustomSetting(series, opt, key, value) {
    var options_str = jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value");
    var options_json = JSON.parse(options_str);
    var configJSON = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value"));
    var s_columns = JSON.parse($("#googlechartid_tmp_chart .googlechart_columns").attr("value"));
    var prep_columns = s_columns.prepared;
    var col_id;
    jQuery.each(prep_columns, function(idx, col) {
        if (col.fullname === series) {
            col_id = col.name;
        }
    });
    if (options_json.series === undefined) {
        options_json.series = {};
    }
    if (options_json.series[col_id] === undefined) {
        options_json.series[col_id] = {};
    }
    if (opt === "lineDashStyle") {
        options_json.series[col_id][opt] = value;
    } else {
        if (options_json.series[col_id][opt] === undefined) {
            options_json.series[col_id][opt] = {};
        }
        if (value !== "") {
            options_json.series[col_id][opt][key] = value;
        } else {
            delete options_json.series[col_id][opt][key];
        }
    }
    jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value", JSON.stringify(options_json));
    redrawEditorChart();
}

function updateCustomSettings() {
    var configJSON = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_configjson").attr("value"));
    var chartOptions = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
    var div_sel = jQuery("#google-visualization-charteditor-series-select-div");
    var line_caption = div_sel.find('.charts-flat-menu-button-caption').text();
    var s_columns = JSON.parse($("#googlechartid_tmp_chart .googlechart_columns").attr("value"));
    var prep_columns = s_columns.prepared;
    var col_id;
    var disable_custom = false;
    jQuery.each(prep_columns, function(idx, col) {
        if (col.fullname === line_caption) {
            col_id = col.name;
        }
    });
    var series_settings = jQuery(".google-visualization-charteditor-section-title");
    jQuery("#line-style-input").attr("disabled", false);
    jQuery("#point-sides-input").attr("disabled", false);
    jQuery("#point-shape").attr("disabled", false);
    jQuery("#point-rotation").attr("disabled", false);

    var line_thickness_select = jQuery("#google-visualization-charteditor-series-combo-line-size-series-0").parent();
    var point_size_select = jQuery("#google-visualization-charteditor-series-combo-point-size-series-0").parent();
    var line_disabled = line_thickness_select.children(':visible').attr("aria-disabled");
    var point_disabled = point_size_select.children(':visible').attr("aria-disabled");

    if (line_disabled === "true") {
        if (jQuery("#line-style-input").attr("value") !== "") {
            jQuery("#line-style-input").attr("value", "");
            setCustomSetting(line_caption, "lineDashStyle", '', '');
        }
        jQuery("#line-style-input").attr("disabled", true);
        disable_custom = true;
    }
    if (point_disabled === "true") {
        if (jQuery("#point-sides-input").attr("value") !== "") {
            jQuery("#point-sides-input").attr("value", "");
            setCustomSetting(line_caption, "pointShape", "sides", '');
        }
        jQuery("#point-sides-input").attr("disabled", true);
        if (jQuery("#point-shape").attr("value") !== "") {
            jQuery("#point-shape").attr("value", "");
            setCustomSetting(line_caption, "pointShape", "type", '');
        }
        jQuery("#point-shape").attr("disabled", true);
        if (jQuery("#point-rotation").attr("value") !== "") {
            jQuery("#point-rotation").attr("value", "");
            setCustomSetting(line_caption, "pointShape", "rotation", '');
        }
        jQuery("#point-rotation").attr("disabled", true);
        disable_custom = true;
    }

    if (disable_custom) {
        return;
    }
    var line_style = '';
    var p_options = {};
    if (chartOptions.series !== undefined) {
        if (chartOptions.series[col_id] !== undefined){
            if (chartOptions.series[col_id].lineDashStyle !== undefined) {
                line_style = chartOptions.series[col_id].lineDashStyle;
            }
            if (chartOptions.series[col_id].pointShape !== undefined) {
                p_options = chartOptions.series[col_id].pointShape;
            }
        }
    }
    jQuery("#line-style-input").attr("value", line_style);
    jQuery("#point-sides-input").attr("value", p_options.sides || '');
    var selected_type = p_options.type;
    if (!selected_type) {
        selected_type = "circle";
    }
    jQuery("#point-shape option").filter(function() {
        return jQuery(this).text() == selected_type;
    }).prop('selected', true);
    if (p_options.type === "star" || p_options.type === "polygon") {
        jQuery("#point-sides-input").attr("disabled", false);
    } else {
        jQuery("#point-sides-input").attr("disabled", true);
    }
    jQuery("#point-rotation").attr("value", p_options.rotation || '');
}

function addCustomSettings() {
    var l_style = jQuery('#line-style');
    var p_shape_style = jQuery('#point-style');
    var series_cfg = jQuery("#google-visualization-charteditor-series-items");
    var div_sel = jQuery("#google-visualization-charteditor-series-select-div");
    var line_caption = div_sel.find('.charts-flat-menu-button-caption').text();

    if (!l_style.length) {
        var line_thickness_select = jQuery("#google-visualization-charteditor-series-combo-line-size-series-0").parent();
        var line_gap = line_thickness_select.nextAll('.google-visualization-charteditor-item-gap').first();
        l_style = jQuery('<div>', {
            'class': 'google-visualization-charteditor-section-title charts-inline-block daviz-custom-widget-title',
            'id': 'line-style',
            'text': 'Line style'
        });
        var l_style_float_end = jQuery('<div>', {
            'class': 'google-visualization-charteditor-float-end',
            'id': 'l-style-float-end'
        });
        var l_input = jQuery("<input type='text' id='line-style-input' title='A value of 5,1,3 means a 5-length dash, a 1-length gap, a 3-length dash, a 5-length gap, and so on.'>")
            .addClass("google-visualization-charteditor-mid-input charts-inline-block")
            .appendTo(l_style_float_end);
        var l_style_gap = jQuery('<div>', {
            'class': 'google-visualization-charteditor-item-gap daviz-custom-widget-gap'
        });
        l_input.on("blur", function(evt){
            var valid_values = getValidatedLineDashStyle(this.value);
            if (valid_values) {
                line_caption = div_sel.find('.charts-flat-menu-button-caption').text();
                setCustomSetting(line_caption, "lineDashStyle", '', valid_values);
            }
        });
        line_gap.after(l_style);
        l_style.after(l_style_float_end);
        l_style_float_end.after(l_style_gap);
    }
    if (!p_shape_style.length) {
        var point_size_select = jQuery("#google-visualization-charteditor-series-combo-point-size-series-0").parent();
        var point_gap = point_size_select.nextAll('.google-visualization-charteditor-item-gap').first();
        var shapes = ["circle", "triangle", "square", "diamond", "star", "polygon"];
        p_shape_style = jQuery('<div>', {
            'class': 'google-visualization-charteditor-section-title charts-inline-block daviz-custom-widget-title',
            'id': 'point-style',
            'text': 'Point shape'
        });

        var p_shape_style_float_end = jQuery('<div>', {
            'class': 'google-visualization-charteditor-float-end',
            'id': 'p-style-float-end'
        });

        var p_shape = jQuery("<select id='point-shape'>")
            .css("width", "80px")
            .addClass("charts-select charts-inline-block")
            .appendTo(p_shape_style_float_end);

        jQuery.each(shapes, function (i, item) {
            p_shape.append($('<option>', {
                "value": item,
                "text" : item
            }));
        });

        p_shape.on("change", function(evt) {
            line_caption = div_sel.find('.charts-flat-menu-button-caption').text();
            if (this.value === "star" || this.value === "polygon") {
                jQuery("#point-sides-input").attr("disabled", false);
            } else {
                jQuery("#point-sides-input").attr("disabled", true);
                jQuery("#point-sides-input").attr("value", "");
                setCustomSetting(line_caption, "pointShape", 'sides', "");
            }
            setCustomSetting(line_caption, "pointShape", "type", this.value);
        });

        var p_shape_style_gap = jQuery('<div>', {
            'class': 'google-visualization-charteditor-item-gap daviz-custom-widget-gap'
        });

        point_gap.after(p_shape_style);
        p_shape_style.after(p_shape_style_float_end);
        p_shape_style_float_end.after(p_shape_style_gap);

        var p_shape_sides = jQuery('<div>', {
            'class': 'google-visualization-charteditor-section-title charts-inline-block daviz-custom-widget-title',
            'id': 'point-style-sides',
            'text': 'Point sides'
        });

        var p_shape_sides_float_end = jQuery('<div>', {
            'class': 'google-visualization-charteditor-float-end'
        });

        var p_sides = jQuery("<input type='text' id='point-sides-input' title='Enter the number of sides for the point shape'>")
            .css("width", "25px")
            .addClass("charts-inline-block")
            .appendTo(p_shape_sides_float_end);

        p_sides.on("blur", function(evt){
            if (validatePointSides(this.value)) {
                var sides = parseInt(this.value, 10) || '';
                line_caption = div_sel.find('.charts-flat-menu-button-caption').text();
                setCustomSetting(line_caption, "pointShape", 'sides', sides);
            }
        });

        var p_shape_sides_gap = jQuery('<div>', {
            'class': 'google-visualization-charteditor-item-gap daviz-custom-widget-gap'
        });

        p_shape_style_gap.after(p_shape_sides);
        p_shape_sides.after(p_shape_sides_float_end);
        p_shape_sides_float_end.after(p_shape_sides_gap);

        var p_shape_rotation = jQuery('<div>', {
            'class': 'google-visualization-charteditor-section-title charts-inline-block daviz-custom-widget-title',
            'id': 'point-style-rotation',
            'text': 'Point rotation'
        });

        var p_shape_rotation_float_end = jQuery('<div>', {
            'class': 'google-visualization-charteditor-float-end'
        });

        var p_rotation = jQuery("<input type='text' id='point-rotation' title='Enter a value between 0 and 360 degrees'>")
            .css("width", "25px")
            .addClass("charts-inline-block daviz-custom-widget")
            .appendTo(p_shape_rotation_float_end);

        p_rotation.on("blur", function(evt){
            if (validatePointRotation(this.value)) {
                var rotation = parseInt(this.value, 10) || '';
                line_caption = div_sel.find('.charts-flat-menu-button-caption').text();
                setCustomSetting(line_caption, "pointShape", 'rotation', rotation);
            }
        });

        var p_shape_rotation_gap = jQuery('<div>', {
            'class': 'google-visualization-charteditor-item-gap daviz-custom-widget-gap'
        });
        p_shape_sides_gap.after(p_shape_rotation);
        p_shape_rotation.after(p_shape_rotation_float_end);
        p_shape_rotation_float_end.after(p_shape_rotation_gap);
    }
    updateCustomSettings();

}

function updatePalette(skipColorsAttr) {
    var selectedPaletteId = jQuery("#googlechart_palettes").attr("value");

    jQuery(".googlechart_preview_color").remove();
    var selectedPalette = chartPalettes[selectedPaletteId].colors;
    jQuery(selectedPalette).each(function(idx, color){
        var tmp_color = "<div class='googlechart_preview_color' style='background-color:"+color+"'> </div>";
        jQuery(tmp_color).appendTo("#googlechart_preview_palette");
        jQuery(tmp_color).appendTo("#googlechart_preview_palette_editor");
    });
    var clear = "<div style='clear:both;'> </div>";
    jQuery(clear).appendTo("#googlechart_preview_palette");
    jQuery(clear).appendTo("#googlechart_preview_palette_editor");

    var tmp_chart_options = jQuery("#googlechartid_tmp_chart .googlechart_options");
    var options_str = tmp_chart_options.attr("value");
    var options_json = JSON.parse(options_str);

    var newColors = [];
    jQuery(selectedPalette).each(function(idx, color){
        newColors.push(color);
    });
    if (!skipColorsAttr){
        options_json.colors = newColors;
    }
    var options_str2 = JSON.stringify(options_json);

    var tmp_chart_configjson = JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value"));
    delete tmp_chart_configjson.options.colors;
    jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value", JSON.stringify(tmp_chart_configjson));

    tmp_chart_options.attr("value", options_str2);

    jQuery("#googlechartid_tmp_chart").find(".googlechart_paletteid").attr("value",selectedPaletteId);
    if (chartEditor){
        redrawEditorChart();
    }
}


function addEEACustomGooglechartEditorTab(id, name){
    var div = jQuery("<div>")
        .addClass("google-visualization-charteditor-panel-navigation-cell charts-inline-block charts-tab")
        .attr("aria-selected", "false")
        .attr("role", "tab")
        .text(name)
        .attr("id", "custom-" + id + "-configurator")
        .hover(function(){jQuery(this).addClass("charts-tab-hover");})
        .mouseout(function(){jQuery(this).removeClass("charts-tab-hover");})
        .appendTo("#google-visualization-charteditor-panel-navigate-div")
        .click(function(){
            var selected_panel = jQuery(".panel-container").find(".charts-tab-selected").eq(0);
            jQuery(".google-visualization-charteditor-panel-navigation-cell")
                .removeClass("charts-tab-selected")
                .attr("aria-selected", "false");
            jQuery(this)
                .addClass("charts-tab-selected")
                .attr("aria-selected", "true");
            jQuery(".google-visualization-charteditor-panel")
                .eq(0)
                .empty()
                .addClass("jfk-scrollbar")
                .attr("id", "google-visualization-charteditor-" + id + "-panel");
            selected_panel
                .attr("aria-selected", "true")
                .addClass("charts-tab-selected");
        });
    jQuery(".google-visualization-charteditor-settings-td .google-visualization-charteditor-panel-navigation-cell").click(function(){
        if (jQuery(this).attr("id") !== "custom-" + id + "-configurator"){
            jQuery("#custom-" + id + "-configurator")
                .removeClass("charts-tab-selected")
                .attr("aria-selected", "false");

            jQuery(this)
                .addClass("charts-tab-selected")
                .attr("aria-selected", "true");
        }
    });
    return div;
}

function addPaletteConfig(){
    jQuery("#google-visualization-charteditor-panel-navigate-div br").remove();
    jQuery("<br />")
        .appendTo("#google-visualization-charteditor-panel-navigate-div");
    var section = addEEACustomGooglechartEditorTab("palette", "Color palette");
    section.click(function(){
            var panel = jQuery("#google-visualization-charteditor-palette-panel");
            jQuery("<div>")
                .addClass("google-visualization-charteditor-multi-section-title eea-googlechart-palette-title")
                .text("Palettes")
                .appendTo(panel);

            var section = jQuery("<div>")
                .addClass("google-visualization-charteditor-section")
                .appendTo(panel);

            jQuery("<div>")
                .addClass("google-visualization-charteditor-section-title charts-inline-block")
                .text("Select palette")
                .appendTo(section);

            jQuery("<select>")
                .addClass("eea-googlechart-colorpalettes")
                .addClass("eea-googlechart-colorpalettes-config-value")
                .addClass("eea-googlechart-select")
                .change(function(){
                    jQuery("#googlechart_palettes").attr("value", jQuery(this).attr("value"));
                    updatePalette(false);
                })
                .appendTo(section);

            jQuery("<div>")
                .attr("style", "clear:both;")
                .appendTo(section);

            jQuery.each(chartPalettes, function(key, value){
                jQuery("<option>")
                    .attr("value", key)
                    .text(value.name)
                    .appendTo(".eea-googlechart-colorpalettes");
                });
            jQuery("<div>")
                .attr("id", "googlechart_preview_palette_editor")
                .appendTo(section);
            jQuery(".eea-googlechart-colorpalettes-config-value").attr("value", jQuery("#googlechart_palettes").attr("value"));
            if (JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value")).chartType !== "PieChart"){
                updatePalette(false);
            }
            else {
                updatePalette(true);
            }
    });
}

function addIntervalConfig(){
    var section = addEEACustomGooglechartEditorTab("interval", "Intervals");

    section.click(function(){
            var panel = jQuery("#google-visualization-charteditor-interval-panel");
            function addSection(section, name){
                function addSelect(section, sectionname, title, name, values){
                    jQuery("<div>")
                        .addClass("google-visualization-charteditor-section-title charts-inline-block")
                        .text(title)
                        .appendTo(section);
                    jQuery("<select>")
                        .addClass("eea-googlechart-intervals-" + name)
                        .addClass("eea-googlechart-intervals-config-value")
                        .addClass("eea-googlechart-" + sectionname)
                        .addClass("eea-googlechart-select")
                        .appendTo(section);
                    jQuery("<div>")
                        .attr("style", "clear:both;")
                        .appendTo(section);

                    jQuery.each(values, function(idx, value){
                        jQuery("<option>")
                            .attr("value", value)
                            .text(value)
                            .appendTo(".eea-googlechart-"+sectionname+".eea-googlechart-intervals-" + name);
                    });
                }
                function addInput(section, sectionname, title, name){
                    jQuery("<div>")
                        .addClass("google-visualization-charteditor-section-title charts-inline-block")
                        .text(title)
                        .appendTo(section);
                    jQuery("<input type='text'>")
                        .addClass("eea-googlechart-intervals-" + name)
                        .addClass("eea-googlechart-intervals-config-value")
                        .addClass("eea-googlechart-" + sectionname)
                        .appendTo(section);

                    jQuery("<div>")
                        .attr("style", "clear:both;")
                        .appendTo(section);
                }
                function addColorField(section, sectionname, title, name){
                    jQuery("<div>")
                        .addClass("google-visualization-charteditor-section-title charts-inline-block")
                        .text(title)
                        .appendTo(section);
                    var colorcontainer = jQuery("<div>")
                        .addClass("eea-googlechart-intervals-" + name)
                        .addClass("eea-googlechart-intervals-config-value")
                        .addClass("eea-googlechart-" + sectionname)
                        .addClass("charts-inline-block")
                        .attr("title","Automatic")
                        .appendTo(section);
                    jQuery("<div>")
                        .addClass("charts-flat-menu-button-indicator")
                        .appendTo(colorcontainer);
                    jQuery("<div>")
                        .addClass("eea-icon eea-icon-caret-down")
                        .appendTo(colorcontainer);
                }
                var styles = ["auto", "line", "bar", "boxes", "sticks", "points", "area"];
                var pixels = ["auto", "0px", "1px", "2px", "3px", "4px", "5px", "6px", "7px", "8px", "9px", "10px"];
                var opacities = ["auto", "0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1"];
                var curvetypes = ["auto", "function"];

                addSelect(section, name, "Style", "style", styles);
                var subsection = jQuery("<div>")
                    .addClass("eea-googlechart-" + name + "-settings")
                    .appendTo(section)
                    .hide();

                addSelect(subsection, name, "Line thickness", "linewidth", pixels);
                addInput(subsection, name, "Bar thickness", "barwidth");
                addSelect(subsection, name, "Point size", "pointsize", pixels);
                addInput(subsection, name, "Box width", "boxwidth");
                addSelect(subsection, name, "Fill opacity", "fillopacity", opacities);
                addSelect(subsection, name, "Curve type", "curvetype", curvetypes);
                addColorField(subsection, name, "Color", "color");
            }
            function setValuesForSection(name, interval){
                var style = interval.style || 'auto';
                var linewidth = interval.lineWidth;
                if (linewidth === undefined){
                    linewidth = 'auto';
                }
                else {
                    linewidth = linewidth.toString() + "px";
                }
                var barwidth = interval.barWidth || '';
                var pointsize = interval.pointSize;
                if (pointsize === undefined){
                    pointsize = 'auto';
                }
                else {
                    pointsize = pointsize.toString() + "px";
                }
                var boxwidth = interval.boxWidth || '';
                var fillopacity = interval.fillOpacity;
                if (fillopacity === undefined){
                    fillopacity = 'auto';
                }

                var curvetype = interval.curveType;
                if (curvetype === undefined){
                    curvetype = 'auto';
                }

                var color = interval.color;
                colorTitle = color;
                if (colorTitle === undefined){
                    colorTitle = 'Automatic';
                    color = "#FFFFFF";
                }

                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-style").attr("value", style);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-linewidth").attr("value", linewidth);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-barwidth").attr("value", barwidth);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-pointsize").attr("value", pointsize);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-boxwidth").attr("value", boxwidth);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-fillopacity").attr("value", fillopacity);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-curvetype").attr("value", curvetype);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-color")
                    .attr("title", colorTitle);
                jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-color").find(".charts-flat-menu-button-indicator")
                    .css("background-color", color);
            }
            function getValuesForSection(name){
                var style = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-style").attr("value");
                var linewidth = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-linewidth").attr("value");
                var barwidth = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-barwidth").attr("value");
                var pointsize = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-pointsize").attr("value");
                var boxwidth = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-boxwidth").attr("value");
                var fillopacity = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-fillopacity").attr("value");
                var curvetype = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-curvetype").attr("value");
                var color = jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-color").attr("title");
                var interval = {};
                if (style !== "auto"){
                    interval.style = style;
                    if (linewidth !== "auto"){
                        interval.lineWidth = parseInt(linewidth, 10);
                    }
                    if (barwidth !== ""){
                        interval.barWidth = parseFloat(barwidth);
                        jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-barwidth").attr("value", parseFloat(barwidth));
                    }
                    if (pointsize !== "auto"){
                        interval.pointSize = parseInt(pointsize, 10);
                    }
                    if (boxwidth !== ""){
                        interval.boxWidth = parseFloat(boxwidth);
                        jQuery(".eea-googlechart-" + name + ".eea-googlechart-intervals-boxwidth").attr("value", parseFloat(boxwidth));
                    }
                    if (fillopacity !== "auto"){
                        interval.fillOpacity = parseFloat(fillopacity);
                    }
                    if (curvetype !== "auto"){
                        interval.curveType = curvetype;
                    }

                    if (color !== "Automatic"){
                        interval.color = color;
                    }
                }
                return interval;
            }
            jQuery("<div>")
                .addClass("google-visualization-charteditor-multi-section-title")
                .text("Global settings")
                .appendTo(panel);
            var section = jQuery("<div>")
                .addClass("google-visualization-charteditor-section")
                .appendTo(panel);
            jQuery("<div>")
                .addClass("google-visualization-charteditor-multi-section-gap")
                .appendTo(panel);
            jQuery("<div>")
                .addClass("google-visualization-charteditor-multi-section-gap")
                .appendTo(panel);
            addSection(section, "global");

            jQuery("<div>")
                .addClass("google-visualization-charteditor-multi-section-title eea-googlechart-intervals-column-title eea-googlechart-custom-column-title")
                .appendTo(panel);
            jQuery("<div>")
                .text("Columns")
                .appendTo(".eea-googlechart-intervals-column-title");

            jQuery("<select>")
                .addClass("google-visualization-charteditor-multi-section-chooser")
                .addClass("eea-googlechart-intervals-column-selector")
                .appendTo(".eea-googlechart-intervals-column-title")
                .change(function(){
                    jQuery(".eea-googlechart-column-section")
                        .removeClass("active");

                    jQuery(".eea-googlechart-column-" + jQuery(this).attr("value"))
                        .addClass("active");
                });

            var chartColumns_str = jQuery("#googlechartid_tmp_chart .googlechart_columns").val();

            var chartColumns = {};
            if (chartColumns_str === ""){
                chartColumns.original = {};
                chartColumns.prepared = {};
            }
            else{
                chartColumns = JSON.parse(chartColumns_str);
            }

            var intervalColumns = [];
            jQuery.each(chartColumns.prepared, function(idx, prepared_column){
                if ((prepared_column.role === 'interval') && (prepared_column.status === 1)){
                    intervalColumns.push({"name":prepared_column.name, "label":prepared_column.fullname});
                }
            });

            for (var i = 0; i < intervalColumns.length; i++){
                jQuery("<option>")
                    .attr("value", intervalColumns[i].name)
                    .text(intervalColumns[i].label)
                    .appendTo(".eea-googlechart-intervals-column-selector");

                section = jQuery("<div>")
                    .addClass("google-visualization-charteditor-section")
                    .addClass("eea-googlechart-column-section")
                    .addClass("eea-googlechart-column-" + intervalColumns[i].name)
                    .appendTo(panel);

                addSection(section, intervalColumns[i].name);
            }
            jQuery(".eea-googlechart-intervals-column-selector").trigger("change");
            jQuery(".eea-googlechart-select").focus(function(){
                jQuery(".eea-googlechart-intervals-color.selected")
                    .removeClass("selected");
                jQuery(".eea-googlechart-intervals-colorpalette").remove();
            });

            jQuery(".eea-googlechart-intervals-color").click(function(evt){
                var colorcontainer = jQuery(this);
                jQuery(".eea-googlechart-intervals-colorpalette").remove();
                var parentleft = jQuery(".googlecharts-customdialog").offset().left;
                var parenttop = jQuery(".googlecharts-customdialog").offset().top;
                var left = jQuery(this).offset().left;
                var top = jQuery(this).offset().top;
                jQuery(":focus").blur();
                jQuery("<div>")
                    .addClass("eea-googlechart-intervals-colorpalette")
                    .offset({top:top - parenttop + 28, left:left-parentleft})
                    .css("z-index", 99999)
                    .appendTo(".googlecharts-customdialog");
                var grayscale = ["rgb(0, 0, 0)",
                                "rgb(67, 67, 67)",
                                "rgb(102, 102, 102)",
                                "rgb(153, 153, 153)",
                                "rgb(183, 183, 183)",
                                "rgb(204, 204, 204)",
                                "rgb(217, 217, 217)",
                                "rgb(239, 239, 239)",
                                "rgb(243, 243, 243)",
                                "rgb(255, 255, 255)"];
                for (var i = 0; i < 10; i++){
                    jQuery("<div>")
                        .attr("title", grayscale[i])
                        .css("background-color", grayscale[i])
                        .addClass("eea-googlechart-intervals-palette-color")
                        .addClass("eea-googlechart-intervals-palette-color-clickable")
                        .appendTo(".eea-googlechart-intervals-colorpalette");
                }
                jQuery("<div>")
                    .attr("style", "clear:both")
                    .css("margin-bottom", "3px")
                    .appendTo(".eea-googlechart-intervals-colorpalette");
                var selectedPaletteId = jQuery("#googlechart_palettes").attr("value");
                var selectedPalette = chartPalettes[selectedPaletteId].colors;
                var colorcount = 0;
                for (i = 0; i < selectedPalette.length; i++){
                    jQuery("<div>")
                        .attr("title", selectedPalette[i])
                        .css("background-color", selectedPalette[i])
                        .addClass("eea-googlechart-intervals-palette-color")
                        .addClass("eea-googlechart-intervals-palette-color-clickable")
                        .appendTo(".eea-googlechart-intervals-colorpalette");
                    colorcount++;
                    if (colorcount === 10){
                        colorcount = 0;
                        jQuery("<div>")
                            .attr("style", "clear:both")
                            .appendTo(".eea-googlechart-intervals-colorpalette");
                    }
                }
                jQuery("<div>")
                    .attr("style", "clear:both")
                    .css("margin-bottom", "3px")
                    .appendTo(".eea-googlechart-intervals-colorpalette");

                jQuery("<div>")
                    .attr("title", "Automatic")
                    .text("Automatic")
                    .addClass("eea-googlechart-intervals-palette-color-auto")
                    .addClass("eea-googlechart-intervals-palette-color-clickable")
                    .appendTo(".eea-googlechart-intervals-colorpalette");

                jQuery("<div>")
                    .attr("style", "clear:both")
                    .appendTo(".eea-googlechart-intervals-colorpalette");
                jQuery(".eea-googlechart-intervals-palette-color-clickable").click(function(){
                    jQuery(".eea-googlechart-intervals-color.selected").find(".charts-flat-menu-button-indicator")
                        .css("background-color", jQuery(this).css("background-color"));
                    jQuery(".eea-googlechart-intervals-color.selected")
                        .attr("title", jQuery(this).attr("title"))
                        .removeClass("selected");
                    jQuery(".eea-googlechart-intervals-colorpalette").remove();
                    jQuery(".eea-googlechart-intervals-config-value").eq(0).trigger("change");
                });

            });

            jQuery(".google-visualization-charteditor-panel").click(function(evt){
                if (jQuery(evt.target).closest(".eea-googlechart-intervals-color").length === 0){
                    jQuery(".eea-googlechart-intervals-colorpalette").remove();
                }
                jQuery(".eea-googlechart-intervals-color.selected")
                    .removeClass("selected");
                jQuery(evt.target).closest(".eea-googlechart-intervals-color")
                    .addClass("selected");
            });

            jQuery(".eea-googlechart-intervals-config-value").change(function(){
                var options = JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value"));
                delete options.intervals;
                options.interval = {};
                var globalinterval = getValuesForSection("global");
                if (globalinterval.style !== undefined){
                    jQuery(".eea-googlechart-global-settings")
                        .show();
                    options.intervals = globalinterval;
                }
                else{
                    jQuery(".eea-googlechart-global-settings")
                        .hide();
                }
                for (var i = 0; i < intervalColumns.length; i++){
                    var interval = getValuesForSection(intervalColumns[i].name);
                    if (interval.style !== undefined){
                        jQuery(".eea-googlechart-" + intervalColumns[i].name + "-settings")
                            .show();
                        options.interval[intervalColumns[i].name] = interval;
                    }
                    else{
                        jQuery(".eea-googlechart-" + intervalColumns[i].name + "-settings")
                            .hide();
                    }
                }
                jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value", JSON.stringify(options));
                redrawEditorChart();

            });

            var options = JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value"));
            setValuesForSection("global", options.intervals || {});

            jQuery.each(options.interval || {}, function(name, settings){
                setValuesForSection(name, settings || {});
            });

            jQuery(".eea-googlechart-intervals-config-value").eq(0).change();
        });
}

resizeTableConfigurator = function(forced){
    if ((jQuery(".googlechart_table_config_scaleable_maximized").length > 0) || forced){
        var fullwidth = jQuery(".googlecharts-customdialog").width();
        var fullheight = jQuery(".googlecharts_columns_config").height();
        var chart_preview = jQuery(".google-visualization-charteditor-preview-td");
        var newTable = jQuery("#newTable");
        var offset = jQuery(".googlechart_table_config_scaleable").offset();
        var helper = jQuery(".googlechart_chart_config_info.hint");
        var helperheight = helper.height() + parseFloat(helper.css("margin-top")) + parseFloat(helper.css("margin-bottom")) + parseFloat(helper.css("padding-top")) + parseFloat(helper.css("padding-bottom"));

        var container_heightstr = 'height:'+(fullheight - helperheight - 50)+'px;width:'+(fullwidth-340)+'px;';
        jQuery(".googlechart_table_config_scaleable").attr("style",container_heightstr);
        var panel = jQuery(".panel-container");
        jQuery(".googlechart_table_config_scaleable").offset({top:panel.offset().top + 5 + panel.height(), left: panel.offset().left});

        var accordion_heightstr = 'height:'+(fullheight-helperheight)+'px;width:'+(fullwidth-340)+'px;';
        var accordion_container_heightstr = 'height:'+(fullheight-helperheight)+'px;width:'+(fullwidth-340)+'px;';
        jQuery(".googlechart_accordion_table").attr("style",accordion_heightstr);
        jQuery(".googlechart_accordion_container").attr("style",accordion_container_heightstr);
        newTable.height(newTable.parent().height() - (newTable.offset().top - newTable.parent().offset().top) - 100);
        grid.resizeCanvas();
    }
};

var shouldListenErrorEvent;

function openEditor(elementId) {
    shouldListenErrorEvent = true;
    isFirstEdit = true;
    jQuery(".google-visualization-charteditor-dialog").remove();
//    chartId = elementId;
    chartId = "tmp_chart";
    var chartObj = jQuery("#googlechartid_"+elementId);
    var title = chartObj.find(".googlechart_name").attr("value");

    var wrapperString = chartObj.find(".googlechart_configjson").attr('value');

    var chartOptions = chartObj.find(".googlechart_options").attr('value');

    var chart;
    var wrapperJSON;
    var cleanChartOptions = {};
    jQuery.extend(true, cleanChartOptions, JSON.parse(chartOptions));

    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
        jQuery.extend(true, chart.options, cleanChartOptions);
    }
    else{
        chart = defaultChart;
    }
    removeAutomaticColor(chart, chart, []);
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

    var shouldAddIntervalsToEditor = false;
    var chartColumnsForEditor = {};
    jQuery.extend(true, chartColumnsForEditor, chartColumns);
    jQuery.each(chartColumnsForEditor.prepared, function(idx, prepared_column){
        if (prepared_column.role === 'old-data'){
            prepared_column.status = 0;
        }

        if (prepared_column.role === 'style'){
            prepared_column.status = 0;
        }

        if (prepared_column.role === 'annotation'){
            prepared_column.status = 0;
        }

        if (prepared_column.role === 'annotationText'){
            prepared_column.status = 0;
        }

        if ((prepared_column.role === 'interval') && (prepared_column.status === 1)){
            shouldAddIntervalsToEditor = true;
            prepared_column.status = 0;
        }
    });

    var columnsFromSettings = getColumnsFromSettings(chartColumnsForEditor);

    var options = {
        originalTable : all_rows,
        normalColumns : columnsFromSettings.normalColumns,
        pivotingColumns : columnsFromSettings.pivotColumns,
        valueColumn : columnsFromSettings.valueColumn,
        availableColumns : getAvailable_columns_and_rows(jQuery("#googlechartid_tmp_chart").data("unpivotsettings"), available_columns, all_rows).available_columns,
        filters: row_filters,
        unpivotSettings : jQuery("#googlechartid_tmp_chart").data("unpivotsettings")
    };

    var transformedTable = transformTable(options);

    jQuery("#googlechartid_tmp_chart").attr("columnproperties", JSON.stringify(transformedTable.properties));

    options = {
        originalDataTable : transformedTable,
        columns : columnsFromSettings.columns,
        sortBy : sortBy,
        sortAsc : sortAsc,
//        preparedColumns: chartColumns.prepared,
        preparedColumns: chartColumnsForEditor.prepared,
        enableEmptyRows: JSON.parse(chartObj.find(".googlechart_options").attr("value")).enableEmptyRows
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
    options.chartType = 'editor';
    var tableForChart = prepareForChart(options);

    // workaround for charteditor issue #17629
    var cols = [];
    for (var i = 0; i < tableForChart.getNumberOfColumns(); i++){
        tableForChart.getColumnProperties(i);
        cols.push(tableForChart.getColumnId(i));
    }
    // end of workaround

    chart.dataTable = tableForChart;

    chart.options.title = title;
    chart.options.allowHtml = true;
    chart.options.series = chart.options.series || [];

    jQuery.each(cleanChartOptions.series || {}, function(name, opt){
        jQuery.each(cols, function(idx, col){
            if (col === name){
                if (chart.options.series[idx - 1] !== undefined) {
                    jQuery.extend(true, chart.options.series[idx - 1], opt);
                } else {
                    chart.options.series[idx - 1] = opt;
                }
            }
        });
    });
    chartWrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);

    function addHelperDisplay(chartEditor){

      var readyListener = null;
      var readyCalled = false;
      var firstClick = true;

      /* Since the API does not reveal a way to retrieve the
         data mismatch messages the following workaround is used

         the google_charts_* variables defined here may change in
         the obfuscated and minified version of the API.
      */

      var google_charts_class = "Hh";
      var google_charts_function = null;

      function get_google_charts_function(){
        /* parse the google_charts_class object and find the correct function based on it's code
          (this is needed because the function name changes based on the active locale)
        */
        var the_object = chartEditor[google_charts_class];
        var keys = [];
        for (var key in the_object) {
          if (the_object.hasOwnProperty(key)){
            keys.push(key);
          }
        }
        for (var i=0; i<keys.length && i<keys.length; i++) {
          if(!the_object){
            continue;
          }

          try{
            var to_string = the_object[keys[i]].toString();
            if (to_string.indexOf("$7(this.l,") != -1){
              return keys[i];
            }
          }
          catch(err){
            continue;
          }
        }
      }

      var google_charts_target = "l";

      var mismatchInfoDisplay = function(){
        var elem = jQuery("#mismatchInfoDisplay");
        if(elem.length === 0){
          elem = jQuery("<div>").attr("id", "mismatchInfoDisplay");
          jQuery(".googlechart_chart_config_info.hint").append(elem);
        }
        return elem;
      }();

      mismatchInfoDisplay.on("DOMSubtreeModified", function(){
        repositionDataTab();
      });

      function hideEmptyThumbnail(){
        var thumb = jQuery("#google-visualization-charteditor-preview-mismatch-thumbnail");
        var thumb_background = thumb.css("background");

        if(thumb_background.indexOf("url") === -1){
          thumb.hide();
        }
      }

      function displayWarningSign(ev_type){
        if(ev_type === "error"){
          var warning_sign = jQuery("<div>&#9888;</div>");
          warning_sign.css({
            "font-size": "250px",
            "text-align": "center",
            "line-height": "300px"
          });
          jQuery("#google-visualization-charteditor-preview-div-chart").html(warning_sign);
        }
      }

      function restyleMismatchMessage(){
        jQuery(".google-visualization-charteditor-data-mismatch").css("padding", 0);
        var header = jQuery(".google-visualization-charteditor-data-mismatch-header");
        header.css({
          "margin-left": 0,
          "margin-top": "10px"
        });

        // remove "data doens't match" text
        header.next().next().remove();
        header.next().remove();

        mismatchInfoDisplay.css("width", "100%");
      }

      function finalCleanup(ev_type){
        hideEmptyThumbnail();
        displayWarningSign(ev_type);
        restyleMismatchMessage();
      }

      var repositionDataTab = function(){
        var panel_container = jQuery(".panel-container");
        var panel_container_height = panel_container.height();
        var panel_container_offset = panel_container.offset();
        panel_container_offset.top += panel_container_height + 5;
        jQuery(".googlechart_table_config_scaleable").offset(panel_container_offset);
      };

      var handleClick = function(ev_type){

        var chartType = chartEditor.getChartWrapper().getChartType();
        if(chartType === "Table" || chartType === "ImageChart"){
            hideMismatchData();
            return;
        }


        /* the google_charts_class may not be initialized at
           the time we initialize the event handler so the
           google_charts_function can not be retrieved.
           This makes sure that it is found out as soon as possible.
        */
        if(google_charts_function === null && chartEditor[google_charts_class]){
          google_charts_function = get_google_charts_function();
        }

        // display the expand/collapse and the mismatch information elements
        showMismatchData();

        // disable save validation (as fetching the mismatch data will always trigger an error event)
        shouldListenErrorEvent = false;

        // remove the listener that triggered this handler as the mismatch data fetching will re-trigger it
        google.visualization.events.removeListener(readyListener);

        // avoid handling the "error" event if we triggered it
        readyCalled = true;

        // save the original mismatch data target and set it to our own element
        var oldEditorTarget = jQuery(chartEditor[google_charts_class][google_charts_target]);
        chartEditor[google_charts_class][google_charts_target] = mismatchInfoDisplay.get(0);

        // fetch mismatch data and do final cleanup
        jQuery.when(chartEditor[google_charts_class][google_charts_function](chartType)).then(function(){
          readyListener = google.visualization.events.addListener(chartEditor, 'ready', handleClick);
          readyCalled = false;
          finalCleanup(ev_type);
        });

        /* reset the mismatch data target to the original and resize the
           configuration table (needed for when the "Data selection for chart"
           tab is selected)
        */
        chartEditor[google_charts_class][google_charts_target] = oldEditorTarget.get(0);
        resizeTableConfigurator(true);

        if(firstClick){
          firstClick = false;
          if(expandCollapse.hasClass("eea-icon-caret-down")){
            setTimeout(function(){
              expandCollapse.click();
            }, 600);
          }
        }

      };

      function expandCollapseMismatch(){
        var expandCollapse = jQuery("#expandCollapseMismatch");
        if(expandCollapse.length === 0){
          expandCollapse = jQuery('<div id="expandCollapseMismatch" class="eea-icon-lg eea-icon eea-caret-icon eea-icon-caret-down"><span class="ex_text">Show/hide details</span></div>');
          expandCollapse.on("click", function(){
              var self = jQuery(this);
              self.toggleClass("eea-icon-caret-down");
              self.toggleClass("eea-icon-caret-right");
              mismatchInfoDisplay.fadeToggle();
              repositionDataTab();
              resizeTableConfigurator(true);
          });
          mismatchInfoDisplay.before(expandCollapse);
          expandCollapse.find(".ex_text").css({
            "font-size": "small",
            "cursor": "pointer"
          });
          expandCollapse.hide();
        }
        return expandCollapse;
      }
      var expandCollapse = expandCollapseMismatch();

      function showMismatchData(){
        if(!expandCollapse.is(":visible")){
          expandCollapse.show();
          mismatchInfoDisplay.show();
        }
      }

      function hideMismatchData(){
        mismatchInfoDisplay.hide();
        expandCollapse.hide();
      }

      readyListener = google.visualization.events.addListener(chartEditor, 'ready', function(){
          handleClick();
      });
      google.visualization.events.addListener(chartEditor, 'error', function(){
          if(!readyCalled){
            handleClick("error");
            }
          });
    }

    google.visualization.events.addListener(chartEditor, 'ready', function(event){
        jQuery(".panel-container").show();
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = true;
        setTimeout(function(){
            redrawEditorChart();
        },100);
        jQuery(".googlechart_editor_loading").addClass("googlechart_editor_loaded");
        jQuery(".googlechart_palette_loading").removeClass("googlechart_palette_loading");

//        verificare json daca errorbar a fost adaugat, daca da, adauga 2 coloane cu rol
    });

    google.visualization.events.addListener(chartEditor, 'error', function(event){
        jQuery(".panel-container").show();
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = true;
        jQuery(".googlechart_editor_loading").addClass("googlechart_editor_loaded");
        jQuery(".googlechart_palette_loading").removeClass("googlechart_palette_loading");
    });
    moveIfFirst();

    try{
      addHelperDisplay(chartEditor);
    }
    catch(err){
      // can't initialize helper
    }
    setTimeout(function(){
        jQuery("#custom-palette-configurator").remove();
        jQuery("#custom-interval-configurator").remove();
        chartEditor.openDialog(chartWrapper, {});
        addPaletteConfig();
        if (shouldAddIntervalsToEditor){
            addIntervalConfig();
        }
        checkReadyForSparklines(false);
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
                if (((newColumn.name === prevColumn.name) || (newColumn.name.indexOf(prevColumn.name+"_") === 0)) && (prevColumn.hasOwnProperty("role"))){
                    newColumn.role = prevColumn.role;
                }
                if (((newColumn.name === prevColumn.name) || (newColumn.name.indexOf(prevColumn.name+"_") === 0)) && (prevColumn.hasOwnProperty("customTooltip"))){
                    newColumn.customTooltip = prevColumn.customTooltip;
                }
            });
        });
        var columns_str = JSON.stringify(columnsSettings);
        jQuery("#googlechartid_tmp_chart .googlechart_columns").val(columns_str);
    }
    openEditor("tmp_chart");
}

var pivotPreviewStructure = [];

function buildPivotsTree(parent, columns, level){
    var nodesCount;
    var node = {
        node: parent,
        nodesCount: 0,
        nodes : []
    };
    if (pivotPreviewStructure.length < level){
        pivotPreviewStructure.push([]);
    }
    jQuery.each(columns, function(key, value){
        var tmp_node = buildPivotsTree(key, value, level + 1);
        node.nodes.push(tmp_node);
        node.nodesCount += tmp_node.nodesCount;
    });
    if (node.nodesCount === 0){
        node.nodesCount = 1;
    }
    pivotPreviewStructure[level-1].push({node: node.node, nodesCount:node.nodesCount});
    return node;
}


function populatePivotPreviewTable(columns){
    pivotPreviewStructure = [];
    var countedPivots = buildPivotsTree("root", columns, 1);
    var table_obj = jQuery("<table>");
    jQuery.each(pivotPreviewStructure, function(row_nr, row){
        if (row_nr === 0){
            return;
        }
        var row_obj = jQuery("<tr>")
                        .addClass("titleRowForPivot")
                        .appendTo(table_obj);
        var head_col = jQuery("<td>").appendTo(row_obj);
        jQuery("#pivots").find(".pivotedColumn").first().appendTo(head_col);
        jQuery.each(row,function(col_nr, col){
            jQuery("<td>")
                .attr("colspan", col.nodesCount)
                .text(col.node)
                .appendTo(row_obj);
        });
    });
    return table_obj[0];
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
        availableColumns : getAvailable_columns_and_rows(jQuery("#googlechartid_tmp_chart").data("unpivotsettings"), available_columns, all_rows).available_columns,
//        filters : row_filters
        unpivotSettings : jQuery("#googlechartid_tmp_chart").data("unpivotsettings")
    };

    var transformedTable = transformTable(options);
    var tmpSortOrder = [];
    jQuery.each(transformedTable.available_columns,function(col_key, col){
        tmpSortOrder.push([col_key, "visible"]);
    });
    if (typeof(sortOrder) === 'undefined'){
        isDefault = true;
        var i;
        for (i = 0; i < tmpSortOrder.length; i++){
            if (jQuery.inArray(tmpSortOrder[i][0], available_columns_ordered) === -1){
                isDefault = false;
            }
        }
        if (isDefault){
            var newTmpSortOrder = [];
            for (i = 0; i < available_columns_ordered.length; i++){
                for (var j = 0; j < tmpSortOrder.length; j++){
                    if (available_columns_ordered[i] === tmpSortOrder[j][0]){
                        newTmpSortOrder.push(tmpSortOrder[j]);
                    }
                }
            }
            tmpSortOrder = newTmpSortOrder;
        }
    }
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

    return transformedTable.pivotLevels;
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
    jQuery(".pivotsPreviewTable").remove();
    var pivotsHtml = "<div id='pivots'>";
    jQuery.each(columnsForPivot,function(key, value){
        var originalColumn = jQuery("#originalColumns").find("[column_id='"+key+"']").find("select");
        if (value.status === 1){
            valueColumn = value.nr;
            jQuery(originalColumn).attr("value",3);
        }
        if (value.status === 2){
            pivots.push(value.nr);
            pivotsHtml += "<div class='pivotedColumn'>"+value.name+"<a style='float:right' href='#' onclick='removePivot(event, "+value.nr+")'><span title='Delete pivot' class='eea-icon eea-icon-trash-o'></span></a></div><div style='clear:both'></div>";
            jQuery(originalColumn).attr("value",2);
        }
        if (value.status === 3){
            hidden.push(value.nr);
            jQuery(originalColumn).attr("value",0);
        }
    });
    pivotsHtml += "</div>";
    pivotsHtml += "<table class='pivotsPreviewTable'></table>";
    pivotsHtml += "<div style='clear:both'></div>";
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
        var pivoticonflag = jQuery(".columnheader [columnnr='"+columnnr+"']").find(".pivothidecolumn");
        pivoticonflag.removeClass("eea-icon-placeholder").removeClass("eea-icon-eye").removeClass("eea-icon-eye-slash");
        if (jQuery.inArray(columnnr, hidden) !== -1){
            pivoticonflag.addClass("eea-icon-eye-slash");
            hideDropZone(columnnr);
        }
        else {
            if (columnnr !== valueColumn){
                pivoticonflag.addClass("eea-icon-eye");
            }
            else {
                pivoticonflag.addClass("eea-icon-placeholder");
            }
        }
    });
}

function removePivot(event, nr){
    event.preventDefault();
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
    var pivotLevels = generateNewTable();
    jQuery.each(pivotLevels, function(key, value){
        jQuery(populatePivotPreviewTable(value)).appendTo(".pivotsPreviewTable");
    });

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
    jQuery("#pivotConfigHeader").empty();
    jQuery("#pivotConfigDropZones").empty();
    var defaultCols = true;
    jQuery.each(columnsForPivot, function(key, value){
        if (jQuery.inArray(key, available_columns_ordered) === -1){
            defaultCols = false;
        }
    });
    var cols = available_columns_ordered;
    if (!defaultCols){
        cols = [];
        jQuery.each(columnsForPivot,function(key, value){
            cols.push(key);
        });
    }
    for (var i = 0; i < cols.length; i++){
        var value = columnsForPivot[cols[i]];
        var th =
                "<th class='columnheader' columnnr='"+value.nr+"'>"+
                "<div class='draggable' columnnr='"+value.nr+"'>"+
                  "<div style='float:right' class='pivothidecolumn daviz-menuicon eea-icon eea-icon-placeholder'><!-- --></div>"+
                  "<div style='margin-right:30px;'>"+ value.name + "</div>" +
                "</div>"+
                "</th>";
        jQuery(th).appendTo(jQuery("#pivotConfigHeader"));
        var td =
                "<td class='columnpivot' columnnr='"+value.nr+"'>"+
                "<div class='droppable' columnnr='"+value.nr+"'>Drop here pivoting column</div>"+
                "</td>";
        jQuery(td).appendTo(jQuery("#pivotConfigDropZones"));
    }

    jQuery(".pivotGooglechartTable .eea-icon").click(function(){
        var col_nr =  parseInt(jQuery(this).parent().attr("columnnr"), 10);
        var column;
        jQuery.each(columnsForPivot,function(key, value){
            if (value.nr === col_nr){
                column = value;
            }
        });
        if (jQuery(this).hasClass("eea-icon-eye")){
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
        var pivotLevels = generateNewTable();
        jQuery.each(pivotLevels, function(key, value){
            jQuery(populatePivotPreviewTable(value)).appendTo(".pivotsPreviewTable");
        });
    });
}

var editorDialog;

function chartEditorSave(id){
    if (!editedChartStatus){
        alert("Chart is not properly configured");
        return;
    }
    var unpivotsettings = jQuery("#googlechartid_tmp_chart").data("unpivotsettings");
    var settings_str = chartEditor.getChartWrapper().toJSON();
    var tmp_dataTable = chartEditor.getChartWrapper().getDataTable();
    chartEditor.closeDialog();
    var columnsSettings = {};
    columnsSettings.original = [];
    columnsSettings.prepared = [];
    var hasNormal = false;
    var hasPivot = false;
    var hasValue = false;
    var tmpPreparedColumns = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_columns").attr("value")).prepared;
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
                    if (tmpPreparedColumn.hasOwnProperty("role")){
                        preparedColumn.role = JSON.parse(JSON.stringify(tmpPreparedColumn.role));
                    }
                    if (tmpPreparedColumn.hasOwnProperty("customTooltip")){
                        preparedColumn.customTooltip = JSON.parse(JSON.stringify(tmpPreparedColumn.customTooltip));
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
    var options_str = jQuery("#googlechartid_tmp_chart .googlechart_options").attr("value");
    var options_json = JSON.parse(options_str);
    var tmp_series = {};
    var series_ids = [];
    var isFirst = true;
    for (var i = 0; i < tmp_dataTable.getNumberOfColumns(); i++){
        if ((tmp_dataTable.getColumnRole(i) === "") || (tmp_dataTable.getColumnRole(i) === "data")){
            if (!isFirst){
                series_ids.push(tmp_dataTable.getColumnId(i));
                tmp_series[tmp_dataTable.getColumnId(i)] = {};
            }
            isFirst = false;
        }
    }

    jQuery.each(options_json.series || {}, function(key, value){
        if (isNaN(key)){
            jQuery.extend(true, tmp_series[key], value);
        }
    });
    jQuery.each(settings_json.options.series || {}, function(key, value){
        if (value){
            delete value.lineDashStyle;
            if (value.pointShape !== undefined){
                delete value.pointShape.type;
                delete value.pointShape.rotation;
                delete value.pointShape.sides;
            }
            jQuery.extend(true, tmp_series[series_ids[parseInt(key, 10)]], value);
        }
    });
    jQuery.each(options_json.series || {}, function(key, value){
        if (!isNaN(key)){
            jQuery.extend(true, tmp_series[series_ids[parseInt(key, 10)]], value);
        }
    });

    jQuery.each(tmp_series || {}, function(key, value){
        if (jQuery.isEmptyObject(value)){
            delete tmp_series[key];
        }
    });
    options_json.series = tmp_series;
    delete settings_json.options.series;
    delete settings_json.options.colors;
    var shouldRemove = false;
    jQuery.each(settings_json.view.columns || {}, function(idx, value){
        if (typeof(value) === 'object'){
            if (value.calc === 'error'){
                shouldRemove = true;
            }
        }
    });
    if (shouldRemove){
        settings_json.view.columns = null;
    }
    var selectedPalette = chartPalettes[settings_json.paletteId].colors;
    var newColors = [];
    jQuery(selectedPalette).each(function(idx, color){
        newColors.push(color);
    });
    if (settings_json.chartType !== 'PieChart'){
        options_json.colors = newColors;
    }

    delete options_json.state;
    var motion_state = chartWrapper.getState();
    if (settings_json.chartType === "ImageChart"){
        if (!options_json.hasOwnProperty("chs")){
            jQuery("#googlechartid_"+id+" .googlechart_width").attr("value","547");
            jQuery("#googlechartid_"+id+" .googlechart_height").attr("value","547");
        }
    }
    else {
        delete options_json.chs;
        delete options_json.chma;
    }

    if (typeof(motion_state) === 'string'){
        options_json.state = motion_state;
    }
    function removeRedundant(tree, path){
        if ((tree instanceof Object) && !(tree instanceof Array)){
            jQuery.each(tree, function(key, subtree){
                path.push(key);
                removeRedundant(subtree, path);
                path.pop();
            });
        }
        else {
            if (!(tree instanceof Array)){
                var node = settings_json.options;
                for (var i = 0; i < path.length - 1; i++){
                    if (node !== undefined){
                        node = node[path[i]];
                    }
                }
                if (node !== undefined){
                    delete node[path[path.length - 1]];
                }
            }
        }
    }
    removeRedundant(options_json, []);
    removeAutomaticColor(options_json, options_json, []);
    removeAutomaticColor(settings_json, settings_json, []);
    var settings_str2 = JSON.stringify(settings_json);
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
    jQuery("#googlechartid_"+id).data("unpivotsettings", unpivotsettings);
    markChartAsModified(id);
    editorDialog.close();
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
    editorDialog.close();
}


function updateMatrixChartScrolls(){
    var pos = jQuery(".matrixCharts_zone").position();
    jQuery("#matrixCharthorizontalscroll").css("left",pos.left);
    jQuery("#matrixChartverticalscroll").css("top",pos.top);
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
        availableColumns : getAvailable_columns_and_rows(jQuery("#googlechartid_tmp_chart").data("unpivotsettings"), available_columns, all_rows).available_columns,
        unpivotSettings : jQuery("#googlechartid_tmp_chart").data("unpivotsettings"),
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

    var unAllowedTypes = ['number', 'boolean', 'timeofday'];

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
            sortAsc : sortAsc,
            chartType : 'editor'
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
            sortAsc : sortAsc,
            chartType : 'editor'
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
        "<div class='matrixChart_dialog hideOverflow'>" +
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
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","mouseenter",function(){
                    var elem = jQuery(this);
                    var col_nr = elem.attr("col_nr");
                    var row_nr = elem.attr("row_nr");
                    jQuery(".horizontalScrollItem[col_nr='"+col_nr+"']").find(".scrollName").find("div").addClass("selectedScrollItem");
                    jQuery(".verticalScrollItem[col_nr='"+row_nr+"']").find(".scrollName").find("div").addClass("selectedScrollItem");
                });
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","mouseout",function(){
                    jQuery(".horizontalScrollItem").find(".scrollName").find("div").removeClass("selectedScrollItem");
                    jQuery(".verticalScrollItem").find(".scrollName").find("div").removeClass("selectedScrollItem");
                });
                jQuery(".matrixChart_dialog").delegate(".matrixChart_overlay","click",function(){
                    jQuery("#matrixChart_chart_dialog").remove();
                    var elem = jQuery(this);
                    var col_nr = parseInt(elem.attr("col_nr"), 10);
                    var row_nr = parseInt(elem.attr("row_nr"), 10);
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
                            sortAsc : sortAsc,
                            chartType : 'editor'
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
                            sortAsc : sortAsc,
                            chartType : 'editor'
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
                            var buttons = jQuery(this).parent().find("button[title!='close']");
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
    jQuery("#matrixCharts_container").scroll(updateMatrixChartScrolls);
    updateMatrixChartScrolls();
    DavizEdit.Status.stop("Done");
}

function fillEditorDialog(options){
    columnsForPivot = {};
//    var id = jQuery(".googlecharts_columns_config").attr("chart_id");
    var id = "tmp_chart";
    if (!options.skippalette){
        var tmp_paletteId = jQuery(".googlecharts_columns_config").attr("palette_id");
    }
    var columns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value");
    var columnsSettings = {};
    if (!columns_str){
        columnsSettings.prepared = [];
    }
    else{
        columnsSettings = JSON.parse(jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value"));
    }
    var columnCount = 0;
    if (!options.skippalette){
        jQuery.each(chartPalettes, function(paletteId, paletteSettings){
            if (tmp_paletteId === ""){
                tmp_paletteId = paletteId;
            }
            var option = "<option value='"+paletteId+"' "+ ((tmp_paletteId === paletteId) ? 'selected="selected"':'')+">"+paletteSettings.name+"</option>";
            jQuery(option).appendTo("#googlechart_palettes");
        });
    }
    if (JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value")).chartType === "PieChart"){
        updatePalette(true);
    }
    else {
        updatePalette(false);
    }
    var tmp_cols_and_rows = getAvailable_columns_and_rows(jQuery("#googlechartid_"+id).data("unpivotsettings"), available_columns, all_rows);

    jQuery("#originalColumns").empty();
    jQuery.each(tmp_cols_and_rows.available_columns, function(column_key,column_name){
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

//    jQuery("#originalTable").empty();
    jQuery.each(tmp_cols_and_rows.all_rows.items, function(row_index,row){
        var tableRow = "<tr>";
        jQuery.each(tmp_cols_and_rows.available_columns, function(column_key,column_name){
            tableRow += "<td>" + row[column_key] + "</td>";
        });
        tableRow += "</tr>";
        jQuery(tableRow).appendTo("#originalTable");
    });

    var loadedSortOrder = [];
    jQuery(columnsSettings.prepared).each(function(idx, prepared){
        loadedSortOrder.push([prepared.name, (prepared.status === 1?'visible':'hidden')]);
    });
    var pivotLevels = generateNewTable(loadedSortOrder, true);

    populateTableForPivot();
    jQuery(".draggable").draggable({
            containment:"#headers",
            delay: 300,
            revert:false,
            start: function(event, ui){
                if (checkVisiblePivotValueColumns() < 2){
                    alert("At least 2 visible column are required");
                    return false;
                }
                pivotDraggedColumn = parseInt(jQuery(ui.helper).attr("columnnr"),10);
                hideDropZone(pivotDraggedColumn);
            },
            stop:function(event, ui){
                jQuery(ui.helper).attr("style","position:relative");
                if (pivotDragStatus === 1){
                    updateStatus();
                }
                updateWithStatus();
                var pivotLevels = generateNewTable();
                jQuery.each(pivotLevels, function(key, value){
                    jQuery(populatePivotPreviewTable(value)).appendTo(".pivotsPreviewTable");
                });
                pivotDragStatus = 0;
            }
    });
    jQuery(".droppable").droppable({
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

    jQuery.each(pivotLevels, function(key, value){
        jQuery(populatePivotPreviewTable(value)).appendTo(".pivotsPreviewTable");
    });

    jQuery("#pivotingTableLabel .eea-menu-item").unbind("click");
    jQuery("#unpivotingFormLabel .eea-menu-item").unbind("click");
    jQuery("#pivotingTableLabel .eea-menu-item").click(function(event){
        if (jQuery(event.toElement).closest(".eea-tutorial").length !== 0){
            return;
        }
        var tmp_icon = jQuery("#pivotingTableLabel").find(".eea-caret-icon");
        if (tmp_icon.hasClass("eea-icon-caret-right")){
            tmp_icon.removeClass("eea-icon-caret-right").addClass("eea-icon-caret-down");
            jQuery("#pivotingTableLabel").addClass("expanded");
        }
        else {
            tmp_icon.removeClass("eea-icon-caret-down").addClass("eea-icon-caret-right");
            jQuery("#pivotingTableLabel").removeClass("expanded");
        }
        jQuery(".pivotingTable").toggle();
    });

    jQuery("#unpivotingFormLabel .eea-menu-item").click(function(event){
        if (jQuery(event.toElement).closest(".eea-tutorial").length !== 0){
            return;
        }
        var tmp_icon = jQuery("#unpivotingFormLabel").find(".eea-caret-icon");
        if (tmp_icon.hasClass("eea-icon-caret-right")){
            tmp_icon.removeClass("eea-icon-caret-right").addClass("eea-icon-caret-down");
            jQuery("#unpivotingFormLabel").addClass("expanded");
        }
        else {
            tmp_icon.removeClass("eea-icon-caret-down").addClass("eea-icon-caret-right");
            jQuery("#unpivotingFormLabel").removeClass("expanded");
        }
        jQuery(".unpivotingForm").toggle();
    });

    jQuery("#googlechart_overlay").overlay({
        mask: 'black'
    });
    jQuery(".unpivot-settings").empty();
    jQuery(".unpivot-pivotedcolumns").empty();
    jQuery.each(available_columns, function(idx, value){
        jQuery("<option>")
            .attr("value", value)
            .text(value)
            .appendTo(".unpivot-pivotedcolumns");

        if (jQuery(".unpivot-settings").text() === ""){
            jQuery("<div>")
                .addClass("columnForUnpivot")
                .text(value)
                .appendTo(".unpivot-settings")
                .annotator()
                .annotator("addPlugin", "EEAGoogleChartsUnpivotAnnotation");
        }
    });
    jQuery(".unpivot-pivotedcolumns").change(function(){
        jQuery(".unpivot-settings").empty();
        jQuery("<div>")
            .addClass("columnForUnpivot")
            .text(jQuery(this).attr("value"))
            .appendTo(".unpivot-settings")
            .annotator()
            .annotator("addPlugin", "EEAGoogleChartsUnpivotAnnotation");
    });
    var unpivotsettings = jQuery("#googlechartid_tmp_chart").data("unpivotsettings");
    if (!jQuery.isEmptyObject(unpivotsettings)){
        jQuery(".unpivot-pivotedcolumns")
            .attr("value", unpivotsettings.columnName);

        jQuery(".unpivot-settings").empty();
        jQuery("<div>")
            .addClass("columnForUnpivot")
            .text(unpivotsettings.columnName)
            .appendTo(".unpivot-settings")
            .annotator()
            .annotator("addPlugin", "EEAGoogleChartsUnpivotAnnotation");

        jQuery.each(unpivotsettings.settings, function(idx, settings){
            var annotation = {};
            var value = {};
            value.colType = settings.colType;
            value.colName = settings.colName;
            value.valType = settings.valType;
            annotation.text = JSON.stringify(value);
            var range = {};
            range.start = "";
            range.startOffset = settings.start;
            range.end = "";
            range.endOffset = settings.end;
            annotation.ranges = [];
            annotation.ranges.push(range);
            jQuery(".columnForUnpivot").data('annotator').setupAnnotation(annotation);
        });
    }
}

function fillEditorDialogWithDelay(){
    fillEditorDialog({});
}

function fetchNextMessage(){
    var found = false;
    jQuery.each(NiceMessages, function(key,value){
        if ((!found) && (value === '')){
            found = true;
            var ChartEditor = new google.visualization.ChartEditor();
            var data = new google.visualization.DataTable();
            if (key === 'GeoChart'){
                data.addColumn('number', 'First column');
                data.addRows([[0]]);
            }
            else {
                data.addColumn('string', 'First column');
                data.addRows([['First string value']]);
            }
            var wrapper = new google.visualization.ChartWrapper({
                'chartType':key,
                'dataTable':data
            });
            ChartEditor.openDialog(wrapper, {});

            NiceMessages[key] = jQuery("#google-visualization-charteditor-preview-div-chart").html();
            ChartEditor.closeDialog();
            ChartEditor = null;
            fetchNextMessage();
        }
    });
}

function buildNiceMessages(){
    var data = new google.visualization.DataTable();
    var ChartEditor = new google.visualization.ChartEditor();
    data.addColumn('string', 'First column');
    data.addRows([['First string value']]);
    var wrapper = new google.visualization.ChartWrapper({
        'chartType':'TableChart',
        'dataTable':data
    });
    ChartEditor.openDialog(wrapper, {});

    var chartTypes = ChartEditor.getAllChartTypes();
    for (var i = 0; i < chartTypes.length; i++){
        NiceMessages[chartTypes[i]] = '';
    }
    ChartEditor.closeDialog();
    ChartEditor = null;
    fetchNextMessage();
}

openEditChart = function(id){
    buildNiceMessages();
    backupColors = [];
    backupOptionColors = [];
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
    var tmp_unpivotsettings = jQuery("#googlechartid_"+id).data("unpivotsettings");
    isFirstEdit = true;

    jQuery(".googlecharts_columns_config").remove();
    var editcolumnsdialog = jQuery(
    '<div class="googlecharts_columns_config hideOverflow">' +
//        '<div id="googlechart_overlay" style="display:none; background: transparent;"><div class="contentWrap" style="width:200px;height:200px; border:1px solid red; background-color:#fff">xxx</div></div>'+
        '<div class="googlechart_chart_config_info hint"><span class="eea-icon eea-icon-info-circle"></span>Each chart requires a specific data layout. If chart does not become available you should go to \'Data selection for chart\' <br/>and re-order/hide columns accordingly. You may also need to rotate the table (pivot/unpivot).</div>'+
        '<div class="chart_config_tabs" style="padding-top:10px;">'+
//            '<div class="googlechart_maximize_chart_config googlechart_config_head googlechart_config_head_selected" style="float:left">Chart Settings</div>'+
//            '<div class="googlechart_maximize_table_config googlechart_config_head" style="float:left;left:344px" title="Click to enlarge Data selection for chart">Data selection for chart</div>'+
            "<div style='float:right;'>"+
                '<div class="buttons">' +
                "<input type='button' class='btn btn-success' value='Save' onclick='chartEditorSave(\""+id+"\");'/>" +
                "<input type='button' class='btn btn-inverse' value='Cancel' onclick='chartEditorCancel();'/>" +
                "</div>" +
            "</div>"+
        '</div>'+
        "<div style='clear:both;'> </div>" +
        '<div class="panel-container">'+
            '<div class="google-visualization-charteditor-panel-navigation-cell charts-inline-block charts-tab googlechart_config_clickable googlechart_chart_config_clickable googlechart_maximize_chart_config googlechart_config_head_selected charts-tab-selected">Chart</div>' +
            '<div class="google-visualization-charteditor-panel-navigation-cell charts-inline-block charts-tab googlechart_config_clickable googlechart_table_config_clickable googlechart_maximize_table_config" title="Click to enlarge Data selection for chart">Data selection for chart</div>' +
        '</div>'+
//        '<div class="googlechart_config_messagezone">'+
//        '</div>'+
        '<div class="googlechart_chart_config_scaleable googlechart_chart_config_scaleable_maximized">'+
            "<div style='clear:both;'> </div>" +
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
                "<select id='googlechart_palettes' style='float:left;' onchange='updatePalette(false);'>"+
                "</select>"+
                "<div style='clear:both;'> </div>" +
                "<div id='googlechart_preview_palette'> </div>"+
            "</div>"+
            "<div style='clear:both;'> </div>" +
        "</div>"+
        "<div style='clear:both;'> </div>" +
        '<div id="googlechart_table_accordion" class="googlechart_table_config_scaleable googlechart_table_config_scaleable_minimized">' +
            '<h3 style="display:none;"><a href="#">Table Editor</a></h3>' +
            '<div class="googlechart_accordion_container">' +
                '<div class="googlechart_accordion_table">' +
                    '<div id="unpivotingFormLabel" class="label">'+
                        '<div class="eea-menu-item">'+
                            '<div class="eea-icon-lg eea-icon eea-caret-icon eea-icon-caret-right" style="float:left;"></div>'+
                            '<div class="main-label">Unpivot Table</div><div class="sub-label">&nbsp;(transform columns to rows)</div>' + //xxx
                            '<img class="pivot-icon" src="../../++resource++eea.googlecharts.images/unpivot-icon.png" style="width:32px;height:32px;"/>'+
                            '<div class="eea-tutorial" tutorial="unpivot"></div>'+
                            '<!--a target="_blank" class="eea-tutorial" href="daviz-tutorials.html#unpivot" title="Tutorials">'+
                                 '<div class="eea-icon eea-icon-youtube-play tutorial-icon" style="float:right;"></div>'+
                                 '<span>See video help</span>'+
                            '</a-->'+
                            '<div style="clear:both"></div>'+
                        '</div>'+
                        '<div class="unpivotingForm">'+
                            '<div class="underlined">'+
                                '<div class="count">1.</div>'+
                                '<div class="description">'+
                                    'Select a column:'+
                                '</div>'+
                                '<div class="extra">'+
                                    '<select class="unpivot-pivotedcolumns">'+
                                    '</select>'+
                                '</div>'+
                                '<div style="clear:both"></div>'+
                            '</div>'+
                            '<div style="clear:both"></div>'+
                            '<div class="underlined">'+
                                '<div class="count">2.</div>'+
                                '<div class="description">'+
                                    'Look at the green-dashed area. Within the column name, select with the mouse<br/>the word you want to become the "base column";<br/>'+
                                    'then click the "Edit" icon and select "base" as column type<br/><br/>'+
                                    'Within the column name select with the mouse each word you want to become the "pivot column";<br/>'+
                                    'then click the "Edit" icon and select "pivot" as column type;<br/>'+
                                    'enter a name and a "value type" for this pivot column.<br/>'+
                                    'NOTE: Be careful that pivot values should not contain characters used as separators<br/>'+
                                '</div>'+
                                '<div class="extra">'+
                                    '<div class="unpivot-settings"></div><br/>'+
                                '</div>'+
                                '<div style="clear:both"></div>'+
                            '</div>'+
                            '<div style="clear:both"></div>'+
                            '<div>'+
                                '<div class="count">3.</div>'+
                                '<div class="description">'+
                                    'Click on the "Unpivot" button and see the results on the "Table for chart" area<br/>'+
                                '</div>'+
                            '</div>'+
                            '<div style="clear:both"></div>'+
                            '<a href="#" class="apply-unpivot btn btn-large disabled">Unpivot</a>'+
                            '<a href="#" class="reset-unpivot btn btn-large disabled">Reset unpivot</a>'+
                            '<div style="clear:both"></div>'+
                        '</div>'+
                    '</div>'+
                    '<div style="clear:both"></div>'+

                    '<div id="pivotingTableLabel" class="label">'+
                        '<div class="eea-menu-item">'+
                            '<div class="eea-icon-lg eea-icon eea-caret-icon eea-icon-caret-right" style="float:left"></div>'+
                            '<div class="main-label">Pivot Table</div><div class="sub-label">&nbsp;(transform rows to columns)</div>' + //xxx
                            '<img class="pivot-icon" src="../../++resource++eea.googlecharts.images/pivot-icon.png" style="width:32px;height:32px;"/>'+
                            '<div class="eea-tutorial" tutorial="pivot"></div>'+
                            '<div style="clear:both"></div>'+
                        '</div>'+
                        '<div class="pivotingTable">' +
                            '<div style="clear:both"></div>'+
                            '<table id="pivotingTable" class="googlechartTable pivotGooglechartTable table">'+
                                '<tr id="pivotConfigHeader"></tr>'+
                                '<tr id="pivotConfigDropZones"></tr>'+
                            '</table>'+
                        '</div>' +
                        '<div style="clear:both"></div>'+
                    '</div>'+
                    '<div>'+
                        '<span class="tableForChartLabel sub-label">Table for chart</span>' +
                        '<div class="eea-tutorial" tutorial="table" style="float:left"></div>'+
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


    editcolumnsdialog.find("#googlechartid_tmp_chart").data("unpivotsettings", tmp_unpivotsettings);
    editcolumnsdialog.find(".googlechart_configjson").attr("value", tmp_config);
    editcolumnsdialog.find(".googlechart_columns").attr("value", tmp_columns);
    editcolumnsdialog.find(".googlechart_paletteid").attr("value", tmp_paletteId);
    editcolumnsdialog.find(".googlechart_options").attr("value", tmp_options);
    editcolumnsdialog.find(".googlechart_name").attr("value", tmp_name);
    editcolumnsdialog.find(".googlechart_row_filters").attr("value", tmp_row_filters);
    editcolumnsdialog.find(".googlechart_sortBy").attr("value", tmp_sortBy);
    editcolumnsdialog.find(".googlechart_sortAsc").attr("value", tmp_sortAsc);
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config","click", function(){
        var clicked = jQuery(this);
        if (clicked.hasClass("googlechart_minimized_chart_clickable")){
            clicked = jQuery(".google-visualization-charteditor-panel-navigation-cell.googlechart_maximize_chart_config");
        }
        jQuery(".googlechart_minimized_chart_clickable").remove();
        clicked.parent().find(".charts-tab-selected")
            .removeClass("charts-tab-selected");
        clicked.addClass("charts-tab-selected");
        jQuery(".googlechart_table_config_scaleable").attr("style","");
        editcolumnsdialog.find(".googlechart_table_config_scaleable").removeClass("googlechart_table_config_scaleable_maximized").addClass("googlechart_table_config_scaleable_minimized");
        editcolumnsdialog.find(".googlechart_chart_config_scaleable").removeClass("googlechart_chart_config_scaleable_minimized").addClass("googlechart_chart_config_scaleable_maximized");
        jQuery(".googlechart_maximize_chart_config").addClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").attr("title","");
        jQuery(".googlechart_maximize_table_config").attr("title","Click to enlarge Data selection for chart");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_hover");
    });
    editcolumnsdialog.delegate(".googlechart_maximize_table_config","click", function(){
        if (editcolumnsdialog.find(".googlechart_table_config_scaleable").hasClass("googlechart_table_config_scaleable_maximized")){
            return;
        }
        var elem = jQuery(this);
        var chart_pos = jQuery("#google-visualization-charteditor-preview-div-wrapper").position();
        elem.parent().find(".charts-tab-selected")
            .removeClass("charts-tab-selected");
        elem.addClass("charts-tab-selected");
        resizeTableConfigurator(true);
        var offset = editcolumnsdialog.find("#google-visualization-charteditor-preview-div-wrapper").offset();
        offset.top = offset.top + 1;
        editcolumnsdialog.find(".googlechart_chart_config_scaleable").removeClass("googlechart_chart_config_scaleable_maximized").addClass("googlechart_chart_config_scaleable_minimized");
        editcolumnsdialog.find(".googlechart_table_config_scaleable").removeClass("googlechart_table_config_scaleable_minimized").addClass("googlechart_table_config_scaleable_maximized");
        editcolumnsdialog.find(".googlechart_table_config_scaleable").offset(offset);
        jQuery(".googlechart_maximize_table_config").addClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_head_selected");
        jQuery(".googlechart_maximize_chart_config").attr("title","Click to enlarge Chart Settings");
        jQuery(".googlechart_maximize_table_config").attr("title","");
        jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        jQuery(".googlechart_maximize_table_config").removeClass("googlechart_config_hover");
        jQuery("<div>")
            .width(jQuery("#google-visualization-charteditor-preview-div-wrapper").width())
            .height(jQuery("#google-visualization-charteditor-preview-div-wrapper").height())
            .addClass("googlechart_minimized_chart_clickable")
            .addClass("googlechart_maximize_chart_config")
            .appendTo(".googlechart_chart_config_scaleable_minimized");
        resizeTableConfigurator(true);
    });
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config", "mouseenter", function(){
        if (jQuery(".googlechart_chart_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_chart_config").addClass("googlechart_config_hover");
        }
    });
    editcolumnsdialog.delegate(".googlechart_maximize_chart_config", "mouseout", function(){
        if (jQuery(".googlechart_chart_config_scaleable_maximized").length === 0){
            jQuery(".googlechart_maximize_chart_config").removeClass("googlechart_config_hover");
        }
    });
    editcolumnsdialog.delegate(".googlechart_maximize_table_config", "mouseenter", function(){
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
    editcolumnsdialog.CustomDialog({title:"Chart Editor",
                dialogClass: 'googlecharts-customdialog',
//                width: width,
                width:1100,
                height:735,
                minWidth:1100,
                minHeight:735,
//                height: height,
                close:function(){
                    jQuery(".slick-header-menu").remove();
                    charteditor_css.remove();
                },
                resize:function(){
                    resizeTableConfigurator(false);
                },
                open:function(){
                    setTimeout(fillEditorDialogWithDelay, 500);
                }
                });
    editorDialog = editcolumnsdialog.data("dialog");
    jQuery(".apply-unpivot").unbind("click");
    jQuery(".reset-unpivot").unbind("click");
    jQuery(".apply-unpivot").bind("click", function(evt){
        evt.preventDefault();
        var annotations = jQuery(".columnForUnpivot").data("annotator").plugins.EEAGoogleChartsUnpivotAnnotation.getAnnotations();
        var unpivotSettings = {};
        unpivotSettings.columnName = jQuery(".unpivot-pivotedcolumns").attr("value");
        unpivotSettings.settings = [];
        jQuery.each(annotations, function(idx, annotation){
            var settings = {};
            settings.start = annotation.ranges[0].startOffset;
            settings.end = annotation.ranges[0].endOffset;
            json_annotation = JSON.parse(annotation.text);
            settings.colType = json_annotation.colType;
            settings.colName = json_annotation.colName;
            if (settings.colType === "base"){
                settings.colName = unpivotSettings.columnName.substr(settings.start, settings.end-settings.start);
            }
            settings.valType = json_annotation.valType;
            var shouldAdd = true;
            jQuery.each(unpivotSettings.settings, function(idx, up_settings){
                if (up_settings.colName === settings.colName){
                    shouldAdd = false;
                }
            });
            if (shouldAdd){
                unpivotSettings.settings.push(settings);
            }
        });
        var newtablesettings;
        var newColumnsSettings = {original:[],prepared:[]};
        try{
            newtablesettings = getAvailable_columns_and_rows(unpivotSettings, available_columns, all_rows);

            jQuery.each(newtablesettings.available_columns, function(key,value){
                newColumnsSettings.original.push({name:key, status:1});
                newColumnsSettings.prepared.push({name:key, status:1, fullname:value});
            });

            var columnsFromSettings = getColumnsFromSettings(newColumnsSettings);
            var options = {
                originalTable : all_rows,
                normalColumns : columnsFromSettings.normalColumns,
                pivotingColumns : columnsFromSettings.pivotColumns,
                valueColumn : columnsFromSettings.valueColumn,
                availableColumns : newtablesettings.available_columns,
//                filters : chart_row_filters,
                unpivotSettings : unpivotSettings
            };
            var transformedTable = transformTable(options);
            if (transformedTable.items.length === 0){
                throw "invalid unpivot settings";
            }

        }
        catch(err){
            alert("Invalid unpivot settings!");
            return;
        }
        jQuery("#googlechartid_tmp_chart").data("unpivotsettings", unpivotSettings);

        jQuery("#googlechartid_tmp_chart .googlechart_columns").attr("value", JSON.stringify(newColumnsSettings));
        fillEditorDialog({skippalette:true});
        updateWithStatus();
        var pivotLevels = generateNewTable();
        jQuery.each(pivotLevels, function(key, value){
            jQuery(populatePivotPreviewTable(value)).appendTo(".pivotsPreviewTable");
        });
    });
    jQuery(".reset-unpivot").bind("click", function(evt){
        evt.preventDefault();
        var unpivotSettings = {};
        jQuery("#googlechartid_tmp_chart").data("unpivotsettings", unpivotSettings);
        var newtablesettings = getAvailable_columns_and_rows(jQuery("#googlechartid_tmp_chart").data("unpivotsettings"), available_columns, all_rows);
        var newColumnsSettings = {original:[],prepared:[]};
        jQuery.each(newtablesettings.available_columns, function(key,value){
            newColumnsSettings.original.push({name:key, status:1});
            newColumnsSettings.prepared.push({name:key, status:1, fullname:value});
        });
        jQuery("#googlechartid_tmp_chart .googlechart_columns").attr("value", JSON.stringify(newColumnsSettings));
        fillEditorDialog({skippalette:true});
        updateWithStatus();
    });
    updateTutorialLinks();
};

function populateDefaults(id, type, settings){
    var edit_filter_settings = {
        step:0,
        ticks:0,
        unitIncrement:0,
        blockIncrement:0,
        orientation:'horizontal'
    };
    jQuery.extend(edit_filter_settings, settings);

    var defaults_div = jQuery(".googlecharts_filter_defaults").empty();
    var selectedColumnName = jQuery(".googlecharts_filter_columns").attr("value");
    var defaults = [];
    var tableForFields;
    if (selectedColumnName.indexOf("pre_config_") !== -1){
        selectedColumnName = selectedColumnName.substr(11);
        tableForFields = all_rows;
        jQuery(".googlecharts_filter_defaults").hide();
    }
    else {
        jQuery(".googlecharts_filter_defaults").show();
        var chart_columns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
        var chart_columns = JSON.parse(chart_columns_str);

        var chart_row_filters_str = jQuery("#googlechartid_"+id+" .googlechart_row_filters").val();
        var chart_row_filters = {};
        if (chart_row_filters_str.length > 0){
            chart_row_filters = JSON.parse(chart_row_filters_str);
        }

        var columnsFromSettings = getColumnsFromSettings(chart_columns);
        var options = {
            originalTable : all_rows,
            normalColumns : columnsFromSettings.normalColumns,
            pivotingColumns : columnsFromSettings.pivotColumns,
            valueColumn : columnsFromSettings.valueColumn,
            availableColumns : getAvailable_columns_and_rows(jQuery("#googlechartid_"+id).data("unpivotsettings"), available_columns, all_rows).available_columns,
            filters : chart_row_filters,
            unpivotSettings : jQuery("#googlechartid_"+id).data("unpivotsettings")
        };
        var transformedTable = transformTable(options);
        tableForFields = transformedTable;
    }
    for (i = 0; i < tableForFields.items.length; i++){
        if (jQuery.inArray(tableForFields.items[i][selectedColumnName], defaults) === -1){
            defaults.push(tableForFields.items[i][selectedColumnName]);
        }
    }
    var isNumber = false;
    if (typeof(defaults[0]) === "number"){
        defaults = defaults.sort(function(a,b){return a-b;});
        isNumber = true;
    }
    else{
        defaults = defaults.sort();
    }
    var clean_defaults = [];
    for (i = 0; i < defaults.length; i++){
        if (defaults[i] !== undefined){
            clean_defaults.push(defaults[i]);
        }
    }
    defaults = clean_defaults;
    var filter_type = jQuery(".googlecharts_filter_type").attr("value");

    defaults_div.append('<label>Defaults for filter</label>');
    defaults_div.append('<div class="formHelp">Default values for filters. If empty, the default settings will be used</div>');

    var edit_filter_type = "-1";
    var edit_filter_defaults = [];
    if (type !== "add"){
        if (id !== "tmp_edit_dashboard"){
            edit_filter_type = jQuery("#" + type + " .googlechart_filteritem_type").attr("value");
            edit_filter_defaults = JSON.parse(jQuery("#" + type + " .googlechart_filteritem_defaults").attr("value"));
        }
        else{
            edit_filter_type = jQuery("#googlechartid_tmp_edit_dashboard .googlechart_filteritem_type").attr("value");
            edit_filter_defaults = JSON.parse(jQuery("#googlechartid_tmp_edit_dashboard .googlechart_filteritem_defaults").attr("value"));
        }
    }
    if (filter_type === "0"){
        defaults_div.append('<div class="googlecharts_defaultsfilter_number"></div>');
        if (isNumber){
            jQuery(".googlecharts_defaultsfilter_number").append('<div class="googlecharts_defaultsfilter_number_min"><label>Min. Value</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number").append('<div class="googlecharts_defaultsfilter_number_max"><label>Max. Value</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number_min input").attr("placeholder", defaults[0]);
            jQuery(".googlecharts_defaultsfilter_number_max input").attr("placeholder", defaults[defaults.length-1]);
            if (edit_filter_defaults.length > 0){
                jQuery(".googlecharts_defaultsfilter_number_min input").attr("value", edit_filter_defaults[0]);
            }
            if (edit_filter_defaults.length > 1){
                jQuery(".googlecharts_defaultsfilter_number_max input").attr("value", edit_filter_defaults[edit_filter_defaults.length-1]);
            }
            jQuery(".googlecharts_defaultsfilter_number").append('<label>Filter options</label><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number").append('<div class="googlecharts_defaultsfilter_number_options"></div>');
            jQuery(".googlecharts_defaultsfilter_number_options").append('<div class="googlecharts_defaultsfilter_number_step"><label>Step</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number_options").append('<div class="googlecharts_defaultsfilter_number_ticks"><label>Ticks</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number_options").append('<div class="googlecharts_defaultsfilter_number_unitincrement"><label>Unit increment</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number_options").append('<div class="googlecharts_defaultsfilter_number_blockincrement"><label>Block increment</label><input type="text"/></div><div style="clear:both"></div>');
            jQuery(".googlecharts_defaultsfilter_number_options").append('<div class="googlecharts_defaultsfilter_number_orientation"><label>Orientation</label><select></select><div style="clear:both"></div>');

            jQuery(".googlecharts_defaultsfilter_number_orientation select").append("<option value='horizontal'>horizontal</option>");
            jQuery(".googlecharts_defaultsfilter_number_orientation select").append("<option value='vertical'>vertical</option>");

            if ((edit_filter_settings.step === 0) || (edit_filter_settings.step === "")){
                jQuery(".googlecharts_defaultsfilter_number_step input").attr("placeholder", "auto");
            }
            else{
                jQuery(".googlecharts_defaultsfilter_number_step input").attr("value", edit_filter_settings.step);
            }

            if ((edit_filter_settings.ticks === 0) || (edit_filter_settings.ticks === '')){
                jQuery(".googlecharts_defaultsfilter_number_ticks input").attr("placeholder", "auto");
            }
            else{
                jQuery(".googlecharts_defaultsfilter_number_ticks input").attr("value", edit_filter_settings.ticks);
            }

            if ((edit_filter_settings.unitIncrement === 0) || (edit_filter_settings.unitIncrement === '')){
                jQuery(".googlecharts_defaultsfilter_number_unitincrement input").attr("placeholder", "auto");
            }
            else{
                jQuery(".googlecharts_defaultsfilter_number_unitincrement input").attr("value", edit_filter_settings.unitIncrement);
            }

            if ((edit_filter_settings.blockIncrement === 0) || (edit_filter_settings.blockIncrement === '')){
                jQuery(".googlecharts_defaultsfilter_number_blockincrement input").attr("placeholder", "auto");
            }
            else{
                jQuery(".googlecharts_defaultsfilter_number_blockincrement input").attr("value", edit_filter_settings.blockIncrement);
            }
            jQuery(".googlecharts_defaultsfilter_number_orientation select").attr("value", edit_filter_settings.orientation);
        }
        else {
            jQuery(".googlecharts_defaultsfilter_number").append('<div class="googlecharts_defaultsfilter_number_error"><b>Warning:</b> Values from selected column are not numbers</div>');
            return;
        }
    }
    if (filter_type === "1"){
        defaults_div.append('<div class="googlecharts_defaultsfilter_string"></div>');
        jQuery(".googlecharts_defaultsfilter_string").append('<div class="googlecharts_defaultsfilter_string"><label>String</label><input type="text"/></div>');
        if ((type !== "add") && (edit_filter_type === "1")){
            jQuery(".googlecharts_defaultsfilter_string input").attr("value", edit_filter_defaults[0]);
        }
    }
    var defaults_list = [];
    if (filter_type === "2"){
        for (i = 0; i < defaults.length; i++){
            default_element = {};
            default_element.value = defaults[i];
            if (type === "add"){
                default_element.defaultval = false;
            }
            else {
                if (edit_filter_type === '2'){
                    if (jQuery.inArray(defaults[i], edit_filter_defaults) === -1){
                        default_element.defaultval = false;
                    }
                    else {
                        default_element.defaultval = true;
                    }
                }
                else {
                    default_element.defaultval = false;
                }
            }
            defaults_list.push(default_element);
        }
        defaults_div.append('<div class="googlecharts_defaultsfilter_slickgrid daviz-data-table daviz-slick-table slick_newTable" style="width:270px;height:200px"></div>');
        drawDefaultValuesGrid(".googlecharts_defaultsfilter_slickgrid", defaults_list, false);
    }
    if (filter_type === "3"){
        for (i = 0; i < defaults.length; i++){
            default_element = {};
            default_element.value = defaults[i];
            if (type === "add"){
                default_element.defaultval = false;
            }
            else {
                if (edit_filter_type === '3'){
                    if (jQuery.inArray(defaults[i], edit_filter_defaults) === -1){
                        default_element.defaultval = false;
                    }
                    else {
                        default_element.defaultval = true;
                    }
                }
                else {
                    default_element.defaultval = false;
                }
            }
            defaults_list.push(default_element);
        }
        defaults_div.append('<div class="googlecharts_defaultsfilter_slickgrid daviz-data-table daviz-slick-table slick_newTable" style="width:270px;height:200px"></div>');
        drawDefaultValuesGrid(".googlecharts_defaultsfilter_slickgrid", defaults_list, true);
    }
    jQuery(".googlecharts_filter_config").dialog("option", "position", "center");
}

function openAddEditChartFilterDialog(id, type, filter_settings){
    jQuery(".googlecharts_filter_config").remove();
    jQuery("#googlechartid_tmp_edit_dashboard").remove();

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
        '<div class="googlecharts_filter_defaults field">'+
        '</div>'+
    '</div>');

    var edit_filter_type = "-1";
    var edit_filter_col = "";
    var edit_filter_defaults = [];
    if (type !== "add"){
        edit_filter_type = jQuery("#" + type + " .googlechart_filteritem_type").attr("value");
        edit_filter_col = jQuery("#" + type + " .googlechart_filteritem_column").attr("value");
        edit_filter_defaults = JSON.parse(jQuery("#" + type + " .googlechart_filteritem_defaults").attr("value"));
        edit_filter_settings = JSON.parse(jQuery("#" + type + " .googlechart_filteritem_settings").attr("value"));
    }
    var orderedFilters = jQuery("#googlechart_filters_"+id).sortable('toArray');
    var used_columns = [];

    jQuery(orderedFilters).each(function(index,value){
        used_columns.push(jQuery("#"+value+" .googlechart_filteritem_column").attr("value"));
    });

    var empty = true;
    var chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    var filter_columns = [];
    if (type === "add"){
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
                    column.text(getAvailable_columns_and_rows(jQuery("#googlechartid_"+id).data("unpivotsettings"), available_columns, all_rows).available_columns[value.name] + " (pre-pivot)");
                    jQuery(".googlecharts_filter_columns", addfilterdialog).append(column);
                    empty = false;
                }
            });
        }
        if(empty){
            return alert("You've added all possible filters!");
        }
    }
    else {
        var edit_col_label;
        var preparedColumns2 = JSON.parse(chartColumns_str).prepared;
        jQuery(preparedColumns2).each(function(index, value){
            if (value.name === edit_filter_col){
                edit_col_label = value.fullname;
            }
        });
        var originalColumns2 = JSON.parse(chartColumns_str).original;
        jQuery(originalColumns2).each(function(index, value){
            if ("pre_config_"+value.name === edit_filter_col){
                edit_col_label = getAvailable_columns_and_rows(jQuery("#googlechartid_"+id).data("unpivotsettings"), available_columns, all_rows).available_columns[value.name] + " (pre-pivot)";
            }
        });

        var column = jQuery('<option></option>');
        column.attr("value", edit_filter_col);
        column.text(edit_col_label);
        jQuery(".googlecharts_filter_columns", addfilterdialog).append(column);
        jQuery(".googlecharts_filter_columns", addfilterdialog).attr("disabled","disabled");
    }
    jQuery.each(available_filter_types,function(key,value){
        var column = jQuery('<option></option>');
        column.attr("value", key);
        column.text(value);
        if (key === edit_filter_type){
            column.attr("selected", "selected");
        }
        jQuery(".googlecharts_filter_type", addfilterdialog).append(column);
    });

    var dialogTitle = "Edit Filter";
    if (type === 'add'){
        dialogTitle = "Add Filter";
    }
    addfilterdialog.dialog({title:dialogTitle,
        dialogClass: 'googlechart-dialog',
        modal:true,
        open: function(evt, ui){
            var buttons = jQuery(this).parent().find("button[title!='close']");
            buttons.attr('class', 'btn');
            jQuery(buttons[0]).addClass('btn-inverse');
            jQuery(buttons[1]).addClass('btn-success');

            if (jQuery(".googlecharts_filter_columns").attr("value").indexOf("pre_config_") === 0){
                jQuery(".googlecharts_filter_type").find("option[value='0']").hide();
                jQuery(".googlecharts_filter_type").find("option[value='1']").hide();
            }

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
                populateDefaults(id, type, filter_settings);
            });
            jQuery(".googlecharts_filter_type").bind("change", function(){
                populateDefaults(id, type, filter_settings);
            });
            populateDefaults(id, type, filter_settings);
        },
        buttons:[
            {
                text: "Cancel",
                click: function(){
                    jQuery(this).dialog("close");
                }
            },
            {
                text: "Save",
                click: function(){
                    var selectedColumn = jQuery(".googlecharts_filter_columns").val();
                    var selectedFilter = jQuery(".googlecharts_filter_type").val();
                    var selectedColumnName = "";
                    var filter_settings = {};
                    jQuery(".googlecharts_filter_columns").find("option").each(function(idx, filter){
                        if (jQuery(filter).attr("value") === selectedColumn){
                            selectedColumnName = jQuery(filter).html();
                            if (selectedColumnName.indexOf("(pre-pivot)") !== -1){
                                selectedColumnName = selectedColumnName.substr(0,selectedColumnName.length - 12);
                            }
                        }
                    });
                    var defaults = [];
                    if (jQuery(".googlecharts_defaultsfilter_number_error").length !== 0){
                        alert("Selected column is not compatible with selected filter type");
                        return;
                    }
                    if (selectedFilter === "0"){
                        var min = jQuery(".googlecharts_defaultsfilter_number_min input").attr("value");
                        var max = jQuery(".googlecharts_defaultsfilter_number_max input").attr("value");
                        if (isNaN(min)){
                            alert("Minimum value is not a number!");
                            return;
                        }
                        if (isNaN(max)){
                            alert("Maximum value is not a number!");
                            return;
                        }
                        defaults.push(min);
                        defaults.push(max);
                        var step = jQuery(".googlecharts_defaultsfilter_number_step input").attr("value");
                        var ticks = jQuery(".googlecharts_defaultsfilter_number_ticks input").attr("value");
                        var unitIncrement = jQuery(".googlecharts_defaultsfilter_number_unitincrement input").attr("value");
                        var blockIncrement = jQuery(".googlecharts_defaultsfilter_number_blockincrement input").attr("value");
                        var orientation = jQuery(".googlecharts_defaultsfilter_number_orientation select").attr("value");
                        if (isNaN(step)){
                            alert("Step is not a number!");
                            return;
                        }
                        if (isNaN(ticks)){
                            alert("Ticks is not a number!");
                            return;
                        }
                        if (isNaN(unitIncrement)){
                            alert("Unit increment is not a number!");
                            return;
                        }
                        if (isNaN(blockIncrement)){
                            alert("Block increment is not a number!");
                            return;
                        }
                        if (step !== 0){
                            filter_settings.step = step;
                        }
                        if (ticks !== 0){
                            filter_settings.ticks = ticks;
                        }
                        if (unitIncrement !== 0){
                            filter_settings.unitIncrement = unitIncrement;
                        }
                        if (blockIncrement !== 0){
                            filter_settings.blockIncrement = blockIncrement;
                        }
                        filter_settings.orientation = orientation;
                    }
                    if (selectedFilter === "1"){
                        defaults.push(jQuery(".googlecharts_defaultsfilter_string input").attr("value"));
                        filter_settings = {};
                    }
                    if ((selectedFilter === "2") || (selectedFilter === "3")){
                        jQuery.each(defaultfilter_data, function(idx, value){
                            if (value.defaultval){
                                defaults.push(value.value);
                            }
                        });
                    }

                    if ((selectedColumn === '-1') || (selectedFilter === '-1')){
                        alert("Please select column and filter type!");
                    }
                    else{
                        addFilter(id, selectedColumn, selectedFilter, selectedColumnName, defaults, filter_settings);
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
            var buttons = jQuery(this).parent().find("button[title!='close']");
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

    var template = Templates.noteDialog({
      data: {
        chart_id: id,
        other_charts: get_other_charts_for_note(null, id)
      }
    });

    var addDialog = jQuery(template);

    addDialog.find('.note-global-field').on('change', function(evt){
      note_toggle_global_field(evt, addDialog);
    });

    var isTinyMCE = false;
    addDialog.dialog({
        title: 'Add note',
        dialogClass: 'googlechart-dialog',
        modal:true,
        minHeight: 600,
        minWidth: 950,
        open: function(evt, ui){
            var buttons = jQuery(this).parent().find("button[title!='close']");
            buttons.attr('class', 'btn');
            jQuery(buttons[0]).addClass('btn-inverse');
            jQuery(buttons[1]).addClass('btn-success');
            isTinyMCE = initializeChartTinyMCE(addDialog);
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
                  title: jQuery('input[name="title"]', addDialog).val(),
                  text: jQuery('textarea[name="text"]', addDialog).val(),
                  global: jQuery('input[name="global"]:checked', addDialog).length > 0,
                  charts: [id].concat(jQuery('select[name="other_charts"]', addDialog).val() || [])
                };
                add_note(id, note);

                jQuery(this).dialog('close');
            }
        }
    });
}

function getChartOptions(chart_id){
    var chartObj = jQuery("#"+chart_id);
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
    chart.hidden = chartObj.find(".googlechart_hide_chart_icon").hasClass("eea-icon-eye-slash");
    chart.sortFilter = chartObj.find(".googlechart-sort-box select").attr("value");
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
        filter_vals = {};
        filter_vals.type = jQuery("#"+filter+" .googlechart_filteritem_type").attr("value");
        filter_vals.defaults = JSON.parse(jQuery("#"+filter+" .googlechart_filteritem_defaults").attr("value"));
        filter_vals.settings = JSON.parse(jQuery("#"+filter+" .googlechart_filteritem_settings").attr("value"));
        filters[jQuery("#"+filter+" .googlechart_filteritem_column").attr("value")] = filter_vals;
    });
    chart.filters = JSON.stringify(filters);

    chart.columnfilters = chartObj.data('columnfilters') || [];
    chart.unpivotsettings = chartObj.data('unpivotsettings') || {};

    return chart;
}

function getNextChartName(chartName){
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
    return chartName+(max_id+1);
}

function getNextChartTitle(chartTitle){
  var latest = 1;
  jQuery('.googlechart_name').each(function(){
    var title = jQuery(this).val();
    if(title.indexOf(chartTitle + ' (Copy ') !== -1){
      latest += 1;
    }
  });

  return chartTitle + ' (Copy ' + latest + ')';
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
        var chart = getChartOptions(value);
        chartObj.attr("data-persisted", false);
        charts.push(chart);
        if (chart.isThumb){
            thumbId = chart.id;
            chartObj.attr("data-cover-persisted", false);
        }

    });
    jsonObj.charts = charts;
    jsonObj.notes = ChartNotes;
    var jsonStr = JSON.stringify(jsonObj);
    var query = {
      'chartsconfig': jsonStr
    };

    jQuery.ajax({
      url:ajax_baseurl+"/googlechart.submit_data",
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
                  var unpivotsettings = chartObj.data("unpivotsettings");

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
                      chartSettings[11] = unpivotsettings;
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
                  var unpivotsettings = chartObj.data("unpivotsettings");
                  chartSettings[2] = columnsSettings;
                  chartSettings[3] = "";
                  chartSettings[4] = chartObj.find(".googlechart_width").attr("value");
                  chartSettings[5] = chartObj.find(".googlechart_height").attr("value");
                  chartSettings[6] = "";
                  chartSettings[7] = JSON.parse(chartObj.find(".googlechart_options").attr("value"));
                  chartSettings[8] = row_filters;
                  chartSettings[9] = sortBy;
                  chartSettings[10] = sortAsc;
                  chartSettings[11] = unpivotsettings;

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
    jQuery.getJSON(ajax_baseurl+"/googlechart.get_data", function(data){
        var jsonObj = data;
        var charts = jsonObj.charts;
        ChartNotes = jsonObj.notes;
        jQuery(charts).each(function(index, chart){
            var options = {
                id : chart.id,
                name : chart.name,
                config : chart.config,
                columns : chart.columns,
                sortFilter : chart.sortFilter,
                filters : JSON.parse(chart.filters),
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
                sortAsc : chart.sortAsc,
                unpivotsettings : chart.unpivotsettings
            };

            addChart(options);
        });
        DavizEdit.Status.stop("Done");
        jQuery(document).trigger('google-charts-initialized');
    });
}

function addNewChart(){
    var chartName = "chart_";
    var newChartId = getNextChartName(chartName);

    var newColumns = {};
    newColumns.original = [];
    newColumns.prepared = [];
    jQuery.each(getAvailable_columns_and_rows({}, available_columns, all_rows).available_columns,function(key,value){
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

    var tmpNewColumnsPrepared = [];
    for (var i = 0; i < available_columns_ordered.length; i++){
        for (var j = 0; j < newColumns.prepared.length; j++){
            if (newColumns.prepared[j].name === available_columns_ordered[i]) {
                tmpNewColumnsPrepared.push(newColumns.prepared[j]);
            }
        }
    }
    newColumns.prepared = tmpNewColumnsPrepared;

    var options = {
        id : newChartId,
        name : "New Chart",
        config : JSON.stringify({'chartType':'Table','options': {'legend':'none','useFirstColumnAsDomain':true}}),
        columns : JSON.stringify(newColumns),
        sortFilter : "__disabled__"
    };

    addChart(options);

    var newChart = jQuery("#googlechartid_"+newChartId);

    markChartAsModified(newChartId);

    jQuery('html, body').animate({
        scrollTop: newChart.offset().top
    });
}

function duplicate_notes_for_chart(source_chart_id, dst_chart_id){
  _.chain(get_notes_for_chart(source_chart_id))
    .filter(function(note){ return !note.global; })
    .map(function(note){
      var new_note = _.clone(note);
      new_note.id = UUID.genV4().toString();
      new_note.charts = _.map(note.charts, function(id){
        return id === source_chart_id ? dst_chart_id : id;
      });
      new_note.order = _.chain(new_note.order)
        .pairs()
        .map(function(pair){
          var key = pair[0];
          var value = pair[1];
          return key === source_chart_id ? [dst_chart_id, value] : pair;
        })
        .object()
        .value();

      ChartNotes.push(new_note);

      _.each(new_note.charts, function(c_id){
        reloadChartNotes(c_id);
        markChartAsModified(c_id);
      });

    })
    .value();
}

function duplicateChart(chartName){
  var options = getChartOptions(chartName);
  var newChartId = getNextChartName(chartName);
  options.isThumb = false;
  options.id = newChartId;
  options.name = getNextChartTitle(options.name);
  options.filters = JSON.parse(options.filters);

  var source_chart_id = jQuery("#" + chartName).find(".googlechart_id").val();
  duplicate_notes_for_chart(source_chart_id, newChartId);

  addChart(options);
  var newChart = jQuery("#googlechartid_"+newChartId);
  markChartAsModified(newChartId);
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
    var unpivotsettings_str = JSON.stringify(chartObj.data('unpivotsettings'));
    var query = {
                "preview_id":chartObj.find(".googlechart_id").attr("value"),
                "preview_tmp_chart":'{"row_filters_str":"'+encodeURIComponent(row_filters_str)+'",'+
                                    '"sortBy":"'+encodeURIComponent(sortBy)+'",'+
                                    '"sortAsc_str":"'+encodeURIComponent(sortAsc_str)+'",'+
                                    '"json":"'+encodeURIComponent(config_str)+'",'+
                                    '"unpivotsettings":"'+encodeURIComponent(unpivotsettings_str)+'",'+
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
            jQuery('#preview-iframe').dialog("option", "resizable", true);            
            var preview_container = jQuery('<div class="preview-container"></div>');
            jQuery('#preview-iframe').append(preview_container);
            preview_container.width(width);
            preview_container.height(height);
            preview_container.append(
                jQuery('<iframe>')
                    .attr('src', chartObj.attr('preview_href')+"?preview_id="+data)
                    .attr('width', width)
                    .attr('height', height));


            var preview_mask = jQuery('<div class="preview-mask"></div>');
            preview_container.append(preview_mask);
            preview_mask.width(width);
            preview_mask.height(height);

            var chart_type = JSON.parse(chartObj.find(".googlechart_configjson").attr("value")).chartType;
            if (resizableCharts.indexOf(chart_type) === -1){
                return;
            }

            preview_container.append(
                jQuery('<div class="chartArea">'+
                            '<div class="googlechartarea-input">'+
                                'top: <input class="googlechartarea-size googlechartarea-top" type="number"/>px'+
                            '</div>'+
                            '<div class="googlechartarea-input">'+
                                'left: <input class="googlechartarea-size googlechartarea-left" type="number"/>px'+
                            '</div>'+
                            '<div class="googlechart-drag_drop">'+
                                '<span>Drag & Resize Chart Area</span>'+
                                '<div class="googlechartarea-input">'+
                                    'Or set the size: '+
                                    '<input class="googlechartarea-size googlechartarea-width" type="number"/>x'+
                                    '<input class="googlechartarea-size googlechartarea-height" type="number"/>px'+
                                '</div>'+
                            ' </div>'+
                        '</div>'));
            var container_offset = preview_container.offset();
            var chart_area = jQuery(".chartArea");
            var chart_area_width = jQuery(".googlechartarea-width");
            var chart_area_height = jQuery(".googlechartarea-height");
            var chart_area_left = jQuery(".googlechartarea-left");
            var chart_area_top = jQuery(".googlechartarea-top");

            chart_area.offset({left:container_offset.left + chartAreaLeft, top:container_offset.top + chartAreaTop});
            chart_area.width(chartAreaWidth);
            chart_area.height(chartAreaHeight);
            chart_area_width.attr("value", chartAreaWidth);
            chart_area_height.attr("value", chartAreaHeight);
            chart_area_left.attr("value", chartAreaLeft);
            chart_area_top.attr("value", chartAreaTop);
            chart_area.draggable({
                containment:".preview-container",
                stop: function(){
                    var elem = jQuery(this);
                    var tmp_left = elem.offset().left - preview_container.offset().left;
                    var tmp_top = elem.offset().top - preview_container.offset().top;
                    var tmp_width = elem.width();
                    var tmp_height = elem.height();
                    chartObj.attr("chartArea", JSON.stringify({left:tmp_left, top:tmp_top, width:tmp_width, height:tmp_height}));
                    chartObj.attr("hasChartArea", true);
                    drawPreviewChart(chartObj, width, height);
                }
            });
            chart_area.resizable({
                containment:".preview-container",
                stop: function(){
                    var elem = jQuery(this);
                    var tmp_left = elem.offset().left - preview_container.offset().left;
                    var tmp_top = elem.offset().top - preview_container.offset().top;
                    var tmp_width = elem.width();
                    var tmp_height = elem.height();
                    chartObj.attr("chartArea", JSON.stringify({left:tmp_left, top:tmp_top, width:tmp_width, height:tmp_height}));
                    chartObj.attr("hasChartArea", true);
                    drawPreviewChart(chartObj, width, height);
                }
            });
            jQuery('.googlechartarea-size').change(function(){
                var tmp_left = parseInt(chart_area_left.attr("value"), 0);
                var tmp_top = parseInt(chart_area_top.attr("value"), 0);
                var tmp_width = parseInt(chart_area_width.attr("value"), 0);
                var tmp_height = parseInt(chart_area_height.attr("value"), 0);
                chartObj.attr("chartArea", JSON.stringify({left:tmp_left, top:tmp_top, width:tmp_width, height:tmp_height}));
                chartObj.attr("hasChartArea", true);
                drawPreviewChart(chartObj, width, height);
            });
            if (jQuery('#googlechartarea-legend').attr('checked')) {
                $('.chartArea').hide();
            }
        }
    });
}

function init_googlecharts_edit(){
    var googlecharts_list = jQuery("#googlecharts_list");
    if(!googlecharts_list.length){
        return;
    }

    googlecharts_list.sortable({
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
        }
    });

    jQuery("#addgooglechart").click(addNewChart);

    googlecharts_list.delegate(".duplicate_chart_icon", "click", function(){
      var chartName = jQuery(this).closest('.googlechart').attr('id');
      return duplicateChart(chartName);
    });

    googlecharts_list.delegate(".remove_chart_icon","click",function(){
        var chartId = jQuery(this).closest('.googlechart').attr('id');
        var chartToRemove = jQuery("#"+chartId).find(".googlechart_id").attr('value');
        var removeChartTemplate = Templates.removeDialog({data: {
          remove_type: "chart",
          remove_text: chartToRemove
        }});
        jQuery(removeChartTemplate).dialog({title:"Remove Chart",
            modal:true,
            dialogClass: 'googlechart-dialog',
            open: function(evt, ui){
                var buttons = jQuery(this).parent().find("button[title!='close']");
                buttons.attr('class', 'btn');
                jQuery(buttons[0]).addClass('btn-danger');
                jQuery(buttons[1]).addClass('btn-inverse');
            },
            buttons:[
                {
                    text: "Remove",
                    click: function(){
                        var chart_id = jQuery("#"+chartId).find(".googlechart_id").attr('value');
                        jQuery("#"+chartId).remove();
                        remove_chart_update_notes(chart_id);
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
    googlecharts_list.delegate(".googlechart_hide_chart_icon","click",function(){
        var oldClass = "eea-icon-eye";
        var newClass = "eea-icon-eye-slash";
        var elem = jQuery(this);
        if (elem.hasClass(newClass)){
            oldClass = "eea-icon-eye-slash";
            newClass = "eea-icon-eye";
        }
        elem.removeClass(oldClass).addClass(newClass);
        var chartId = elem.closest('.googlechart').find('.googlechart_id').attr('value');
        markChartAsModified(chartId);
        changeChartHiddenState(chartId);
    });

    googlecharts_list.delegate(".edit_filter_icon","click",function(){
        var elem = jQuery(this);
        var filterToEdit = elem.closest('.googlechart_filteritem');
        chartId = elem.closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        filter_settings = JSON.parse(elem.closest('.googlechart_filteritem').find(".googlechart_filteritem_settings").attr("value"));
        openAddEditChartFilterDialog(id, filterToEdit.attr("id"), filter_settings);
    });

    googlecharts_list.delegate(".remove_filter_icon","click",function(){
        var elem = jQuery(this);
        var filterToRemove = elem.closest('.googlechart_filteritem');
        chartId = elem.closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        var title = filterToRemove.find('.googlechart_filteritem_id').html();
        var removeFilterTemplate = Templates.removeDialog({data: {
          remove_type: "filter",
          remove_text: title
        }});
        jQuery(removeFilterTemplate).dialog({title:"Remove filter",
            modal:true,
            dialogClass: 'googlechart-dialog',
            open: function(evt, ui){
                var buttons = jQuery(this).parent().find("button[title!='close']");
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

    googlecharts_list.delegate(".addgooglechartfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddEditChartFilterDialog(id, "add", {});
    });

    googlecharts_list.delegate(".addgooglechartcolumnfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddChartColumnFilterDialog(id);
    });

    googlecharts_list.delegate(".addgooglechartnote","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var liName = "googlechartid";
        var id = chartId.substr(liName.length+1);
        openAddChartNoteDialog(id);
    });

    jQuery("input[name='googlechart.googlecharts.actions.save']").unbind('click');
    jQuery("input[name='googlechart.googlecharts.actions.save']").click(function(e){
        saveCharts();
    });

    googlecharts_list.delegate("a.preview_button", "click", function(){
        previewChartObj = jQuery(this).closest('.googlechart');
        var chartObj = previewChartObj;
        var width = parseInt(chartObj.find(".googlechart_width").val(),10);
        var height = parseInt(chartObj.find(".googlechart_height").val(),10);
        jQuery( '#preview-iframe').remove();
        var previewDiv = jQuery("<div id='preview-iframe'></div>");
        var controlsDiv = jQuery("<div class='preview-controls'> </div>");
        var legendDiv = jQuery("<div class='legend-controls'> </div>");
        legendDiv.append("<label for='googlechartarea-legend'>Show only legend</label> ");
        legendDiv.append("<input id='googlechartarea-legend' name='googlechartarea-legend' type='checkbox' />");
        controlsDiv.append(legendDiv);
        var sizesDiv = jQuery("<div class='sizes-controls'> </div>");
        sizesDiv.append("<input class='chartsize chartWidth' type='number'/>");
        sizesDiv.append("<span>x</span>");
        sizesDiv.append("<input class='chartsize chartHeight' type='number'/>");
        sizesDiv.append("<span>px</span>");
        var buttonsDiv = jQuery("<div class='buttons-controls'> </div>");
        buttonsDiv.append("<input value='Cancel' class='btn btn-inverse' type='button'/>");
        buttonsDiv.append("<input value='Save' class='btn btn-success' type='button'/>");
        sizesDiv.append(buttonsDiv);
        controlsDiv.append(sizesDiv);
        controlsDiv.append("<div style='clear:both;'> </div>");
        previewDiv.append(controlsDiv);
        previewDiv.dialog({
            dialogClass: 'googlechart-dialog googlechart-preview-dialog',
            modal:true,
            width:width + 35,
            height:height + 90,
            title:'Preview and size adjustments',
            resize: function() {
                var elem = jQuery(this);
                var tmp_width = width + (elem.width() - elem.attr("widthOriginal"));
                var tmp_height = height + (elem.height() - elem.attr("heightOriginal"));
                jQuery(".preview-controls .chartWidth").attr("value", tmp_width);
                jQuery(".preview-controls .chartHeight").attr("value", tmp_height);
            },
            resizeStop: function(){
                jQuery(this).dialog("option", "resizable", false);
                var elem = jQuery(this);
                if (JSON.parse(chartObj.find(".googlechart_configjson").attr("value")).chartType === "ImageChart"){
                    if (elem.width() * elem.height() > 300000){
                        alert("Maximum size of pixels is 300000, You specified " +
                            parseInt(elem.width(),10) + "x" +parseInt(elem.height(),10) +
                            " what results in " + parseInt(elem.width(),10) * parseInt(elem.height(),10) + "px!");
                        elem.width(chartObj.attr("widthPrevious"));
                        elem.height(chartObj.attr("heightPrevious"));
                        jQuery(".googlechart-preview-dialog").width(jQuery(".googlechart-preview-dialog").attr("widthPrevious"));
                        jQuery(".googlechart-preview-dialog").height(jQuery(".googlechart-preview-dialog").attr("heightPrevious"));
                        jQuery(".preview-controls .chartWidth").attr("value", jQuery(".preview-controls .chartWidth").attr("valuePrevious"));
                        jQuery(".preview-controls .chartHeight").attr("value", jQuery(".preview-controls .chartHeight").attr("valuePrevious"));
                        return;
                    }
                }
                var width_ratio = elem.width() / chartObj.attr("widthPrevious");
                var height_ratio = elem.height() / chartObj.attr("heightPrevious");
                var chartAreaLeft = JSON.parse(chartObj.attr("chartArea")).left * width_ratio;
                var chartAreaTop = JSON.parse(chartObj.attr("chartArea")).top * height_ratio;
                var chartAreaWidth = JSON.parse(chartObj.attr("chartArea")).width * width_ratio;
                var chartAreaHeight = JSON.parse(chartObj.attr("chartArea")).height * height_ratio;
                chartObj.attr("chartArea", JSON.stringify({left:chartAreaLeft, top:chartAreaTop, width:chartAreaWidth, height:chartAreaHeight}));
                drawPreviewChart(chartObj,
                         width + (elem.width() - elem.attr("widthOriginal")),
                         height + (elem.height() - elem.attr("heightOriginal"))
                        );
            },
            resizeStart: function(){
                var elem = jQuery(this);
                chartObj.attr("widthPrevious", elem.width());
                chartObj.attr("heightPrevious", elem.height());
                jQuery(".googlechart-preview-dialog").attr("widthPrevious", jQuery(".googlechart-preview-dialog").width());
                jQuery(".googlechart-preview-dialog").attr("heightPrevious", jQuery(".googlechart-preview-dialog").height());
                jQuery(".preview-controls .chartWidth").attr("valuePrevious", jQuery(".preview-controls .chartWidth").attr("value"));
                jQuery(".preview-controls .chartHeight").attr("valuePrevious", jQuery(".preview-controls .chartHeight").attr("value"));
            },
            create: function(){
                var adv_options_str = chartObj.find(".googlechart_options").attr("value");
                var adv_options = JSON.parse(adv_options_str);
                var chartAreaSettings = {
                    left: "19.1%",
                    top: "19.1%",
                    width: "61.8%",
                    height: "61.8%"
                };
                jQuery.extend(chartAreaSettings, adv_options.chartArea);
                var chartAreaLeft = chartAreaAttribute2px(chartAreaSettings.left, width);
                var chartAreaTop = chartAreaAttribute2px(chartAreaSettings.top, height);
                var chartAreaWidth = chartAreaAttribute2px(chartAreaSettings.width, width);
                var chartAreaHeight = chartAreaAttribute2px(chartAreaSettings.height, height);
                if ((chartAreaLeft === 0) && (chartAreaTop === 0) && (chartAreaWidth === 0)) {
                    $('#googlechartarea-legend').prop('checked', true);
                }
                chartObj.attr("chartArea", JSON.stringify({left: chartAreaLeft, top:chartAreaTop, width:chartAreaWidth, height: chartAreaHeight}));
                chartObj.attr("hasChartArea", true);
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
                jQuery("#googlechartarea-legend").click(function(){
                    var chart_area = $('.chartArea');
                    var chart_area_top = jQuery(".googlechartarea-top");
                    var chart_area_left = jQuery(".googlechartarea-left");
                    var chart_area_width = jQuery(".googlechartarea-width");
                    var chart_area_height = jQuery(".googlechartarea-height");
                    if($(this).attr('checked')) {
                        chart_area_top.attr("value", '0');
                        chart_area_left.attr("value", '0');
                        chart_area_width.attr("value", '0');
                        chart_area_height.attr("value",  jQuery(".preview-controls .chartHeight").attr("value"));
                    } else {
                        var preview_container = $('.preview-container');
                        chart_area_top.attr("value", parseInt(preview_container.height()*19.1/100, 10));
                        chart_area_left.attr("value", parseInt(preview_container.width()*19.1/100, 10));
                        chart_area_width.attr("value", parseInt(preview_container.width()*61.8/100, 10));
                        chart_area_height.attr("value", parseInt(preview_container.height()*61.8/100, 10));
                    }
                    jQuery('.googlechartarea-size').trigger("change");
                });
                var elem = jQuery(this);
                jQuery(".preview-controls .chartWidth").attr("value", width);
                jQuery(".preview-controls .chartHeight").attr("value", height);
                elem.attr("widthOriginal", elem.width());
                elem.attr("heightOriginal", elem.height());
                chartObj.attr("widthPrevious", width);
                chartObj.attr("heightPrevious", height);
            }
        });
    });
    googlecharts_list.delegate("a.preview_button", "mouseenter", function(){
        previewChartObj = jQuery(this).closest('.googlechart');
        var chartObj = previewChartObj;
        if (chartObj.attr("preview_href")) {
            return;
        }
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

function manageCustomSettings() {
    jQuery("body").off("click", "#google-visualization-charteditor-panel-navigate-div div:nth-child(3)")
        .on("click", "#google-visualization-charteditor-panel-navigate-div div:nth-child(3)", function(evt){
            setTimeout(addCustomSettings, 1);
        });
    jQuery("body").off("click", ".charts-menuitem")
        .on("click", ".charts-menuitem", function(evt){
        updateCustomSettings();
    });
}

function overrideGooglePalette(){
    jQuery(document).delegate(".google-visualization-charteditor-settings-td .google-visualization-charteditor-panel-navigation-cell", "click", function(){
        if (jQuery.inArray(jQuery(this).attr("id"), ["custom-interval-configurator", "custom-palette-configurator"]) !== -1){
            return;
        }
        backupColors = [];
        backupOptionColors = [];

        var tmpwrapper = chartEditor.getChartWrapper();
        var tmpwrapper_json = JSON.parse(tmpwrapper.toJSON());
        var chartOptions = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
        var cleanChartOptions = {};
        jQuery.extend(true, cleanChartOptions, chartOptions);
        delete cleanChartOptions.series;
        jQuery.extend(true, tmpwrapper_json.options, cleanChartOptions);
        jQuery.each(tmpwrapper_json.options, function(key, value){
            tmpwrapper.setOption(key,value);
        });

        chartEditor.setChartWrapper(tmpwrapper);
        var section_title = jQuery(".google-visualization-charteditor-section-title:contains('Title')");
        section_title.hide();
        section_title.next().next().hide();
        section_title.next().next().next().next().hide();
    });
    jQuery(document).delegate(".google-visualization-charteditor-color", "click", function(){
        saveEditorColors();
        var selectedPaletteId = jQuery("#googlechart_palettes").attr("value");
        var selectedPalette = chartPalettes[selectedPaletteId].colors;
        var grayscale;
        var custompalette;
        var automatic;
        jQuery(".jfk-colormenu:visible .jfk-palette-cell").show();
        jQuery(".jfk-colormenu:visible .charts-menuitem").hide();
        jQuery.each(jQuery(".jfk-colormenu:visible .jfk-palette"), function(idx, palette){
            if (jQuery(palette).find("td").eq(0).attr("aria-label") === "black"){
                grayscale = palette;
                jQuery(palette).show();
            }
            else {
                if (jQuery(palette).find("td").eq(0).attr("aria-label") === "light red berry 3"){
                    custompalette = palette;
                    jQuery(palette).show();
                }
                else {
                    if (jQuery(palette).find("td").eq(0).attr("aria-label") === "RGB (51, 102, 204)"){
                        automatic = palette;
                        jQuery(palette).show();
                    }
                    else {
                        jQuery(palette).hide();
                    }
                }
            }
        });
        jQuery(".jfk-palette-colorswatch").empty();

        jQuery(automatic).find("td").hide();
        jQuery(automatic).find("td").eq(0).show();
        jQuery(automatic).find("td").eq(0).find(".jfk-palette-colorswatch").html("<div class='googlechart-palette-cell-replacement automatic' style='background-color:white;'>Automatic</div>");
        jQuery(automatic).find("td").eq(0).find(".jfk-palette-colorswatch").css("width","auto").css("height","auto");
        jQuery.each(selectedPalette, function(idx, color){
            if (idx < 60){
                jQuery(custompalette).find(".jfk-palette-colorswatch").eq(idx).html("<div class='googlechart-palette-cell-replacement' style='background-color:"+color+"' title='"+color+"'></div>");
            }
        });
        for (var i = selectedPalette.length; i < 60; i++){
            jQuery(custompalette).find(".jfk-palette-cell").eq(i).hide();
        }
        for (i = 0; i < 10; i++){
            var obj = jQuery(grayscale).find(".jfk-palette-colorswatch").eq(i);
            var color = obj.css("background-color");
            obj.html("<div class='googlechart-palette-cell-replacement' style='background-color:"+color+"' title='"+color+"'></div>");
        }
    });
    jQuery(document).delegate(".googlechart-palette-cell-replacement", "click", function(){
        var elem = jQuery(this);
        jQuery(".jfk-palette").hide();
        var new_rgb_color = elem.css("background-color");
        var old_rgb_color = elem.parent().css("background-color");
        var new_color = rgbstrToHex(new_rgb_color);
        var old_color = rgbstrToHex(old_rgb_color);
        if (elem.hasClass("automatic")){
            new_color = "eea-automatic-color";
        }

        var colorcontainers = jQuery(".google-visualization-charteditor-color .charts-flat-menu-button");
        jQuery.each(colorcontainers, function(idx, container){
            if (jQuery(container).hasClass("charts-flat-menu-button-focused")){
                backupColors[idx] = new_rgb_color;
            }
        });

        var coloroptions = jQuery(".google-visualization-charteditor-select-series-color");
        jQuery.each(coloroptions, function(idx, option){
            if (jQuery(option).css("background-color") === old_rgb_color){
                backupOptionColors[idx] = new_rgb_color;
            }
        });

        var currentConfig = JSON.parse(jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value"));
        var tmpwrapper = chartEditor.getChartWrapper();
        var extraConfig = {};

        function parseTree(tree, path){
            if ((tree instanceof Object) && !(tree instanceof Array)){
                jQuery.each(tree, function(key, subtree){
                    path.push(key);
                    parseTree(subtree, path);
                    path.pop();
                });
            }
            else {
                if (tree === old_color){
                    var tmp_extra = {};
                    var node = tmp_extra;
                    for (var i = 0; i < path.length; i++){
                        if (i < path.length - 1){
                            node[path[i]] = {};
                            node = node[path[i]];
                        }
                        else{
                            node[path[i]] = new_color;
                        }
                    }
                    jQuery.extend(true, extraConfig, tmp_extra);
                }
            }
        }
        parseTree(currentConfig, []);
        var chartOptions = JSON.parse(jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value"));
        removeAutomaticColor(chartOptions, chartOptions, []);
        jQuery.extend(true, chartOptions, extraConfig.options);
        if (tmpwrapper.getChartType() === "PieChart"){

            var selectedPaletteId = jQuery("#googlechart_palettes").attr("value");

            var selectedPalette = chartPalettes[selectedPaletteId].colors;

            chartOptions.colors = currentConfig.options.colors;
            for (var i = 0; i < chartOptions.colors.length; i++){
                if (chartOptions.colors[i] === old_color){
                    chartOptions.colors[i] = new_color;
                }
                if (chartOptions.colors[i] === 'eea-automatic-color'){
                    chartOptions.colors[i] = selectedPalette[i % selectedPalette.length];
                }
            }
        }
        jQuery("#googlechartid_tmp_chart").find(".googlechart_options").attr("value", JSON.stringify(chartOptions));
        redrawEditorChart();
    });
    jQuery(document).click(function(evt){
        if (jQuery(evt.target).closest(".eea-googlechart-intervals-color").length === 0){
            jQuery(".eea-googlechart-intervals-colorpalette").remove();
        }
    });
}

function overrideSparklinesThumbnail(){
    jQuery(document).delegate("#google-visualization-charteditor-thumbnail-imagesparkline", "click", function(){
        checkReadyForSparklines(true);
    });
}

function load_templates(callback){
  jQuery.ajax({
    url: "++resource++eea.googlecharts.jst/edit.jst",
    cache: false,
    type: "GET",
    success: function(templates){
      var body = $(templates);
      _.each(body.filter("script.template"), function(template){
        Templates[template.id] = _.template(template.textContent);
      }, this);
      callback();
    }
  });
}

jQuery(document).ready(function(){
    charteditor_css = jQuery("link[rel='stylesheet'][href*='charteditor']");
    charteditor_css.remove();

    load_templates(function(){
      init_googlecharts_edit();
      jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
          init_googlecharts_edit();
      });
    });

    overrideGooglePalette();
    overrideSparklinesThumbnail();
    updateTutorialLinks();
    manageCustomSettings();
});

/*if (window.DavizEdit === undefined){
    var DavizEdit = {'version': 'eea.googlecharts'};
}*/

DavizEdit.CustomDialog = function(context, options){
    var self = this;
    self.context = context;
    self.initialize(options);
};

DavizEdit.CustomDialog.prototype = {
    initialize: function(options){
        var self = this;
        self.settings = {
            dialogClass: "",
            title : "Dialog",
            width : 600,
            height : 400,
            minWidth : 0,
            minHeight : 0,
            create : function(){},
            close: function(){},
            resize: function(){},
            open: function(){}
        };
        self.context.data("dialog", self);
        jQuery.extend(self.settings, options);
        if (self.settings.minWidth > self.settings.width){
            self.settings.width = self.settings.minWidth;
        }
        if (self.settings.minHeight > self.settings.height){
            self.settings.height = self.settings.minHeight;
        }
        self.drawDialog();
    },

    drawDialog: function(){
        var self = this;
        self.settings.create();
        var windowWidth = jQuery(window).width();
        var windowHeight = jQuery(window).height();
        var windowTop = jQuery(window).scrollTop();
        var windowLeft = jQuery(window).scrollLeft();
        var left = (windowWidth - self.settings.width)/2 + windowLeft;
        var top = (windowHeight - self.settings.height)/2 + windowTop;
        jQuery("<div>")
            .addClass("ui-widget-overlay ui-front")
            .appendTo("body");
        var dialog = jQuery("<div>")
                        .addClass("ui-dialog ui-widget ui-widget-content ui-corner-all eea-custom-dialog")
                        .addClass(self.settings.dialogClass)
                        .css("width", self.settings.width)
                        .css("height", self.settings.height)
                        .css("left", left)
                        .css("top", top)
                        .resizable({
                            minWidth:self.settings.minWidth,
                            minHeight:self.settings.minHeight,
                            stop: function(){
                                self.settings.resize();
                            },
                            resize: function(){
                                var elem = jQuery(this);
                                jQuery(".custom-dialog-content")
                                    .css("width", elem.width()-30)
                                    .css("height", elem.height()-40);
                            }
                        })
                        .draggable({handle:".customDialogHeader"});
        var dialogHeader = jQuery("<div>")
                            .text(self.settings.title)
                            .addClass("customDialogHeader")
                            .addClass("ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix")
                            .appendTo(dialog);
        var closeBtn = jQuery("<button>")
                            .attr("title", "close")
                            .attr("role", "button")
                            .addClass("ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close")
                            .hover(
                                function(){
                                    jQuery(this)
                                        .addClass("ui-state-hover ui-state-active");
                                },
                                function(){
                                    jQuery(this)
                                        .removeClass("ui-state-hover ui-state-active");
                                }
                            )
                            .click(
                                function(){
                                    self.close();
                                }
                            );
        var expandDialog = function(){
            var width;
            var height;
            var windowWidth = jQuery(window).width();
            var windowHeight = jQuery(window).height();
            var windowTop = jQuery(window).scrollTop();
            var windowLeft = jQuery(window).scrollLeft();
            width = self.settings.width;
            height = self.settings.height;
            if (width < windowWidth * 0.95) {
                width = windowWidth * 0.95;
            }
            if (height < windowHeight * 0.95) {
                height = windowHeight * 0.95;
            }
            var left = (windowWidth - width)/2 + windowLeft;
            var top = (windowHeight - height)/2 + windowTop;
            jQuery(".eea-custom-dialog")
                .css("width", width)
                .css("height", height)
                .css("left", left)
                .css("top", top);

            jQuery(".custom-dialog-content")
                .css("width", width-30)
                .css("height", height-40);

            self.settings.resize();
        };

        jQuery("<span>")
            .addClass("ui-button-icon-primary eea-icon eea-icon-times")
            .appendTo(closeBtn);
        jQuery("<span>")
            .addClass("ui-button-text")
            .text("close")
            .appendTo(closeBtn);
        closeBtn.appendTo(dialogHeader);
        self.context
                .addClass("ui-dialog-content ui-widget-content custom-dialog-content")
                .css("width",self.settings.width-30)
                .css("height",self.settings.height-40);
        self.context.appendTo(dialog);
        dialog.appendTo("body");
        self.settings.open();
        expandDialog();
    },

    close: function(){
        var self = this;
        jQuery(".ui-widget-overlay").remove();
        self.settings.close();
        self.context.closest(".googlecharts-customdialog").remove();
    }
};

jQuery.fn.CustomDialog = function(options){
    return this.each(function(){
        var customDialog = new DavizEdit.CustomDialog(jQuery(this), options);
    });
};
