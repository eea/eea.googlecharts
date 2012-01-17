google.load('visualization', '1.0');
function drawVisualization(parameters, container_id) {
    var wrapper = new google.visualization.ChartWrapper(parameters);
    wrapper.setContainerId(container_id);
    wrapper.draw();
}

function loadJSON(settings_and_data_url, container_id){
    jQuery.ajax({
        url: settings_and_data_url,
        success: function(data){
            drawVisualization(data, container_id);
        }
    });
}

function drawChart(settings_and_data_url, container_id){
    google.setOnLoadCallback(function(){
        loadJSON(settings_and_data_url, container_id);
    });
}

