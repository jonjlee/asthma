#!/usr/bin/env python -B
import extract, transform, load
from copy import deepcopy

# Set up logging
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)-15s: %(message)s')

def main():
    # Extract
    # ------------------------------------------------------------------------
    # Read and parse datasets. Functions in the extract module return data
    # as a list of dicts where each item represents a row. For example:
    #
    #   data = [
    #       {'name': 'john doe', 'diagnosis': 'pneumonia'}, 
    #       ...
    #   ]
    data = extract.from_csv(
        filename='1.csv',
        fieldnames=['Unit#', 'Account#', 'Name', 'Age', 'Admit', 'Discharge', 'Discharge Location', 'LOS'],
        restkey='ICD9 Codes',
        startline=2,
        float_fields=['LOS'],
        datetime_fields=['Admit', 'Discharge'])
    icd9 = extract.from_csv(
        filename='icd9.csv',
        encoding='latin-1',
        fieldnames=['code', 'desc'],
        startline=2)


    # Transform
    # ------------------------------------------------------------------------
    # Get list of ICD9 codes represented in data
    icd9_lookup = transform.to_dict(icd9, 'code', 'desc')
    icd9_codes = transform.unique_values(data, 'ICD9 Codes')
    icd9_descs = [{
            'Code': code,
            'Description': icd9_lookup.get(code, '[Unknown]')
        } for code in icd9_codes]
    transform.sort(icd9_descs, 'Code')

    # Calculate ICD9 categories for each row and use to remove records meeting exclusion criteria
    transform.calc_field(data,
        'ICD9 Categories',
        lambda row: [code.split('.')[0] for code in row['ICD9 Codes']])
    data = transform.filter(data, lambda row: not any([
        '480' in row['ICD9 Categories'],    # Pneumonia
        '461' in row['ICD9 Categories'],    # Sinusitis
        '466' in row['ICD9 Categories'],    # Bronchiolitis
        '933' in row['ICD9 Categories'],    # Foreign body in airway
        '934' in row['ICD9 Categories'],    # -
        '935.0' in row['ICD9 Codes'],       # Foreign body in mouth
        '277.02' in row['ICD9 Codes'],      # CF with pulm
        '277.09' in row['ICD9 Codes'],      # CF other
    ]))

    # Generate a unique ID for each patient
    transform.id_transform(data, 'Unit#', 'pid')

    # Make human readable fields
    readable = deepcopy(data)
    transform.calc_field(readable, 'Diagnosis', lambda row: ','.join(row['ICD9 Codes']))

    # Remove PHI
    anonymized = transform.remove_fields(data, ['Unit#', 'Account#', 'Name', 'Age', 'ICD9 Categories', 'Discharge', 'Discharge Location'])


    # Load
    # ------------------------------------------------------------------------
    load.to_csv(readable, 'data.csv', ['pid', 'Admit', 'LOS', 'Diagnosis'])
    load.to_js(anonymized, 'data.js')
    load.to_xls(icd9_descs, 'diagnoses.xls', ['Code', 'Description'])

if __name__ == '__main__':
    main()