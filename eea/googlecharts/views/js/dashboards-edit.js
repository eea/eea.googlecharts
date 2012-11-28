/** EEA Google Dashboards
*/
if(window.DavizEdit === undefined){
  var DavizEdit = {'version': 'eea.googlecharts'};
  DavizEdit.Events = {};
}

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

    jQuery('input[name*="save"]', self.context.parent()).unbind();
    self.reload();
  },

  reload: function(){
    var self = this;
    self.context.empty();

    jQuery.each(self.settings.dashboards, function(index, config){
      var thumb = jQuery('<div>')
        .attr('title', 'Edit ' + config.title)
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
  },

  add: function(){
    var self = this;
    console.log('Adding new dashboard');
  },

  edit: function(chart, options){
    var self = this;
    jQuery('.edit-button', self.context).removeClass('selected');
    chart.addClass('selected');
    jQuery('#gcharts-dashboard-edit', self.context).remove();
    jQuery("<div>")
      .attr('id', "gcharts-dashboard-edit")
      .appendTo(self.context);

    jQuery('#gcharts-dashboard-edit', self.context).EEAGoogleDashboard(options);
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
