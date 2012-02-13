/** EEA Google Dashboard
*/
DavizEdit.Events.charts = {
    initialized: 'google-charts-initialized',
    changed: 'google-charts-changed',
    reordered: 'google-charts-position-changed',
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

  jQuery(document).bind(DavizEdit.Events.charts.changed, function(evt, data){
    self.reload();
  });
};

DavizEdit.GoogleDashboard.prototype = {
  initialize: function(){
    var self = this;
    self.context.empty();

    // Filters
    self.handle_filters();

    // Charts
    self.handle_charts();

    self.context.sortable({
      items: '.dashboard-section',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      update: function(event, ui){
        console.log(self.context.sortable('toArray'));
      }
    });
  },

  handle_filters: function(){
    var self = this;
    var filters = new DavizEdit.GoogleDashboardFilters(self.context);
  },

  handle_charts: function(){
    var self = this;
    var charts = new DavizEdit.GoogleDashboardCharts(self.context);
  },

  reload: function(){
    var self = this;
    jQuery(self.context).unbind('.dashboard');
    self.initialize();
  }
};

DavizEdit.GoogleDashboardCharts = function(context, options){
  var self = this;
  self.context = context;

  self.settings = {};
  if(options){
    jQuery.extend(self.settings, options);
  }

  // Events
  jQuery(self.context).bind(DavizEdit.Events.charts.reordered + '.dashboard', function(evt, data){
    self.handle_charts_position(data.order);
  });

  self.initialize();
};

DavizEdit.GoogleDashboardCharts.prototype = {
  initialize: function(){
    var self = this;
    self.box = jQuery('<div>')
      .attr('id', 'dashboard-charts')
      .attr('title', 'Click and drag to reorder')
      .addClass('dashboard-charts')
      .addClass('dashboard-section')
      .appendTo(self.context);
    var header = jQuery('<div>')
      .addClass('box-title')
      .html('<span class="label">Dashboard charts</span>')
      .prependTo(self.box);
    var body = jQuery('<div>')
       .addClass('box-body')
       .appendTo(self.box);

    var charts = jQuery('li.googlechart').sort(function(a, b){
      var order_a = jQuery.data(a, 'dashboard').order;
      order_a = order_a !== undefined ? parseInt(order_a, 10) : 998;
      var order_b = jQuery.data(b, 'dashboard').order;
      order_b = order_b !== undefined ? parseInt(order_b, 10) : 999;
      return (order_a <= order_b) ? -1 : 1;
    });

    jQuery(charts).each(function(index){
      self.handle_chart(index, jQuery(this), body);
    });

    self.box.sortable({
      items: '.dashboard-chart',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      update: function(event, ui){
        jQuery(self.context).trigger(DavizEdit.Events.charts.reordered, {
          order: self.context.sortable('toArray')
        });
      }
    });
  },

  handle_chart: function(index, chart, context){
    var self = this;
    name = jQuery('.googlechart_id', chart).val();
    var gchart = new DavizEdit.GoogleDashboardChart(context, {
      chart: chart,
      name: name,
      index: index
    });
  },

  handle_charts_position: function(order){
    var self = this;
    var query = {
      action: 'charts.position',
      order: order
    };

    query = jQuery.param(query, traditional=true);
    DavizEdit.Status.start("Saving...");
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      DavizEdit.Status.stop(data);
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
  jQuery(self.settings.chart).unbind('.dashboard');

  // Resize
  jQuery(self.settings.chart).bind(DavizEdit.Events.charts.resized + '.dashboard', function(evt, data){
    self.handle_chart_resize(data);
  });

  // After resize
  jQuery(self.settings.chart).bind(DavizEdit.Events.charts.resizeFinished + '.dashboard', function(evt, data){
    self.handle_chart_afterResize(data);
  });

  // Position changed
  jQuery(self.context).bind(DavizEdit.Events.charts.reordered + '.dashboard', function(evt, data){
    self.handle_chart_position(data.order);
  });

  self.initialize();
};

DavizEdit.GoogleDashboardChart.prototype = {
  initialize: function(){
    var self = this;

    self.dashboard = self.settings.chart[0];
    var dashboardVal = jQuery.data(self.dashboard, 'dashboard');

    var width = dashboardVal.width !== undefined ? dashboardVal.width : jQuery('.googlechart_width', self.settings.chart).val();
    var height = dashboardVal.height !== undefined ? dashboardVal.height : jQuery('.googlechart_height', self.settings.chart).val();
    self.order = dashboardVal.order !== undefined ? dashboardVal.order : (self.settings.index + 1) * 50;
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
    var svg = jQuery('<div>')
      .attr('id', self.settings.name)
      .addClass('dashboard-chart')
      .append(iframe);
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
    var header = jQuery('<div>')
      .addClass('dashboard-header')
      .attr('title', 'Click and drag to reorder')
      .html([
      '<span class="title">', self.settings.name, '</span>',
      '<input type="number" name="width" value=""/>',
      '<span>X</span>',
      '<input type="number" name="height" value=""/>',
      '<span>px</span>'
    ].join('\n'));
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

  handle_chart_position: function(order){
    var self = this;
    var name = self.settings.name;
    var index = order.indexOf(name);
    if(index === -1){
      return;
    }

    jQuery.data(self.dashboard, 'dashboard').order = index;
  },

  save: function(){
    var self = this;
    DavizEdit.Status.start("Saving...");
    var dashboard = jQuery.data(self.dashboard, 'dashboard');
    query = {
      action: 'chart.edit',
      name: self.settings.name,
      dashboard: JSON.stringify(dashboard)
    };
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      DavizEdit.Status.stop(data);
    });
  }
};

