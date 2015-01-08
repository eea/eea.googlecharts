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
    var doc = $(document);
    doc.bind('googlecharts.embed.ready', function() {
        $('.googlecharts-embed-dialog').dialog({ autoOpen: false, width: '80%'});
        var share_dialog = $('#share-dialog');
        var embed_url = this.location.href;
        var doc_height = doc.height();
        var doc_width = doc.width();
        var iframeCode = '<iframe width=\'' + doc_width  + '\' height=\'' + doc_height + '\' src=\'' + embed_url + '\'></iframe>';
        share_dialog.find('.share-dialog-text').text(iframeCode);
        $('.open-dialog').click(function(ev) {
            $($(this).attr('data-dialog')).dialog('open');
            ev.preventDefault();
        });
        if (!window.EEAGoogleCharts) {
            return;
        }
        var embed_obj = window.EEAGoogleCharts.embed;
        var hash = embed_obj.hash;
        var baseurl_uri = window.encodeURIComponent(embed_obj['baseurl_' + hash] + '/#tab-' + embed_obj['chart_id_' + hash]);
        var chart_share = $('.googlechart-share');
        chart_share.parent().appendTo("#googlechart_bottom_images_" + hash);
        $(".googlechart_left_image").find('img').appendTo("#share-dialog");
        var notes = $('.googlechart-notes');
        var datasource_info = $(".googlechart-datasources-info");
        if (notes.is(":visible")) {
            datasource_info.addClass('notesMeld');
        }
        datasource_info.insertAfter(notes);
        doc.hover(function() {
            chart_share.fadeTo(400, 1);
        }, function() {
            chart_share.fadeTo(400, 0);
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
});
