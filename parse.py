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
    logger.info('Reading data...')
    data = extract.from_csv(
        filename='2.csv',
        fieldnames=['Unit#', 'Account#', 'Name', 'Age', 'Sex', 'Wt (kg)', 'Race', 'ADM/SER Date', 'ADM/SER Time', 'Dis Date', 'Dis Time', 'Arrival Date', 'Arrival Time', 'Triage Date', 'Triage Time', 'ER Depart Date', 'ER Depart Time', 'Disch Location', 'LOS (Hrs)', 'Visit Type', 'Dx1', 'Dx2', 'Dx3', 'Dx4', 'Dx5', 'Dx6', 'Dx7', 'Dx8', 'Dx9', 'Dx10', 'Dx11', 'Dx12', 'Dx13', 'Dx14', 'Dx15', 'Dx16', 'Dx17', 'Dx18', 'Dx19', 'Dx20', 'Dx21', 'Dx22', 'Dx23', 'Dx24', 'Dx25', 'Dx26', 'Dx27', 'Dx28', 'Dx29', 'Dx30', 'Dx31', 'Dx32', 'Dx33', 'Dx34', 'Dx35', 'Dx36', 'Dx37', 'Dx38', 'Dx39', 'Dx40', 'Location1', 'Start Date1', 'Start Time1', 'End Date1', 'End Time1', 'Location2', 'Start Date2', 'Start Time2', 'End Date2', 'End Time2', 'Location3', 'Start Date3', 'Start Time3', 'End Date3', 'End Time3', 'Location4', 'Start Date4', 'Start Time4', 'End Date4', 'End Time4', 'Location5', 'Start Date5', 'Start Time5', 'End Date5', 'End Time5', 'Location6', 'Start Date6', 'Start Time6', 'End Date6', 'End Time6', 'Location7', 'Start Date7', 'Start Time7', 'End Date7', 'End Time7', 'Location8', 'Start Date8', 'Start Time8', 'End Date8', 'End Time8', 'Location9', 'Start Date9', 'Start Time9', 'End Date9', 'End Time9', 'Location10', 'Start Date10', 'Start Time10', 'End Date10', 'End Time10', 'Positive Culture: Test', 'Collection Date', 'Coll Time', 'Specimen Type', 'Organism ID', 'Medication', 'Admin Dose & Unit', 'Admin Date', 'Admin Time'],
        startline=2,
        float_fields=['LOS (Hrs)'],
        datetime_fields=[['ADM/SER Date', 'ADM/SER Time'], ['Dis Date', 'Dis Time'], ['Arrival Date', 'Arrival Time'], ['Triage Date', 'Triage Time'], ['Admin Date', 'Admin Time']],
        limit=None)
    icd9 = extract.from_csv(
        filename='CMS32_DESC_LONG_DX.csv',
        encoding='latin-1',
        fieldnames=['code', 'desc'],
        startline=2)

    # Transform
    # ------------------------------------------------------------------------
    # Rename fields to be more friendly
    logger.info('Renaming fields...')
    transform.rename(data, {
        'ADM/SER Date': 'Admit',
        'Dis Date': 'Discharge',
        'Arrival Date': 'Arrival',
        'Triage Date': 'Triage',
        'LOS (Hrs)': 'LOS',
    })

    # Combine rows from the same patient visit that represent an array
    # e.g. [{'ID':1, 'med':x}, {'ID':1, 'med':y}] -> {'ID':1, 'meds':[x,y]}
    logger.info('Collecting arrays...')
    transform.rows_to_list(data, idkey='Admit', target='Micro', field='Organism ID')
    transform.rows_to_list(data, idkey='Admit', target='Meds', field='Medication')
    transform.rows_to_list(data, idkey='Admit', target='Med Times', field='Admin Date')
    transform.rows_to_list(data, idkey='Admit', target='Med Doses', field='Admin Dose & Unit')
    data = transform.unique(data, 'Admit')

    # Combine cols in a row that represent an array (e.g. {'Dx1': x, 'Dx2': y} -> 'Dx': [x, y])
    transform.cols_to_list(data, target='ICD9 Codes', fields=['Dx1', 'Dx2', 'Dx3', 'Dx4', 'Dx5', 'Dx6', 'Dx7', 'Dx8', 'Dx9', 'Dx10', 'Dx11', 'Dx12', 'Dx13', 'Dx14', 'Dx15', 'Dx16', 'Dx17', 'Dx18', 'Dx19', 'Dx20', 'Dx21', 'Dx22', 'Dx23', 'Dx24', 'Dx25', 'Dx26', 'Dx27', 'Dx28', 'Dx29', 'Dx30', 'Dx31', 'Dx32', 'Dx33', 'Dx34', 'Dx35', 'Dx36', 'Dx37', 'Dx38', 'Dx39', 'Dx40'])
    transform.cols_to_list(data, target='Locs', fields=['Location1', 'Location2', 'Location3', 'Location4', 'Location5', 'Location6', 'Location7', 'Location8', 'Location9', 'Location10'])
    transform.cols_to_list(data, target='Locs Dates', fields=['Start Date1', 'Start Date2', 'Start Date3', 'Start Date4', 'Start Date5', 'Start Date6', 'Start Date7', 'Start Date8', 'Start Date9', 'Start Date10'])
    transform.cols_to_list(data, target='Locs Times', fields=['Start Time1', 'Start Time2', 'Start Time3', 'Start Time4', 'Start Time5', 'Start Time6', 'Start Time7', 'Start Time8', 'Start Time9', 'Start Time10'])

    # Get list of ICD9 codes represented in data
    logger.info('Building ICD9 lookup...')
    icd9_lookup = transform.to_dict(icd9, 'code', 'desc')
    icd9_codes = transform.unique_values(data, 'ICD9 Codes')
    icd9_codes_no_dot = [code.replace('.','') for code in icd9_codes]
    icd9_descs = [{
            'Code': icd9_codes[idx],
            'Description': icd9_lookup.get(code, '[Unknown]')
        } for idx,code in enumerate(icd9_codes_no_dot)]
    transform.sort(icd9_descs, 'Code')

    # Calculate ICD9 categories for each row and use to remove records meeting exclusion criteria
    logger.info('Filtering exclusion diagnoses...')
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

    # Calculate other static fields
    calc_time_to_med(data, ['albuterol', 'ipratropium', 'epinephrine', 'flovent', 'pulmicort'], 'First nebs', 'Nebs dose', 'Time to nebs (min)')
    calc_time_to_med(data, ['medrol', 'orapred'], 'First steroids', 'Steroids dose', 'Time to steroids (min)')

    # Make human readable fields
    logger.info('Formatting output...')
    transform.calc_field(data, 'Diagnosis', lambda row: ';'.join(row['ICD9 Codes']))
    transform.calc_field(data, 'Med List', lambda row: ', '.join(set(row['Meds'])))
    transform.calc_field(data, 'Micro', lambda row: row['Micro'] and '; '.join(row['Micro']) or None)

    # Generate an anonymous ID for each patient based on PHI
    logger.info('Anonymizing...')
    transform.id_transform(data, 'Unit#', 'pid')

    # Load
    # ------------------------------------------------------------------------
    logger.info('Writing output...')
    load.to_csv(data, 'data.csv', ['Arrival', 'Triage', 'Admit', 'Discharge', 'pid', 'Age', 'Sex', 'Wt (kg)', 'Race', 'LOS', 'Visit Type', 'First nebs', 'Nebs dose', 'Time to nebs (min)', 'First steroids', 'Steroids dose', 'Time to steroids (min)', 'Med List', 'Micro', 'Diagnosis'])
    load.to_js(data, 'data.js', ['Admit', 'pid', 'Visit Type', 'LOS', 'Diagnosis', 'Time to nebs (min)', 'Time to steroids (min)'])
    load.to_xls(icd9_descs, 'diagnoses.xls', ['Code', 'Description'])

    logger.info('Done.')

def calc_time_to_med(data, meds, med_key, dose_key, time_key):
    def is_target_med(med_name):
        med_name = med_name.lower()
        for m in meds:
            if m in med_name: 
                return True
        return False

    for row in data:
        t = row['Arrival']
        meds_given = zip(row['Meds'], row['Med Doses'], row['Med Times'])
        meds_given = [m for m in meds_given if is_target_med(m[0])]
        meds_given = sorted(meds_given, key=lambda x: x[2])
        if not meds_given:
            row[med_key], row[dose_key], row[time_key] = None, None, None
        else:
            first_med = meds_given[0]
            row[med_key] = first_med[0]
            row[dose_key] = first_med[1]
            row[time_key] = (first_med[2] - t).total_seconds() / 60

def calc_time_to_first_neb(data):
    return 

if __name__ == '__main__':
    main()