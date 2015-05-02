from collections import namedtuple, OrderedDict
from datetime import datetime

import csv
import xlwt
import json
from pprint import pprint

def to_stdout(data):
    pprint(data)

def to_json(data, fieldnames=None, filename=None):
    '''
    Return data as a JSON string. Fieldnames is a list containing keys to output.
    If not specified all keys will be included. Mapping from the data key name to
    json key name can be included using dicts, e.g.

        fieldnames = ['Name', {'Duration': 'Duration (hrs)'}])

    converts

        [{'Name': 'John', 'Duration': 5}] -> [{'Name': 'John', 'Duration (hrs)': 5}]
    '''
    if not fieldnames:
        # No list of fieldnames specified, so output all fields
        filtered = data        
    else:
        # Get key names from optional mappings in fieldnames (e.g. ['Name', {'Duration': 'Duration (hrs)'}])
        keys, fieldnames = __flatten_fieldnames(fieldnames)

        # Retain only fields in fieldnames
        filtered = []
        for row in data:
            # Preserve same key order as fieldnames with an OrderedDict
            filtered_row = OrderedDict()

            filtered.append(filtered_row)
            for i,field in enumerate(fieldnames):
                filtered_row[keys[i]] = row[field]

    # Custom handler to properly output dates
    dthandler = lambda obj: (
        obj.isoformat()
        if isinstance(obj, datetime)
        else None)
    
    # Convert to JSON
    js_data = json.dumps(filtered, default=dthandler)

    # Write file if specified
    if filename:
        with open(filename, 'w') as out:
            out.write(js_data)

    return js_data

def to_js(data, filename, fieldnames=None, varname='data'):
    '''
    Same as to_json, except returned string assigns JSON object to varname.
    e.g. data = {JSON object}
    '''
    # Output "varname = {JSON object}".
    js_data = to_json(data, fieldnames, filename=None)
    with open(filename, 'w') as out:
        out.write('%s = %s;' % (varname, js_data))
    return js_data

def to_csv(data, filename, fieldnames):
    '''
    Output a CSV file. Fieldnames is a list containing keys to output. If not
    specified all keys will be included. Map a data key name to a different 
    header using dicts, e.g.

        to_csv(
            data=[{'Name': 'John', 'Duration': 5}],
            filename='data.csv',
            fieldnames=['Name', {'Duration': 'Duration (hrs)'}])

    outputs to data.csv:

        Name,Duration (hrs)
        John,5

    '''
    # Get header row values
    headers, fieldnames = __flatten_fieldnames(fieldnames)
    
    with open(filename, 'w') as out:
        writer = csv.writer(out)
        
        # Write header
        writer.writerow(headers)

        # Write data rows
        for row in data: writer.writerow([row[field] for field in fieldnames])

def to_xls(data, filename, fieldnames, sheetname='Data'):
    '''
    Same as to_csv, except writes an Excel spreadsheet.
    '''
    # Get header row values
    headers, fieldnames = __flatten_fieldnames(fieldnames)

    # Formatter for date/times
    date_format = xlwt.Style.easyxf(num_format_str='M/D/YYYY h:mm AM/PM')

    workbook = xlwt.Workbook() 
    sheet = workbook.add_sheet(sheetname)

    # Write header row
    for colidx, header in enumerate(headers):
        sheet.write(0, colidx, header)

    # Write data rows
    for rowidx, row in enumerate(data):
        for colidx, field in enumerate(fieldnames):
            if isinstance(row[field], datetime):
                sheet.write(rowidx+1, colidx, row[field], date_format)
            else:
                sheet.write(rowidx+1, colidx, row[field])

    workbook.save(filename)

# -------------------------------------------------------------------------
# Utility functions
# -------------------------------------------------------------------------
def __flatten_fieldnames(fieldnames):
    '''
    Turn a list of fieldnames with optional mapping to different headers into
    two separate lists of fieldnames without mappings and headers. e.g.

    ['Name', {'Duration': 'Duration (hrs)'}] -> ['Name', 'Duration'], ['Name', 'Duration (hrs)']
    '''
    fields, headers = [], []
    headers = [list(f.values())[0] if isinstance(f, dict) else f for f in fieldnames]
    fields = [list(f.keys())[0] if isinstance(f, dict) else f for f in fieldnames]
    return headers, fields
