if(window.Daviz === undefined){
  var Daviz = {'version': 'eea.googlecharts'};
}

/* Google Charts Dashboard
*/
Daviz.GoogleDashboard = function(context, options){
  var self = this;
  self.context = context;
  self.settings = {
    dashboard: {},
    charts: {},
    absolute_url: ''
  };

  if(options){
    jQuery.extend(self.settings, options);
  }

  // Default Charts Box
  if(self.settings.dashboard.chartsBox === undefined){
    self.settings.dashboard.chartsBox = {};
  }

  // Default Filters box
  if(self.settings.dashboard.filtersBox === undefined){
    self.settings.dashboard.filtersBox = {};
  }

  // Default Filters
  if(self.settings.dashboard.filters === undefined){
    self.settings.dashboard.filters = [];
  }

  self.initialize();
};

Daviz.GoogleDashboard.prototype = {
  initialize: function(){
    self.redraw();
  },

  redraw: function(){
    var self = this;
    // XXX Do nothing yet
  }
};

// Make EEAGoogleDashboard a jQuery plugin
jQuery.fn.EEAGoogleDashboardView = function(options){
  return this.each(function(){
    var context = jQuery(this).addClass('eea');
    if(options === undefined){
      options = {};
    }
    options.absolute_url = context.attr('data-link');
    var dashboard = new Daviz.GoogleDashboard(context, options);
    context.data('EEAGoogleDashboardView', dashboard);
  });
};
