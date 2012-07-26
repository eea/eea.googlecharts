var charteditor_css = null;
var previewChartObj = null;
var chartEditor = null;
var chartId = '';

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

function checkSVG(id){
    var svg = jQuery("#googlechart_chart_div_"+id).find("iframe").contents().find("#chartArea").html();

    if ((svg) && (svg !== "")){
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
}

function addFilter(id, column, filtertype, columnName){
    var filter = "<li class='googlechart_filteritem' id='googlechart_filter_"+id+"_"+column+"'>" +
                "<h1 class='googlechart_filteritem_"+id+"'><div style='float:left;width:90%;height:20px;overflow:hidden' class='googlechart_filteritem_id'>"+columnName+"</div><div class='ui-icon ui-icon-trash remove_filter_icon' title='Delete filter'>x</div><div style='clear:both'></div></h1>" +
                available_filter_types[filtertype] +
                "<input type='hidden' class='googlechart_filteritem_type' value='"+filtertype+"'/>" +
                "<input type='hidden' class='googlechart_filteritem_column' value='"+column+"'/>" +
             "</li>";
    jQuery(filter).appendTo("#googlechart_filters_"+id);
}

function saveThumb(value){
    DavizEdit.Status.start("Saving Thumb");
    var chart_id = value[0];
    var chart_json = value[1];
    var chart_columns = value[2];
    var chart_filters = value[3];
    var chart_width = value[4];
    var chart_height = value[5];
    var chart_filterposition = value[6];
    var chart_options = value[7];

    var columnsFromSettings = getColumnsFromSettings(chart_columns);
    var transformedTable = transformTable(all_rows,
                                    columnsFromSettings.normalColumns,
                                    columnsFromSettings.pivotColumns,
                                    columnsFromSettings.valueColumn,
                                    available_columns);
    var tableForChart = prepareForChart(transformedTable, columnsFromSettings.columns);
    drawGoogleChart(
        '',
        'googlechart_thumb_zone',
        '',
        chart_id,
        chart_json,
        tableForChart,
        '',
        chart_width,
        chart_height,
        '',
        chart_options,
        transformedTable.available_columns,
        function(){
            var thumbObj = jQuery("#googlechart_thumb_form");
            thumbObj.find("#filename").attr("value", "thumb");
            thumbObj.find("#type").attr("value","image/png");
            var svg = jQuery("#googlechart_thumb_zone").find("iframe").contents().find("#chartArea").html();
            thumbObj.find("#svg").attr("value",svg);
            var form = jQuery('.daviz-view-form:has(#googlecharts_config)');
            var action = form.length ? form.attr('action') : '';
            action = action.split('@@')[0] + "@@googlechart.setthumb";
            jQuery.post(action, {"svg":svg},function(data){
                if (data !== "Success"){
                    alert("Can't generate thumb from the chart called: "+chart_json.options.title);
                }
                DavizEdit.Status.stop("Done");
            });
        },
        function(){
            alert("Can't generate thumb from the chart called: "+chart_json.options.title);
            DavizEdit.Status.stop("Done");
        }
    );
}

function drawChart(elementId, readyEvent){
    var wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart_configjson").attr('value');
    var chartName = jQuery("#googlechartid_"+elementId+" .googlechart_name").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON.containerId = "googlechart_chart_div_" + elementId;

        var chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();
        var chartColumns = {};
        if (chartColumns_str === ""){
            chartColumns.original = {};
            chartColumns.prepared = {};
        }
        else{
            chartColumns = JSON.parse(chartColumns_str);
        }

        var columnsFromSettings = getColumnsFromSettings(chartColumns);
        var transformedTable = transformTable(all_rows,
                                        columnsFromSettings.normalColumns,
                                        columnsFromSettings.pivotColumns,
                                        columnsFromSettings.valueColumn,
                                        available_columns);
        var tableForChart = prepareForChart(transformedTable, columnsFromSettings.columns);

        wrapperJSON.dataTable = tableForChart;
        wrapperJSON.options.title = chartName;
        var wrapper = new google.visualization.ChartWrapper(wrapperJSON);
        var chartOptions = JSON.parse(jQuery("#googlechartid_"+elementId+" .googlechart_options").attr('value'));
        jQuery.each(chartOptions, function(key, value){
            wrapper.setOption(key, value);
        });

        google.visualization.events.addListener(wrapper, 'ready', function(event){
            readyEvent(elementId);
        });

        wrapper.draw();
    }
}

