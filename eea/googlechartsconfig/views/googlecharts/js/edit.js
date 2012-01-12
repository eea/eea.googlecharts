var chartEditor = null;
var chartId = '';

defaultChart = {
           'chartType':'LineChart',
           "dataTable": [["column1", "column2"], ["A", 1], ["B", 2], ["C", 3], ["D", 2]],
           'options': {'legend':'none'},
    };

col0 = ["A", "B", "C", "D"];
cols = [[1, 8, 2, 4],
        [4, 1, 5, 7],
        [9, 3, 4, 6],
        [8, 4, 2, 6],
        [5, 2, 7, 1]];

function openEditor(elementId) {
    chartId = elementId;
    title = jQuery("#googlechartid_"+elementId+" .googlechart-name").attr("value");

    chartColumns_str = jQuery("#googlechartid_"+elementId+" .googlechart-columns").val();
    if (chartColumns_str == ""){
        chartColumns = []
    }
    else{
        chartColumns = JSON.parse(chartColumns_str);
    }

    if (chartColumns.length > 0){
        dataTable = [];

        available_column_values = [];
        available_column_labels = [];

        jQuery(available_columns).each(function(index,value){
            available_column_values.push(value[0]);
            available_column_labels.push(value[1]);
        });
        columnHeaders = [];
        jQuery(chartColumns).each(function(index,value){
            pos = available_column_values.find(value);
            if (pos){
                columnHeaders.push(available_column_labels[pos[0]]);
            }
        });
        dataTable.push(columnHeaders)

        columns_nr = columnHeaders.length;

        for (i = 0; i < 4; i++){
            row = [];
            row.push(col0[i]);
            for (j = 0; j < columns_nr -1; j++){
                row.push(cols[j%5][i]+Math.floor(j/5));
            }
            dataTable.push(row);
        }
    }

    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        chart = wrapperJSON;
    }
    else{
        chart = defaultChart;
    }


    if (chartColumns.length > 0){
        chart.dataTable = dataTable;
    }
    chart.options.title = title;
    var wrapper = new google.visualization.ChartWrapper(chart);

    chartEditor = new google.visualization.ChartEditor();
    google.visualization.events.addListener(chartEditor, 'ok', redrawChart);
    chartEditor.openDialog(wrapper, {});
}

function drawChart(elementId){
    wrapperString = jQuery("#googlechartid_"+elementId+" .googlechart-configjson").attr('value');
    if (wrapperString.length > 0){
        wrapperJSON = JSON.parse(wrapperString);
        wrapperJSON['containerId']="googlechart_chart_div_"+elementId;
        var wrapper = new google.visualization.ChartWrapper(wrapperJSON);
        wrapper.draw();
    }
}
function redrawChart(){
    jsonString = chartEditor.getChartWrapper().toJSON();
    jQuery("#googlechartid_"+chartId+" .googlechart-configjson").attr('value',jsonString);
    chartEditor.getChartWrapper().draw(jQuery("#googlechart_chart_div_"+chartId)[0]);
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

    available_column_values = [];
    available_column_labels = [];

    jQuery(available_columns).each(function(index,value){
        if (!chartColumns.find(value[0])){
            column = '<option value="'+value[0]+'">'+value[1]+'</option>';
            jQuery(column).appendTo(".googlecharts-columns-from");
        }
        else{
            available_column_values.push(value[0]);
            available_column_labels.push(value[1]);
        }
    });
    jQuery(chartColumns).each(function(index,value){
        pos = available_column_values.find(value);
        if (pos){
            column = '<option value="'+value+'">'+available_column_labels[pos[0]]+'</option>';
            jQuery(column).appendTo(".googlecharts-columns-to");
        }
    });
}

jQuery(document).ready(function($){

    function addChart(id, name, config, columns){
        config = typeof(config) != 'undefined' ? config : "";
        columns = typeof(columns) != 'undefined' ? columns : "";

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
                <h1 class='googlechart-handle'>"+name+"<div class='ui-icon ui-icon-trash' title='Delete chart'>x</div></h1>\
                <div>\
                    <div id='googlechart_chart_div_"+id+"' class='chart_div' style='max-height: 350px; max-width:600px'></div>\
                </div>\
                <input type='button' value='Edit Chart' onclick='openEditor(\""+id+"\");'/>\
                <input type='button' value='Edit Columns' onclick='openEditColumns(\""+id+"\");'/>\
            </li>";
        jQuery(googlechart).appendTo("#googlecharts-list");
        drawChart(id);
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
            chart.columns = jQuery("#"+value+" .googlechart-columns").attr("value");
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
                        addChart(chart.id,chart.name,chart.config,chart.columns);
                    })
                }
                DavizEdit.Status.stop("Done");
            }
        });

    }
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
    jQuery("#googlecharts-list").delegate(".ui-icon-trash","click",function(){
                    removeChart(jQuery(this).closest('.googlechart').attr('id')); 
                    });

    jQuery('#googlecharts-submit').click(function(e){
        saveCharts();
    });

    var api = jQuery("#daviz-views-edit ul.formTabs").data("tabs");
    api.onClick(function(e, index) {
        if (jQuery(api.getTabs()[index]).attr('href').indexOf('googlechart-googlecharts') != -1){
            if (jQuery(api.getTabs()[index]).attr('loaded') != 'loaded'){
                jQuery(api.getTabs()[index]).attr('loaded','loaded');
                loadCharts();
            }
        }
    });
});

