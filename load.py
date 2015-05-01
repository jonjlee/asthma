from collections import namedtuple, OrderedDict
from datetime import datetime

import csv
import xlwt
import json
from pprint import pprint

def to_stdout(data):
    pprint(data)

def to_json(data, fieldnames=None, keys=None, filename=None):
    if not fieldnames:
        # Convert all fields in data
        filtered = data        
    else:
        # default json key names to be the same as in data
        keys = keys or fieldnames

        # Retain only fields in fieldnames
        filtered = []
        for row in data:
            filtered_row = {}
            filtered.append(filtered_row)
            for col in row.keys():
                for i,col in enumerate(fieldnames):
                    filtered_row[keys[i]] = row[col]

    # Convert to JSON object
    dthandler = lambda obj: (
        obj.isoformat()
        if isinstance(obj, datetime)
        else None)
    js_data = json.dumps(filtered, default=dthandler)

    if filename:
        with open(filename, 'w') as out:
            out.write(js_data)

    return js_data

def to_js(data, filename, fieldnames=None, keys=None, varname='data'):
    js_data = to_json(data, fieldnames, keys)
    with open(filename, 'w') as out:
        out.write('%s = %s;' % (varname, js_data))
    return js_data

def to_csv(data, filename, fieldnames, headers=None):
    # Default header row to the same as field names
    headers = headers or fieldnames
    
    with open(filename, 'w') as out:
        writer = csv.writer(out)
        writer.writerow(fieldnames)
        for row in data: writer.writerow([row[field] for field in fieldnames])

def to_xls(data, filename, fieldnames, sheetname='Data', headers=None):
    # Default header row to the same as field names
    headers = headers or fieldnames

    workbook = xlwt.Workbook() 
    sheet = workbook.add_sheet(sheetname)
    for colidx, header in enumerate(headers):
        sheet.write(0, colidx, header)
    for rowidx, row in enumerate(data):
        for colidx, field in enumerate(fieldnames):
            sheet.write(rowidx+1, colidx, row[field])

    workbook.save(filename)