function openAdvancedOptions(id){
    var errorMsgJSON = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input must be a valid JSON" +
        "</div>";

    var chartObj = jQuery("#googlechartid_"+id);
    var options = chartObj.find(".googlechart_options").attr("value");

    jQuery(".googlecharts_advancedoptions_dialog").remove();

    var advancedOptionsDialog = ""+
        "<div class='googlecharts_advancedoptions_dialog'>"+
            "<div class='googlechart_dialog_options_div field'>" +
                "<label>Options</label>" +
                "<div class='formHelp'><a href='http://code.google.com/apis/chart/interactive/docs/gallery.html'>See GoogleChart documentation</a></div>" +
                "<textarea rows='10' cols='30' class='googlechart_dialog_options'>" +
                options +
                "</textarea>" +
            "</div>" +
        "<div>";
    jQuery(advancedOptionsDialog).dialog({title:"Advanced Options",
            dialogClass: 'googlechart-dialog',
            modal:true,
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

function addChart(id, name, config, columns, filters, width, height, filter_pos, options, isThumb, dashboard){
    config = typeof(config) !== 'undefined' ? config : "";
    columns = typeof(columns) !== 'undefined' ? columns : "";
    filters = typeof(filters) !== 'undefined' ? filters : {};
    width = typeof(width) !== 'undefined' ? width : 800;
    height = typeof(height) !== 'undefined' ? height : 600;
    filter_pos = typeof(filter_pos) !== 'undefined' ? filter_pos : 0;
    options = typeof(options) !== 'undefined' ? options : defaultAdvancedOptions;
    isThumb = typeof(isThumb) !== 'undefined' ? isThumb : false;
    dashboard = typeof(dashboard) !== 'undefined' ? dashboard: {};
    filter_pos = parseInt(filter_pos, 0);

    var shouldMark = false;
    var chart;
    if (config === ""){
        shouldMark = true;
        chart = defaultChart;
        chart.options.title = name;
        config = JSON.stringify(chart);
    }
    var googlechart = jQuery("" +
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>" +
            "<input class='googlechart_id' type='hidden' value='"+id+"'/>" +
            "<input class='googlechart_configjson' type='hidden' value='"+config+"'/>" +
            "<input class='googlechart_columns' type='hidden' value='"+columns+"'/>" +
            "<input class='googlechart_options' type='hidden' value='"+options+"'/>" +

            "<h1 class='googlechart_handle'>"+
            "<div style='float:left;width:60%;height:20px;overflow:hidden;'>"+
                "<input class='googlechart_name' type='text' value='"+name+"' style='width:200px' onchange='markChartAsModified(\""+id+"\");drawChart(\""+id+"\",function(){});'/>" +
                "<span style='font-weight:normal;padding: 0 0.5em;float:right;'>px</span>"+
                "<input class='googlechart_height' type='text' value='"+height+"' onchange='markChartAsModified(\""+id+"\");'/>" +
                "<span style='font-weight:normal;padding: 0 0.5em;float:right;'>X</span>"+
                "<input class='googlechart_width' type='text' value='"+width+"' onchange='markChartAsModified(\""+id+"\");'/>" +
            "</div>"+
            "<div class='ui-icon ui-icon-trash remove_chart_icon' title='Delete chart'>x</div>"+
            "<div style='float:right;font-weight:normal;font-size:0.9em;margin-right:10px' id='googlechart_thumb_text_"+id+"'>Use this chart as thumb</div>"+
            "<input style='float:right; margin:3px' type='checkbox' class='googlechart_thumb_checkbox' id='googlechart_thumb_id_"+id+"' onChange='markChartAsThumb(\""+id+"\");' "+(isThumb?"checked='checked'":"")+"/>"+
            "<div style='clear:both'> </div>"+
            "</h1>" +
            "<fieldset>" +
                "<div style='float:left'>" +
                    "<div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 400px; max-width:700px; overflow:auto'></div>" +
                "</div>" +
                "<div style='float:right; width:250px'>" +
                    "<strong>Filters</strong><br/>"+
                    "Position:"+
                    "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='0' "+((filter_pos === 0)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Top" +
                    "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='1' "+((filter_pos === 1)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Left" +
                    "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='2' "+((filter_pos === 2)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Bottom" +
                    "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='3' "+((filter_pos === 3)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Right" +
                    "<br/>"+
                    "<br/>"+
                    "<input type='button' value='Add New Filter' class='context addgooglechartfilter'/>"+
                    "<div style='clear:both'> </div>" +
                    "<ul class='googlechart_filters_list'  id='googlechart_filters_"+id+"'>" +
                    "</ul>" +
                "</div>" +
                "<div style='clear:both'> </div>" +
                "<input type='button' class='context' value='Edit Chart' onclick='openEditChart(\""+id+"\");'/>" +
                "<input type='button' class='context' value='Advanced Options' onclick='openAdvancedOptions(\""+id+"\");'/>" +
                "<a style='float:right' class='preview_button'>Preview Chart</a>"+
            "</fieldset>" +
        "</li>");

    jQuery('#googlecharts_list').append(googlechart);
    jQuery.data(googlechart[0], 'dashboard', dashboard);

    jQuery("#googlechart_filters_"+id).sortable({
        handle : '.googlechart_filteritem_'+id,
        stop: function(event,ui){
            markChartAsModified(id);
        }
    });

    drawChart(id, checkSVG);

    var chartColumns = {};
    if (columns === ""){
        chartColumns.original = {};
        chartColumns.prepared = {};
    }
    else{
        chartColumns = JSON.parse(columns);
    }

    jQuery.each(filters,function(key,value){
        jQuery(chartColumns.prepared).each(function(idx, column){
            if (column.name === key){
                addFilter(id, key, value, column.fullname);
            }
        });
    });
    if (shouldMark){
        markChartAsModified(id);
    }
}

var isFirstEdit = true;
var editedChartStatus = false;

function moveIfFirst(){
    if (isFirstEdit){
        jQuery(".google-visualization-charteditor-dialog").appendTo("#googlechart_editor_container");
        jQuery(".google-visualization-charteditor-dialog").removeClass("modal-dialog");
        jQuery(".google-visualization-charteditor-dialog").addClass("googlechart-editor");
    }
    isFirstEdit = false;
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


    var columnsFromSettings = getColumnsFromSettings(chartColumns);
    var transformedTable = transformTable(all_rows,
                                    columnsFromSettings.normalColumns,
                                    columnsFromSettings.pivotColumns,
                                    columnsFromSettings.valueColumn,
                                    available_columns);
    var tableForChart = prepareForChart(transformedTable, columnsFromSettings.columns, 100);

    chart.dataTable = tableForChart;

    chart.options.title = title;
    var wrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);


    google.visualization.events.addListener(chartEditor, 'ready', function(event){
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = true;
        moveIfFirst();
        redrawEditorChart();
    });
    google.visualization.events.addListener(chartEditor, 'error', function(event){
        var settings_str = chartEditor.getChartWrapper().toJSON();
        jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value",settings_str);
        editedChartStatus = false;
        moveIfFirst();
    });

    chartEditor.openDialog(wrapper, {});
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

function generateNewTable(sortOrder, isFirst){
    isFirst = typeof(isFirst) !== 'undefined' ? isFirst : false;
    DavizEdit.Status.start("Updating Tables");
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

    jQuery("#newTable").find("tr").remove();
    var transformedTable = transformTable(all_rows, normalColumns, pivotColumns, valueColumn, available_columns);

    var tmpSortOrder = [];
    jQuery.each(transformedTable.available_columns,function(col_key, col){
        tmpSortOrder.push([col_key, "visible"]);
    });
    sortOrder = typeof(sortOrder) === 'undefined' ? tmpSortOrder : sortOrder;

    var newColumnsRow = "<tr id='newColumns'></tr>";
    jQuery(newColumnsRow).appendTo("#newTable");

    jQuery(sortOrder).each(function(col_idx, col){
        var newColumn = '<th column_id="' + col[0] + '" column_visible="'+col[1]+'">' +
                        '<div title="Hide facet" style="float:right" class="ui-icon '+((col[1]==='hidden')?'ui-icon-show':'ui-icon-hide')+'">h</div>' +
                        '<div style="clear:both;"></div>'+
                        '<span>' + transformedTable.available_columns[col[0]] + '</span>' +
                    '</th>';
        jQuery(newColumn).appendTo("#newColumns");
    });

    jQuery("#newColumns").sortable({
        items: 'th',
        placeholder: 'ui-state-highlight',
        delay: 300,
        opacity: 0.7,
        cursor: 'crosshair',
        tolerance: 'pointer',
        stop: function(event,ui){
            generateNewTable(generateSortedColumns());
        }
    });

    jQuery(".googlechartTable .ui-icon").click(function(){
        if (jQuery(this).hasClass("ui-icon-hide")){
            jQuery(this).removeClass("ui-icon-hide");
            jQuery(this).addClass("ui-icon-show");
            jQuery(this).closest("th").attr("column_visible","hidden");
        }
        else{
            jQuery(this).removeClass("ui-icon-show");
            jQuery(this).addClass("ui-icon-hide");
            jQuery(this).closest("th").attr("column_visible","visible");
        }
        generateNewTable(generateSortedColumns());
    });

    jQuery(transformedTable.items).each(function(row_idx, row){
        var tableRow = "<tr>";
        jQuery(sortOrder).each(function(column_idx,column_key){
            tableRow += "<td class=" + ((column_key[1]==='hidden')?'column-hidden':'column-visible') + ">" + row[column_key[0]] + "</td>";
        });
        tableRow += "</tr>";
        jQuery(tableRow).appendTo("#newTable");
    });

    if (!isFirst){
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
        jQuery("#newColumns").find("th").each(function(){
            var preparedColumn = {};
            preparedColumn.name = jQuery(this).attr("column_id");
            preparedColumn.status = (jQuery(this).attr("column_visible") === 'visible'?1:0);
            preparedColumn.fullname = jQuery(this).find("span").html();
            columnsSettings.prepared.push(preparedColumn);
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
        if(isOK){
            var columns_str = JSON.stringify(columnsSettings);
            jQuery("#googlechartid_tmp_chart .googlechart_columns").val(columns_str);
        }
    }
    openEditor("tmp_chart");
    DavizEdit.Status.stop("Done");
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
    jQuery("#pivots").remove();
    var pivotsHtml = "<div id='pivots'>";
    jQuery.each(columnsForPivot,function(key, value){
        originalColumn = jQuery("#originalColumns").find("[column_id='"+key+"']").find("select");
        if (value.status === 1){
            valueColumn = value.nr;
            jQuery(originalColumn).attr("value",3);
        }
        if (value.status === 2){
            pivots.push(value.nr);
            pivotsHtml += "<div class='pivotedColumn'>"+key+"<a style='float:right' href='#' onclick='removePivot("+value.nr+")'><span title='Delete pivot' class='ui-icon ui-icon-trash'>x</span></a></div><div style='clear:both'></div>";
            jQuery(originalColumn).attr("value",2);
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
            columnnr = parseInt(jQuery(value).attr("columnnr"), 10);
            if (columnnr === valueColumn){
                setPivotsForColumn(columnnr, pivotsHtml);
                showHeader(columnnr);
                showDropZone(columnnr);
            }
            else {
//                if (pivots.indexOf(columnnr) !== -1){
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

function populateTableForPivot(){
    jQuery.each(columnsForPivot,function(key, value){
        var th =
                "<th class='columnheader' columnnr='"+value.nr+"'>"+
                "<div class='draggable' columnnr='"+value.nr+"'>"+value.name+"</div>"+
                "</th>";
        jQuery(th).appendTo(jQuery("#pivotConfigHeader"));
        var td =
                "<td class='columnpivot' columnnr='"+value.nr+"'>"+
                "<div class='droppable' columnnr='"+value.nr+"'>Drop here pivoting column</div>"+
                "</td>";
        jQuery(td).appendTo(jQuery("#pivotConfigDropZones"));
    });
}

var editorDialog;

function chartEditorSave(id){
    if (!editedChartStatus){
        alert("Chart is not properly configured");
        return;
    }
    chartEditor.closeDialog();
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
    jQuery("#newColumns").find("th").each(function(){
        var preparedColumn = {};
        preparedColumn.name = jQuery(this).attr("column_id");
        preparedColumn.status = (jQuery(this).attr("column_visible") === 'visible'?1:0);
        preparedColumn.fullname = jQuery(this).find("span").html();
        columnsSettings.prepared.push(preparedColumn);
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

    var settings_str = jQuery("#googlechartid_tmp_chart .googlechart_configjson").attr("value");
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
    var options_str2 = JSON.stringify(options_json);

    var name_str = jQuery("#googlechartid_tmp_chart .googlechart_name").attr("value");

    jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value",columns_str);
    jQuery("#googlechartid_"+id+" .googlechart_configjson").attr("value",settings_str2);
    jQuery("#googlechartid_"+id+" .googlechart_options").attr("value",options_str2);
    jQuery("#googlechartid_"+id+" .googlechart_name").attr("value",name_str);
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
    jQuery("#"+filtersPrefix).find(".googlechart_filteritem").each(function(idx,value){
        var filterColumnName = jQuery(value).attr("id").substr(filtersPrefix.length);
//        if (columnsForFilters.indexOf(filterColumnName) === -1){
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

function columnsHideAll(){
    jQuery("#newTable").find(".ui-icon").each(function(idx, column){
        if (jQuery(column).hasClass("ui-icon-hide")){
            jQuery(column).removeClass("ui-icon-hide");
            jQuery(column).addClass("ui-icon-show");
            jQuery(column).closest("th").attr("column_visible","hidden");
        }
    });
    generateNewTable(generateSortedColumns());
}

function columnsShowAll(){
    jQuery("#newTable").find(".ui-icon").each(function(idx, column){
        if (!jQuery(column).hasClass("ui-icon-hide")){
            jQuery(column).removeClass("ui-icon-show");
            jQuery(column).addClass("ui-icon-hide");
            jQuery(column).closest("th").attr("column_visible","visible");
        }
    });
    generateNewTable(generateSortedColumns());
}

function columnsRevert(){
    jQuery("#newTable").find(".ui-icon").each(function(idx, column){
        if (jQuery(column).hasClass("ui-icon-hide")){
            jQuery(column).removeClass("ui-icon-hide");
            jQuery(column).addClass("ui-icon-show");
            jQuery(column).closest("th").attr("column_visible","hidden");
        }
        else{
            jQuery(column).removeClass("ui-icon-show");
            jQuery(column).addClass("ui-icon-hide");
            jQuery(column).closest("th").attr("column_visible","visible");
        }
    });
    generateNewTable(generateSortedColumns());
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

    var transformedTable = transformTable(all_rows, normalColumns, pivotColumns, valueColumn, available_columns);

    var columnsForMatrix = [];
    var columns_tmp = jQuery("#newColumns").find("th");
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
        var columnName = jQuery(value).attr("column_id");
        var columnVisible = jQuery(value).attr("column_visible");
        if (columnVisible === 'visible'){
            if (transformedTable.properties[columnName].valueType === 'number'){

                if (chartType === 'ScatterChart'){
                    columnsForMatrix.push(key_idx);
                }
                else {
                    columnsForMatrix.push(allKey_idx);
                }
                columnNamesForMatrix.push(columnName);
                columnNiceNamesForMatrix.push(jQuery(value).find("span").html());
                key_idx++;
            }

            if (jQuery.inArray(transformedTable.properties[columnName].valueType, unAllowedTypes) === -1){
                allAllowedColumnsForMatrix.push(allKey_idx);
                allAllowedColumnNamesForMatrix.push(columnName);
                allAllowedColumnNiceNamesForMatrix.push(jQuery(value).find("span").html());
            }

            allColumnsForMatrix.push(allKey_idx);
            allColumnNamesForMatrix.push(columnName);
            allColumnNiceNamesForMatrix.push(jQuery(value).find("span").html());
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

    if ((cols_nr < 1) || (rows_nr < 1)){
        DavizEdit.Status.stop("Done");
        alert("At least 1 string and 1 numeric columns have to be visible!");
        return;
    }

    var dotsForMatrixChart;
    var data;
    if (chartType === 'ScatterChart'){
        dotsForMatrixChart = Math.max(Math.round(matrixChartMatrixMaxDots / ((cols_nr * cols_nr - cols_nr) / 2)), matrixChartMinDots);
        data = prepareForChart(transformedTable, columnNamesForMatrix, dotsForMatrixChart);
    }
    else {
        dotsForMatrixChart = 30;
        //Math.max(Math.round(matrixChartMatrixMaxDots / (rows_nr * cols_nr)), matrixChartMinDots);
        data = prepareForChart(transformedTable, allColumnNamesForMatrix, dotsForMatrixChart);
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
                    if (chartType === 'ScatterChart'){
                        sc_col_name1 = columnNiceNamesForMatrix[col_nr];
                        sc_col_name2 = columnNiceNamesForMatrix[row_nr];
                        sc_col1 = columnNamesForMatrix[col_nr];
                        sc_col2 = columnNamesForMatrix[row_nr];
                        chart_data = prepareForChart(transformedTable, columnNamesForMatrix);
                    }
                    else {
                        sc_col_name1 = allColumnNiceNamesForMatrix[row_nr];
                        sc_col_name2 = allColumnNiceNamesForMatrix[col_nr];
                        sc_col1 = allColumnNamesForMatrix[row_nr];
                        sc_col2 = allColumnNamesForMatrix[col_nr];
                        chart_data = prepareForChart(transformedTable, allColumnNamesForMatrix);
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
                                    var firstCol;
                                    var secondCol;
                                    jQuery(this).dialog("close");
                                    jQuery(".matrixChart_dialog").dialog("close");
                                    jQuery("#newTable").find(".ui-icon").each(function(idx, column){
                                        if (jQuery(column).closest("th").attr("column_id") === sc_col1) {
                                            firstCol = jQuery(column).closest("th");
                                        }
                                        if (jQuery(column).closest("th").attr("column_id") === sc_col2) {
                                            secondCol = jQuery(column).closest("th");
                                        }
                                        if (jQuery(column).hasClass("ui-icon-hide") &&
                                            (jQuery(column).closest("th").attr("column_id") != sc_col1) &&
                                            (jQuery(column).closest("th").attr("column_id") != sc_col2)){
                                                jQuery(column).removeClass("ui-icon-hide");
                                                jQuery(column).addClass("ui-icon-show");
                                                jQuery(column).closest("th").attr("column_visible","hidden");
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
                                    jQuery("#newColumns").prepend(secondCol);
                                    jQuery("#newColumns").prepend(firstCol);
                                    generateNewTable(generateSortedColumns());
                                }
                            },
                            {
                                text: "Cancel",
                                click: function(){
                                    jQuery(this).dialog("close");
                                }
                            }],
                        open:function(){
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

function openEditChart(id){
    jQuery("html").append(charteditor_css);
    chartEditor = null;
    var tmp_config = jQuery("#googlechartid_"+id+" .googlechart_configjson").attr('value');
    var tmp_paletteId = typeof(JSON.parse(tmp_config).paletteId) !== 'undefined' ? JSON.parse(tmp_config).paletteId : "";
    var tmp_columns = jQuery("#googlechartid_"+id+" .googlechart_columns").attr('value');
    var tmp_name = jQuery("#googlechartid_"+id+" .googlechart_name").attr('value');
    var tmp_options = jQuery("#googlechartid_"+id+" .googlechart_options").attr('value');
    isFirstEdit = true;
    DavizEdit.Status.start("Updating Tables");
    jQuery(".googlecharts_columns_config").remove();
    var editcolumnsdialog =
    '<div class="googlecharts_columns_config">' +
        '<div id="googlechartid_tmp_chart" style="float:left">' +
            "<input class='googlechart_configjson' type='hidden' value='"+tmp_config+"'/>" +
            "<input class='googlechart_columns' type='hidden' value='"+tmp_columns+"'/>" +
            "<input class='googlechart_paletteid' type='hidden' value='"+tmp_paletteId+"'/>" +
            "<input class='googlechart_options' type='hidden' value='"+tmp_options+"'/>" +
            "<input class='googlechart_name' type='hidden' value='"+tmp_name+"'/>" +

            "<div id='googlechart_editor_container'></div>" +
        '</div>' +
        "<div style='padding-top:20px; padding-left:5px;float:left;width:168px'>"+
        '<div class="buttons">' +
        "<input type='button' class='context' value='Save' onclick='chartEditorSave(\""+id+"\");'/>" +
        "<input style='margin-left:5px;' type='button' class='context' value='Cancel' onclick='chartEditorCancel();'/>" +
        "</div>" +
        "<div id='googlechart_palette_select'>"+
            "<strong style='float:left;'>Select Palette:</strong>"+
            "<select id='googlechart_palettes' style='float:left;' onchange='updatePalette();'>"+
            "</select>"+
            "<div style='clear:both;'> </div>" +
            "<div id='googlechart_preview_palette'> </div>"+
        "</div>"+
        "</div>"+
        "<div style='clear:both;'> </div>" +
        '<div id="googlechart_table_accordion">' +
            '<h3><a href="#">Original Table</a></h3>' +
            '<div>' +
                '<div style="height:200px;overflow:auto">' +
                    '<table id="originalTable" class="googlechartTable">'+
                        '<tr id="originalColumns">'+
                        '</tr>'+
                    '</table>'+
                '</div>'+
            '</div>'+
            '<h3><a href="#">Table Editor</a></h3>' +
            '<div>' +
                '<div style="height:200px;overflow:auto">' +
                    '<strong style="float:left;width:115px;">Table pivots:</strong>' +
                    '<table id="pivotingTable" class="googlechartTable" style="float:left;">'+
                        '<tr id="pivotConfigHeader"></tr>'+
                        '<tr id="pivotConfigDropZones"></tr>'+
                    '</table>'+
                    '<div style="clear:both"></div>'+
                    '<div style="float:left;width:115px">'+
                        '<strong style="float:left;width:100px;">Table for chart:</strong>' +
                        '<input type="button" class="column-show-hide-button context" value="Hide all columns" onclick="columnsHideAll();"/>' +
                        '<input type="button" class="column-show-hide-button context" value="Show all columns" onclick="columnsShowAll();"/>' +
                        '<input type="button" class="column-show-hide-button context" value="Reverse selection" onclick="columnsRevert();"/>' +
                        '<input type="button" class="column-show-hide-button context" value="Scatterplots matrix" onclick="columnsMatrixChart(\'ScatterChart\');"/>' +
                        '<input type="button" class="column-show-hide-button context" value="Other matrices" onclick="columnsMatrixChart();"/>' +
                    '</div>'+
                    '<table id="newTable" class="googlechartTable" style="height:300px;">'+
                    '</table>'+
                    '<div style="clear:both"></div>'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</div>';
    var width = jQuery(window).width() * 0.95;
    var height = jQuery(window).height() * 0.95;
    jQuery(editcolumnsdialog).dialog({title:"Chart Editor",
                dialogClass: 'googlechart-dialog',
                modal:true,
                width: width,
                height: height,
                resizable:true,
                create:function(){
                    editorDialog = jQuery(this);
                },
                close:function(){
                    charteditor_css.remove();
                }
                });

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
            columnSettings.status = 0;
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

    jQuery('#googlechart_table_accordion').accordion({active:1});

    populateTableForPivot();
    $(".draggable").draggable({
            containment:"#headers",
            revert:false,
            start: function(event, ui){
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
    openEditor("tmp_chart");
    DavizEdit.Status.stop("Done");
}

function openAddChartFilterDialog(id){
    jQuery(".googlecharts_filter_config").remove();

    var addfilterdialog = '' +
    '<div class="googlecharts_filter_config">' +
        '<div class="field">' +
            '<label>Column</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Column</div>' +
            '<select class="googlecharts_filter_columns">' +
                '<option value="-1">Select Column</option>'+
            '</select>' +
        '</div>' +
        '<div class="field">' +
            '<label>Type</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Type</div>' +
            '<select class="googlecharts_filter_type">' +
                '<option value="-1">Select Filter Type</option>'+
            '</select>' +
        '</div>' +
    '</div>';

    jQuery(addfilterdialog).dialog({title:"Add Filter",
                dialogClass: 'googlechart-dialog',
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            var selectedColumn = jQuery(".googlecharts_filter_columns").val();
                            var selectedFilter = jQuery(".googlecharts_filter_type").val();
                            var selectedColumnName = "";
                            jQuery(".googlecharts_filter_columns").find("option").each(function(idx, filter){
                                if (jQuery(filter).attr("value") === selectedColumn){
                                    selectedColumnName = jQuery(filter).html();
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
                    },
                    {
                        text: "Cancel",
                        click: function(){
                            jQuery(this).dialog("close");
                        }
                    }
                ]});

    var orderedFilters = jQuery("#googlechart_filters_"+id).sortable('toArray');
    var used_columns = [];

    jQuery(orderedFilters).each(function(index,value){
        used_columns.push(jQuery("#"+value+" .googlechart_filteritem_column").attr("value"));
    });

    var chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    if (chartColumns_str !== ""){
        var preparedColumns = JSON.parse(chartColumns_str).prepared;
        jQuery(preparedColumns).each(function(index, value){
            if ((value.status === 1) && (used_columns.indexOf(value.name) === -1)){
                var column = '<option value="'+value.name+'">'+value.fullname+'</option>';
                jQuery(column).appendTo(".googlecharts_filter_columns");
            }
        });
    }

    jQuery.each(available_filter_types,function(key,value){
        var column = '<option value="'+key+'">'+value+'</option>';
        jQuery(column).appendTo(".googlecharts_filter_type");
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
        chart.width = chartObj.find(".googlechart_width").attr("value");
        chart.height = chartObj.find(".googlechart_height").attr("value");
        chart.filterposition = chartObj.find(".googlechart_filterposition:checked").attr("value");
        chart.options = chartObj.find(".googlechart_options").attr("value");
        chart.isThumb = chartObj.find(".googlechart_thumb_checkbox").attr("checked");
        chart.dashboard = jQuery.data(chartObj[0], 'dashboard');
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
            if (thumbId){
                var chartSettings=[];
                var chartObj = jQuery("#googlechartid_"+thumbId);
                chartSettings[0] = thumbId;
                config_str = chartObj.find(".googlechart_configjson").attr("value");
                if (!config_str){
                    DavizEdit.Status.stop(data);
                }
                else{
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

                    DavizEdit.Status.stop(data);
                    saveThumb(chartSettings);
                }
            }
            else {
                DavizEdit.Status.stop(data);
                alert("There is no chart selected for thumbnail");
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
        jQuery(charts).each(function(index,chart){
            addChart(
                chart.id,
                chart.name,
                chart.config,
                chart.columns,
                JSON.parse(chart.filters),
                chart.width,
                chart.height,
                chart.filterposition,
                chart.options,
                chart.isThumb,
                chart.dashboard
            );
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
    addChart(newChartId, "New Chart",JSON.stringify({'chartType':'Table','options': {'legend':'none'}}), JSON.stringify(newColumns));

    var newChart = jQuery("#googlechartid_"+newChartId);

    markChartAsModified(newChartId);

    jQuery('html, body').animate({
        scrollTop: newChart.offset().top
    });
}

function init_googlecharts_edit(){
    if(!jQuery("#googlecharts_list").length){
        return;
    }

    jQuery("#googlecharts_list").sortable({
        handle : '.googlechart_handle',
        items: 'li.googlechart',
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
    jQuery("#googlecharts_list").delegate(".remove_chart_icon","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        var chartToRemove = jQuery("#"+chartId).find(".googlechart_id").attr('value');
        var removeChartDialog = ""+
            "<div>Are you sure you want to delete chart: "+
            "<strong>"+chartToRemove+"</strong>"+
            "</div>";
        jQuery(removeChartDialog).dialog({title:"Remove Chart",
            modal:true,
            dialogClass: 'googlechart-dialog',
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
        jQuery(removeFilterDialog).dialog({title:"Remove Chart",
            modal:true,
            dialogClass: 'googlechart-dialog',
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

    jQuery('input[name=googlechart.googlecharts.actions.save]').unbind('click');
    jQuery('input[name=googlechart.googlecharts.actions.save]').click(function(e){
        saveCharts();
    });

    jQuery('<div>').attr('id', 'preview-iframe').appendTo("body");

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

        self.attr("href", action);
        self.attr('rel', '#preview-iframe');
        self.overlay({
            onBeforeLoad: function() {
                jQuery('#preview-iframe iframe').remove();
                var width = chartObj.find(".googlechart_width").val();
                var height = chartObj.find(".googlechart_height").val();
                jQuery('#preview-iframe').append(
                    jQuery('<iframe>')
                        .attr('width', parseInt(width, 10))
                        .attr('height', parseInt(height, 10)));
                var config_json = JSON.parse(previewChartObj.find(".googlechart_configjson").attr("value"));
                config_json.dataTable = [];
                var config_str = JSON.stringify(config_json);
                var name = previewChartObj.find(".googlechart_name").attr("value");
                var query = {'preview_tmp_chart':'{"json":"'+encodeURIComponent(config_str)+'","options":"'+encodeURIComponent(previewChartObj.find(".googlechart_options").attr("value"))+'","columns":"'+encodeURIComponent(previewChartObj.find(".googlechart_columns").attr("value"))+'","width":'+width+',"height":'+height+',"name":"'+name+'"}'};
                jQuery.ajax({
                    url:ajax_baseurl+"/googlechart.set_iframe_chart",
                    type:'post',
                    data:query,
                    success:function(data){
                        jQuery('#preview-iframe iframe').remove();
                        jQuery('#preview-iframe').append(
                            jQuery('<iframe>')
                                .attr('src', self.attr('href'))
                                .attr('width', parseInt(width, 10))
                                .attr('height', parseInt(height, 10)));
                    }
                });

            }
        });
    });
    loadCharts();
}


jQuery(document).ready(function(){
    charteditor_css = jQuery("link[rel=stylesheet][href*=charteditor]");
    charteditor_css.remove();

    init_googlecharts_edit();
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        init_googlecharts_edit();
    });
});
