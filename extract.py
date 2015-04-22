import csv
import xlrd
from datetime import datetime

def from_csv(filename, fieldnames, restkey=None, encoding='utf-8', startline=1, float_fields=[], datetime_fields=[], datetime_format='%m/%d/%y'):
    '''Read a CSV file into a list of dicts. fieldnames and restkey are passed directly
    to the csv module.

    fieldnames, restkey, encoding: Passed directly to csv module.
    startline: 1-based line number to start reading from. Use startline=2 to skip a header row.
    float_fields, datetime_fields: list of columns which should be interpreted
        specific data types
    datetime_format: Passed directly to datetime.strptime() used when datetime_fields
        are specified
    '''
    with open(filename, newline='', encoding=encoding) as f:
        reader = csv.DictReader(f, fieldnames=fieldnames, restkey=restkey)
        
        # Skip startline lines
        for i in range(1, startline): reader.__next__()
        
        # Read entire file into memory
        data = [row for row in reader]

    # Parse non-string fields
    for row in data:
        for field in float_fields:
            row[field] = row[field] and float(row[field])
        for field in datetime_fields:
            row[field] = row[field] and datetime.strptime(row[field], datetime_format)

    return data
