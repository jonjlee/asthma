#!/usr/bin/env python -B

import csv
import sys
import itertools
import json
from datetime import datetime
from pprint import pprint

def load_icd9_lookup():
    with open('icd9.csv', newline='', encoding='latin-1') as f:
        reader = csv.reader(f)
        reader.__next__()  # skip header row
        icd9_lookup = [(row[0], row[1]) for row in reader]
        icd9_lookup = dict(icd9_lookup)

    return icd9_lookup

def parse_data(fname):
    fieldnames = ['Unit#', 'Account#', 'Name', 'Age', 'Admit', 'Discharge', 'Discharge Location', 'LOS']
    with open(fname, newline='') as f:
        reader = csv.DictReader(f, fieldnames=fieldnames, restkey='ICD9 Codes')
        reader.__next__()
        data = [row for row in reader]

    float_fields = ['LOS']
    datetime_fields = ['Admit', 'Discharge']
    for row in data:
        for field in float_fields:
            row[field] = row[field] and float(row[field])
        for field in datetime_fields:
            row[field] = row[field] and datetime.strptime(row[field], '%m/%d/%y')
        row['ICD9 Categories'] = [code.split('.')[0] for code in row['ICD9 Codes']]

    return data

def collect_diagnoses(data):
    codes = [row['ICD9 Codes'] for row in data]
    codes = list(set(itertools.chain.from_iterable(codes)))

    icd9_lookup = load_icd9_lookup()
    icd = [(c, icd9_lookup.get(c) or '[Unknown]') for c in codes]
    icd = dict(icd)

    return icd

def filter_exclusion(data):
    filtered = []
    for row in data:
        remove = any([
            '480' in row['ICD9 Categories'],    # Pneumonia
            '461' in row['ICD9 Categories'],    # Sinusitis
            '466' in row['ICD9 Categories'],    # Bronchiolitis
            '933' in row['ICD9 Categories'],    # Foreign body in airway
            '934' in row['ICD9 Categories'],    # -
            '935.0' in row['ICD9 Codes'],       # Foreign body in mouth
            '277.02' in row['ICD9 Codes'],      # CF with pulm
            '277.09' in row['ICD9 Codes'],      # CF other
        ])
        if not remove:
            filtered.append(row)

    return filtered

def remove_phi(data):
    # hpi_fields = set()
    hpi_fields = set(['Unit#', 'Account#', 'Name', 'Age', 'ICD9 Codes', 'ICD9 Categories', 'Discharge', 'Discharge Location'])
    for row in data:
        fields = row.keys()
        field_to_remove = hpi_fields.intersection(fields)
        for field in field_to_remove:
            del row[field]

    return data

def main(fname, outfile):
    # Read main data file
    data = parse_data(fname)
    diagnoses = collect_diagnoses(data)

    # Remove records meeting exclusion criteria
    data = filter_exclusion(data)

    # Remove all PHI
    remove_phi(data)

    output(data, outfile)

def output(data, outfile):
    # Convert to JS
    dthandler = lambda obj: (
        obj.isoformat()
        if isinstance(obj, datetime)
        else None)
    js_data = json.dumps(data, default=dthandler)

    if not outfile:
        print(js_data)
    else:
        with open(outfile + '.js', 'w') as out:
            out.write('data = %s;' % js_data)
        with open(outfile + '.csv', 'w') as out:
            writer = csv.DictWriter(out, fieldnames=['Admit', 'LOS'])
            writer.writeheader()
            for row in data: writer.writerow(row)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: parse.py <excel file> [output file]')
        sys.exit(1)

    infile = sys.argv[1]
    outfile = None if len(sys.argv) < 3 else sys.argv[2]
    main(infile, outfile)