""" Googlecharts Control Panel Section
"""
from eea.app.visualization.controlpanel.interfaces import IDavizSection
from eea.googlecharts.config import EEAMessageFactory as _
from zope.interface import implements
from zope.formlib.form import FormFields
from zope import schema
from zope.schema.vocabulary import SimpleVocabulary, SimpleTerm

class GooglechartsSection(object):
    """ Googlecharts Settings Section
    """
    implements(IDavizSection)
    prefix = 'googlechart'
    title = _('Google Charts Settings')
    form_fields = FormFields(
        schema.Choice(
            __name__='googlechart.qrcode_position',
            title=_(u"QRCode Position"),
            description=_(u"Position of QR Code"),
            required=True,
            default='Disabled',
            vocabulary=
                'eea.googlecharts.controlpanel.vocabularies.imgPositions',
            ),
        schema.Int(
            __name__='googlechart.qrcode_horizontal_space_for_png_export',
            title=_(u'QRCode Horizontal Space For PNG Export'),
            description=_(u"""Horizontal space of QR Code from margin of the
                            container (for PNG Export)"""),
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.qrcode_vertical_space_for_png_export',
            title=_(u'QRCode Vertical Space For PNG Export'),
            description=_(u"""Vertical space of QR Code from margin of the
                            container (for PNG Export)"""),
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.qrcode_size',
            title=_(u'QRCode Size'),
            description=_(u"Size of QR Code"),
            required=False,
            default=70),
        schema.Choice(
            __name__='googlechart.watermark_position',
            title=_(u"Watermark Position"),
            description=_(u"Position of Watermark"),
            required=True,
            default='Disabled',
            vocabulary=
                'eea.googlecharts.controlpanel.vocabularies.imgPositions',
            ),
        schema.TextLine(
            __name__='googlechart.watermark_image',
            description=_(u"Link to watermark image"),
            title=_(u'Watermark Image'),
            required=True),
        schema.Int(
            __name__='googlechart.watermark_horizontal_space_for_png_export',
            title=_(u'Watermark Horizontal Space For PNG Export'),
            description=_(u"""Horizontal space of Watermark image from margin
                            of the container (for PNG Export)"""),
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.watermark_vertical_space_for_png_export',
            title=_(u'Watermark Vertical Space For PNG Export'),
            description=_(u"""Vertical space of Watermark image from margin
                            of the container (for PNG Export)"""),
            required=False,
            default=0),
        schema.Bool(
            __name__='googlechart.watermark_hide_on_iframe',
            title=_(u'Hide watermark on iframe'),
            description=_(u"""Hide watermark when chart is embedded on same
                            site"""),
            required=False,
            default=False,
            ),
        schema.Bool(
            __name__='googlechart.watermark_resize_on_iframe',
            title=_(u'Resize watermark on iframe'),
            description=_(u"""Resize watermark when chart is embedded on same
                            site"""),
            required=False,
            default=False,
            ),
        schema.Int(
            __name__='googlechart.watermark_size_on_iframe',
            title=_(u'Size of watermark on iframe'),
            description=_(u"""Size of watermark when chart is embedded on same
                            site"""),
            required=False,
            default=0,
            ),
        schema.Bool(
            __name__='googlechart.qrcode_hide_on_iframe',
            title=_(u'Hide QR Code on iframe'),
            description=_(u"""Hide QR Code when chart is embedded on same
                            site"""),
            required=False,
            default=False,
            ),
        schema.Bool(
            __name__='googlechart.qrcode_resize_on_iframe',
            title=_(u'Resize QR Code on iframe'),
            description=_(u"""Resize QR Code when chart is embedded on same
                            site"""),
            required=False,
            default=False,
            ),
        schema.Int(
            __name__='googlechart.qrcode_size_on_iframe',
            title=_(u'Size of QR Code on iframe'),
            description=_(u"""Size of QR Code when chart is embedded on same
                            site"""),
            required=False,
            default=0,
            ),
    )

GooglechartsSectionFactory = GooglechartsSection()

def img_positions_vocabulary(context):
    """Vocabulary with available positions for watermark and qr code
    """
    terms = []
    terms.append(
        SimpleTerm(
            value='Disabled',
            token='Disabled',
            title='Disabled'))
    terms.append(
        SimpleTerm(
            value='Top Left',
            token='Top Left',
            title='Top Left'))
    terms.append(
        SimpleTerm(
            value='Top Right',
            token='Top Right',
            title='Top Right'))
    terms.append(
        SimpleTerm(
            value='Bottom Left',
            token='Bottom Left',
            title='Bottom Left'))
    terms.append(
        SimpleTerm(
            value='Bottom Right',
            token='Bottom Right',
            title='Bottom Right'))
    return SimpleVocabulary(terms)
