jQuery(document).ready(function($){
    function addChart(id, name){
        googlechart = 
            "<li class='googlechart daviz-facet-edit' id='googlechartid_"+id+"'>\
                <input class='googlechart-id' type='hidden' value='"+id+"'/>\
                <input class='googlechart-name' type='hidden' value='"+name+"'/>\
                <h1 class='googlechart-handle'>"+name+"<div class='ui-icon ui-icon-trash' title='Delete chart'>x</div></h1>\
                <div>content</div>\
            </li>";
        jQuery(googlechart).appendTo("#googlecharts-list");
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
        jQuery('.googlechart-dialog-chartname-div:visible').removeClass('error');
        jQuery('.googlechart-dialog-chartid-div:visible').removeClass('error');

        isValid = true;
        var reText=/^[a-zA-Z][a-zA-Z0-9]*$/;
        jQuery('.googlechart-dialog-errormsg').remove();
        chartId = jQuery(".googlechart-dialog-chartid:visible").val();
        chartName = jQuery(".googlechart-dialog-chartname:visible").val();
        errorOnName = false;
        errorOnId = false;
        if (chartName.trim().length == 0){
            ('.googlechart-dialog-chartname:visible').before(errorMsgMissing);
            errorOnName = true;
            isValid = false;
        }
        if (chartId.trim().length == 0){
            jQuery('.googlechart-dialog-chartid:visible').before(errorMsgMissing);
            errorOnId = true;
            isValid = false;
        }
        else
            if (!reText.test(chartId)){
                jQuery('.googlechart-dialog-chartid:visible').before(errorMsgInvalid);
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
            jQuery('.googlechart-dialog-chartid:visible').before(errorMsgUsed);
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
            jQuery('.googlechart-dialog-chartname:visible').before(errorMsgUsed);
            isValid = false;
            errorOnName = true;
        }
        if (errorOnName){
            jQuery('.googlechart-dialog-chartname-div:visible').addClass('error');
        }
        if (errorOnId){
            jQuery('.googlechart-dialog-chartid-div:visible').addClass('error');
        }

        return isValid;
    }
    function openAddDialog(){
        addchartdialog=
            "<div>\
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
                buttons:[
                    {
                        text: "Add",
                        click: function(){
                            if (isValidAddDialog()){
                                addChart(jQuery(".googlechart-dialog-chartid:visible").val(),
                                    jQuery(".googlechart-dialog-chartname:visible").val());
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
            charts.push(chart);
//            console.log(value);
        })
        jsonObj.charts = charts;
        jsonStr = JSON.stringify(jsonObj);
        query = {'charts':jsonStr};
        console.log(JSON.stringify(jsonObj));
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
                    console.log(data);
                    jsonObj = JSON.parse(data);
                    charts = jsonObj.charts;
                    jQuery(charts).each(function(index,chart){
                        addChart(chart.id,chart.name);
                    })
                }
                DavizEdit.Status.stop("Done");
            }
        });

    }
    jQuery("#googlecharts-list").sortable({ 
        handle : '.googlechart-handle'
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

