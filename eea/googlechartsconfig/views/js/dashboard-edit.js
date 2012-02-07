/** EEA Google Dashboard
*/
DavizEdit.Events.charts = {
    initialized: 'google-charts-initialized',
    changed: 'google-charts-changed',
    resized: 'google-chart-resized',
    resizeFinished: 'google-chart-resize-finished'
};

DavizEdit.GoogleDashboards = {};

DavizEdit.GoogleDashboard = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {};

  if(options){
    jQuery.extend(self.settings, options);
  }

  jQuery(document).bind(DavizEdit.Events.charts.initialized, function(evt, data){
    self.initialize();
  });

  jQuery(document).bind(DavizEdit.Events.charts.resized, function(evt, data){
    self.handle_chart_resize(data);
  });

  jQuery(document).bind(DavizEdit.Events.charts.resizeFinished, function(evt, data){
    self.handle_chart_afterResize(data);
  });
};

DavizEdit.GoogleDashboard.prototype = {
  initialize: function(config, dataTable){
    var self = this;
    var charts = jQuery('li.googlechart');
    jQuery(charts).each(function(){
      self.handle_chart(jQuery(this));
    });
    self.context.append(
      jQuery('<li>').css({
        'clear': 'both',
        'padding': '2em'
      })
    );
    self.context.sortable({
      items: 'li.dashboard-chart'
    });
  },

  handle_chart: function(chart){
    var self = this;
    var width = jQuery('.googlechart_width', chart).val();
    var height = jQuery('.googlechart_height', chart).val();

    var href = chart.find('a.preview_button');
    href.trigger('mouseover');
    href = href.attr('href');
    var iframe = jQuery('<iframe>').attr('src', href);
    var svg = jQuery('<li>').addClass('dashboard-chart').append(iframe);
    svg.width(width);
    svg.height(height);
    svg.resizable({
      ghost: true,
      helper: 'dashboard-resizable-helper',
      stop: function(event, ui){
        jQuery(document).trigger(DavizEdit.Events.charts.resized, {
          context: svg, width: ui.size.width, height: ui.size.height});
      }
    });
    self.handle_chart_header(svg, width, height);
    self.handel_chart_mask(svg, width, height);
    self.context.append(svg);
  },

  handle_chart_header: function(context, width, height){
    var header = jQuery('<div>').addClass('dashboard-header').html(
      '<input type="number" name="width" value=""/>' +
      '<span>X</span>' +
      '<input type="number" name="height" value=""/>' +
      '<span>px</span>'
    );

    jQuery('input[name=width]', header).val(width).change(function(){
      var width = jQuery(this).val();
      context.width(width);
      jQuery(document).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: context,
        width: width
      });
    });

    jQuery('input[name=height]', header).val(height).change(function(){
      var height = jQuery(this).val();
      context.height(height);
      jQuery(document).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: context,
        height: height
      });
    });

    context.prepend(header);
  },

  handel_chart_mask: function(context, width, height){
    var mask = jQuery('<div>').addClass('dashboard-mask');
    context.prepend(mask);
  },

  handle_chart_resize: function(data){
    var context = jQuery(data.context);
    jQuery('input[name=width]', context).val(data.width);
    jQuery('input[name=height]', context).val(data.height);
    jQuery(document).trigger(DavizEdit.Events.charts.resizeFinished, {
      context: context,
      width: data.width,
      height: data.height
    });
  },

  handle_chart_afterResize: function(data){
    var context = data.context;
    var width = data.width;
    var height = data.height;
    var iframe = context.find('iframe');
    var src = iframe.attr('src');
    if(width){
      src = src.replace(/width\=\d+/, 'width=' + width);
    }
    if(height){
      src = src.replace(/height\=\d+/, 'height=' + height);
    }
    iframe.attr('src', src);
  }
};

// Make EEAGoogleDashboard a jQuery plugin
jQuery.fn.EEAGoogleDashboard = function(options){
  return this.each(function(){
    var context = jQuery(this).addClass('ajax');
    var name = context.attr('id');
    DavizEdit.GoogleDashboards[name] = new DavizEdit.GoogleDashboard(context, options);
  });
};


/** On load
*/
jQuery(document).ready(function(){
  var dashboard = jQuery('#gcharts-dashboard-edit');
  if(!dashboard.length){
    return;
  }
  dashboard.EEAGoogleDashboard();
});
