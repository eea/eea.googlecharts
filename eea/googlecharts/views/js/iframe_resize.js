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

if (window.DavizIframeResizer === undefined){
    var DavizIframeResizer = {'version': 'eea.googlecharts'};
    DavizIframeResizer.Events = {};
}

DavizIframeResizer.Events.charts = {
    resized: 'google-chart-iframesized'
};

DavizIframeResizer.ChartResizer = function(context){
    var self = this;
    self.context = context;
    self.initialize();
};

DavizIframeResizer.ChartResizer.prototype = {
    initialize: function(){
        var self = this;
        self.iframeDefaultSettings = {src:self.context.attr("src"),
                                    width:self.context.width(),
                                    height:self.context.height()};
        self.iframeNewSettings = {src:self.context.attr("src"),
                                    width:self.context.width(),
                                    height:self.context.height()};
        self.startResize();
        self.setChartAreaSizes();
        self.shouldUpdate = true;

        self.area = jQuery('.googlechart-chartiframe-resizable');
        self.area.append(jQuery('<div>').addClass('googlechart-resize-cleanup'));

        self.lock = jQuery('<div>').addClass('googlechart-resize-status-lock');
        self.message = jQuery('<div>').addClass('googlechart-resize-ajax-loader');
        self.lock.prepend(this.message);
        self.area.prepend(this.lock);
        self.lock.slideUp();
    },

    startMessage: function(msg){
        this.message.html(msg);
        this.lock.slideDown();
    },

    stopMessage: function(msg){
        this.message.html(msg);
        this.lock.delay(1500).slideUp();
    },

    updateMasks: function(sizes){
        var self = this;
        jQuery(".custom-overlay-mask.top")
            .width(sizes.fullWidth)
            .height(sizes.iframeTop)
            .offset({left:0, top:0});

        jQuery(".custom-overlay-mask.bottom")
            .width(sizes.fullWidth)
            .height(sizes.fullHeight - sizes.iframeHeight - sizes.iframeTop)
            .offset({left:0, top:sizes.iframeHeight + sizes.iframeTop});

        jQuery(".custom-overlay-mask.left")
            .width(sizes.iframeLeft)
            .height(sizes.iframeHeight)
            .offset({left:0, top: sizes.iframeTop});

        jQuery(".custom-overlay-mask.right")
            .width(sizes.fullWidth - sizes.iframeLeft - sizes.iframeWidth)
            .height(sizes.iframeHeight)
            .offset({left:sizes.iframeLeft + sizes.iframeWidth, top: sizes.iframeTop});
    },

    resizeIframe: function(options){
        var self = this;
        settings = {
            width: 0,
            height: 0,
            chartWidth: 0,
            chartHeight: 0,
            areaLeft: 0,
            areaTop: 0,
            areaWidth: 0,
            areaHeight: 0,
            hideFilters: false,
            hideNotes: false,
            hideQRCode: false,
            hideWatermark: false,
            hideLink: false
        };
        jQuery.extend(settings, options);
        self.context.width(settings.width);
        self.context.height(settings.height);
        var params = jQuery.deparam(self.iframeNewSettings.src.split("?")[1]);
        if ((parseInt(params.chartWidth, 10) === settings.chartWidth) && (parseInt(params.chartHeight, 10) === settings.chartHeight)){
            delete params.padding;
            if (settings.areaWidth !== 0){
                var top = settings.areaTop;
                var right = settings.chartWidth - settings.areaLeft - settings.areaWidth;
                var bottom = settings.chartHeight - settings.areaTop - settings.areaHeight;
                var left = settings.areaLeft;
                params.padding = top + "," + right + "," + bottom + "," + left;
            }
        }
        else{
            params.chartWidth = settings.chartWidth;
            params.chartHeight = settings.chartHeight;
        }

        if (params.customStyle !== undefined){
            params.customStyle = params.customStyle
                                .split(".googlechart_filters{display:none}").join("")
                                .split(".googlechart-notes{display:none}").join("")
                                .split('div[id*="googlechart_qr_"]{display:none}').join("")
                                .split('div[id*="googlechart_wm_"]{display:none}').join("")
                                .split(".go-to-original-link{display:none}").join("");
        }
        if (settings.hideFilters || settings.hideNotes || settings.hideQRCode || settings.hideWatermark || settings.hideLink){
            if (params.customStyle === undefined){
                params.customStyle = "";
            }
            if (settings.hideFilters){
                params.customStyle += ".googlechart_filters{display:none}";
            }
            if (settings.hideNotes){
                params.customStyle += ".googlechart-notes{display:none}";
            }
            if (settings.hideQRCode){
                params.customStyle += 'div[id*="googlechart_qr_"]{display:none}';
            }
            if (settings.hideWatermark){
                params.customStyle += 'div[id*="googlechart_wm_"]{display:none}';
            }
            if (settings.hideLink){
                params.customStyle += ".go-to-original-link{display:none}";
            }
        }
        var new_src = self.iframeNewSettings.src.split("?")[0] + "?" + jQuery.param(params);
        self.context.attr("src", new_src);

        var loopForSet = function(){
            if (self.shouldUpdate){
                try{
                    self.setChartAreaSizes();
                    self.iframeNewSettings.src = new_src;
                    self.iframeNewSettings.width = settings.width;
                    self.iframeNewSettings.height = settings.height;
                }
                catch (e){
                }
                setTimeout(loopForSet, 500);
            }
        };
        setTimeout(loopForSet, 500);
    },

    disableResize: function(){
        jQuery(".googlechart-chartiframe-resizable").remove();
        jQuery(".custom-overlay-mask").remove();
    },

    applyResize: function(){
        var self = this;
        self.shouldUpdate = false;
        var data = {
                old_src : self.iframeDefaultSettings.src,
                old_width : self.iframeDefaultSettings.width,
                old_height : self.iframeDefaultSettings.height,
                new_src : self.iframeNewSettings.src,
                new_width : self.iframeNewSettings.width,
                new_height : self.iframeNewSettings.height
            };

        var action = jQuery("base").attr("href") + "/@@googlechart.resize_iframe";
        self.startMessage("Saving updated charts");
        jQuery.ajax({
            type: 'POST',
            url: action,
            data: data,
            async: true,
            success: function(data){
                if (data === "ok"){
                    self.startMessage("Done");
                    self.disableResize();
                }
                else {
                    self.startMessage("Couldn't save changes!");
                    alert("Couldn't save changes!");
                }
            },
            error: function(data){
                self.startMessage("Couldn't save changes!");
                alert("Couldn't save changes!");
            }
        });
    },

    cancelResize: function(){
        var self = this;
        self.shouldUpdate = false;
        self.context.width(self.iframeDefaultSettings.width);
        self.context.height(self.iframeDefaultSettings.height);
        self.context.attr("src", self.iframeDefaultSettings.src);
        self.disableResize();
    },

    hideDialog: function(){
        var self = this;
        self.shouldUpdate = false;
        jQuery(".googlechart-iframe-hidedialog").remove();
        var hideDialogForm = jQuery("<div>")
                                .addClass('googlechart-iframe-hideform')
                                .data("resizer", self);
        hideDialogForm.dialog({
            dialogClass: 'googlechart-iframe-hidedialog',
            title: 'Select elements to hide',
            modal: true,
            height: 200,
            width: 240,
            resizable:false,
            open: function(evt, ui){
                jQuery("<span>")
                    .text("Filters")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<input>")
                    .attr("type", "checkbox")
                    .addClass("googlechart-iframe-hide-filters")
                    .addClass("googlechart-iframe-hide-element")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<br/>")
                    .appendTo('.googlechart-iframe-hideform');
                if (!self.context.data("isDashboard")){
                    jQuery("<span>")
                        .text("Notes")
                        .appendTo('.googlechart-iframe-hideform');
                    jQuery("<input>")
                        .attr("type", "checkbox")
                        .addClass("googlechart-iframe-hide-notes")
                        .addClass("googlechart-iframe-hide-element")
                        .appendTo('.googlechart-iframe-hideform');
                    jQuery("<br/>")
                        .appendTo('.googlechart-iframe-hideform');
                }
                jQuery("<span>")
                    .text("QR Code")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<input>")
                    .attr("type", "checkbox")
                    .addClass("googlechart-iframe-hide-qrcode")
                    .addClass("googlechart-iframe-hide-element")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<br/>")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<span>")
                    .text("Watermark")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<input>")
                    .attr("type", "checkbox")
                    .addClass("googlechart-iframe-hide-watermark")
                    .addClass("googlechart-iframe-hide-element")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<br/>")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<span>")
                    .text("Link")
                    .appendTo('.googlechart-iframe-hideform');
                jQuery("<input>")
                    .attr("type", "checkbox")
                    .addClass("googlechart-iframe-hide-link")
                    .addClass("googlechart-iframe-hide-element")
                    .appendTo('.googlechart-iframe-hideform');
                var resizer= jQuery('.googlechart-iframe-hideform').data("resizer");
                var customStyle = jQuery.deparam(resizer.iframeNewSettings.src).customStyle;
                if (customStyle !== undefined){
                    if (customStyle.indexOf(".googlechart_filters{display:none}") >= 0){
                        jQuery(".googlechart-iframe-hide-filters").attr("checked", "checked");
                    }
                    if (customStyle.indexOf(".googlechart-notes{display:none}") >= 0){
                        jQuery(".googlechart-iframe-hide-notes").attr("checked", "checked");
                    }
                    if (customStyle.indexOf('div[id*="googlechart_qr_"]{display:none}') >= 0){
                        jQuery(".googlechart-iframe-hide-qrcode").attr("checked", "checked");
                    }
                    if (customStyle.indexOf('div[id*="googlechart_wm_"]{display:none}') >= 0){
                        jQuery(".googlechart-iframe-hide-watermark").attr("checked", "checked");
                    }
                    if (customStyle.indexOf(".go-to-original-link{display:none}") >= 0){
                        jQuery(".googlechart-iframe-hide-link").attr("checked", "checked");
                    }
                }
            },
            buttons: {
                Cancel: function(){
                    jQuery(this).dialog('close');
                },
                Save: function(){
                    var resizer= jQuery('.googlechart-iframe-hideform').data("resizer");
                    resizer.shouldUpdate = true;
                    var options = {
                                    width: resizer.iframeNewSettings.width,
                                    height: resizer.iframeNewSettings.height,
                                    hideFilters: (jQuery(".googlechart-iframe-hide-filters").attr("checked") === "checked" ? true : false),
                                    hideNotes: (jQuery(".googlechart-iframe-hide-notes").attr("checked") === "checked" ? true : false),
                                    hideQRCode: (jQuery(".googlechart-iframe-hide-qrcode").attr("checked") === "checked" ? true : false),
                                    hideWatermark: (jQuery(".googlechart-iframe-hide-watermark").attr("checked") === "checked" ? true : false),
                                    hideLink: (jQuery(".googlechart-iframe-hide-link").attr("checked") === "checked" ? true : false)
                                };
                    if (!resizer.context.data("isDashboard")){
                        var iframeSizes = self.context[0].contentWindow.getIframeSizes();
                        options.chartWidth = iframeSizes.chart.width;
                        options.chartHeight = iframeSizes.chart.height;
                        options.areaLeft = chartAreaAttribute2px(iframeSizes.chartArea.left, iframeSizes.chart.width);
                        options.areaTop = chartAreaAttribute2px(iframeSizes.chartArea.top, iframeSizes.chart.height);
                        options.areaWidth = chartAreaAttribute2px(iframeSizes.chartArea.width, iframeSizes.chart.width);
                        options.areaHeight = chartAreaAttribute2px(iframeSizes.chartArea.height, iframeSizes.chart.height);
                    }
                    resizer.resizeIframe(options);
                    jQuery(this).dialog('close');
                }
            }
        });
    },

    getSizes: function() {
        var self = this;
        var view = self.context;
        var sizes = {};
        sizes.iframeWidth = view.width();
        sizes.iframeHeight = view.height();
        sizes.iframeLeft = view.offset().left;
        sizes.iframeTop = view.offset().top;
        sizes.fullWidth = jQuery("html").width();
        sizes.fullHeight = jQuery("html").height();
        if (!self.context.data().isDashboard){
            var iframeSizes = self.context[0].contentWindow.getIframeSizes();
            sizes.chart = iframeSizes.chart;
            sizes.chartArea = iframeSizes.chartArea;
        }
        return sizes;
    },

    setChartAreaSizes: function() {

        var self = this;

        if (!self.chartAreaConfigurable){
            return;
        }
        var size = self.getSizes();
        var parentOffset = jQuery(".googlechart-chartarea-resizable")
                            .parent()
                            .offset();
        if ((size.chartArea.width !== 0) && (size.chartArea.height !== 0)){
            chartAreaWidth = chartAreaAttribute2px(size.chartArea.width, size.chart.width);
            chartAreaHeight = chartAreaAttribute2px(size.chartArea.height, size.chart.height);
            chartAreaLeft = chartAreaAttribute2px(size.chartArea.left, size.chart.width);
            chartAreaTop = chartAreaAttribute2px(size.chartArea.top, size.chart.height);

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
        }
        else{
            jQuery(".googlechart-chartarea-resizable").hide();
        }
        parentOffset = jQuery(".googlechart-chart-resizable")
                        .parent()
                        .offset();
        jQuery(".googlechart-chart-resizable")
            .width(size.chart.width)
            .height(size.chart.height)
            .offset({left:parentOffset.left + size.chart.left, top:parentOffset.top + size.chart.top});

    },

    drawOverlays: function(){
        var self = this;
        var sizes = self.getSizes();
        self.updateMasks(sizes);
        jQuery("<div>")
            .addClass("googlechart-chartiframe-resizable")
            .width(sizes.iframeWidth)
            .height(sizes.iframeHeight)
            .offset({left:sizes.iframeLeft, top:sizes.iframeTop})
            .resizable({
                stop: function(){
                    self.shouldUpdate = true;
                    jQuery(".googlechart-chartiframe-width")
                        .trigger("change");
                },
                resize: function(){
                    self.shouldUpdate = false;
                    jQuery(".googlechart-chartiframe-width")
                        .attr("value", jQuery(this).width());
                    jQuery(".googlechart-chartiframe-height")
                        .attr("value", jQuery(this).height());
                }
            })
            .appendTo("body");
        jQuery("<div>")
             .addClass("googlechart-chartiframe-header")
            .appendTo(".googlechart-chartiframe-resizable");
        jQuery("<a>")
            .addClass("standardButton googlechart-iframe-apply")
            .text("Apply")
            .click(function(){
                self.applyResize();
            })
            .appendTo(".googlechart-chartiframe-header");
        jQuery("<a>")
            .addClass("standardButton googlechart-iframe-cancel")
            .text("Cancel")
            .click(function(){
                self.cancelResize();
            })
            .appendTo(".googlechart-chartiframe-header");

        jQuery("<a>")
            .addClass("standardButton googlechart-iframe-apply")
            .text("Hide elements")
            .click(function(){
                self.hideDialog();
            })
            .appendTo(".googlechart-chartiframe-header");
        jQuery("<span>iframe size: </span>")
            .appendTo(".googlechart-chartiframe-header");
        jQuery("<input>")
            .addClass("googlechart-chartiframe-width googlechart-iframe-size")
            .attr("type", "number")
            .attr("value", sizes.iframeWidth)
            .appendTo(".googlechart-chartiframe-header");

        jQuery("<span>x</span>")
            .appendTo(".googlechart-chartiframe-header");

        jQuery("<input>")
            .addClass("googlechart-chartiframe-height googlechart-iframe-size")
            .attr("type", "number")
            .attr("value", sizes.iframeHeight)
            .appendTo(".googlechart-chartiframe-header");

        jQuery("<span>px</span>")
            .appendTo(".googlechart-chartiframe-header");

        jQuery("<div style='clear:both'></div>")
            .appendTo(".googlechart-chartiframe-header");
        if (!self.context.data().isDashboard){
            jQuery("<div>")
                .addClass("googlechart-chart-resizable")
                .width(sizes.chart.width)
                .height(sizes.chart.height)
                .offset({left:sizes.chart.left, top:sizes.chart.top})
                .resizable({
                    stop: function(){
                        self.shouldUpdate = true;
                        jQuery(".googlechart-chartiframe-width")
                            .trigger("change");
                    },
                    resize: function(){
                        self.shouldUpdate = false;
                        jQuery(".googlechart-chart-width")
                            .attr("value", jQuery(this).width());
                        jQuery(".googlechart-chart-height")
                            .attr("value", jQuery(this).height());
                    }
                })
                .appendTo(".googlechart-chartiframe-resizable");


            jQuery("<span>chart size: </span>")
                .appendTo(".googlechart-chartiframe-header");
            jQuery("<input>")
                .addClass("googlechart-chart-width googlechart-iframe-size")
                .attr("type", "number")
                .attr("value", sizes.chart.width)
                .appendTo(".googlechart-chartiframe-header");

            jQuery("<span>x</span>")
                .appendTo(".googlechart-chartiframe-header");

            jQuery("<input>")
                .addClass("googlechart-chart-height googlechart-iframe-size")
                .attr("type", "number")
                .attr("value", sizes.chart.height)
                .appendTo(".googlechart-chartiframe-header");
            jQuery("<span>px</span>")
                .appendTo(".googlechart-chartiframe-header");

            self.chartAreaConfigurable = true;
            if (self.chartAreaConfigurable){
                jQuery("<div>")
                    .addClass("googlechart-chartarea-resizable")
                    .hover(
                        function(){
                            jQuery(".googlechart-chartiframe-header")
                                .addClass("googlechart-chartiframe-header-hidden");
                        },
                        function(){
                            jQuery(".googlechart-chartiframe-header")
                                .removeClass("googlechart-chartiframe-header-hidden");
                        }
                    )
                    .resizable({
                        containment:".googlechart-chart-resizable",
                        resize: function(){
                            self.shouldUpdate = false;
                            jQuery(".googlechart-chartarea-width")
                                .attr("value", jQuery(this).width());
                            jQuery(".googlechart-chartarea-height")
                                .attr("value", jQuery(this).height());
                        },
                        stop: function(){
                            self.shouldUpdate = true;
                            jQuery(".googlechart-chartarea-width")
                                .trigger("change");
                        }
                    })
                    .draggable({
                        containment:".googlechart-chart-resizable",
                        drag: function(){
                            self.shouldUpdate = false;
                            parentOffset = jQuery(".googlechart-chartarea-resizable")
                                    .parent()
                                    .offset();
                            jQuery(".googlechart-chartarea-left")
                                .attr("value", jQuery(this).offset().left - parentOffset.left);
                            jQuery(".googlechart-chartarea-top")
                                .attr("value", jQuery(this).offset().top - parentOffset.top);
                        },
                        stop: function(){
                            self.shouldUpdate = true;
                            jQuery(".googlechart-chartarea-left")
                                .trigger("change");
                        }
                    })
                    .appendTo(".googlechart-chart-resizable");

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

                jQuery("<span>")
                    .text("And the position: ")
                    .appendTo(".googlechart-chartarea-size-input");
                jQuery("<div>")
                    .addClass("googlechart-chartarea-input googlechart-chartarea-top-input")
                    .appendTo(".googlechart-chartarea-size-input");

                jQuery("<div>")
                    .addClass("googlechart-chartarea-input googlechart-chartarea-left-input")
                    .appendTo(".googlechart-chartarea-size-input");

                jQuery("<input>")
                    .addClass("googlechart-chartarea-width googlechart-iframe-size")
                    .attr("type", "number")
                    .appendTo(".googlechart-chartarea-size-input-fields");

                jQuery("<span>x</span>")
                    .appendTo(".googlechart-chartarea-size-input-fields");

                jQuery("<input>")
                    .addClass("googlechart-chartarea-height googlechart-iframe-size")
                    .attr("type", "number")
                    .appendTo(".googlechart-chartarea-size-input-fields");

                jQuery("<span>px</span>")
                    .appendTo(".googlechart-chartarea-size-input-fields");

                jQuery("<span>top: </span>")
                    .appendTo(".googlechart-chartarea-top-input");

                jQuery("<input>")
                    .addClass("googlechart-chartarea-top googlechart-iframe-size")
                    .attr("type", "number")
                    .appendTo(".googlechart-chartarea-top-input");

                jQuery("<span>px</span>")
                    .appendTo(".googlechart-chartarea-top-input");

                jQuery("<span>left: </span>")
                    .appendTo(".googlechart-chartarea-left-input");

                jQuery("<input>")
                    .addClass("googlechart-chartarea-left googlechart-iframe-size")
                    .attr("type", "number")
                    .appendTo(".googlechart-chartarea-left-input");

                jQuery("<span>px</span>")
                    .appendTo(".googlechart-chartarea-left-input");

            }
        }
        jQuery(".googlechart-iframe-size").change(function(){
            var width = parseInt(jQuery(".googlechart-chartiframe-width").attr("value"),0);
            var height = parseInt(jQuery(".googlechart-chartiframe-height").attr("value"),0);

            var chartWidth = parseInt(jQuery(".googlechart-chart-width").attr("value"),0);
            var chartHeight = parseInt(jQuery(".googlechart-chart-height").attr("value"),0);

            var areaWidth = parseInt(jQuery(".googlechart-chartarea-width").attr("value"),0);
            var areaHeight = parseInt(jQuery(".googlechart-chartarea-height").attr("value"),0);
            var areaLeft = parseInt(jQuery(".googlechart-chartarea-left").attr("value"),0);
            var areaTop = parseInt(jQuery(".googlechart-chartarea-top").attr("value"),0);

            var options = {
                width: width,
                height: height,
                chartWidth: chartWidth,
                chartHeight: chartHeight,
                areaWidth: areaWidth,
                areaHeight: areaHeight,
                areaLeft: areaLeft,
                areaTop: areaTop

            };
            var customStyle = jQuery.deparam(self.iframeNewSettings.src).customStyle;

            if (customStyle !== undefined){
                if (customStyle.indexOf(".googlechart_filters{display:none}") >= 0){
                    options.hideFilters = true;
                }
                if (customStyle.indexOf(".googlechart-notes{display:none}") >= 0){
                    options.hideNotes = true;
                }
                if (customStyle.indexOf('div[id*="googlechart_qr_"]{display:none}') >= 0){
                    options.hideQRCode = true;
                }
                if (customStyle.indexOf('div[id*="googlechart_wm_"]{display:none}') >= 0){
                    options.hideWatermark = true;
                }
                if (customStyle.indexOf(".go-to-original-link{display:none}") >= 0){
                    options.hideLink = true;
                }
            }
            self.resizeIframe(options);
            sizes.iframeWidth = width;
            sizes.iframeHeight = height;
            jQuery(".googlechart-chartiframe-resizable")
                .width(width)
                .height(height);

            jQuery(".googlechart-chart-resizable")
                .width(chartWidth)
                .height(chartHeight);
            var new_sizes = self.getSizes();
            self.updateMasks(new_sizes);
            jQuery(".googlechart-chartiframe-resizable")
                .offset({left:new_sizes.iframeLeft, top:new_sizes.iframeTop});
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

jQuery.fn.EEAChartIframeResizer = function(){
    return this.each(function(){
        var chartResizer = new DavizIframeResizer.ChartResizer(jQuery(this));
    });
};


jQuery(document).ready(function($){
    if (jQuery("base").attr("href") === undefined) {
        return;
    }
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)){
        var ieversion=RegExp.$1;
        if (ieversion<9){
            return;
        }
    }
    var iframe_embedded_charts = jQuery("iframe[src*='embed-chart?chart=']");
    if (iframe_embedded_charts.length === 0){
        return;
    }
    var action = jQuery("base").attr("href").split("@@")[0] + "/@@googlechart.check_permission";
    jQuery.ajax({
        type: 'GET',
        url: action,
        async: true,
        success: function(data){
            if (data === "True"){
                var resizeButton = "<a class='standardButton googlechart-iframe-resize'>Resize chart</a>";
                jQuery.each(iframe_embedded_charts, function(){
                    var btn = jQuery(resizeButton).data("chart_iframe", this);
                    jQuery(this).data("isDashboard", false);
                    jQuery(this).after(jQuery(resizeButton).data("chart_iframe", this));
                    jQuery(this).after("<div style='clear:both'></div>");
                });

                jQuery.each(jQuery("iframe[src*='embed-dashboard?dashboard=']"), function(){
                    var btn = jQuery(resizeButton).data("chart_iframe", this);
                    jQuery(this).data("isDashboard", true);
                    jQuery(this).after(jQuery(resizeButton).data("chart_iframe", this));
                    jQuery(this).after("<div style='clear:both'></div>");
                });

                jQuery("a.googlechart-iframe-resize").click(function(){
                    jQuery(jQuery(this).data("chart_iframe")).EEAChartIframeResizer();
                });
            }
        }
    });
});


