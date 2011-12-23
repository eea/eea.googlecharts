import re
import logging
import csv
import StringIO
from Products.CMFPlone.utils import normalizeString

logger = logging.getLogger("eea.daviz.converter")

REGEX = re.compile(r"[\W]+")

def column_type(column):
    if ":" not in column:
        column = normalizeString(column, encoding='utf-8')
        column = REGEX.sub('_', column)
        return column, "text"

    typo = column.split(":")[-1]
    column = ":".join(column.split(":")[:-1])
    column = normalizeString(column, encoding='utf-8')
    column = REGEX.sub('_', column)
    return column, typo

def text2list(key, value):
    if ":list" not in key:
        return value

    if "," in value:
        value = value.split(",")
    elif ";" in value:
        value = value.split(";")
    else:
        value = [value, ]

    value = [item.strip() for item in value]
    return value

def text2number(key, value):
    if ":number" not in key:
        return value

    try:
        value = int(value)
    except Exception:
        try:
            value = float(value)
        except Exception, err:
            logger.debug(err)
    return value

def text2boolean(key, value):
    if ":boolean" not in key:
        return value

    try:
        value = bool(value)
    except Exception, err:
        logger.debug(err)
    return value

def csv2json(csvdata):

    columns = []
    hasLabel = False
    out = []
    properties = {}

    reader = csv.reader(csvdata, delimiter=',',quotechar='"',escapechar='\\',lineterminator='\r\n')
    for index, row in enumerate(reader):
        if row == []:
            continue

        if columns == []:
            for name in row:
                name = name.replace(' ', '+')
                if name.lower().endswith('label'):
                    name = "label"
                    hasLabel = True
                columns.append(name)
            continue

        row = iter(row)
        datarow = []

        for col in columns:
            text = row.next()

            text = text2list(col, text)
            text = text2number(col, text)
            text = text2boolean(col, text)

            datarow.append(text)

        out.append(datarow)

    columns = [column_type(col) for col in columns]
    return columns, out