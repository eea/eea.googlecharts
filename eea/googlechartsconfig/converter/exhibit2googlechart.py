def exhibit2googlechart(data, columns, filters=None):
    resultData = []
    titles = [column[1] for column in columns]
    resultData.append(titles)
    for row in data['items']:
        datarow = []
        oktoadd = True
        if filters:
            for filter in filters:
                if row[filter[0]] != filter[1]:
                    oktoadd = False
        if oktoadd:
            for column in columns:
                datarow.append (row[column[0]])
            resultData.append(datarow)
    return resultData
