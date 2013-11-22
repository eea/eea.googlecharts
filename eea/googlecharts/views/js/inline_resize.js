var defaultSize;


function updateMasks(sizes){
    jQuery(".custom-overlay-mask.top")
        .width(sizes.fullWidth)
        .height(sizes.chartTop)
        .offset({left:0, top:0});

    jQuery(".custom-overlay-mask.bottom")
        .width(sizes.fullWidth)
        .height(sizes.fullHeight - sizes.chartHeight - sizes.chartTop)
        .offset({left:0, top:sizes.chartHeight + sizes.chartTop});

    jQuery(".custom-overlay-mask.left")
        .width(sizes.chartLeft)
        .height(sizes.chartHeight)
        .offset({left:0, top: sizes.chartTop});

    jQuery(".custom-overlay-mask.right")
        .width(sizes.fullWidth - sizes.chartLeft - sizes.chartWidth)
        .height(sizes.chartHeight)
        .offset({left:sizes.chartLeft + sizes.chartWidth, top: sizes.chartTop});
}

function resizeChart(options){
    settings = {
        hash: '',
        width: 0,
        height: 0,
        areaLeft: '',
        areaTop: '',
        areaWidth: '',
        areaHeight: ''
    };
    jQuery.extend(settings, options);

    jQuery("#googlechart_dashboard_" + settings.hash).html("");
    var chart_settings = window['settings_' + settings.hash];
    var other_options = window['other_options_' + settings.hash];
    chart_settings[4] = settings.width;
    chart_settings[5] = settings.height;
    chart_settings[1].options.width = settings.width;
    chart_settings[1].options.height = settings.height;
    drawChart(chart_settings, other_options);
}

function disableResize(){
    jQuery(".googlechart-fullchart-resizable").remove();
    jQuery(".custom-overlay-mask").remove();
}

function applyResize(hash){
    disableResize();
}

function cancelResize(hash){
    var chart_settings = window['settings_'+hash];
    chart_settings[4] = defaultSize.chartWidth;
    chart_settings[5] = defaultSize.chartHeight;
    chart_settings[1].options.width = defaultSize.chartWidth;
    chart_settings[1].options.height = defaultSize.chartHeight;

    var options = {
        hash: hash,
        width: defaultSize.chartWidth,
        height: defaultSize.chartHeight
    };

    resizeChart(options);

    disableResize();
}


function getSizes(hash) {
    var view = jQuery("#googlechart_view_" + hash);
    var sizes = {};
    sizes.chartWidth = view.width();
    sizes.chartHeight = view.height();
    sizes.chartLeft = view.offset().left;
    sizes.chartTop = view.offset().top;
    sizes.fullWidth = jQuery("body").width();
    sizes.fullHeight = jQuery("body").height();
    return sizes;
}

function drawOverlays(hash){
    var sizes = getSizes(hash);
    updateMasks(sizes);

    var fullChart = jQuery("<div class='googlechart-fullchart-resizable'></div>");
    var chartHeader = jQuery("<div class='googlechart-fullchart-header'></div>");
    var btnCancel = jQuery("<a class='standardButton googlechart-inline-cancel'>Cancel</div>");
    var btnApply = jQuery("<a class='standardButton googlechart-inline-apply'>Apply</div>");

    btnApply.appendTo(chartHeader);
    btnCancel.appendTo(chartHeader);

    btnCancel.click(function(){
        cancelResize(hash);
    });
    btnApply.click(function(){
        applyResize(hash);
    });
    var chartWidth = jQuery("<input type='number' class='googlechart-fullchart-width googlechart-fullchart-size'/>");
    var chartHeight = jQuery("<input type='number' class='googlechart-fullchart-height googlechart-fullchart-size'/>");
    chartWidth.attr("value", sizes.chartWidth);
    chartHeight.attr("value", sizes.chartHeight);
    chartWidth.appendTo(chartHeader);
    jQuery("<span>x</span>").appendTo(chartHeader);
    chartHeight.appendTo(chartHeader);
    jQuery("<span>px</span>").appendTo(chartHeader);
    jQuery("<div style='clear:both'></div>").appendTo(chartHeader);
    chartHeader.appendTo(fullChart);
    fullChart.width(sizes.chartWidth);
    fullChart.height(sizes.chartHeight);
    fullChart.offset({left:sizes.chartLeft, top:sizes.chartTop});
    fullChart.appendTo("body");
    jQuery('.googlechart-fullchart-resizable').resizable({
        stop: function(){
            var width = jQuery(this).width();
            var height = jQuery(this).height();
            var chart_settings = window['settings_'+hash];

            var options = {
                hash: hash,
                width: width,
                height: height
            };
            resizeChart(options);
            sizes.chartWidth = width;
            sizes.chartHeight = height;
            updateMasks(sizes);
        },
        resize: function(){
            jQuery(".googlechart-fullchart-width").attr("value", jQuery(this).width());
            jQuery(".googlechart-fullchart-height").attr("value", jQuery(this).height());
        }
    });
    jQuery(".googlechart-fullchart-size").change(function(){
        var width = parseInt(jQuery(".googlechart-fullchart-width").attr("value"),0);
        var height = parseInt(jQuery(".googlechart-fullchart-height").attr("value"),0);

        var chart_settings = window['settings_'+hash];

        var options = {
            hash: hash,
            width: width,
            height: height
        };
        resizeChart(options);
        sizes.chartWidth = width;
        sizes.chartHeight = height;
        fullChart.width(width);
        fullChart.height(height);
        updateMasks(sizes);
    });
}


function putMasks(){
    jQuery(".custom-overlay-mask").remove();

    jQuery("<div class='custom-overlay-mask top'></div>").appendTo("body");
    jQuery("<div class='custom-overlay-mask bottom'></div>").appendTo("body");
    jQuery("<div class='custom-overlay-mask left'></div>").appendTo("body");
    jQuery("<div class='custom-overlay-mask right'></div>").appendTo("body");
}




function enableResize(hash){
    defaultSize = getSizes(hash);
    putMasks();
    drawOverlays(hash);
}

jQuery(document).ready(function($){
    var resizeButton = "<a class='standardButton googlechart-inline-resize'>Resize chart</div>";
    jQuery(".embedded-daviz-visualization .standardButton").after(resizeButton);

    jQuery("a.googlechart-inline-resize").click(function(){
        var chartHash = "";
        jQuery.each(jQuery(this).closest(".embedded-daviz-visualization").find(".googlechart_dashboard"), function(idx, chart){
            if (jQuery(chart).is(":visible")){
                chartHash = jQuery(chart).attr("id").substr(22);
            }
        });
        enableResize(chartHash);
    });
});
