def exhibit2googlechart(data, columns, filters=None):
    resultData = []
    titles = [column[1] for column in columns]
    resultData.append(titles)
    for row in data['items']:
        datarow = []
        oktoadd = True
        if filters:
            for exfilter in filters:
                if row[exfilter[0]] != exfilter[1]:
                    oktoadd = False
        if oktoadd:
            for column in columns:
                datarow.append (row[column[0]])
            resultData.append(datarow)
    return resultData