DavizEdit.GoogleDashboardFilters = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {};
  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

DavizEdit.GoogleDashboardFilters.prototype = {
  initialize: function(){
    var self = this;
    self.box = jQuery('<div>')
      .attr('id', 'dashboard-filters')
      .attr('title', 'Click and drag to reorder')
      .addClass('dashboard-filters')
      .addClass('dashboard-section')
      .prependTo(self.context);
    var header = jQuery('<div>')
      .addClass('box-title')
      .html('<span class="label">Dashboard filters</span>')
      .prependTo(self.box);
    var body = jQuery('<div>')
       .addClass('box-body')
       .appendTo(self.box);
    var add_button = jQuery("<span>")
      .attr('title', 'Add new filter')
      .text('+')
      .addClass('ui-icon').addClass('ui-icon-plus').addClass('ui-corner-all')
      .prependTo(header)
      .click(function(){
        self.new_chart(self.box);
      });

    // Annotations
    jQuery.data(self.box, 'all_filter_columns', window.available_columns ? jQuery.extend({}, available_columns) : {});
    jQuery.data(self.box, 'filter_columns', window.available_columns ? jQuery.extend({}, available_columns) : {});
    jQuery.data(self.box, 'filter_types', window.available_filter_types ? jQuery.extend({}, available_filter_types): {});

    // Get config JSON
    var query = {action: 'json'};
    jQuery.getJSON('@@googlechart.googledashboard.edit', query, function(data){
      self.draw(data);
    });

    self.box.sortable({
      items: '.dashboard-filter',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      update: function(event, ui){
        self.reorder(self.box.sortable('toArray'));
      }
    });
  },

  draw: function(data){
    var self = this;
    var filters = data.filters !== undefined ? data.filters : [];
    jQuery.each(filters, function(index, filter){
      delete jQuery.data(self.box, 'filter_columns')[filter.column];
      var gfilter = new DavizEdit.GoogleDashboardFilter(self.box, filter);
    });
  },

  new_chart: function(context){
    var self = this;
    if(!jQuery.param(jQuery.data(self.box, 'filter_columns'))){
      return alert("You've added all possible filters!");
    }

    var ftypes = jQuery.data(self.box, 'filter_types');
    var fcolumns = jQuery.data(self.box, 'filter_columns');
    var widget = jQuery('<div>')
      .html([
      '<form>',
        '<div class="field">',
            '<label>Column</label>',
            '<div class="formHelp">Filter Column</div>',
            '<select name="column"></select>',
        '</div>',
        '<div class="field">',
            '<label>Type</label>',
            '<div class="formHelp">Filter Type</div>',
            '<select name="type"></select>',
        '</div>',
      '</form>'].join('\n'));

    jQuery.each(fcolumns, function(key, val){
      var option = jQuery('<option>')
        .val(key).text(val)
        .appendTo(jQuery('select[name=column]', widget));
    });

    jQuery.each(ftypes, function(key, val){
      var option = jQuery('<option>')
        .val(key).text(val)
        .appendTo(jQuery('select[name=type]', widget));
    });

    widget.dialog({
      title: "Add Filter",
      dialogClass: 'googlechart-dialog',
      bgiframe: true,
      modal: true,
      closeOnEscape: true,
      buttons: [
        {
          text: "Save",
          click: function(){
            var form = jQuery('form', widget);
            self.new_chart_onSave(form);
            widget.dialog("close");
          }
        },
        {
            text: "Cancel",
            click: function(){
                widget.dialog("close");
            }
        }
      ]
    });
  },

  new_chart_onSave: function(form){
    var self = this;
    var query = {};
    jQuery.each(form.serializeArray(), function(){
      query[this.name] = this.value;
    });

    query.action = 'filter.add';
    DavizEdit.Status.start("Adding...");
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      delete query.action;
      self.draw({filters: [query]});
      DavizEdit.Status.stop(data);
    });
  },

  reorder: function(order){
    var self = this;
    var query = {
      action: 'filters.position',
      order: order
    };
    query = jQuery.param(query, traditional=true);
    DavizEdit.Status.start("Saving...");
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      DavizEdit.Status.stop(data);
    });
  }
};

