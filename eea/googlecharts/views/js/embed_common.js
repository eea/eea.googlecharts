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
