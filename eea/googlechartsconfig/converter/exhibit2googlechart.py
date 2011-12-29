def exhibit2googlechart(data, columns):
    resultData = []
    titles = [column[1] for column in columns]
    resultData.append(titles)
    for row in data['items']:
        datarow = []
        for column in columns:
            datarow.append (row[column[0]])
        resultData.append(datarow)
    return resultData