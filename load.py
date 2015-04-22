from collections import namedtuple, OrderedDict
from datetime import datetime

import csv
import xlwt
import json
from pprint import pprint

def to_stdout(data):
    pprint(data)

def to_json(data, filename=None):
    # Convert to JSON object
    dthandler = lambda obj: (
        obj.isoformat()
        if isinstance(obj, datetime)
        else None)
    js_data = json.dumps(data, default=dthandler)

    if filename:
        with open(filename, 'w') as out:
            out.write(js_data)

    return js_data

def to_js(data, filename=None, varname='data'):
    js_data = to_json(data)
    if filename:
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
