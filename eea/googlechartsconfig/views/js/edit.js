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
        "<div class='googlechart-dialog-errormsg'>" +
            "Required input is missing" +
        "</div>";
    errorMsgInvalid = "" +
        "<div class='googlechart-dialog-errormsg'>" +
            "Required input is not valid" +
        "</div>";
    errorMsgUsed = "" +
        "<div class='googlechart-dialog-errormsg'>" +
            "Required input is already in use" +
        "</div>";
    jQuery('.googlechart-dialog-chartname-div').removeClass('error');
    jQuery('.googlechart-dialog-chartid-div').removeClass('error');

    isValid = true;
    var reText=/^[a-zA-Z][a-zA-Z0-9]*$/;
    jQuery('.googlechart-dialog-errormsg').remove();
    chartId = jQuery(".googlechart-dialog-chartid").val();
    chartName = jQuery(".googlechart-dialog-chartname").val();
    errorOnName = false;
    errorOnId = false;
    if (chartName.trim().length === 0){
        ('.googlechart-dialog-chartname').before(errorMsgMissing);
        errorOnName = true;
        isValid = false;
    }
    if (chartId.trim().length === 0){
        jQuery('.googlechart-dialog-chartid').before(errorMsgMissing);
        errorOnId = true;
        isValid = false;
    }
    else
        if (!reText.test(chartId)){
            jQuery('.googlechart-dialog-chartid').before(errorMsgInvalid);
            errorOnId = true;
            isValid = false;
        }
    alreadyUsed = false;
    var chart_ids = jQuery(".googlechart > .googlechart-id");
    inUse = false;
    jQuery(chart_ids).each(function(){
        if (chartId == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart-dialog-chartid').before(errorMsgUsed);
        errorOnId = true;
        isValid = false;
    }

    var chart_names = jQuery(".googlechart > .googlechart-name");
    inUse = false;
    jQuery(chart_names).each(function(){
        if (chartName == this.value){
            inUse = true;
        }
    });
    if (inUse){
        jQuery('.googlechart-dialog-chartname').before(errorMsgUsed);
        isValid = false;
        errorOnName = true;
    }
    if (errorOnName){
        jQuery('.googlechart-dialog-chartname-div').addClass('error');
    }
    if (errorOnId){
        jQuery('.googlechart-dialog-chartid-div').addClass('error');
    }
    return isValid;
}

function openAddDialog(){
    jQuery(".googlecharts-addchart-dialog").remove();
    addchartdialog = "" +
        "<div class='googlecharts-addchart-dialog'>" +
            "<div class='googlechart-dialog-chartid-div field'>" +
                "<label>Id</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Id of the chart (e.g. firstchart)</div>" +
                "<input class='googlechart-dialog-chartid' type='text'/>" +
            "</div>" +
            "<div class='googlechart-dialog-chartname-div field'>" +
                "<label>Friendly Name</label>" +
                "<span class='required' style='color: #f00;' title='Required'> ■ </span>" +
                "<div class='formHelp'>Friendly name of the chart (e.g. My first chart)</div>" +
                "<input class='googlechart-dialog-chartname' type='text'/>" +
            "</div>" +
        "</div>";
    jQuery(addchartdialog).dialog({title:"Add Chart",
            modal:true,
            buttons:[
                {
                    text: "Add",
                    click: function(){
                        if (isValidAddDialog()){
                            addChart(jQuery(".googlechart-dialog-chartid").val(),
                                jQuery(".googlechart-dialog-chartname").val());
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

function addFilter(id, column, filtertype){
    filter = "<li class='googlechart-filteritem' id='googlechart-filter_"+id+"_"+column+"'>" +
                "<h1 class='googlechart-filteritem_"+id+"'>"+available_columns[column]+"<div class='ui-icon ui-icon-trash remove-filter-icon' title='Delete filter'>x</div></h1>" +
                available_filter_types[filtertype] +
                "<input type='hidden' class='googlechart-filteritem-type' value='"+filtertype+"'/>" +
                "<input type='hidden' class='googlechart-filteritem-column' value='"+column+"'/>" +
             "</li>";
    jQuery(filter).appendTo("#googlechart_filters_"+id);
}

function drawChart(elementId, add){
    add = typeof(add) != 'undefined' ? add : "";

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON.containerId = "googlechart_chart_div_" + elementId;

        dataTable=[];
        chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart-columns").val();
        if (chartColumns_str === ""){
            chartColumns = [];
        }
        else{
            chartColumns = JSON.parse(chartColumns_str);
        }
        if (chartColumns.length > 0){
            columnlabels = [];
            jQuery(chartColumns).each(function(index,chart_token){
                columnlabels.push(available_columns[chart_token]);
            });
            dataTable.push(columnlabels);
            jQuery(merged_rows.items).each(function(index, merged_row){
                row = [];
                jQuery(chartColumns).each(function(index,chart_token){
                    row.push(merged_row[chart_token]);
                });
                dataTable.push(row);
            });
        }

        wrapperJSON.dataTable = dataTable;

        var wrapper = new google.visualization.ChartWrapper(wrapperJSON);
        wrapper.draw();
    }
}

function markAllChartsAsModified(){
    jQuery(".googlechart").each(function(){
        jQuery(this).addClass("googlechart-modified");
    });
}

function markChartAsModified(id){
    chartObj = jQuery("#googlechartid_"+id);
    chartObj.addClass("googlechart-modified");
}

function addChart(id, name, config, columns, filters, width, height, filter_pos){
    config = typeof(config) !== 'undefined' ? config : "";
    columns = typeof(columns) !== 'undefined' ? columns : "";
    filters = typeof(filters) !== 'undefined' ? filters : {};
    width = typeof(width) !== 'undefined' ? width : 800;
    height = typeof(height) !== 'undefined' ? height : 600;
    filter_pos = typeof(filter_pos) !== 'undefined' ? filter_pos : 0;

    shouldMark = false;
    if (config === ""){
        shouldMark = true;
        chart = defaultChart;
        chart.options.title = name;
        config = JSON.stringify(chart);
    }
    googlechart = "" +
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>" +
            "<input class='googlechart-id' type='hidden' value='"+id+"'/>" +
            "<input class='googlechart-configjson' type='hidden' value='"+config+"'/>" +
            "<input class='googlechart-columns' type='hidden' value='"+columns+"'/>" +

            "<h1 class='googlechart-handle'>"+id+"<div class='ui-icon ui-icon-trash remove-chart-icon' title='Delete chart'>x</div></h1>" +
            "<table>"+
                "<tr>"+
                    "<td>"+
                        "Friendly name:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart-name' type='text' value='"+name+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                        "Width: "+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart-width' type='text' value='"+width+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                        "Filter position:"+
                        "<input type='radio' class='googlechart-filterposition' name='googlechart-filterposition_"+id+"' value='0' "+((filter_pos == 0)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Top" +
                        "<input type='radio' class='googlechart-filterposition' name='googlechart-filterposition_"+id+"' value='1' "+((filter_pos == 1)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Left" +
                        "<input type='radio' class='googlechart-filterposition' name='googlechart-filterposition_"+id+"' value='2' "+((filter_pos == 2)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Bottom" +
                        "<input type='radio' class='googlechart-filterposition' name='googlechart-filterposition_"+id+"' value='3' "+((filter_pos == 3)?"checked='checked'":"")+"' onchange='markChartAsModified(\""+id+"\");'/>Right" +
                    "</td>"+
                "</tr>"+
                "<tr>"+
                    "<td></td>"+
                    "<td></td>"+
                    "<td>"+
                        "Height:"+
                    "</td>"+
                    "<td>"+
                        "<input class='googlechart-height' type='text' value='"+height+"' style='width:100px' onchange='markChartAsModified(\""+id+"\");'/>" +
                    "</td>"+
                    "<td>"+
                    "</td>"+
                "</tr>"+
            "</table>"+
            "<div style='float:left'>" +
                "<div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 350px; max-width:500px; overflow:auto'></div>" +
            "</div>" +
            "<div style='float:right; width:180px'>" +
                "Filters" +
                "<span class='ui-icon ui-icon-plus ui-corner-all addgooglechartfilter' title='Add new filter'></span>" +
                "<ul class='googlechart_filters_list'  id='googlechart_filters_"+id+"'>" +
                "</ul>" +
            "</div>" +
            "<div style='clear:both'> </div>" +
            "<input type='button' value='Edit Columns' onclick='openEditColumns(\""+id+"\");'/>" +
            "<input type='button' value='Edit Chart' onclick='openEditor(\""+id+"\");'/>" +
            "<a style='float:right' class='preview-button'>Preview Chart</a>"+
        "</li>";
    jQuery(googlechart).appendTo("#googlecharts-list");

    jQuery("#googlechart_filters_"+id).sortable({
        handle : '.googlechart-filteritem_'+id,
        stop: function(event,ui){
            console.log(id);
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

function openEditColumns(id){
    jQuery(".googlecharts-columns-config").remove();
    editcolumnsdialog =
    '<div class="googlecharts-columns-config">' +
        '<table border="0" class="ordered-selection-field">' +
            '<tr>' +
                '<td>' +
                    '<select id="googlecharts.columns.from" name="googlecharts.columns.from" class="googlecharts-columns-from" size="5" multiple="multiple">' +
                    '</select>' +
                '</td>' +
                '<td>' +
                    '<button name="from2toButton" type="button" value=" -&gt;" onclick="javascript:from2to(\'googlecharts.columns\')">&nbsp;-&gt;</button>' +
                    '<br />' +
                    '<button name="to2fromButton" type="button" value="&lt;- " onclick="javascript:to2from(\'googlecharts.columns\')">&lt;-&nbsp;</button>' +
                '</td>' +
                '<td>' +
                    '<select id="googlecharts.columns.to" name="googlecharts.columns.to" class="googlecharts-columns-to" size="5" multiple="multiple">' +
                    '</select>' +
                    '<input name="googlecharts.columns-empty-marker" type="hidden" />' +
                    '<span id="googlecharts.columns.toDataContainer">' +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<button name="upButton" type="button" value="^" onclick="javascript:moveUp(\'googlecharts.columns\')">^</button>' +
                    '<br />' +
                    '<button name="downButton" type="button" value="v" onclick="javascript:moveDown(\'googlecharts.columns\')">v</button>' +
                '</td>' +
            '</tr>' +
        '</table>' +
    '</div>';

    jQuery(editcolumnsdialog).dialog({title:"Edit Columns",
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            selectedOptions = jQuery(".googlecharts-columns-to option");
                            columns=[];
                            selectedOptions.each(function(){
                                columns.push(jQuery(this).attr('value'));
                            });
                            columns_str = JSON.stringify(columns);
                            jQuery("#googlechartid_"+id+" .googlechart-columns").val(columns_str);
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
    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart-columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    jQuery.each(available_columns,function(key,value){
        if (!chartColumns.find(key)){
            column = '<option value="'+key+'">'+value+'</option>';
            jQuery(column).appendTo(".googlecharts-columns-from");
        }
    });
    jQuery(chartColumns).each(function(index,key){
        if (available_columns[key]){
            column = '<option value="'+key+'">'+available_columns[key]+'</option>';
            jQuery(column).appendTo(".googlecharts-columns-to");
        }
    });
}

function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    chartObj = jQuery("#googlechartid_"+chartId);
    chartObj.find(".googlechart-configjson").attr('value',jsonString);
    chartObj.find(".googlechart-name").attr('value',chartEditor.getChartWrapper().getOption('title'));
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
    markChartAsModified(chartId);
}

function openEditor(elementId) {
    chartId = elementId;
    chartObj = jQuery("#googlechartid_"+elementId);
    title = chartObj.find(".googlechart-name").attr("value");

    wrapperString = chartObj.find(".googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }

    dataTable=[];
    chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart-columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }
    if (chartColumns.length > 0){
        columnlabels = [];
        jQuery(chartColumns).each(function(index,chart_token){
            columnlabels.push(available_columns[chart_token]);
        });
        dataTable = [];
        dataTable.push(columnlabels);
        jQuery(merged_rows.items).each(function(index, merged_row){
            row = [];
            jQuery(chartColumns).each(function(index,chart_token){
                row.push(merged_row[chart_token]);
            });
            dataTable.push(row);
        });
    }

    chart.dataTable = dataTable;

    chart.options.title = title;
    var wrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);
    chartEditor.openDialog(wrapper, {});
}

function openAddChartFilterDialog(id){
    jQuery(".googlecharts-filter-config").remove();

    addfilterdialog = '' +
    '<div class="googlecharts-filter-config">' +
        '<div class="field">' +
            '<label>Column</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Column</div>' +
            '<select class="googlecharts-filter-columns">' +
            '</select>' +
        '</div>' +
        '<div class="field">' +
            '<label>Type</label>' +
            '<span class="required" style="color: #f00;" title="Required"> ■ </span>' +
            '<div class="formHelp">Filter Type</div>' +
            '<select class="googlecharts-filter-type">' +
            '</select>' +
        '</div>' +
    '</div>';

    jQuery(addfilterdialog).dialog({title:"Add Filter",
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            addFilter(id, jQuery(".googlecharts-filter-columns").val(),
                                jQuery(".googlecharts-filter-type").val());
                            console.log(id);
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


    var orderedFilter = jQuery("#googlechart_filters_"+id).sortable('toArray');
    used_columns = [];

    jQuery(orderedFilter).each(function(index,value){
            used_columns.push(jQuery("#"+value+" .googlechart-filteritem-column").attr("value"));
    });

    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart-columns").val();
    if (chartColumns_str === ""){
        chartColumns = [];
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    jQuery.each(available_columns,function(key,value){
        if (!used_columns.find(key)){
            if (chartColumns.find(key)){
                column = '<option value="'+key+'">'+value+'</option>';
                jQuery(column).appendTo(".googlecharts-filter-columns");
            }
        }
    });

    jQuery.each(available_filter_types,function(key,value){
        column = '<option value="'+key+'">'+value+'</option>';
        jQuery(column).appendTo(".googlecharts-filter-type");
    });

}

function removeChart(id){
    jQuery("#"+id).remove();
    markAllChartsAsModified();
}

function saveCharts(){
    DavizEdit.Status.start("Saving Charts");
    var ordered = jQuery('#googlecharts-list').sortable('toArray');
    var jsonObj = {};
    charts = [];
    jQuery(ordered).each(function(index, value){
        var chartObj = jQuery("#"+value);
        chartObj.removeClass("googlechart-modified");
        var chart = {};
        chart.id = chartObj.find(".googlechart-id").attr("value");
        chart.name = chartObj.find(".googlechart-name").attr("value");
        chart.config = chartObj.find(".googlechart-configjson").attr("value");
        chart.width = chartObj.find(".googlechart-width").attr("value");
        chart.height = chartObj.find(".googlechart-height").attr("value");
        chart.filterposition = chartObj.find(".googlechart-filterposition:checked").attr("value");
        config = JSON.parse(chart.config);
        config.options.title = chart.name;
        config.dataTable = [];
        chart.config = JSON.stringify(config);
        chart.columns = chartObj.find(".googlechart-columns").attr("value");
        id = "googlechart_filters_"+chart.id;
        var orderedFilter = jQuery("#googlechart_filters_"+chart.id).sortable('toArray');
        filters = {};

        jQuery(orderedFilter).each(function(index,filter){
            filters[jQuery("#"+filter+" .googlechart-filteritem-column").attr("value")] = jQuery("#"+filter+" .googlechart-filteritem-type").attr("value");
        });
        chart.filters = JSON.stringify(filters);
        charts.push(chart);
    });
    jsonObj.charts = charts;
    jsonStr = JSON.stringify(jsonObj);
    query = {'charts':jsonStr};
    jQuery.ajax({
        url:ajax_baseurl+"/googlechart.submit_charts",
        type:'post',
        data:query,
        success:function(data){
            DavizEdit.Status.stop(data);
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
                    addChart(chart.id,chart.name,chart.config,chart.columns,JSON.parse(chart.filters), chart.width, chart.height, chart.filterposition);
                });
            }
            DavizEdit.Status.stop("Done");
        }
    });
}

function init_googlecharts_edit(){
    jQuery("#googlecharts-list").sortable({
        handle : '.googlechart-handle',
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
    jQuery("#googlecharts-list").delegate(".remove-chart-icon","click",function(){
        removeChart(jQuery(this).closest('.googlechart').attr('id'));
    });

    jQuery("#googlecharts-list").delegate(".remove-filter-icon","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        markChartAsModified(id);
        jQuery(this).closest('.googlechart-filteritem').remove();
    });

    jQuery("#googlecharts-list").delegate(".addgooglechartfilter","click",function(){
        chartId = jQuery(this).closest('.googlechart').attr('id');
        liName = "googlechartid";
        id = chartId.substr(liName.length+1);
        openAddChartFilterDialog(id);
    });

    jQuery('#googlecharts-submit').click(function(e){
        saveCharts();
    });

    jQuery("#googlecharts-list").delegate("a.preview-button", "hover", function(){
        chartObj = jQuery(this).closest('.googlechart');
        width = chartObj.find(".googlechart-width").attr("value");
        height = chartObj.find(".googlechart-height").attr("value");
        name = chartObj.find(".googlechart-name").attr("value");
        params = "?json="+encodeURIComponent(chartObj.find(".googlechart-configjson").attr("value"));
        params += "&columns="+encodeURIComponent(chartObj.find(".googlechart-columns").attr("value"));
        params += "&width="+width;
        params += "&height="+height;
        params += "&name="+encodeURIComponent(name);
        jQuery(this).attr("href", "chart-full"+params);
        jQuery(this).fancybox({type:'iframe', width:parseInt(width), height:parseInt(height), autoDimensions:false});
    });

    loadCharts();
}

jQuery(document).ready(function($){
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        location.reload();
    });
});
