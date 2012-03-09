/** EEA Google Dashboard
*/
if(window.DavizEdit === undefined){
  var DavizEdit = {'version': 'eea.googlecharts'};
  DavizEdit.Events = {};
}

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

    // Get config JSON
    var query = {action: 'json'};

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    jQuery.getJSON(action, query, function(data){
      if((data.chartsBox !== undefined) && (data.chartsBox.order === 0)){
        self.handle_charts(data);
        self.handle_filters(data);
      }else{
        self.handle_filters(data);
        self.handle_charts(data);
      }
    });

    self.context.sortable({
      items: '.dashboard-section',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      opacity: 0.7,
      delay: 300,
      cursor: 'crosshair',
      tolerance: 'pointer',
      update: function(event, ui){
        self.reorder(self.context.sortable('toArray'));
      }
    });
  },

  handle_filters: function(options){
    var self = this;
    var filters = new DavizEdit.GoogleDashboardFilters(self.context, options);
  },

  handle_charts: function(options){
    var self = this;
    var charts = new DavizEdit.GoogleDashboardCharts(self.context, options);
  },

  reorder: function(order){
    var self = this;
    var query = {
      action: 'sections.position',
      order: order
    };
    query = jQuery.param(query, traditional=true);

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
    });
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

  self.settings = {
    chartsBox: {
      width: '100%',
      height: 'auto',
      order: 1
    }
  };
  if(options){
    jQuery.extend(self.settings, options);
    if(self.settings.chartsBox.width === undefined){
      self.settings.chartsBox.width = '100%';
    }
    if(self.settings.chartsBox.height === undefined){
      self.settings.chartsBox.height = 'auto';
    }
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
      .attr('id', 'chartsBox')
      .attr('title', 'Click and drag to reorder')
      .addClass('dashboard-charts')
      .addClass('dashboard-section')
      .appendTo(self.context)
      .resizable({
        ghost: true,
        helper: 'dashboard-resizable-helper',
        stop: function(event, ui){
          self.resize(ui.size.width, ui.size.height);
        }
      });

    var width = self.settings.chartsBox.width;
    var height = self.settings.chartsBox.height;
    self.box.width(width);
    self.box.height(height);
    self.handle_header(width, height);
    self.handle_body();

    var charts = jQuery('li.googlechart').sort(function(a, b){
      var order_a = jQuery.data(a, 'dashboard').order;
      order_a = order_a !== undefined ? parseInt(order_a, 10) : 998;
      var order_b = jQuery.data(b, 'dashboard').order;
      order_b = order_b !== undefined ? parseInt(order_b, 10) : 999;
      return (order_a <= order_b) ? -1 : 1;
    });

    jQuery(charts).each(function(index){
      self.handle_chart(index, jQuery(this), jQuery('.box-body', self.box));
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
          order: self.box.sortable('toArray')
        });
      }
    });
  },

  handle_header: function(width, height){
    var self = this;
    var header = jQuery('<div>')
      .addClass('box-title')
      .html([
        '<span class="label">Dashboard charts</span>',
        '<input type="text" name="width" value=""/>',
        '<span>X</span>',
        '<input type="text" name="height" value=""/>'
      ].join('\n'))
      .prependTo(self.box);

    jQuery('input[name=width]', header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      self.after_resize(width, self.box.height());
    });

    jQuery('input[name=height]', header).val(height).change(function(){
      var height = jQuery(this).val();
      self.box.height(height);
      self.after_resize(self.box.width(), height);
    });
  },

  handle_body: function(){
    var self = this;
    jQuery('<div>')
       .addClass('box-body')
       .appendTo(self.box);
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

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
    });
  },

  resize: function(width, height){
    jQuery('.box-title input[name=width]', self.box).val(width);
    jQuery('.box-title input[name=height]', self.box).val(height);
  },

  after_resize: function(width, height){
    var self = this;
    var query = {
      action: 'charts.size',
      width: width,
      height: height
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
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
    self.box = jQuery('<div>')
      .attr('id', self.settings.name)
      .addClass('dashboard-chart')
      .append(iframe)
      .width(width)
      .height(height)
      .resizable({
        ghost: true,
        helper: 'dashboard-resizable-helper',
        stop: function(event, ui){
          jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resized, {
            context: self.box, width: ui.size.width, height: ui.size.height});
        }
      }).appendTo(self.context);
    self.handle_chart_header(width, height);
    self.handle_chart_mask();
  },

  handle_chart_header: function(width, height){
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

    self.handle_buttons(header);

    jQuery('input[name=width]', header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: self.box,
        width: width
      });
    });

    jQuery('input[name=height]', header).val(height).change(function(){
      var height = jQuery(this).val();
      self.box.height(height);
      jQuery(self.settings.chart).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: self.box,
        height: height
      });
    });

    self.box.prepend(header);
  },

  handle_buttons: function(header){
    var self = this;
    var title = 'Hide chart';
    if(self.hidden){
      title = 'Show chart';
    }

    jQuery("<span>")
     .attr('title', title)
     .text('h')
     .addClass('ui-icon').addClass('ui-icon-visibility')
     .prependTo(header)
     .click(function(){
       self.toggle_visibility();
     });
  },

  handle_chart_mask: function(){
    var self = this;
    var mask = jQuery('<div>').addClass('dashboard-mask');
    self.box.prepend(mask);
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

  toggle_visibility: function(){
    var self = this;
    if(self.hidden){
      self.hidden = false;
      jQuery('.dashboard-header', self.box).removeClass('dashboard-header-hidden');
      jQuery('.ui-icon-visibility', self.box).attr('title', 'Hide chart');
    }else{
      self.hidden = true;
      jQuery('.dashboard-header', self.box).addClass('dashboard-header-hidden');
      jQuery('.ui-icon-visibility', self.box).attr('title', 'Show chart');
    }
    jQuery.data(self.dashboard, 'dashboard').hidden = self.hidden;
    self.save();
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

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
    });
  }
};

