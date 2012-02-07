/** EEA Google Dashboard
*/
DavizEdit.Events.charts = {
    initialized: 'google-charts-initialized',
    changed: 'google-charts-changed',
    resized: 'google-chart-resized',
    resizeFinished: 'google-chart-resize-finished',
    updated: 'google-chart-updated'
};

DavizEdit.GoogleDashboards = {};

DavizEdit.GoogleDashboard = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {};

  if(options){
    jQuery.extend(self.settings, options);
  }

  // Events
  jQuery(document).bind(DavizEdit.Events.charts.initialized, function(evt, data){
    self.initialize();
  });
};

DavizEdit.GoogleDashboard.prototype = {
  initialize: function(config, dataTable){
    var self = this;
    var charts = jQuery('li.googlechart');
    jQuery(charts).each(function(index){
      self.handle_chart(index, jQuery(this));
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

  handle_chart: function(index, chart){
    var self = this;
    name = jQuery('.googlechart_id', chart).val();
    var gchart = new DavizEdit.GoogleDashboardChart(self.context, {
      chart: chart,
      name: name,
      index: index
    });
  }
};

DavizEdit.GoogleDashboardChart = function(context, options){
  var self = this;
  self.context = context;

  self.settings = {
    index: 0,
    name: '',
    chart: ''
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  // Events
  jQuery(self.settings.chart).bind(DavizEdit.Events.charts.resized, function(evt, data){
    self.handle_chart_resize(data);
  });

  jQuery(self.settings.chart).bind(DavizEdit.Events.charts.resizeFinished, function(evt, data){
    self.handle_chart_afterResize(data);
  });

  self.initialize();
};

DavizEdit.GoogleDashboardChart.prototype = {
  initialize: function(){
    var self = this;

    self.dashboard = self.settings.chart[0];
    var dashboardVal = jQuery.data(self.dashboard, 'dashboard');

    var width = dashboardVal.width ? dashboardVal.width : jQuery('.googlechart_width', self.settings.chart).val();
    var height = dashboardVal.height ? dashboardVal.height : jQuery('.googlechart_height', self.settings.chart).val();
    self.order = dashboardVal.order ? dashboardVal.order : self.settings.index;
    self.hidden = dashboardVal.hidden ? true : false;

    dashboardVal.width = width;
    dashboardVal.height = height;
    dashboardVal.order = self.order;
    dashboardVal.hidden = self.hidden;
    jQuery.data(self.dashboard, 'dashboard', dashboardVal);

    var href = self.settings.chart.find('a.preview_button');
    href.trigger('mouseover');
    href = href.attr('href');
    href = href.replace(/width\=\d+/, 'width=' + width);
    href = href.replace(/height\=\d+/, 'height=' + height);

    var iframe = jQuery('<iframe>').attr('src', href);
    var svg = jQuery('<li>').addClass('dashboard-chart').append(iframe);
    svg.width(width);
    svg.height(height);
    svg.resizable({
      ghost: true,
      helper: 'dashboard-resizable-helper',
      stop: function(event, ui){
        jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resized, {
          context: svg, width: ui.size.width, height: ui.size.height});
      }
    });
    self.handle_chart_header(svg, width, height);
    self.handle_chart_mask(svg, width, height);
    self.context.append(svg);
  },

  handle_chart_header: function(context, width, height){
    var self = this;
    var header = jQuery('<div>').addClass('dashboard-header').html(
      '<input type="number" name="width" value=""/>' +
      '<span>X</span>' +
      '<input type="number" name="height" value=""/>' +
      '<span>px</span>'
    );
    if(self.hidden){
      header.addClass('dashboard-header-hidden');
    }

    jQuery('input[name=width]', header).val(width).change(function(){
      var width = jQuery(this).val();
      context.width(width);
      jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: context,
        width: width
      });
    });

    jQuery('input[name=height]', header).val(height).change(function(){
      var height = jQuery(this).val();
      context.height(height);
      jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: context,
        height: height
      });
    });

    context.prepend(header);
  },

  handle_chart_mask: function(context, width, height){
    var mask = jQuery('<div>').addClass('dashboard-mask');
    context.prepend(mask);
  },

  handle_chart_resize: function(data){
    var self = this;
    var context = jQuery(data.context);
    jQuery('input[name=width]', context).val(data.width);
    jQuery('input[name=height]', context).val(data.height);
    jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resizeFinished, {
      context: context,
      width: data.width,
      height: data.height
    });
  },

  handle_chart_afterResize: function(data){
    var self = this;
    var context = data.context;
    var width = data.width;
    var height = data.height;
    var iframe = context.find('iframe');
    var src = iframe.attr('src');
    var dashboard = jQuery.data(self.dashboard, 'dashboard');
    if(width){
      src = src.replace(/width\=\d+/, 'width=' + width);
      dashboard.width = width;
    }
    if(height){
      src = src.replace(/height\=\d+/, 'height=' + height);
      dashboard.height = height;
    }

    // Update dashboard
    jQuery.data(self.dashboard, 'dashboard', dashboard);

    // Update preview
    iframe.attr('src', src);

    // Save changes
    self.save();
  },

  save: function(){
    console.log('Ops!!! Saving...');
    var self = this;
    DavizEdit.Status.start("Saving...");
    var dashboard = jQuery.data(self.dashboard, 'dashboard');
    query = {
      action: 'chart',
      name: self.settings.name,
      dashboard: JSON.stringify(dashboard)
    };
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      DavizEdit.Status.stop(data);
    });
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
