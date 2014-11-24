/* @flow */
google.load('visualization', '1.0', {packages: ['controls']});

function putImageDivInPosition(div_id, position, vhash){
    if (position === "Disabled"){
        return;
    }

    var div = "<div id='" + div_id+ "' class='eea-googlechart-hidden-image'></div>";

    if (position.indexOf("Top") > -1){
        jQuery(div).appendTo("#googlechart_top_images_"+vhash);
    }

    if (position.indexOf("Bottom") > -1){
        jQuery(div).appendTo("#googlechart_bottom_images_"+vhash);
    }

    if (position.indexOf("Left") > -1){
        jQuery("#" + div_id).addClass("googlechart_left_image");
    }

    if (position.indexOf("Right") > -1){
        jQuery("#" + div_id).addClass("googlechart_right_image");
    }
}

jQuery(function($){
    $('.googlecharts-embed-dialog').dialog({ autoOpen: false, width: '80%'});
    var share_dialog = $('#share-dialog');
    var embed_url = document.location.href;
    debugger;
    var doc = $(document);
    var doc_height = doc.height();
    var doc_width = doc.width();
    var iframeCode = '<iframe width=\'' + doc_width  + '\' height=\'' + doc_height + '\' src=\'' + embed_url + '\'></iframe>';
    share_dialog.find('.share-dialog-text').text(iframeCode);
    $('.open-dialog').click(function(ev) {
        $($(this).attr('data-dialog')).dialog('open');
        ev.preventDefault();
    });
    var embed_obj = window.EEAGoogleCharts.embed;
    var hash = embed_obj.hash;
    var baseurl_uri = window.encodeURIComponent(embed_obj['baseurl_' + hash] + '/#tab-' + embed_obj['chart_id_' + hash]);
    var chart_share = $('.googlechart-share');
    var chart_share_btn = $('.googlechart-share-btn');
    doc.hover(function() {
        chart_share_btn.fadeIn();
    }, function() {
        chart_share_btn.fadeOut();
    });
    chart_share_btn.click(function(ev){
        ev.preventDefault();
        var self = $(this).find('span');
        chart_share.toggle("slide", { direction: "toggle" }, 500, function(){
            self.toggleClass('sprite-show').toggleClass('sprite-hide');
        });
    });

    var enlarge_button = $('.googlechart-enlarge');
    enlarge_button.attr('href', embed_url);
    // show the enlarge button only if we are inside of the iframe
    if(window === window.top) {
        enlarge_button.hide();
    }
    $('.share-button').each(function(){
        this.href = this.href + baseurl_uri;
    });
});
