var resizableCharts = ['LineChart',
                        'ComboChart',
                        'AreaChart',
                        'SteppedAreaChart',
                        'ColumnChart',
                        'BarChart',
                        'ScatterChart',
                        'BubbleChart',
                        'PieChart'];

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
    return parseInt(pixels,10);
}

if (window.DavizInlineResizer === undefined){
    var DavizInlineResizer = {'version': 'eea.googlecharts'};
    DavizInlineResizer.Events = {};
}

DavizInlineResizer.Events.charts = {
    resized: 'google-chart-inlineresized'
};

DavizInlineResizer.ChartResizer = function(context){
    var self = this;
    self.context = context;
    self.initialize();
};

DavizInlineResizer.ChartResizer.prototype = {
    initialize: function(){
        var self = this;
        self.hash = self.context.attr("id").substr(22);
        self.defaultSize = self.getSizes();

        var chart_settings = window['settings_' + self.hash];
        self.chartAreaConfigurable = false;
        if (resizableCharts.indexOf(chart_settings[1].chartType) !== -1){
            self.chartAreaConfigurable = true;
        }

        self.chartAreaConfigured = false;
        self.startResize();

        if (self.chartAreaConfigurable){
            if (chart_settings[7].chartArea !== undefined){
                self.chartAreaConfigured = true;
                self.defaultChartAreaSize = {
                    width: chart_settings[7].chartArea.width,
                    height: chart_settings[7].chartArea.height,
                    top: chart_settings[7].chartArea.top,
                    left: chart_settings[7].chartArea.left
                };
            }
        }
        self.chartAreaConfiguredFromSettings = self.chartAreaConfigured;

        self.setChartAreaSizes();

    },

    updateMasks: function(sizes){
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
    },

    resizeChart: function(options){
        var self = this;
        settings = {
            width: 0,
            height: 0,
            areaLeft: 0,
            areaTop: 0,
            areaWidth: 0,
            areaHeight: 0
        };
        jQuery.extend(settings, options);
        var chart_settings = window['settings_' + self.hash];
        var other_options = window['other_options_' + self.hash];
        chart_settings[4] = settings.width;
        chart_settings[5] = settings.height;
        chart_settings[1].options.width = settings.width;
        chart_settings[1].options.height = settings.height;

        if (self.chartAreaConfigurable){
            if ((settings.areaLeft !== 0) ||
                (settings.areaTop !== 0) ||
                (settings.areaWidth !== 0) ||
                (settings.areaHeight !== 0)){
                if (self.chartAreaConfigured){
                    chart_settings[7].chartArea = {};
                    chart_settings[7].chartArea.left = settings.areaLeft * 100 / settings.width + "%";
                    chart_settings[7].chartArea.top = settings.areaTop * 100 / settings.height + "%";
                    chart_settings[7].chartArea.width = settings.areaWidth * 100 / settings.width + "%";
                    chart_settings[7].chartArea.height = settings.areaHeight * 100 / settings.height + "%";
                }
            }
        }
        var view = self.context.find(".googlechart_view");
        view.css('width', chart_settings[4]);
        view.css('height', chart_settings[5]);
        gl_charts[chart_settings[1].containerId].setOption('width', chart_settings[4]);
        gl_charts[chart_settings[1].containerId].setOption('height', chart_settings[5]);
        if (chart_settings[7].chartArea) {
            gl_charts[chart_settings[1].containerId].setOption('chartArea', chart_settings[7].chartArea);
        } else {
            gl_charts[chart_settings[1].containerId].setOption('chartArea', undefined);
        }
        gl_charts[chart_settings[1].containerId].draw();
        self.setChartAreaSizes();
    },

    disableResize: function(){
        jQuery(".googlechart-fullchart-resizable").remove();
        jQuery(".custom-overlay-mask").remove();
    },

    applyResize: function(hash){
        var self = this;
        self.disableResize();
        var chart_settings = window['settings_' + self.hash];

        var sizes = self.getSizes();
        var value = {
            chart_id:chart_settings[0],
            width:sizes.chartWidth,
            height:sizes.chartHeight
        };

        if (self.chartAreaConfigured){
            value.chartAreaWidth = chart_settings[7].chartArea.width;
            value.chartAreaHeight = chart_settings[7].chartArea.height;
            value.chartAreaTop = chart_settings[7].chartArea.top;
            value.chartAreaLeft = chart_settings[7].chartArea.left;
        }
        jQuery(self.context).trigger(DavizInlineResizer.Events.charts.resized, value);
    },

    cancelResize: function(hash){
        var self = this;
        var chart_settings = window['settings_'+self.hash];
        chart_settings[4] = self.defaultSize.chartWidth;
        chart_settings[5] = self.defaultSize.chartHeight;
        chart_settings[1].options.width = self.defaultSize.chartWidth;
        chart_settings[1].options.height = self.defaultSize.chartHeight;

        if (self.chartAreaConfigurable){
            if (self.chartAreaConfiguredFromSettings){
                chart_settings[7].chartArea.width = self.defaultChartAreaSize.width;
                chart_settings[7].chartArea.height = self.defaultChartAreaSize.height;
                chart_settings[7].chartArea.top = self.defaultChartAreaSize.top;
                chart_settings[7].chartArea.left = self.defaultChartAreaSize.left;
            }
            else{
                self.chartAreaConfigured = false;
                delete(chart_settings[7].chartArea);
                delete(chart_settings[1].options.chartArea);
            }
        }

        var options = {
            width: self.defaultSize.chartWidth,
            height: self.defaultSize.chartHeight
        };

        self.resizeChart(options);

        self.disableResize();
    },

    getSizes: function() {
        var self = this;
        var view = self.context.find(".googlechart_view");
        var sizes = {};
        sizes.chartWidth = view.width();
        sizes.chartHeight = view.height();
        sizes.chartLeft = view.offset().left;
        sizes.chartTop = view.offset().top;
        sizes.fullWidth = jQuery("body").width();
        sizes.fullHeight = jQuery("body").height();
        return sizes;
    },

    setChartAreaSizes: function() {
        var self = this;
        if (!self.chartAreaConfigurable){
            return;
        }
        var size = self.getSizes();
        parentOffset = jQuery(".googlechart-chartarea-resizable")
                            .parent()
                            .offset();

        var chart_settings = window['settings_' + self.hash];

        var chartAreaWidth = chartAreaAttribute2px("61.8%", size.chartWidth);
        var chartAreaHeight = chartAreaAttribute2px("61.8%", size.chartHeight);
        var chartAreaLeft = chartAreaAttribute2px("19.1%", size.chartWidth);
        var chartAreaTop = chartAreaAttribute2px("19.1%", size.chartHeight);

        if (self.chartAreaConfigured){
            chartAreaWidth = chartAreaAttribute2px(chart_settings[7].chartArea.width, size.chartWidth);
            chartAreaHeight = chartAreaAttribute2px(chart_settings[7].chartArea.height, size.chartHeight);
            chartAreaLeft = chartAreaAttribute2px(chart_settings[7].chartArea.left, size.chartWidth);
            chartAreaTop = chartAreaAttribute2px(chart_settings[7].chartArea.top, size.chartHeight);
        }

        jQuery(".googlechart-chartarea-width")
            .attr("value", chartAreaWidth);

        jQuery(".googlechart-chartarea-height")
            .attr("value", chartAreaHeight);

        jQuery(".googlechart-chartarea-left")
            .attr("value", chartAreaLeft);

        jQuery(".googlechart-chartarea-top")
            .attr("value", chartAreaTop);

        jQuery(".googlechart-chartarea-resizable")
            .width(chartAreaWidth)
            .height(chartAreaHeight)
            .offset({left:parentOffset.left + chartAreaLeft + 4, top:parentOffset.top + chartAreaTop});
    },

    updateChartFromSizes: function() {
        var self = this;

    },

    drawOverlays: function(hash){
        var self = this;
        var sizes = self.getSizes();
        self.updateMasks(sizes);
        jQuery("<div>")
            .addClass("googlechart-fullchart-resizable")
            .width(sizes.chartWidth)
            .height(sizes.chartHeight)
            .offset({left:sizes.chartLeft, top:sizes.chartTop})
            .resizable({
                stop: function(){
                    jQuery(".googlechart-fullchart-width")
                        .trigger("change");
                },
                resize: function(){
                    jQuery(".googlechart-fullchart-width")
                        .attr("value", jQuery(this).width());
                    jQuery(".googlechart-fullchart-height")
                        .attr("value", jQuery(this).height());
                }
            })
            .appendTo("body");
        jQuery("<div>")
            .addClass("googlechart-fullchart-header")
            .appendTo(".googlechart-fullchart-resizable");
        jQuery("<a>")
            .addClass("standardButton googlechart-inline-apply")
            .text("Apply")
            .click(function(){
                self.applyResize();
            })
            .appendTo(".googlechart-fullchart-header");
        jQuery("<a>")
            .addClass("standardButton googlechart-inline-cancel")
            .text("Cancel")
            .click(function(){
                self.cancelResize();
            })
            .appendTo(".googlechart-fullchart-header");

        jQuery("<input>")
            .addClass("googlechart-fullchart-width googlechart-chart-size")
            .attr("type", "number")
            .attr("value", sizes.chartWidth)
            .appendTo(".googlechart-fullchart-header");

        jQuery("<span>x</span>")
            .appendTo(".googlechart-fullchart-header");

        jQuery("<input>")
            .addClass("googlechart-fullchart-height googlechart-chart-size")
            .attr("type", "number")
            .attr("value", sizes.chartHeight)
            .appendTo(".googlechart-fullchart-header");

        jQuery("<span>px</span>")
            .appendTo(".googlechart-fullchart-header");

        jQuery("<div style='clear:both'></div>")
            .appendTo(".googlechart-fullchart-header");

        if (self.chartAreaConfigurable){
            jQuery("<div>")
                .addClass("googlechart-chartarea-resizable")
                .hover(
                    function(){
                        jQuery(".googlechart-fullchart-header")
                            .addClass("googlechart-fullchart-header-hidden");
                    },
                    function(){
                        jQuery(".googlechart-fullchart-header")
                            .removeClass("googlechart-fullchart-header-hidden");
                    }
                )
                .resizable({
                    containment:".googlechart-fullchart-resizable",
                    resize: function(){
                        jQuery(".googlechart-chartarea-width")
                            .attr("value", jQuery(this).width());
                        jQuery(".googlechart-chartarea-height")
                            .attr("value", jQuery(this).height());
                    },
                    stop: function(){
                        jQuery(".googlechart-chartarea-width")
                            .trigger("change");
                    }
                })
                .draggable({
                    containment:".googlechart-fullchart-resizable",
                    drag: function(){
                        parentOffset = jQuery(".googlechart-chartarea-resizable")
                                .parent()
                                .offset();
                        jQuery(".googlechart-chartarea-left")
                            .attr("value", jQuery(this).offset().left - parentOffset.left);
                        jQuery(".googlechart-chartarea-top")
                            .attr("value", jQuery(this).offset().top - parentOffset.top);
                    },
                    stop: function(){
                        jQuery(".googlechart-chartarea-left")
                            .trigger("change");
                    }
                })
                .appendTo(".googlechart-fullchart-resizable");

            jQuery("<div>")
                .addClass("googlechart-chartarea-input googlechart-chartarea-size-input")
                .appendTo(".googlechart-chartarea-resizable");

            jQuery("<span>")
                .text("Drag & Resize Chart Area")
                .appendTo(".googlechart-chartarea-size-input");

            jQuery("<div>")
                .text("Or set the size: ")
                .addClass("googlechart-chartarea-size-input-fields")
                .appendTo(".googlechart-chartarea-size-input");

            jQuery("<div>")
                .addClass("googlechart-chartarea-input googlechart-chartarea-top-input")
                .appendTo(".googlechart-chartarea-resizable");

            jQuery("<div style='clear:both'></div>")
                .appendTo(".googlechart-chartarea-resizable");

            jQuery("<div>")
                .addClass("googlechart-chartarea-input googlechart-chartarea-left-input")
                .appendTo(".googlechart-chartarea-resizable");

            jQuery("<input>")
                .addClass("googlechart-chartarea-width googlechart-chart-size")
                .attr("type", "number")
                .appendTo(".googlechart-chartarea-size-input-fields");

            jQuery("<span>x</span>")
                .appendTo(".googlechart-chartarea-size-input-fields");

            jQuery("<input>")
                .addClass("googlechart-chartarea-height googlechart-chart-size")
                .attr("type", "number")
                .appendTo(".googlechart-chartarea-size-input-fields");

            jQuery("<span>px</span>")
                .appendTo(".googlechart-chartarea-size-input-fields");

            jQuery("<span>top: </span>")
                .appendTo(".googlechart-chartarea-top-input");

            jQuery("<input>")
                .addClass("googlechart-chartarea-top googlechart-chart-size")
                .attr("type", "number")
                .appendTo(".googlechart-chartarea-top-input");

            jQuery("<span>px</span>")
                .appendTo(".googlechart-chartarea-top-input");

            jQuery("<span>left: </span>")
                .appendTo(".googlechart-chartarea-left-input");

            jQuery("<input>")
                .addClass("googlechart-chartarea-left googlechart-chart-size")
                .attr("type", "number")
                .appendTo(".googlechart-chartarea-left-input");

            jQuery("<span>px</span>")
                .appendTo(".googlechart-chartarea-left-input");

        }

        jQuery(".googlechart-chart-size").change(function(){
            var width = parseInt(jQuery(".googlechart-fullchart-width").attr("value"),0);
            var height = parseInt(jQuery(".googlechart-fullchart-height").attr("value"),0);

            var areaWidth = 0;
            var areaHeight = 0;
            var areaLeft = 0;
            var areaTop = 0;

            if (self.chartAreaConfigurable){
                areaWidth = parseInt(jQuery(".googlechart-chartarea-width").attr("value"),0);
                areaHeight = parseInt(jQuery(".googlechart-chartarea-height").attr("value"),0);
                areaLeft = parseInt(jQuery(".googlechart-chartarea-left").attr("value"),0);
                areaTop = parseInt(jQuery(".googlechart-chartarea-top").attr("value"),0);
            }

            if ((jQuery(this).hasClass("googlechart-fullchart-width")) ||
                (jQuery(this).hasClass("googlechart-fullchart-height"))){
                areaWidth = 0;
                areaHeight = 0;
                areaLeft = 0;
                areaTop = 0;
            }

            if ((jQuery(this).hasClass("googlechart-chartarea-width")) ||
                (jQuery(this).hasClass("googlechart-chartarea-height")) ||
                (jQuery(this).hasClass("googlechart-chartarea-top")) ||
                (jQuery(this).hasClass("googlechart-chartarea-left"))){
                    self.chartAreaConfigured = true;
            }

            var options = {
                width: width,
                height: height,
                areaWidth: areaWidth,
                areaHeight: areaHeight,
                areaLeft: areaLeft,
                areaTop: areaTop
            };

            self.resizeChart(options);
            sizes.chartWidth = width;
            sizes.chartHeight = height;
            jQuery(".googlechart-fullchart-resizable")
                .width(width)
                .height(height);
            self.updateMasks(sizes);
        });

    },

    startResize: function(){
        var self = this;
        jQuery(".custom-overlay-mask").remove();
        jQuery("<div class='custom-overlay-mask top'></div>").appendTo("body");
        jQuery("<div class='custom-overlay-mask bottom'></div>").appendTo("body");
        jQuery("<div class='custom-overlay-mask left'></div>").appendTo("body");
        jQuery("<div class='custom-overlay-mask right'></div>").appendTo("body");

        self.drawOverlays();
    }

};

jQuery.fn.EEAChartResizer = function(){
    return this.each(function(){
        var chartResizer = new DavizInlineResizer.ChartResizer(jQuery(this));
    });
};
