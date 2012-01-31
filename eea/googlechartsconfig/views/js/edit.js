var chartEditor = null;
var chartId = '';

defaultChart = {
           'chartType':'LineChart',
           "dataTable": [["column1", "column2"], ["A", 1], ["B", 2], ["C", 3], ["D", 2]],
           'options': {'legend':'none'}
    };

available_filter_types = {  0:'Number Range Filter',
                            1:'String Filter',
                            2:'Simple Category Filter',
                            3:'Multiple Category Filter'};

function isValidAddDialog(){
    errorMsgMissing = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is missing" +
        "</div>";
    errorMsgInvalid = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is not valid" +
        "</div>";
    errorMsgUsed = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input is already in use" +
        "</div>";
    jQuery('.googlechart_dialog_chartname_div').removeClass('error');
    jQuery('.googlechart_dialog_chartid_div').removeClass('error');

    isValid = true;
    var reText=/^[a-zA-Z][a-zA-Z0-9]*$/;
    jQuery('.googlechart_dialog_errormsg').remove();
    chartId = jQuery(".googlechart_dialog_chartid").val();
    chartName = jQuery(".googlechart_dialog_chartname").val();
    errorOnName = false;
    errorOnId = false;
    if (chartName.trim().length === 0){
        jQuery('.googlechart_dialog_chartname').before(errorMsgMissing);
        errorOnName = true;
        isValid = false;
    }
    if (chartId.trim().length === 0){
        jQuery('.googlechart_dialog_chartid').before(errorMsgMissing);
        errorOnId = true;
        isValid = false;
    }
    else
        if (!reText.test(chartId)){
            jQuery('.googlechart_dialog_chartid').before(errorMsgInvalid);
            errorOnId = true;
            isValid = false;
        }
    alreadyUsed = false;
    var chart_id = jQuery(".googlechart > .googlechart_id");
    inUse = false;
    jQuery(chart_id).each(function(){
        if (chartId == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart_dialog_chartid').before(errorMsgUsed);
        errorOnId = true;
        isValid = false;
    }

    var chart_names = jQuery(".googlechart > .googlechart_name");
    inUse = false;
    jQuery(chart_names).each(function(){
        if (chartName == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart_dialog_chartname').before(errorMsgUsed);
        isValid = false;
        errorOnName = true;
    }
    if (errorOnName){
        jQuery('.googlechart_dialog_chartname_div').addClass('error');
    }
    if (errorOnId){
        jQuery('.googlechart_dialog_chartid_div').addClass('error');
    }
    return isValid;
}

function openAddDialog(){
    jQuery(".googlecharts_addchart_dialog").remove();
    addchartdialog = "" +
        "<div class='googlecharts_addchart_dialog'>" +
            "<div class='googlechart_dialog_chartid_div field'>" +
                "<label>Id</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Id of the chart (e.g. firstchart)</div>" +
                "<input class='googlechart_dialog_chartid' type='text'/>" +
            "</div>" +
            "<div class='googlechart_dialog_chartname_div field'>" +
                "<label>Friendly Name</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Friendly name of the chart (e.g. My first chart)</div>" +
                "<input class='googlechart_dialog_chartname' type='text'/>" +
            "</div>" +
        "</div>";
    jQuery(addchartdialog).dialog({title:"Add Chart",
            modal:true,
            dialogClass: 'googlechart-dialog',
            buttons:[
                {
                    text: "Add",
                    click: function(){
                        if (isValidAddDialog()){
                            addChart(jQuery(".googlechart_dialog_chartid").val(),
                                jQuery(".googlechart_dialog_chartname").val());
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
}

function openAdvancedOptions(id){
    var errorMsgJSON = "" +
        "<div class='googlechart_dialog_errormsg'>" +
            "Required input must be a valid JSON" +
        "</div>";

    var chartObj = jQuery("#googlechartid_"+id);
    options = chartObj.find(".googlechart_options").attr("value");

    jQuery(".googlecharts_advancedoptions_dialog").remove();

    advancedOptionsDialog = ""+
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
                            tmpOptions = JSON.parse(advancedOptions);
                            chartObj.find(".googlechart_options").attr("value",advancedOptions);
                            markChartAsModified(id);
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

function addFilter(id, column, filtertype){
    filter = "<li class='googlechart_filteritem' id='googlechart_filter_"+id+"_"+column+"'>" +
                "<h1 class='googlechart_filteritem_"+id+"'><div style='float:left;width:90%;height:20px;overflow:hidden' class='googlechart_filteritem_id'>"+(available_columns[column]?available_columns[column]:column)+"</div><div class='ui-icon ui-icon-trash remove_filter_icon' title='Delete filter'>x</div><div style='clear:both'></div></h1>" +
                available_filter_types[filtertype] +
                "<input type='hidden' class='googlechart_filteritem_type' value='"+filtertype+"'/>" +
                "<input type='hidden' class='googlechart_filteritem_column' value='"+column+"'/>" +
             "</li>";
    jQuery(filter).appendTo("#googlechart_filters_"+id);
}

function saveThumb(value){
    DavizEdit.Status.start("Saving Thumb");
    chart_id = value[0];
    chart_json = value[1];
    chart_columns = value[2];
    chart_filters = value[3];
    chart_width = value[4];
    chart_height = value[5];
    chart_filterposition = value[6];
    chart_options = value[7];

//    dataTable = prepareTable(all_rows, chart_columns, available_columns);
    dataTable = prepareTableForChart(all_rows, chart_columns, available_columns);

    drawGoogleChart(
        '', 
        'googlechart_thumb_zone', 
        '',
        chart_id,
        chart_json,
        dataTable,
        '',
        chart_width,
        chart_height,
        '',
        chart_options,
        available_columns,
        function(){
            thumbObj = jQuery("#googlechart_thumb_form");
            thumbObj.find("#filename").attr("value", "thumb");
            thumbObj.find("#type").attr("value","image/png");
            var svg = jQuery("#googlechart_thumb_zone").find("iframe").contents().find("#chartArea").html();
            thumbObj.find("#svg").attr("value",svg);
            jQuery.post("@@googlechart.setthumb",{"svg":svg},function(data){
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

function drawChart(elementId, add){
    add = typeof(add) != 'undefined' ? add : "";

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart_configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON.containerId = "googlechart_chart_div_" + elementId;

        chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();
        if (chartColumns_str === ""){
            chartColumns = [];
            chartColumns.original = {};
            chartColumns.prepared = {};
        }
        else{
            chartColumns = JSON.parse(chartColumns_str);
        }

        dataTable = prepareTableForChart(all_rows, chartColumns, available_columns);

        wrapperJSON.dataTable = dataTable;

        var wrapper = new google.visualization.ChartWrapper(wrapperJSON);
        wrapper.draw();
    }
}

function markAllChartsAsModified(){
    jQuery(".googlechart").each(function(){
        jQuery(this).addClass("googlechart_modified");
    });
}

function markChartAsModified(id){
    chartObj = jQuery("#googlechartid_"+id);
    chartObj.addClass("googlechart_modified");
}

function markChartAsThumb(id){
    jQuery(".googlechart_thumb_checkbox").each(function(){
        checkObj = jQuery(this);
        if (checkObj.attr("id") !== "googlechart_thumb_id_"+id){
            checkObj.attr("checked",false);
        }
        else {
            checkObj.attr("checked",true);
        }
    });
    markChartAsModified(id);
}

function addChart(id, name, config, columns, filters, width, height, filter_pos, options, isThumb){
    config = typeof(config) !== 'undefined' ? config : "";
    columns = typeof(columns) !== 'undefined' ? columns : "";
    filters = typeof(filters) !== 'undefined' ? filters : {};
    width = typeof(width) !== 'undefined' ? width : 800;
    height = typeof(height) !== 'undefined' ? height : 600;
    filter_pos = typeof(filter_pos) !== 'undefined' ? filter_pos : 0;
    options = typeof(options) !== 'undefined' ? options : "{}";
    isThumb = typeof(isThumb) !== 'undefined' ? isThumb : false;

    filter_pos = parseInt(filter_pos,0);
    shouldMark = false;
    if (config === ""){
        shouldMark = true;
        chart = defaultChart;
        chart.options.title = name;
        config = JSON.stringify(chart);
    }
    googlechart = "" +
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>" +
            "<input class='googlechart_id' type='hidden' value='"+id+"'/>" +
            "<input class='googlechart_configjson' type='hidden' value='"+config+"'/>" +
            "<input class='googlechart_columns' type='hidden' value='"+columns+"'/>" +
            "<input class='googlechart_options' type='hidden' value='"+options+"'/>" +

            "<h1 class='googlechart_handle'>"+
            "<div style='float:left;width:70%;height:20px;overflow:hidden;'>"+id+"</div>"+
            "<div class='ui-icon ui-icon-trash remove_chart_icon' title='Delete chart'>x</div>"+
            "<div style='float:right;font-weight:normal;font-size:0.9em;margin-right:10px'>Use this chart as thumb</div>"+
            "<input style='float:right; margin:3px' type='checkbox' class='googlechart_thumb_checkbox' id='googlechart_thumb_id_"+id+"' onChange='markChartAsThumb(\""+id+"\");' "+(isThumb?"checked='checked'":"")+"/>"+
            "<div style='clear:both'> </div>"+
            "</h1>" +
            "<fieldset>" +
            "<table>"+
                "<tr>"+
                    "<td>"+
                        "Friendly name:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_name' type='text' value='"+name+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                        "Width: "+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_width' type='text' value='"+width+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td class='filters_position'>"+
                        "Filter position:"+
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='0' "+((filter_pos === 0)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Top" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='1' "+((filter_pos === 1)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Left" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='2' "+((filter_pos === 2)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Bottom" +
                        "<input type='radio' class='googlechart_filterposition' name='googlechart_filterposition_"+id+"' value='3' "+((filter_pos === 3)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Right" +
                    "</td>"+
                "</tr>"+
                "<tr>"+
                    "<td></td>"+
                    "<td></td>"+
                    "<td>"+
                        "Height:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart_height' type='text' value='"+height+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                    "</td>"+
                "</tr>"+
            "</table>"+
            "<div style='float:left'>" +
                "<div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 350px; max-width:490px; overflow:auto'></div>" +
            "</div>" +
            "<div style='float:right; width:180px'>" +
                "<div style='float:left'>Filters</div>" +
                "<span class='ui-icon ui-icon-plus ui-corner-all addgooglechartfilter' title='Add new filter'></span>" +
                "<div style='clear:both'> </div>" +
                "<ul class='googlechart_filters_list'  id='googlechart_filters_"+id+"'>" +
                "</ul>" +
            "</div>" +
            "<div style='clear:both'> </div>" +
            "<input type='button' class='context' value='Edit Columns' onclick='openEditColumns(\""+id+"\");'/>" +
            "<input type='button' class='context' value='Edit Chart' onclick='openEditor(\""+id+"\");'/>" +
            "<input type='button' class='context' value='Advanced Options' onclick='openAdvancedOptions(\""+id+"\");'/>" +
            "<a style='float:right' class='preview_button'>Preview Chart</a>"+
            "</fieldset>" +
        "</li>";

    jQuery(googlechart).appendTo("#googlecharts_list");

    jQuery("#googlechart_filters_"+id).sortable({
        handle : '.googlechart_filteritem_'+id,
        stop: function(event,ui){
            markChartAsModified(id);
        }
    });

    jQuery("#addgooglechartfilter_"+id).click(openAddDialog);

    drawChart(id);

    jQuery.each(filters,function(key,value){
        addFilter(id, key, value);
    });
    if (shouldMark){
        markChartAsModified(id);
    }
}

function populateNewTable(dataTable){
    DavizEdit.Status.start("Updating Tables");
    columns = jQuery("#newColumns").find("th");
    newColumns = [];
    newColumnTitles = [];
    availableColumns = {};

    hiddenStatus = [];

    jQuery.each(columns, function(idx, value){
        columnName = jQuery(value).find("span").html();
        hidden = jQuery(value).find("div.ui-icon").hasClass("ui-icon-show");
        hiddenStatus.push(hidden);
        found = false;
        jQuery.each(available_columns,function(key,value){
            if (value === columnName){
                availableColumns[key] = value;
                newColumns.push(key);
                newColumnTitles.push(value);
                found = true;
            }
        });
        if (!found){
            availableColumns[columnName] = columnName;
            newColumns.push(columnName);
            newColumnTitles.push(columnName);
        }
    });

    jQuery("#newTable").find("tr").remove();

    newColumnsRow = "<tr id='newColumns'></tr>";
    jQuery(newColumnsRow).appendTo("#newTable");

    idx = 0;

    jQuery(newColumnTitles).each(function(key,value){
        newColumn = '<th>' + 
                        '<span style="float:left;margin-right:2px">' + value + '</span>';
                        if (hiddenStatus[idx]){
                            newColumn += '<div title="Hide facet" class="ui-icon ui-icon-show">h</div>';
                        }
                        else {
                            newColumn += '<div title="Hide facet" class="ui-icon ui-icon-hide">h</div>';
                        }
        newColumn += '</th>';
        jQuery(newColumn).appendTo("#newColumns");
        idx ++;
    });

    newDataTable = prepareTable(dataTable, newColumns, availableColumns);

    jQuery.each(newDataTable, function(row_index,row){
        if (row_index > 0){
            tableRow = "<tr class='newRow'>";
            jQuery.each(row, function(value_index, value){
                tableRow += "<td>" + value + "</td>";
            });
            tableRow += "</tr>";
            jQuery(tableRow).appendTo("#newTable");
        }
    });

    jQuery("#newColumns").sortable({
        stop: function(event,ui){
            populateNewTable(dataTable);
        }
    });

    jQuery(".googlechartTable .ui-icon").click(function(){
        if (jQuery(this).hasClass("ui-icon-hide")){
            jQuery(this).removeClass("ui-icon-hide");
            jQuery(this).addClass("ui-icon-show");
        }
        else{
            jQuery(this).removeClass("ui-icon-show");
            jQuery(this).addClass("ui-icon-hide");
        }
    });

    DavizEdit.Status.stop("Done");

    return dataTable;
}

function generateNewTable(){
    DavizEdit.Status.start("Updating Tables");
    columns = jQuery("#originalColumns").find("th");
    newColumns = [];

    normalColumns = [];
    pivotColumns = [];
    valueColumn = -1;
    allColumns = [];
    jQuery.each(columns, function(idx, value){
        columnType = jQuery(value).find("select").attr("value");
        columnName = jQuery(value).find("span").html();

        jQuery.each(available_columns,function(key,value){
            if (value === columnName){
                allColumns.push(key);
            }
        });

        switch(columnType){
            case "0":
                break;
            case "1":
                newColumns.push(columnName);
                normalColumns.push(idx);
                break;
            case "2":
                pivotColumns.push(idx);
                break;
            case "3":
                valueColumn = idx;
                break;
        }
    });


    newRows = all_rows;
    if (valueColumn != -1){
        dataTable = {};
        newColumns = [];
        dataTable.items = prepareTable(all_rows, allColumns, available_columns);
        newRows = pivotTable(dataTable, normalColumns, pivotColumns, valueColumn, available_columns, all_rows.properties);
        jQuery.each(newRows.properties, function(key,value){
            newColumns.push(key);
        });
    }

    jQuery("#newTable").find("tr").remove();

    newColumnsRow = "<tr id='newColumns'></tr>";
    jQuery(newColumnsRow).appendTo("#newTable");

    jQuery(newColumns).each(function(key,value){
        newColumn = '<th>' + 
                        '<span>' + value + '</span>' +
                    '</th>';
        jQuery(newColumn).appendTo("#newColumns");
    });

    jQuery("#newColumns").sortable({
        stop: function(event,ui){
            populateNewTable(newRows);
        }
    });

    newTable = populateNewTable(newRows);

    DavizEdit.Status.stop("Done");
    return newTable;
}

function openEditColumns(id){
    DavizEdit.Status.start("Updating Tables");
    jQuery(".googlecharts_columns_config").remove();
    editcolumnsdialog =
    '<div class="googlecharts_columns_config">' +
        '<div>' +
            '<div style="float:left;width:48%;overflow:auto">' +
                '<strong>Original Table</strong>'+
                '<table id="originalTable" class="googlechartTable">'+
                    '<tr id="originalColumns">'+
                    '</tr>'+
                '</table>'+
            '</div>'+

            '<div style="float:left; padding-left:10px;width:48%;overflow:auto">' +
                '<strong>New Table</strong>'+
                '<table id="newTable" class="googlechartTable">'+
                '</table>'+
            '</div>'+
        '</div>'+
    '</div>';

    jQuery(editcolumnsdialog).dialog({title:"Edit Columns",
                dialogClass: 'googlechart-dialog',
                modal:true,
                width:1024,
                height:400,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            columnsSettings = {};
                            columnsSettings.original = [];
                            columnsSettings.prepared = [];
                            hasNormal = false;
                            hasPivot = false;
                            hasValue = false;
                            jQuery("#originalColumns").find("th").each(function(){
                                originalColumn = jQuery(this).find("span").html();
                                originalColumnName = originalColumn;
                                originalColumnStatus = parseInt(jQuery(this).find("select").attr("value"),10);
                                original = {};

                                jQuery.each(available_columns,function(key,value){
                                    if (value === originalColumn){
                                        originalColumnName = key;
                                    }
                                });

                                original.name = originalColumnName;
                                original.status = originalColumnStatus;
                                if (originalColumnStatus === 1){
                                    hasNormal = true;
                                }
                                if (originalColumnStatus === 2){
                                    hasPivot = true;
                                }
                                if (originalColumnStatus === 3){
                                    hasValue = true;
                                }
                                columnsSettings.original.push(original);
                            });
                            jQuery("#newColumns").find("th").each(function(){
                                newColumn = jQuery(this).find("span").html();
                                newColumnName = newColumn;
                                jQuery.each(available_columns,function(key,value){
                                    if (value === newColumn){
                                        newColumnName = key;
                                    }
                                });

                                preparedColumn = {};
                                if (jQuery(this).find("div.ui-icon").hasClass("ui-icon-hide")){
                                    newColumnStatus = 1;
                                }
                                else{
                                    newColumnStatus = 0;
                                }
                                preparedColumn.name = newColumnName;
                                preparedColumn.status = newColumnStatus;
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
                            columns_str = JSON.stringify(columnsSettings);
                            jQuery("#googlechartid_"+id+" .googlechart_columns").val(columns_str);
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
    columns = [];

    columns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value");
    if (!columns_str){
        columnsSettings = {};
    }
    else{
        columnsSettings = JSON.parse(jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value"));
    }
    jQuery.each(available_columns,function(key,value){
        originalStatus = 0;
        jQuery(columnsSettings.original).each(function(idx, original){
            if (original.name === key){
                originalStatus = original.status;
            }
        });
        column = '<th>' + 
                    '<span>' + value + '</span>' +
                    '<select onchange="generateNewTable();">' +
                        '<option value="0" ' + ((originalStatus === 0) ? 'selected="selected"':'')+ '>Hidden</option>' +
                        '<option value="1" ' + ((originalStatus === 1) ? 'selected="selected"':'')+ '>Visible</option>' +
                        '<option value="2" ' + ((originalStatus === 2) ? 'selected="selected"':'')+ '>Pivot</option>' +
                        '<option value="3" ' + ((originalStatus === 3) ? 'selected="selected"':'')+ '>Value</option>' +
                    '</select>' +
                 '</th>';
        jQuery(column).appendTo("#originalColumns");
        columns.push(key);
    });

    dataTable = prepareTable(all_rows, columns, available_columns);

    jQuery.each(dataTable, function(row_index,row){
        if (row_index > 0){
            tableRow = "<tr>";
            jQuery.each(row, function(value_index, value){
                tableRow += "<td>" + value + "</td>";
            });
            tableRow += "</tr>";
            jQuery(tableRow).appendTo("#originalTable");
        }
    });

    newDataTable = generateNewTable();

    jQuery("#newColumns").find("th").remove();
    jQuery(columnsSettings.prepared).each(function(idx, prepared){
        preparedName = available_columns[prepared.name];
        if (!preparedName){
            preparedName = prepared.name;
        }
        newColumn = '<th>' + 
                        '<span style="float:left;margin-right:2px">' + preparedName + '</span>';
                        if (prepared.status === 0){
                            newColumn += '<div title="Hide facet" class="ui-icon ui-icon-show">h</div>';
                        }
                        else {
                            newColumn += '<div title="Hide facet" class="ui-icon ui-icon-hide">h</div>';
                        }
        newColumn += '</th>';

        jQuery(newColumn).appendTo("#newColumns");
    });

    populateNewTable(newDataTable);
    DavizEdit.Status.stop("Done");
}

function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    chartObj = jQuery("#googlechartid_"+chartId);
    chartObj.find(".googlechart_configjson").attr('value',jsonString);
    chartObj.find(".googlechart_name").attr('value',chartEditor.getChartWrapper().getOption('title'));
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
    markChartAsModified(chartId);
}

function openEditor(elementId) {
    chartId = elementId;
    chartObj = jQuery("#googlechartid_"+elementId);
    title = chartObj.find(".googlechart_name").attr("value");

    wrapperString = chartObj.find(".googlechart_configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }

    chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart_columns").val();

    chart.dataTable = prepareTableForChart(all_rows,JSON.parse(chartColumns_str),available_columns);

    chart.options.title = title;
    var wrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);
    chartEditor.openDialog(wrapper, {});
}

function openAddChartFilterDialog(id){
    jQuery(".googlecharts_filter_config").remove();


    addfilterdialog = '' +
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
                            selectedColumn = jQuery(".googlecharts_filter_columns").val();
                            selectedFilter = jQuery(".googlecharts_filter_type").val();
                            if ((selectedColumn === '-1') || (selectedFilter === '-1')){
                                alert("Please select column and filter type!");
                            }
                            else{
                                addFilter(id, selectedColumn,selectedFilter);
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


    var orderedFilter = jQuery("#googlechart_filters_"+id).sortable('toArray');
    used_columns = [];

    jQuery(orderedFilter).each(function(index,value){
        used_columns.push(jQuery("#"+value+" .googlechart_filteritem_column").attr("value"));
    });

    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart_columns").val();
    chartColumns = [];
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        preparedColumns = JSON.parse(chartColumns_str).prepared;
        jQuery(preparedColumns).each(function(index, value){
            if (value.status === 1){
                chartColumns.push(value.name);
            }
        });
    }

    columnsSettings = JSON.parse(jQuery("#googlechartid_"+id+" .googlechart_columns").attr("value"));
    availableColumns = {};
    jQuery.each(available_columns,function(key,value){
        availableColumns[key] = value;
    });
    jQuery(columnsSettings.prepared).each(function(idx,value){
        if (!available_columns[value.name]){
            availableColumns[value.name] = value.name;
        }
    });

    jQuery.each(availableColumns,function(key,value){
        if (!used_columns.find(key)){
            if (chartColumns.find(key)){
                column = '<option value="'+key+'">'+value+'</option>';
                jQuery(column).appendTo(".googlecharts_filter_columns");
            }
        }
    });

    jQuery.each(available_filter_types,function(key,value){
        column = '<option value="'+key+'">'+value+'</option>';
        jQuery(column).appendTo(".googlecharts_filter_type");
    });
}

function saveCharts(){
    DavizEdit.Status.start("Saving Charts");
    var ordered = jQuery('#googlecharts_list').sortable('toArray');
    var jsonObj = {};
    charts = [];
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
        config = JSON.parse(chart.config);
        config.options.title = chart.name;
        config.dataTable = [];
        chart.config = JSON.stringify(config);
        chart.columns = chartObj.find(".googlechart_columns").attr("value");
        id = "googlechart_filters_"+chart.id;
        var orderedFilter = jQuery("#googlechart_filters_"+chart.id).sortable('toArray');
        filters = {};

        jQuery(orderedFilter).each(function(index,filter){
            filters[jQuery("#"+filter+" .googlechart_filteritem_column").attr("value")] = jQuery("#"+filter+" .googlechart_filteritem_type").attr("value");
        });
        chart.filters = JSON.stringify(filters);
        charts.push(chart);
        if ((index === 0) || (chart.isThumb)){
            thumbId = chart.id;
        }

    });
    jsonObj.charts = charts;
    jsonStr = JSON.stringify(jsonObj);
    query = {'charts':jsonStr};
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.submit_charts",
        type:'post',
        data:query,
        success:function(data){
            chartSettings=[];
            chartObj = jQuery("#googlechartid_"+thumbId);
            chartSettings[0] = thumbId;
            chartSettings[1] = JSON.parse(chartObj.find(".googlechart_configjson").attr("value"));
            chartSettings[2] = JSON.parse(chartObj.find(".googlechart_columns").attr("value"));
            chartSettings[3] = "";
            chartSettings[4] = chartObj.find(".googlechart_width").attr("value");
            chartSettings[5] = chartObj.find(".googlechart_height").attr("value");
            chartSettings[6] = "";
            chartSettings[7] = JSON.parse(chartObj.find(".googlechart_options").attr("value"));

            DavizEdit.Status.stop(data);

            saveThumb(chartSettings);
        }
    });
}

function loadCharts(){
    DavizEdit.Status.start("Loading Charts");
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.get_charts",
        type:'post',
        success:function(data){
            if (data){
                jsonObj = JSON.parse(data);
                charts = jsonObj.charts;
                jQuery(charts).each(function(index,chart){
                    addChart(chart.id,chart.name,chart.config,chart.columns,JSON.parse(chart.filters), chart.width, chart.height, chart.filterposition, chart.options, chart.isThumb);
                });
            }
            DavizEdit.Status.stop("Done");
        }
    });
}

function init_googlecharts_edit(){
    jQuery("#googlecharts_list").sortable({
        handle : '.googlechart_handle',
        stop: function(event,ui){
            draggedItem = jQuery(ui.item[0]).attr('id');
            liName = "googlechartid";
            if (draggedItem.substr(0,liName.length) == liName){
                id = draggedItem.substr(liName.length+1);
                drawChart(id);
                markChartAsModified(id);
            }
        }
    });

    jQuery("#addgooglechart").click(openAddDialog);
    jQuery("#googlecharts_list").delegate(".remove_chart_icon","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        chartToRemove = jQuery("#"+chartId).find(".googlechart_id").attr('value');
        removeChartDialog = ""+
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
        filterToRemove = jQuery(this).closest('.googlechart_filteritem');
        chartId = jQuery(this).closest('.googlechart').attr('id');
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        title = filterToRemove.find('.googlechart_filteritem_id').html();
        removeFilterDialog = ""+
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
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        openAddChartFilterDialog(id);
    });

    jQuery('#googlecharts_submit').click(function(e){
        saveCharts();
    });

    jQuery("#googlecharts_list").delegate("a.preview_button", "hover", function(){
        chartObj = jQuery(this).closest('.googlechart');
        width = chartObj.find(".googlechart_width").attr("value");
        height = chartObj.find(".googlechart_height").attr("value");
        name = chartObj.find(".googlechart_name").attr("value");
        params = "?json="+encodeURIComponent(chartObj.find(".googlechart_configjson").attr("value"));
        params += "&options="+encodeURIComponent(chartObj.find(".googlechart_options").attr("value"));
        params += "&columns="+encodeURIComponent(chartObj.find(".googlechart_columns").attr("value"));
        params += "&width="+width;
        params += "&height="+height;
        params += "&name="+encodeURIComponent(name);
        jQuery(this).attr("href", "chart-full"+params);
        jQuery(this).fancybox({type:'iframe', width:parseInt(width, 10)+30, height:parseInt(height, 10)+30, autoDimensions:false});
    });

    loadCharts();
}

jQuery(document).ready(function($){
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        location.reload();
    });
});
