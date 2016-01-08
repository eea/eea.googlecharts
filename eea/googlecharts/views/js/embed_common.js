/* @flow */
google.load('visualization', '1.0', {packages: ['controls']});

if (!window.EEAGoogleCharts) {
    window.EEAGoogleCharts = {};
}
if (!window.EEAGoogleCharts.common) {
    window.EEAGoogleCharts.common = {};
}
if (!window.EEAGoogleCharts.embed) {
    window.EEAGoogleCharts.embed = {};
}
var commonModule = window.EEAGoogleCharts.common;
var embedModule = window.EEAGoogleCharts.embed;

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

commonModule.insertBottomImages = function(settings, chart_url) {
    // check if cross-domain or not
    var chart_hash = settings.vhash;
    var is_cross_domain = false;
    try{
        if (jQuery.isEmptyObject(window.parent.location)){
            is_cross_domain = true;
        }
    }
    catch(e){
        is_cross_domain = true;
    }
    var wm_resize = false;
    var qr_resize = false;
    // if not cross-domain, use the iframe settings for wm & qrcode
    if (!is_cross_domain){
        if (settings.iframe_qr_settings.hide){
            settings.qr_pos = "Disabled";
        }
        else{
            if (settings.iframe_qr_settings.resize){
                if (settings.iframe_qr_settings.size < 70){
                    qr_resize = true;
                }
                else{
                    settings.qr_size = settings.iframe_qr_settings.size;
                }
            }
        }

        if (settings.iframe_wm_settings.hide){
            settings.wm_pos = "Disabled";
        }
        else{
            if (settings.iframe_wm_settings.resize){
                wm_resize = true;
            }
        }
    }

    putImageDivInPosition("googlechart_qr_" + chart_hash, settings.qr_pos, chart_hash);

    var qr_img_url = "http://chart.apis.google.com/chart?cht=qr&chld=H|0&chs="+settings.qr_size+"x"+settings.qr_size+"&chl=" + encodeURIComponent(chart_url);
    var googlechart_qr = "<img alt='QR code' src='" + qr_img_url + "'/>";

    if (settings.qr_pos !== "Disabled"){
        jQuery(googlechart_qr).appendTo("#googlechart_qr_" + chart_hash);
        jQuery("#googlechart_qr_" + chart_hash).removeClass("eea-googlechart-hidden-image");
    }

    putImageDivInPosition("googlechart_wm_" + chart_hash, settings.wm_pos, settings.vhash);

    var googlechart_wm = "<img alt='Watermark' src='" + settings.wm_path + "'/>";
    if (settings.wm_pos !== "Disabled"){
        jQuery(googlechart_wm).appendTo("#googlechart_wm_" + chart_hash);
        jQuery("#googlechart_wm_" + chart_hash).removeClass("eea-googlechart-hidden-image");
    }
    if (qr_resize){
        jQuery("#googlechart_qr_" + chart_hash + " img").css("height", settings.iframe_qr_settings.size + "px");
    }
    if (wm_resize){
        jQuery("#googlechart_wm_" + chart_hash + " img").css("height", settings.iframe_wm_settings.size + "px");
    }

    // #22489 add Explore chart link when printing
    var explore_link, left_images;
    if (embedModule && embedModule.isPrint) {
        explore_link = $("<a />", {
            href: settings.baseurl,
            text:'Explore chart interactively',
            target: '_blank',
            'class':'googlecharts-explore-link'
        });
        left_images = $("<div class='googlechart_left_image' />");
        explore_link.appendTo(left_images);
        left_images.prependTo($("#googlechart_bottom_images_" + chart_hash));
    }
};

jQuery(function($){
    var doc = $(document);
    doc.bind('googlecharts.embed.ready', function(ev, data) {
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
