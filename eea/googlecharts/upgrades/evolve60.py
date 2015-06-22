"""Settings upgrade
"""
import logging
logger = logging.getLogger("eea.app.visualization.upgrades")

def migrate_settings(context):
    """ Migrate settings to portal_daviz
    """

    old_settings = context.portal_properties.site_properties
    new_settings = context.portal_daviz.settings

    migration_mapping = (
            ('QRCode_Position',
            'googlechart.qrcode_position',
            'Top Left'),
            ('QRCode_Vertical_Space_For_PNG_Export',
            'googlechart.qrcode_vertical_space_for_png_export',
            0),
            ('QRCode_Horizontal_Space_For_PNG_Export',
            'googlechart.qrcode_horizontal_space_for_png_export',
            0),
            ('Watermark_Image',
            'googlechart.watermark_image',
            ''),
            ('Watermark_Position',
            'googlechart.watermark_position',
            'Bottom Right'),
            ('Watermark_Vertical_Space_For_PNG_Export',
            'googlechart.watermark_vertical_space_for_png_export',
            0),
            ('Watermark_Horizontal_Space_For_PNG_Export',
            'googlechart.watermark_horizontal_space_for_png_export',
            0),
            ('QRCode_Size',
            'googlechart.qrcode_size',
            70))

    for setting in migration_mapping:
        logger.info('Migrating ' + setting[0])
        new_settings[setting[1]] = old_settings.getProperty(setting[0],
                                                            setting[2])
        if old_settings.hasProperty(setting[0]):
            old_settings._delProperty(setting[0])

    if old_settings.hasProperty('watermark_positions'):
        old_settings._delProperty('watermark_positions')
