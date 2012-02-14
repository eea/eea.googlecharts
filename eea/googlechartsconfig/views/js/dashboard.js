jQuery.fn.EEAGoogleDashboard = function(options){
  var settings = {};
  return this.each(function(){
    if(options){
      jQuery.extend(settings, options);
    }

    var self = jQuery(this).addClass('ajax');

    //var dashboard = new google.visualization.Dashboard(this);
    //var data = google.visualization.arrayToDataTable([]);
    //dashboard.bind();
    //dashboard.draw(data);
  });
};


jQuery(document).ready(function(){
  var dashboard = jQuery('#gcharts-dashboard-view');
  if(!dashboard.length){
    return;
  }
  dashboard.EEAGoogleDashboard();
  console.log('DEBUG: View Dashboard initialized');
});
