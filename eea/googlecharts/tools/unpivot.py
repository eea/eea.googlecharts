#!/usr/bin/env python
"""Unpivot csv tables
"""
import csv
import sys

if __name__ == '__main__':
    if len(sys.argv) < 6:
        print 'usage: unpivot.py <input.csv> <ouput.csv> '+\
            '<unpivot_base> <delimiter> <unpivot_column_label>'
    else:
        filename = sys.argv[1]
        output = sys.argv[2]
        unpivot_base = sys.argv[3]
        delimiter = sys.argv[4]
        unpivot_column_label = sys.argv[5]


        datafile = open(filename, 'r')
        datareader = csv.reader(datafile)
        data = []
        for row in datareader:
            data.append(row)
        datafile.close()

        unpivoted = []
        unpivoted_header_row = []
        pivots_nr = 0
        for col in data[0]:
            if col.split(delimiter)[0].strip() != unpivot_base:
                unpivoted_header_row.append(col.strip())
            else:
                pivots_nr = pivots_nr + 1
        unpivoted_header_row.append(unpivot_column_label)
        unpivoted_header_row.append(unpivot_base)

        unpivoted.append(unpivoted_header_row)

        for row in data[1:]:
            unpivoted_values = []
            pivoted_rows = []
            i = 0
            for val in row:
                if data[0][i].strip() in unpivoted_header_row:
                    unpivoted_values.append(val)
                else:
                    pivoted_row = []
                    pivoted_row.append(data[0][i].strip().split(delimiter)[1])
                    pivoted_row.append(val)
                    pivoted_rows.append(pivoted_row)
                i = i + 1
            for pivoted_row in pivoted_rows:
                unpivoted_row = []
                for unpivoted_value in unpivoted_values:
                    unpivoted_row.append(unpivoted_value.strip())
                for pivoted_value in pivoted_row:
                    unpivoted_row.append(pivoted_value.strip())
                unpivoted.append(unpivoted_row)

        datafile = open(output, 'w')
        datawriter = csv.writer(datafile, delimiter=',')
        datawriter.writerows(unpivoted)
        datafile.close()



