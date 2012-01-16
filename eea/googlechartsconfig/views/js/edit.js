var chartEditor = null;
var chartId = '';

defaultChart = {
           'chartType':'LineChart',
           "dataTable": [["column1", "column2"], ["A", 1], ["B", 2], ["C", 3], ["D", 2]],
           'options': {'legend':'none'},
    };

available_filter_types = {  0:'Number Range Filter',
                            1:'String Filter',
                            2:'Simple Category Filter',
                            3:'Multiple Category Filter'};

function openAddDialog(){
    jQuery(".googlecharts-addchart-dialog").remove();
    addchartdialog=
        "<div class='googlecharts-addchart-dialog'>\
            <div class='googlechart-dialog-chartid-div field'>\
                <label>Id</label>\
                <span class='required' style='color: #f00;' title='Required'> ■ </span>\
                <div class='formHelp'>Id of the chart (e.g. firstchart)</div>\
                <input class='googlechart-dialog-chartid' type='text'/>\
            </div>\
            <div class='googlechart-dialog-chartname-div field'>\
                <label>Friendly Name</label>\
                <span class='required' style='color: #f00;' title='Required'> ■ </span>\
                <div class='formHelp'>Friendly name of the chart (e.g. My first chart)</div>\
                <input class='googlechart-dialog-chartname' type='text'/>\
            </div>\
        </div>"
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
                },
            ]});
}

