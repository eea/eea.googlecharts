""" Googlecharts Control Panel Section
"""
from zope.interface import implements
from eea.app.visualization.controlpanel.interfaces import IDavizSection
from zope.formlib.form import FormFields
from zope import schema
from zope.schema.vocabulary import SimpleVocabulary, SimpleTerm

class GooglechartsSection(object):
    """ Googlecharts Settings Section
    """
    implements(IDavizSection)
    prefix = 'googlechart'
    title = 'Googlechart Settings'
    form_fields = FormFields(
        schema.Choice(
            __name__='googlechart.qrcode_position',
            title=u"QRCode Position",
            required=True,
            default='Disabled',
            vocabulary=
                'eea.googlecharts.controlpanel.vocabularies.imgPositions',
            ),
        schema.Int(
            __name__='googlechart.qrcode_horizontal_space_for_png_export',
            title=u'QRCode Horizontal Space For PNG Export',
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.qrcode_vertical_space_for_png_export',
            title=u'QRCode Vertical Space For PNG Export',
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.qrcode_size',
            title=u'QRCode Size',
            required=False,
            default=70),
        schema.Choice(
            __name__='googlechart.watermark_position',
            title=u"Watermark Position",
            required=True,
            default='Disabled',
            vocabulary=
                'eea.googlecharts.controlpanel.vocabularies.imgPositions',
            ),
        schema.TextLine(
            __name__='googlechart.watermark_image',
            title=u'Watermark Image',
            required=True),
        schema.Int(
            __name__='googlechart.watermark_horizontal_space_for_png_export',
            title=u'Watermark Horizontal Space For PNG Export',
            required=False,
            default=0),
        schema.Int(
            __name__='googlechart.watermark_vertical_space_for_png_export',
            title=u'Watermark Vertical Space For PNG Export',
            required=False,
            default=0),

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