DavizEdit.GoogleDashboardFilter = function(context, options){
  var self = this;
  self.context = context;
  self.box = jQuery('.box-body', self.context);
  self.settings = {};
  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

DavizEdit.GoogleDashboardFilter.prototype = {
  initialize: function(){
    var self = this;
    var column_label = jQuery.data(self.context, 'all_filter_columns')[self.settings.column];
    var type_label = jQuery.data(self.context, 'filter_types')[self.settings.type];
    self.box = jQuery('<dl>')
      .addClass('dashboard-filter')
      .attr('id', self.settings.column)
      .attr('title', 'Click and drag to reorder')
      .html(['',
      '<dt>', column_label, '<dt>',
      '<dd>', type_label, '</dd>'
      ].join('\n'))
      .appendTo(self.box);

    // Delete "<div class='ui-icon ui-icon-trash remove_chart_icon' title='Delete chart'>x</div>"
    jQuery('<div>')
      .addClass('ui-icon').addClass('ui-icon-trash')
      .attr('title', 'Delete filter')
      .text('x')
      .prependTo(self.box)
      .click(function(){
        self.remove();
      });
  },

  remove: function(){
    var self = this;
    jQuery('<div>')
      .html([
        '<span>Are you sure you want to delete:</span>',
        '<strong>',
          self.settings.column,
        '</strong>'
        ].join('\n'))
      .dialog({
        title: 'Remove filter',
        modal: true,
        dialogClass: 'googlechart-dialog',
        buttons: {
          Yes: function(){
            self.onRemove();
            jQuery(this).dialog('close');
          },
          No: function(){
            jQuery(this).dialog('close');
          }
        }
      });

  },

  onRemove: function(){
    var self = this;
    var query = {
      action: 'filter.delete',
      name: self.settings.column
    };

    DavizEdit.Status.start("Deleting...");
    jQuery.post('@@googlechart.googledashboard.edit', query, function(data){
      // Add column type to available columns;
      var label = jQuery.data(self.context, 'all_filter_columns')[self.settings.column];
      jQuery.data(self.context, 'filter_columns')[self.settings.column] = label;

      self.box.remove();
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