function openEditColumns(id){
    jQuery(".googlecharts-columns-config").remove();
    editcolumnsdialog = 
    '<div class="googlecharts-columns-config">\
        <table border="0" class="ordered-selection-field">\
            <tr>\
                <td>\
                    <select id="googlecharts.columns.from" name="googlecharts.columns.from" class="googlecharts-columns-from" size="5" multiple="multiple">\
                    </select>\
                </td>\
                <td>\
                    <button name="from2toButton" type="button" value=" -&gt;" onclick="javascript:from2to(\'googlecharts.columns\')">&nbsp;-&gt;</button>\
                    <br />\
                    <button name="to2fromButton" type="button" value="&lt;- " onclick="javascript:to2from(\'googlecharts.columns\')">&lt;-&nbsp;</button>\
                </td>\
                <td>\
                    <select id="googlecharts.columns.to" name="googlecharts.columns.to" class="googlecharts-columns-to" size="5" multiple="multiple">\
                    </select>\
                    <input name="googlecharts.columns-empty-marker" type="hidden" />\
                    <span id="googlecharts.columns.toDataContainer">\
                    </span>\
                </td>\
                <td>\
                    <button name="upButton" type="button" value="^" onclick="javascript:moveUp(\'googlecharts.columns\')">^</button>\
                    <br />\
                    <button name="downButton" type="button" value="v" onclick="javascript:moveDown(\'googlecharts.columns\')">v</button>\
                </td>\
            </tr>\
        </table>\
    </div>';

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
                            jQuery(this).dialog("close");
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){ 
                            jQuery(this).dialog("close");
                        }
                    },
                ]});
    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart-columns").val();
    if (chartColumns_str == ""){
        chartColumns = []
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

function openEditor(elementId) {
    chartId = elementId;
    title = jQuery("#googlechartid_"+elementId+" .googlechart-name").attr("value");

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }

    dataTable=[];
    chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart-columns").val();
    if (chartColumns_str == ""){
        chartColumns = []
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }
    if (chartColumns.length > 0){
        columnlabels = []
        jQuery(chartColumns).each(function(index,chart_token){
            columnlabels.push(available_columns[chart_token]);
        });
        dataTable = [];
        dataTable.push(columnlabels);
        jQuery(merged_rows.items).each(function(index, merged_row){
            row = []
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

    addfilterdialog = 
    '<div class="googlecharts-filter-config">\
        <div class="field">\
            <label>Column</label>\
            <span class="required" style="color: #f00;" title="Required"> ■ </span>\
            <div class="formHelp">Filter Column</div>\
            <select class="googlecharts-filter-columns">\
            </select>\
        </div>\
        <div class="field">\
            <label>Type</label>\
            <span class="required" style="color: #f00;" title="Required"> ■ </span>\
            <div class="formHelp">Filter Type</div>\
            <select class="googlecharts-filter-type">\
            </select>\
        </div>\
    </div>';

    jQuery(addfilterdialog).dialog({title:"Add Filter",
                modal:true,
                buttons:[
                    {
                        text: "Save",
                        click: function(){
                            addFilter(id, jQuery(".googlecharts-filter-columns").val(),
                                jQuery(".googlecharts-filter-type").val());

                            jQuery(this).dialog("close");
                        }
                    },
                    {
                        text: "Cancel",
                        click: function(){ 
                            jQuery(this).dialog("close");
                        }
                    },
                ]});


    var orderedFilter = jQuery("#googlechart_filters_"+id).sortable('toArray');
    used_columns = [];

    jQuery(orderedFilter).each(function(index,value){
            used_columns.push(jQuery("#"+value+" .googlechart-filteritem-column").attr("value"));
    });

    chartColumns_str = jQuery("#googlechartid_"+id+" .googlechart-columns").val();
    if (chartColumns_str == ""){
        chartColumns = []
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

function addChart(id, name, config, columns, filters){
    config = typeof(config) != 'undefined' ? config : "";
    columns = typeof(columns) != 'undefined' ? columns : "";
    filters = typeof(filters) != 'undefined' ? filters : {};

    if (config == ""){
        chart = defaultChart;
        chart.options.title = name;
        config = JSON.stringify(chart); 
    }
    googlechart = 
        "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>\
            <input class='googlechart-id' type='hidden' value='"+id+"'/>\
            <input class='googlechart-name' type='hidden' value='"+name+"'/>\
            <input class='googlechart-configjson' type='hidden' value='"+config+"'/>\
            <input class='googlechart-columns' type='hidden' value='"+columns+"'/>\
            <h1 class='googlechart-handle'>"+name+"<div class='ui-icon ui-icon-trash remove-chart-icon' title='Delete chart'>x</div></h1>\
            <div style='float:left'>\
                <div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 350px; max-width:600px; overflow:auto'></div>\
            </div>\
            <div style='float:right; width:250px'>\
                Filters\
                <span class='ui-icon ui-icon-plus ui-corner-all addgooglechartfilter' title='Add new filter'></span>\
                <ul class='googlechart_filters_list'  id='googlechart_filters_"+id+"'>\
                </ul>\
            </div>\
            <div style='clear:both'> </div>\
            <input type='button' value='Edit Columns' onclick='openEditColumns(\""+id+"\");'/>\
            <input type='button' value='Edit Chart' onclick='openEditor(\""+id+"\");'/>\
        </li>";
    jQuery(googlechart).appendTo("#googlecharts-list");

    jQuery("#googlechart_filters_"+id).sortable({ 
        handle : '.googlechart-filteritem_'+id
    });

    jQuery("#addgooglechartfilter_"+id).click(openAddDialog);

    drawChart(id);

    jQuery.each(filters,function(key,value){
        addFilter(id, key, value);
    });
}

function addFilter(id, column, filtertype){
    filter = "<li class='googlechart-filteritem' id='googlechart-filter_"+id+"_"+column+"'>\
                <h1 class='googlechart-filteritem_"+id+"'>"+available_columns[column]+"<div class='ui-icon ui-icon-trash remove-filter-icon' title='Delete filter'>x</div></h1>\
                "+available_filter_types[filtertype]+"\
                <input type='hidden' class='googlechart-filteritem-type' value='"+filtertype+"'/>\
                <input type='hidden' class='googlechart-filteritem-column' value='"+column+"'/>\
             </li>"
    jQuery(filter).appendTo("#googlechart_filters_"+id);
}

function removeChart(id){
    jQuery("#"+id).remove()
}

function isValidAddDialog(){
    errorMsgMissing = 
        "<div class='googlechart-dialog-errormsg'>\
            Required input is missing\
        </div>";
    errorMsgInvalid = 
        "<div class='googlechart-dialog-errormsg'>\
            Required input is not valid\
        </div>";
    errorMsgUsed = 
        "<div class='googlechart-dialog-errormsg'>\
            Required input is already in use\
        </div>";
    jQuery('.googlechart-dialog-chartname-div').removeClass('error');
    jQuery('.googlechart-dialog-chartid-div').removeClass('error');

    isValid = true;
    var reText=/^[a-zA-Z][a-zA-Z0-9]*$/;
    jQuery('.googlechart-dialog-errormsg').remove();
    chartId = jQuery(".googlechart-dialog-chartid").val();
    chartName = jQuery(".googlechart-dialog-chartname").val();
    errorOnName = false;
    errorOnId = false;
    if (chartName.trim().length == 0){
        ('.googlechart-dialog-chartname').before(errorMsgMissing);
        errorOnName = true;
        isValid = false;
    }
    if (chartId.trim().length == 0){
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

function drawChart(elementId, add){
    add = typeof(add) != 'undefined' ? add : "";

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON['containerId']="googlechart_chart_div_"+elementId;

        dataTable=[];
        chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart-columns").val();
        if (chartColumns_str == ""){
            chartColumns = []
        }
        else{
            chartColumns = JSON.parse(chartColumns_str);
        }
        if (chartColumns.length > 0){
            columnlabels = []
            jQuery(chartColumns).each(function(index,chart_token){
                columnlabels.push(available_columns[chart_token]);
            });
            dataTable.push(columnlabels);
            jQuery(merged_rows.items).each(function(index, merged_row){
                row = []
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

function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    jQuery("#googlechartid_"+chartId+" .googlechart-configjson").attr('value',jsonString);
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
}

function saveCharts(){
    DavizEdit.Status.start("Saving Charts");
    var ordered = jQuery('#googlecharts-list').sortable('toArray');
    var jsonObj = {};
    charts = []
    jQuery(ordered).each(function(index, value){
        chart = {};
        chart.id = jQuery("#"+value+" .googlechart-id").attr("value");
        chart.name = jQuery("#"+value+" .googlechart-name").attr("value");
        chart.config = jQuery("#"+value+" .googlechart-configjson").attr("value");
        config = JSON.parse(chart.config);
        config.dataTable = [];
        chart.config = JSON.stringify(config);
        chart.columns = jQuery("#"+value+" .googlechart-columns").attr("value");

        id = "googlechart_filters_"+chart.id;
        var orderedFilter = jQuery("#googlechart_filters_"+chart.id).sortable('toArray');
        filters = {}

        jQuery(orderedFilter).each(function(index,value){
/*            filter = [jQuery("#"+value+" .googlechart-filteritem-type").attr("value"),
                    jQuery("#"+value+" .googlechart-filteritem-column").attr("value")];
            filters.push(filter);*/
            filters[jQuery("#"+value+" .googlechart-filteritem-column").attr("value")] = jQuery("#"+value+" .googlechart-filteritem-type").attr("value");
        })
        chart.filters = JSON.stringify(filters);
        charts.push(chart);
    })
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
                    addChart(chart.id,chart.name,chart.config,chart.columns,JSON.parse(chart.filters));
                })
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
                id = draggedItem.substr(liName.length+1)
                drawChart(id);
            }
        }
    }); 

    jQuery("#addgooglechart").click(openAddDialog);
    jQuery("#googlecharts-list").delegate(".remove-chart-icon","click",function(){
        removeChart(jQuery(this).closest('.googlechart').attr('id')); 
    });

    jQuery("#googlecharts-list").delegate(".remove-filter-icon","click",function(){
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
    loadCharts();
}

jQuery(document).ready(function($){
    jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
        location.reload();
    });
});