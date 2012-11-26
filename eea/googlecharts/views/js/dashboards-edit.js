/** EEA Google Dashboards
*/
if(window.DavizEdit === undefined){
  var DavizEdit = {'version': 'eea.googlecharts'};
  DavizEdit.Events = {};
}

DavizEdit.GoogleDashboards = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {
    config: {}
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  self.initialize();
};

DavizEdit.GoogleDashboards.prototype = {
  initialize: function(){
    var self = this;

    jQuery('input[name*="save"]', self.context.parent()).remove();
    self.reload();
  },

  reload: function(){
    var self = this;
    self.context.empty();

    jQuery.each(self.settings.config.dashboards, function(index, config){
      var thumb = jQuery('<div>')
        .attr('title', 'Edit ' + config.title)
        .addClass('img-polaroid')
        .addClass('edit-button')
        .data('config', config)
        .appendTo(self.context)
        .html("<span>" + config.title + "</span>")
        .click(function(){
          self.edit(jQuery(this));
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

  edit: function(chart){
    var self = this;
    console.log(chart);
    console.log(chart.data());
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
  var dashboards = jQuery('#gcharts-dashboards-edit');
  if(!dashboards.length){
    return;
  }
  var config = dashboards.attr('data-config') || "{}";
  dashboards.attr('data-config', null);
  config = JSON.parse(config);
  dashboards.EEAGoogleDashboards({config: config});
});
