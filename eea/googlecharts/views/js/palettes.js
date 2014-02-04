
function toHex(int_nr){
    var hex = Math.round(int_nr).toString(16);
    if (hex.length < 2){
        hex = "0" + hex;
    }
    return hex;
}

function rgbToHex(r, g, b){
    return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex){
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbstrToHex(rgbstr){
    var components = rgbstr.substr(4,rgbstr.length - 5).split(",");
    return rgbToHex(parseInt(components[0],10), parseInt(components[1],10), parseInt(components[2],10));
}

function getGradients(fromR, fromG, fromB, toR, toG, toB, steps){
    var stepR = (toR - fromR) / (steps - 1);
    var stepG = (toG - fromG) / (steps - 1);
    var stepB = (toB - fromB) / (steps - 1);
    var gradients = [];
    for (i = 0; i < steps; i++){
        gradients.push("#" + toHex(fromR) + toHex(fromG) + toHex(fromB));
        fromR += stepR;
        fromG += stepG;
        fromB += stepB;
    }
    return gradients;
}

function getRainbow(colors, steps){
    var rainbow = [];
    for (var i = 0; i < colors.length - 1; i++){
        var grad = getGradients(colors[i][0], colors[i][1], colors[i][2], colors[i + 1][0], colors[i + 1][1], colors[i + 1][2], Math.floor(steps/(colors.length - 1)));
        for (j = 0; j < grad.length; j++){
            if (jQuery.inArray(grad[j], rainbow) === -1){
                rainbow.push(grad[j]);
            }
        }
    }
    return rainbow;
}

var chartPalettes = {"default":{"name":"Company Default Palette",
                                "colors":
                                    [
                                    "#AFBC21",  //pantone 583
                                    "#002C56",  //85% pantone 296
                                    "#6b7427",  //pantone 385
                                    "#844980",  //pantone 682
                                    "#d48625",  //pantone 152
                                    "#51697a",  //pantone 5405
                                    "#000000",  //black
                                    "#8a9c3a",  //pantone 582
                                    "#b8006b",  //pantone 227
                                    "#e3b73b",  //pantone 7409
                                    "#6c8ba2",  //pantone 549
                                    "#7c7c7c",  //pantone cool grey 9
                                    "#b4cb4c",  //pantone 584
                                    "#ac003e",  //pantone 152
                                    "#efdc1e",  //pantone 109
                                    "#9cc9c8",  //pantone 570
                                    "#c0c0c0",  //pantone cool grey 5
                                    "#c0cf99",  //pantone 7492
                                    "#d67c9d",  //pantone 7432
                                    "#fffabe",  //pantone 601
                                    "#c7e0e9",  //pantone 317
                                    "#eaeaea"  //pantone cool grey 2
                                    ]
                                },
                    "company":{"name":"Company Colors",
                                "colors":
                                    [
                                    "#AFBC21",  //pantone 583
                                    "#002C56"  //85% pantone 296
                                    ]
                                },
                    "green":{"name":"Company Green Gradient",
                                "colors":
                                    [
                                    "#6b7427",  //pantone 385
                                    "#8a9c3a",  //pantone 582
                                    "#b4cb4c",  //pantone 584
                                    "#c0cf99"  //pantone 7492
                                    ]
                                },
                    "red":{"name":"Company Red Gradient",
                                "colors":
                                    [
                                    "#844980",  //pantone 682
                                    "#b8006b",  //pantone 227
                                    "#ac003e",  //pantone 152
                                    "#d67c9d"  //pantone 7432
                                    ]
                                },
                    "yellow":{"name":"Company Yellow Gradient",
                                "colors":
                                    [
                                    "#d48625",  //pantone 152
                                    "#e3b73b",  //pantone 7409
                                    "#efdc1e",  //pantone 109
                                    "#fffabe"  //pantone 601
                                    ]
                                },
                    "blue":{"name":"Company Blue Gradient",
                                "colors":
                                    [
                                    "#51697a",  //pantone 5405
                                    "#6c8ba2",  //pantone 549
                                    "#9cc9c8",  //pantone 570
                                    "#c7e0e9"  //pantone 317
                                    ]
                                },
                    "gray":{"name":"Company Gray Gradient",
                                "colors":
                                    [
                                    "#000000",  //black
                                    "#7c7c7c",  //pantone cool grey 9
                                    "#c0c0c0",  //pantone cool grey 5
                                    "#eaeaea"  //pantone cool grey 2
                                    ]
                                },
                    "redgradient":{"name":"Red Gradient",
                                "colors":getGradients(255, 0, 0, 255, 211, 211, 30)
                                },
                    "redgradientinverted":{"name":"Red Gradient - Inverted",
                                "colors":getGradients(255, 211, 211, 255, 0, 0, 30)
                                },
                    "greengradient":{"name":"Green Gradient",
                                "colors":getGradients(0, 255, 0, 211, 255, 211, 30)
                                },
                    "greengradientinverted":{"name":"Green Gradient - Inverted",
                                "colors":getGradients(211, 255, 211, 0, 255, 0, 30)
                                },
                    "bluegradient":{"name":"Blue Gradient",
                                "colors":getGradients(0, 0, 255, 211, 211, 255, 30)
                                },
                    "bluegradientinverted":{"name":"Blue Gradient - Inverted",
                                "colors":getGradients(211, 211, 255, 0, 0, 255, 30)
                                },
                    "rainbow":{"name":"Rainbow",
                                "colors":getRainbow([[255,0,0],[0,255,0],[0,0,255],[255,0,0]],50)
                                }
                    };