DavizEdit.GoogleDashboardFilters = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {
    filtersBox: {
      width: '100%',
      height: 'auto',
      order: 0
    }
  };

  if(options){
    jQuery.extend(self.settings, options);
    if(self.settings.filtersBox.width === undefined){
      self.settings.filtersBox.width = '100%';
    }
    if(self.settings.filtersBox.height === undefined){
      self.settings.filtersBox.height = 'auto';
    }
  }

  self.initialize();
};

DavizEdit.GoogleDashboardFilters.prototype = {
  initialize: function(){
    var self = this;
    self.box = jQuery('<div>')
      .attr('id', 'filtersBox')
      .attr('title', 'Click and drag to reorder')
      .addClass('dashboard-filters')
      .addClass('dashboard-section')
      .appendTo(self.context)
      .resizable({
        ghost: true,
        helper: 'dashboard-resizable-helper',
        stop: function(event, ui){
          self.resize(ui.size.width, ui.size.height);
        }
      });

    var width = self.settings.filtersBox.width;
    var height = self.settings.filtersBox.height;
    self.box.width(width);
    self.box.height(height);
    self.handle_header(width, height);
    self.handle_body();

    // Annotations
    jQuery.data(self.box, 'all_filter_columns', window.available_columns ? jQuery.extend({}, available_columns) : {});
    jQuery.data(self.box, 'filter_columns', window.available_columns ? jQuery.extend({}, available_columns) : {});
    jQuery.data(self.box, 'filter_types', window.available_filter_types ? jQuery.extend({}, available_filter_types): {});

    // Get config JSON
    self.draw(self.settings);

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

  handle_header: function(width, height){
    var self = this;
    var header = jQuery('<div>')
      .addClass('box-title')
      .html([
        '<span class="label">Dashboard filters</span>',
        '<input type="text" name="width" value=""/>',
        '<span>X</span>',
        '<input type="text" name="height" value=""/>'
        ].join('\n'))
      .prependTo(self.box);

    // Add button
    jQuery("<span>")
     .attr('title', 'Add new filter')
     .text('+')
     .addClass('ui-icon').addClass('ui-icon-plus').addClass('ui-corner-all')
     .prependTo(header)
     .click(function(){
       self.new_filter(self.box);
     });

    jQuery('input[name=width]', header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      self.after_resize(width, self.box.height());
    });

    jQuery('input[name=height]', header).val(height).change(function(){
      var height = jQuery(this).val();
      self.box.height(height);
      self.after_resize(self.box.width(), height);
    });
  },

  handle_body: function(){
    var self = this;
    jQuery('<div>')
       .addClass('box-body')
       .appendTo(self.box);
  },

  draw: function(data){
    var self = this;
    var filters = data.filters !== undefined ? data.filters : [];
    jQuery.each(filters, function(index, filter){
      delete jQuery.data(self.box, 'filter_columns')[filter.column];
      var gfilter = new DavizEdit.GoogleDashboardFilter(self.box, filter);
    });
  },

  new_filter: function(context){
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
            self.new_filter_onSave(form);
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

  new_filter_onSave: function(form){
    var self = this;
    var query = {};
    jQuery.each(form.serializeArray(), function(){
      query[this.name] = this.value;
    });

    query.action = 'filter.add';

    form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Adding...");
    jQuery.post(action, query, function(data){
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

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
    });
  },

  resize: function(width, height){
    jQuery('.box-title input[name=width]', self.box).val(width);
    jQuery('.box-title input[name=height]', self.box).val(height);
  },

  after_resize: function(width, height){
    var self = this;
    var query = {
      action: 'filters.size',
      width: width,
      height: height
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
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

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Deleting...");
    jQuery.post(action, query, function(data){
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
