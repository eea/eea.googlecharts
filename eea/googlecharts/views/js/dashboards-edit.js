/** EEA Google Dashboards
*/
if(window.DavizEdit === undefined){
  var DavizEdit = {'version': 'eea.googlecharts'};
}

DavizEdit.Events = DavizEdit.Events || {};
DavizEdit.GoogleDashboards = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {};

  if(options){
    jQuery.extend(self.settings, options);
  }

  if(!self.settings.dashboards){
    self.settings.dashboards = [];
  }
  self.initialize();
};

DavizEdit.GoogleDashboards.prototype = {
  initialize: function(){
    var self = this;
    self.active = null;

    var form = self.context.parents('.daviz-view-form');
    self.action = form.length ? form.attr('action') : '';

    jQuery('input[name*="save"]', self.context.parent()).unbind();

    // Events
    jQuery(document).unbind('.dashboards');
    jQuery(document).bind(DavizEdit.Events.charts.changed + ".dashboards", function(evt, data){
      if (self.context.is(":visible")){
        self.reload(true);
      }
      else {
        self.close();
      }
    });

    jQuery(document).bind(DavizEdit.Events.dashboard.removed + ".dashboards", function(evt, data){
      self.remove(data);
    });

    jQuery(document).bind(DavizEdit.Events.dashboard.renamed + ".dashboards", function(evt, data){
      self.rename(data);
    });

    self.reload(false);
  },

  reload: function(hard){
    var self = this;
    if(!hard){
      return self.onReload();
    }

    jQuery.getJSON(self.action, {action: 'json'}, function(data){
      self.settings = data;
      return self.onReload();
    });
  },

  close: function(){
    var self = this;
    self.active = null;
    return self.reload(false);
  },

  onReload: function(){
    var self = this;
    self.context.empty();
    jQuery("<div>")
        .addClass("eea-tutorial")
        .attr("tutorial", "dashboard")
        .attr("message", "Configure dashboards or")
        .attr("style", "float:left")
        .css("display", "block")
        .css("margin-bottom", "20px")
        .css("margin-top", "10px")
        .css("margin-left", "0px")
        .css("font-size", "16px")
        .appendTo(self.context);
    jQuery("<div>")
        .attr("style", "clear:both")
        .appendTo(self.context);
    updateTutorialLinks();
    try{
        self.context.sortable('destroy');
    } catch(err) {}
    patched_each(self.settings.dashboards, function(index, config){
      var thumb = jQuery('<div>')
        .attr('title', 'Edit ' + config.title)
        .attr('id', config.name)
        .addClass('img-polaroid')
        .addClass('edit-button')
        .appendTo(self.context)
        .html("<span>" + config.title + "</span>")
        .click(function(){
          self.edit(jQuery(this), config);
        });
    });

    self.button = jQuery('<div>')
      .attr('title', 'Add new dashboard')
      .addClass('img-polaroid')
      .addClass('add-button')
      .appendTo(self.context)
      .click(function(){
        self.add();
      });

    self.context.sortable({
      items: '.edit-button',
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

    if(self.active){
      var active = self.active;
      self.active = null;
      jQuery('[id="' + active+ '"]', self.context).click();
    }
  },

  add: function(){
    var self = this;


    jQuery.getJSON(self.action, {action: 'add'}, function(data){
      self.settings = data;
      var dashboards = self.settings.dashboards;
      var dashboard = dashboards[dashboards.length - 1];
      self.active = dashboard.name;
      return self.reload(false);
    });
  },

  edit: function(chart, options){
    var self = this;

    // Close tab
    if(options.name == self.active){
      return self.close();
    }

    self.active = options.name;
    jQuery('.edit-button', self.context).removeClass('selected');
    chart.addClass('selected');
    jQuery('#gcharts-dashboard-edit', self.context).remove();
    jQuery("<div>")
      .attr('id', "gcharts-dashboard-edit")
      .appendTo(self.context);

    jQuery('#gcharts-dashboard-edit', self.context).EEAGoogleDashboard(options);
  },

  reorder: function(order){
    var self = this;
    var query = {
      action: 'dashboards.position',
      order: order
    };
    query = jQuery.param(query, traditional=true);

    DavizEdit.Status.start("Saving...");
    jQuery.post(self.action, query, function(data){
      self.settings = JSON.parse(data);
      DavizEdit.Status.stop('Dashboards position changed');
    });
  },

  rename: function(dashboard){
    var self = this;
    patched_each(self.settings.dashboards, function(index, elem){
      if(elem.name==dashboard.name){
        elem.title = dashboard.title;
      }
    });
    self.reload(false);
  },

  remove: function(dashboard){
    var self = this;
    self.settings.dashboards = jQuery.map(self.settings.dashboards, function(elem, index){
      if(elem.name != dashboard.name){
        return elem;
      }
    });
    self.reload(false);
  }
};

// Make EEAGoogleDashboard a jQuery plugin
jQuery.fn.EEAGoogleDashboards = function(options){
  return this.each(function(){
    var context = jQuery(this).addClass('eea');
    var data = new DavizEdit.GoogleDashboards(context, options);
    context.data('EEAGoogleDashboards', data);
  });
};

/** On load
*/
jQuery(document).ready(function(){
  var init = function(){
    var dashboards = jQuery('#gcharts-dashboards-edit');
    if(!dashboards.length){
      return;
    }
    var config = dashboards.attr('data-config') || "{}";
    dashboards.attr('data-config', null);
    config = JSON.parse(config);
    dashboards.EEAGoogleDashboards(config);
  };

  // onRefresh
  jQuery(document).bind(DavizEdit.Events.views.refreshed, function(evt, data){
    init();
  });

  // onLoad
  init();

});
