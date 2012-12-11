/** EEA Google Dashboard
*/
if(window.DavizEdit === undefined){
  var DavizEdit = {'version': 'eea.googlecharts'};
  DavizEdit.Events = {};
}

DavizEdit.Events.dashboard = {
  remove: 'google-dashboard-delete',
  removed: 'google-dashboard-deleted',
  rename: 'google-dashboard-rename',
  renamed: 'google-dashboard-renamed'
};

DavizEdit.Events.charts = {
    initialized: 'google-charts-initialized',
    changed: 'google-charts-changed',
    reordered: 'google-charts-position-changed',
    resized: 'google-chart-resized',
    resizeFinished: 'google-chart-resize-finished',
    updated: 'google-chart-updated'
};

DavizEdit.GoogleDashboard = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {};

  if(options){
    jQuery.extend(self.settings, options);
  }

  // Events
  jQuery(document).unbind('.dashboard');
  jQuery(document).bind(DavizEdit.Events.dashboard.rename + ".dashboard", function(evt, data){
    self.onRename(data);
  });

  jQuery(document).bind(DavizEdit.Events.dashboard.remove + ".dashboard", function(evt, data){
    self.onRemove(data);
  });

  self.initialize();
};

DavizEdit.GoogleDashboard.prototype = {
  initialize: function(){
    var self = this;
    self.context.empty();

    self.handle_header();
    if((self.settings.chartsBox !== undefined) && (self.settings.chartsBox.order === 0)){
      self.handle_charts();
      self.handle_filters();
    }else{
      self.handle_filters();
      self.handle_charts();
    }

    self.context.sortable({
      items: '.dashboard-section',
      placeholder: 'ui-state-highlight',
      handle: '.box-title',
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

  handle_header: function(){
    var self = this;
    var header = jQuery('<div>')
      .addClass('dashboard-header')
      .addClass('dashboard-header-title')
      .html([
      '<span class="title">', self.settings.title, '</span>'
      ].join('\n'));

    self.handle_buttons(header);
    self.context.prepend(header);
  },

  handle_buttons: function(header){
    var self = this;

    jQuery("<span>")
      .attr('title', 'Rename')
      .text('e')
      .addClass('ui-icon').addClass('ui-icon-pencil')
      .prependTo(header)
      .click(function(){
        self.handle_rename();
      });

    jQuery('<span>')
      .attr('title', 'Delete')
      .text('x')
      .addClass('ui-icon').addClass('ui-icon-trash')
      .prependTo(header)
      .click(function(){
        self.handle_delete();
      });
  },

  handle_rename: function(){
    var self = this;
    var text = self.settings.title;
    var popup = jQuery("<div title='Rename dashbord: " + text + "' />")
      .append(
        jQuery('<input>').attr('type', 'text').val(text).width('80%')
      ).dialog({
        bgiframe: true,
        modal: true,
        dialogClass: 'daviz-confirm-overlay',
        width: 400,
        open: function(evt, ui){
          var buttons = jQuery(this).parent().find('button');
          buttons.attr('class', 'btn');
          jQuery(buttons[0]).addClass('btn-inverse');
          jQuery(buttons[1]).addClass('btn-success');
        },
        buttons: {
          Cancel: function(){
            jQuery(this).dialog('close');
          },
          Rename: function(){
            var value = jQuery('input', popup).val();
            jQuery(document).trigger(DavizEdit.Events.dashboard.rename, value);
            jQuery(this).dialog('close');
          }
        }
    });
  },

  onRename: function(value){
    var self = this;

    self.settings.title = value;
    var query = {
      action: 'dashboard.rename',
      dashboard: self.settings.name,
      title: value
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Saving...");
    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
      jQuery(document).trigger(DavizEdit.Events.dashboard.renamed, self.settings);
    });
  },

  handle_delete: function(){
    var self = this;
    var msg = [
      '<span>This will <strong>erase</strong> all configuration for this dashboard.</span>',
      '<span>Are you sure you want to <strong>remove</strong> this dashboard?</span>'
    ].join('\n');
    DavizEdit.Confirm.confirm(msg, DavizEdit.Events.dashboard.remove, self.settings);
  },

  onRemove: function(dashboard){
    var self = this;
    var query = {
      action: 'dashboard.delete',
      dashboard: self.settings.name
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    DavizEdit.Status.start("Deleting dashboard...");
    jQuery.post(action, query, function(data){
      DavizEdit.Status.stop(data);
      jQuery(document).trigger(DavizEdit.Events.dashboard.removed, self.settings);
    });
  },

  handle_filters: function(){
    var self = this;
    var filters = new DavizEdit.GoogleDashboardFilters(self.context, self.settings);
  },

  handle_charts: function(){
    var self = this;
    var charts = new DavizEdit.GoogleDashboardCharts(self.context, self.settings);
  },

  reorder: function(order){
    var self = this;
    var query = {
      action: 'sections.position',
      dashboard: self.settings.name,
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
    },
    widgets: []
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
      .addClass('dashboard-charts')
      .addClass('dashboard-section')
      .appendTo(self.context)
      .resizable({
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

    jQuery(self.settings.widgets).each(function(index){
      self.handle_widget(this, index);
    });

    self.box.sortable({
      items: '.dashboard-chart',
      placeholder: 'ui-state-highlight',
      forcePlaceholderSize: true,
      handle: '.dashboard-header',
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
      .attr('title', 'Click and drag to reorder')
      .html([
        '<span class="label">Dashboard charts</span>',
        '<input type="text" name="width" value=""/>',
        '<span>x</span>',
        '<input type="text" name="height" value=""/>'
      ].join('\n'))
      .prependTo(self.box);

    // Add button
    jQuery("<span>")
     .attr('title', 'Add new widget')
     .text('+')
     .addClass('ui-icon').addClass('ui-icon-plus').addClass('ui-corner-all')
     .prependTo(header)
     .click(function(){
       self.new_widget(self.box);
     });

    jQuery("input[name='width']", header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      self.after_resize(width, self.box.height());
    });

    jQuery("input[name='height']", header).val(height).change(function(){
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

  handle_widget: function(widget, index){
    var self = this;
    if(widget.dashboard.order === undefined){
      widget.dashboard.order = index;
    }
    if(widget.dashboard.name === undefined){
      widget.dashboard.name = self.settings.name;
    }
    var gwidget = new DavizEdit.GoogleDashboardWidget(jQuery('.box-body', self.box), widget);
  },

  handle_charts_position: function(order){
    var self = this;
    var query = {
      action: 'charts.position',
      dashboard: self.settings.name,
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
    self = this;
    jQuery(".box-title input[name='width']", self.box).val(width);
    jQuery(".box-title input[name='height']", self.box).val(height);
    self.after_resize(width, height);
  },

  after_resize: function(width, height){
    var self = this;
    var query = {
      action: 'charts.size',
      dashboard: self.settings.name,
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
  },

  initializeTinyMCE: function(form){
    var self = this;

    // tinyMCE no supported
    if(!window.tinyMCE){
      return;
    }
    if(!window.TinyMCEConfig){
      return;
    }

    var textarea = jQuery('textarea', form).addClass('mce_editable');
    var name = textarea.attr('id');
    var exists = tinyMCE.get(name);
    if(exists !== undefined){
      delete InitializedTinyMCEInstances[name];
    }

    form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@tinymce-jsonconfiguration';

    jQuery.getJSON(action, {fieldname: name}, function(data){
      data.autoresize = true;
      data.resizing = false;
      // XXX Remove some buttons as they have bugs
      data.buttons = jQuery.map(data.buttons, function(button){
        if(button === 'save'){
          return;
        }else{
          return button;
        }
      });
      textarea.attr('title', JSON.stringify(data));
      var config = new TinyMCEConfig(name);
      config.init();
    });
  },

  new_widget: function(context){
    var self = this;
    var wtypes = jQuery.data(self.box, 'widget_types');
    var widget = jQuery('<form>')
      .addClass('loading')
      .addClass('googlechart-widget-add')
      .submit(function(){
        return false;
      });

    widget.dialog({
      title: 'Add Widget',
      dialogClass: 'googlechart-dialog',
      bgiframe: true,
      modal: true,
      closeOnEscape: true,
      minHeight: 600,
      minWidth: 950,
      open: function(evt, ui){
        var buttons = jQuery(this).parent().find('button');
        buttons.attr('class', 'btn');
        jQuery(buttons[0]).addClass('btn-inverse');
        jQuery(buttons[1]).addClass('btn-success');
      },
      buttons: [
        {
          text: "Cancel",
          click: function(){
              widget.dialog("close");
          }
        },
        {
          text: "Add",
          click: function(){
            self.new_widget_onSave(widget);
            widget.dialog("close");
          }
        }
      ]
    });

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlecharts.widgets.add';

    widget.load(action, {dashboard: self.settings.name}, function(){
      widget.removeClass('loading');
      jQuery('#actionsView', widget).remove();
      jQuery("[name*='.wtype']", widget).change(function(){
        var formUrl = jQuery(this).val();
        if(!formUrl){
          return;
        }
        action = action.split('@@')[0] + '@@' + formUrl + '.add';
        widget.load(action, {dashboard: self.settings.name}, function(){
          widget.attr('action', action);
          jQuery('#actionsView', widget).remove();
          // Init tinyMCE
          if(jQuery('textarea', widget).length){
            self.initializeTinyMCE(widget);
          }
        });
      });
    });
  },

  new_widget_onSave: function(form){
    var self = this;
    if(jQuery('.mce_editable', form).length){
      tinyMCE.triggerSave(true, true);
    }

    var query = {
      dashboard: self.settings.name
    };

    jQuery.each(form.serializeArray(), function(){
      query[this.name] = this.value;
    });
    query[self.settings.name + '.actions.save'] = 'ajax';

    DavizEdit.Status.start("Adding...");
    jQuery.post(form.attr('action'), query, function(data){
      jQuery(document).trigger(DavizEdit.Events.charts.changed);
      DavizEdit.Status.stop(data);
    });
  }
};

DavizEdit.GoogleDashboardWidget = function(context, options){
  var self = this;
  self.context = context;

  self.settings = {
    dashboard: {
      height: 600,
      width: 800,
      order: 997,
      hidden: false,
      name: ''
    },
    name: '',
    wtype: '',
    text: ''
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

DavizEdit.GoogleDashboardWidget.prototype = {
  initialize: function(){
    var self = this;
    self.isTinyMCE = false;
    self.reload();
  },

  reload: function(){
    var self = this;
    if(self.box === undefined){
      self.box = jQuery('<div>')
        .attr('id', self.settings.name)
        .addClass('dashboard-chart')
        .width(self.settings.dashboard.width)
        .height(self.settings.dashboard.height)
        .appendTo(self.context);
    }else{
      self.box.resizable("destroy");
      self.box.empty();
    }

    self.box.resizable({
      helper: 'dashboard-resizable-helper',
      stop: function(event, ui){
        jQuery(self.box).trigger(DavizEdit.Events.charts.resized, {
          context: self.box,
          width: ui.size.width,
          height: ui.size.height
        });
      }
    });

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@' + self.settings.wtype;
    var query = {
      dashboard: self.settings.dashboard.name,
      name: self.settings.name
    };


    jQuery.get(action, query, function(data){
      jQuery('<div>')
        .addClass('dashboard-widget')
        .append(data)
        .appendTo(self.box);
    });

    self.handle_header(self.settings.dashboard.width, self.settings.dashboard.height);

    // Events
    self.box.unbind('.dashboard');
    self.box.unbind('dblclick');

    self.box.bind('dblclick', function(){
      self.handle_edit();
    });

    // Resize
    self.box.bind(DavizEdit.Events.charts.resized + '.dashboard', function(evt, data){
      self.handle_resize(data);
    });

    // After resize
    self.box.bind(DavizEdit.Events.charts.resizeFinished + '.dashboard', function(evt, data){
      self.handle_afterResize(data);
    });

    // Position changed
    self.context.parents('#gcharts-dashboard-edit').bind(DavizEdit.Events.charts.reordered + '.dashboard', function(evt, data){
        self.handle_position(data.order);
    });

  },

  initializeTinyMCE: function(form){
    var self = this;

    // tinyMCE not supported
    if(!window.tinyMCE){
      return;
    }
    if(!window.TinyMCEConfig){
      return;
    }

    self.isTinyMCE = true;
    var textarea = jQuery('textarea', form).addClass('mce_editable');
    var name = textarea.attr('id');
    var exists = tinyMCE.get(name);
    if(exists !== undefined){
      delete InitializedTinyMCEInstances[name];
    }

    form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@tinymce-jsonconfiguration';

    jQuery.getJSON(action, {fieldname: name}, function(data){
      data.autoresize = true;
      data.resizing = false;
      // XXX Remove some buttons as they have bugs
      data.buttons = jQuery.map(data.buttons, function(button){
        if(button === 'save'){
          return;
        }else{
          return button;
        }
      });
      textarea.attr('title', JSON.stringify(data));
      var config = new TinyMCEConfig(name);
      config.init();
    });
  },

  tinyMCE_onChange: function(form){
    var self = this;
    self.settings.text = jQuery('textarea', form).val();
  },

  handle_header: function(width, height){
    var self = this;
    var header = jQuery('<div>')
      .addClass('dashboard-header')
      .attr('title', 'Click and drag to reorder')
      .html([
      '<span class="title">', self.settings.title, '</span>',
      '<input type="number" name="width" value=""/>',
      '<span>x</span>',
      '<input type="number" name="height" value=""/>',
      '<span>px</span>'
    ].join('\n'));
    if(self.settings.dashboard.hidden){
      header.addClass('dashboard-header-hidden');
    }

    self.handle_buttons(header);

    jQuery("input[name='width']", header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      jQuery(self.box).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: self.box,
        width: width
      });
    });

    jQuery("input[name='height']", header).val(height).change(function(){
      var height = jQuery(this).val();
      self.box.height(height);
      jQuery(self.box).trigger(DavizEdit.Events.charts.resizeFinished, {
        context: self.box,
        height: height
      });
    });

    self.box.prepend(header);
  },

  handle_buttons: function(header){
    var self = this;
    var title = 'Hide widget';
    if(self.hidden){
      title = 'Show widget';
    }

    jQuery("<span>")
      .attr('title', title)
      .text('h')
      .addClass('ui-icon').addClass('ui-icon-visibility')
      .prependTo(header)
      .click(function(){
        self.toggle_visibility();
      });

    jQuery("<span>")
      .attr('title', 'Edit widget')
      .text('e')
      .addClass('ui-icon').addClass('ui-icon-pencil')
      .prependTo(header)
      .click(function(){
        self.handle_edit();
      });

    jQuery('<span>')
      .attr('title', 'Delete')
      .text('x')
      .addClass('ui-icon').addClass('ui-icon-trash')
      .prependTo(header)
      .click(function(){
        self.handle_delete();
      });
  },

  handle_resize: function(data){
    var self = this;
    var context = jQuery(data.context);
    jQuery("input[name='width']", context).val(data.width);
    jQuery("input[name='height']", context).val(data.height);
    jQuery(self.box).trigger(DavizEdit.Events.charts.resizeFinished, {
      context: context,
      width: data.width,
      height: data.height
    });
  },

  handle_afterResize: function(data){
    var self = this;
    var context = data.context;
    var width = data.width;
    var height = data.height;

    if(width){
      self.settings.dashboard.width = width;
    }
    if(height){
      self.settings.dashboard.height = height;
    }

    // Save changes
    self.save(false, true);
  },

  handle_position: function(order){
    var self = this;
    var name = self.settings.name;
    var index = order.indexOf(name);
    if(index === -1){
      return;
    }

    self.settings.dashboard.order = index;
  },

  handle_edit: function(){
    var self = this;
    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@' + self.settings.wtype + '.edit';

    var query = {
      dashboard: self.settings.dashboard.name,
      name: self.settings.name
    };

    jQuery.get(action, query, function(data){
      var form = jQuery('<form>')
        .append(data)
        .attr('action', action)
        .addClass('googlechart-widget-edit')
        .submit(function(){
          return false;
        });

      jQuery('.actionButtons', form).remove();

      form.dialog({
        title: 'Edit Widget',
        dialogClass: 'googlechart-dialog',
        bgiframe: true,
        modal: true,
        minWidth: 950,
        minHeight: 600,
        closeOnEscape: true,
        open: function(){
          var buttons = jQuery(this).parent().find('button');
          buttons.attr('class', 'btn');
          jQuery(buttons[0]).addClass('btn-inverse');
          jQuery(buttons[1]).addClass('btn-success');
          // Init tinyMCE
          if(jQuery('textarea', form).length){
            self.initializeTinyMCE(form);
          }
        },
        buttons: [
          {
            text: "Cancel",
            click: function(){
              form.remove();
              form.dialog("close");
            }
          },
          {
            text: "Save",
            click: function(){
              self.onEdit(form);
              form.dialog("close");
            }
          }
        ]
      });
    });
  },

  onEdit: function(form){
    var self = this;
    if(self.isTinyMCE){
      tinyMCE.triggerSave(true, true);
      self.tinyMCE_onChange(form);
    }

    var title = jQuery("input[name*='.title']", form);
    if(title.length){
      self.settings.title = title.val();
    }
    var action = self.settings.dashboard.name + '.actions.save';
    var query = {};
    jQuery.each(form.serializeArray(), function(){
      query[this.name] = this.value;
    });
    query.name = self.settings.name;
    query.dashboard = self.settings.dashboard.name;

    query[action] = 'ajax';
    DavizEdit.Status.start("Saving...");
    jQuery.post(form.attr('action'), query, function(data){
      self.reload();
      form.remove();
      DavizEdit.Status.stop(data);
    });
  },

  handle_delete: function(){
    var self = this;
    jQuery('<div>')
      .html([
        '<span>Are you sure you want to delete:</span>',
        '<strong>',
          self.settings.title,
        '</strong>'
        ].join('\n'))
      .dialog({
        title: 'Remove widget',
        modal: true,
        dialogClass: 'googlechart-dialog',
        open: function(evt, ui){
          var buttons = jQuery(this).parent().find('button');
          buttons.attr('class', 'btn');
          jQuery(buttons[0]).addClass('btn-danger');
          jQuery(buttons[1]).addClass('btn-inverse');
        },
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
    DavizEdit.Status.start("Deleting...");
    query = {
      dashboard: self.settings.dashboard.name,
      name: self.settings.name,
      action: 'widget.delete'
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    jQuery.post(action, query, function(data){
      self.box.remove();
      DavizEdit.Status.stop(data);
    });
  },

  toggle_visibility: function(){
    var self = this;
    if(self.settings.dashboard.hidden){
      self.settings.dashboard.hidden = false;
      jQuery('.dashboard-header', self.box).removeClass('dashboard-header-hidden');
      jQuery('.ui-icon-visibility', self.box).attr('title', 'Hide widget');
    }else{
      self.settings.dashboard.hidden = true;
      jQuery('.dashboard-header', self.box).addClass('dashboard-header-hidden');
      jQuery('.ui-icon-visibility', self.box).attr('title', 'Show widget');
    }
    self.save();
  },

  save: function(quiet, reload){
    var self = this;
    query = {
      action: 'widget.edit',
      name: self.settings.name,
      dashboard: self.settings.dashboard.name,
      settings: JSON.stringify(self.settings)
    };

    var form = self.context.parents('.daviz-view-form');
    var action = form.length ? form.attr('action') : '';
    action = action.split('@@')[0] + '@@googlechart.googledashboard.edit';

    if(!quiet){
      DavizEdit.Status.start("Saving...");
    }
    jQuery.post(action, query, function(data){
      if(!quiet){
        DavizEdit.Status.stop(data);
      }
      if(reload){
        self.reload();
      }
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
      .addClass('dashboard-filters')
      .addClass('dashboard-section')
      .appendTo(self.context)
      .resizable({
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
      .attr('title', 'Click and drag to reorder')
      .html([
        '<span class="label">Dashboard filters</span>',
        '<input type="text" name="width" value=""/>',
        '<span>x</span>',
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

    jQuery("input[name='width']", header).val(width).change(function(){
      var width = jQuery(this).val();
      self.box.width(width);
      self.after_resize(width, self.box.height());
    });

    jQuery("input[name='height']", header).val(height).change(function(){
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
      if(filter.dashboard === undefined){
        filter.dashboard = {};
      }
      if(filter.dashboard.name === undefined){
        filter.dashboard.name = self.settings.name;
      }
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
        .appendTo(jQuery("select[name='column']", widget));
    });

    jQuery.each(ftypes, function(key, val){
      var option = jQuery('<option>')
        .val(key).text(val)
        .appendTo(jQuery("select[name='type']", widget));
    });

    widget.dialog({
      title: "Add Filter",
      dialogClass: 'googlechart-dialog',
      bgiframe: true,
      modal: true,
      closeOnEscape: true,
      open: function(evt, ui){
        var buttons = jQuery(this).parent().find('button');
        buttons.attr('class', 'btn');
        jQuery(buttons[0]).addClass('btn-inverse');
        jQuery(buttons[1]).addClass('btn-success');
      },
      buttons: [
        {
          text: "Cancel",
          click: function(){
              widget.dialog("close");
          }
        },
        {
          text: "Add",
          click: function(){
            var form = jQuery('form', widget);
            self.new_filter_onSave(form);
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
    query.dashboard = self.settings.name;

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
      dashboard: self.settings.name,
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
    self = this;
    jQuery(".box-title input[name='width']", self.box).val(width);
    jQuery(".box-title input[name='height']", self.box).val(height);
    self.after_resize(width, height);
  },

  after_resize: function(width, height){
    var self = this;
    var query = {
      action: 'filters.size',
      dashboard: self.settings.name,
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
      .addClass('ui-icon').addClass('ui-icon-close')
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
        open: function(evt, ui){
          var buttons = jQuery(this).parent().find('button');
          buttons.attr('class', 'btn');
          jQuery(buttons[0]).addClass('btn-danger');
          jQuery(buttons[1]).addClass('btn-inverse');
        },
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
      dashboard: self.settings.dashboard.name,
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
    var dashboard = new DavizEdit.GoogleDashboard(context, options);
    context.data('EEAGoogleDashboard', dashboard);
  });
};
