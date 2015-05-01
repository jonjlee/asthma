import itertools
from copy import deepcopy

def rename(data, field_mapping):
    for row in data:
        for src, dst in field_mapping.items():
            row[dst] = row.pop(src)

def unique_values(data, field):
    values = [row[field] for row in data]
    values = list(set(itertools.chain.from_iterable(values)))
    return values

def to_dict(data, key_field, val_field):
    pairs = [(row[key_field], row[val_field]) for row in data]
    return dict(pairs)

def calc_field(data, new_field, calc_fn):
    for row in data:
        row[new_field] = calc_fn(row)

def sort(data, field, descending=False):
    data.sort(key=lambda row: row[field], reverse=descending)

def filter(data, filter_fn):
    filtered = []
    for row in data:
        if filter_fn(row): 
            filtered.append(row)

    return filtered

def remove_fields(data, remove_fields):
    '''Returns a copy of data without the given fields. Data should be a list of maps.'''
    filtered = deepcopy(data)
    for row in filtered:
        for field in row.keys():
            if field in remove_fields:
                del row[field]
    return filtered

def retain_fields(data, fields):
    '''Returns a copy of data with only the given fields.'''
    filtered = []
    for row in data:
        filtered_row = {}
        filtered.append(filtered_row)
        for col in row.keys():
            if col in fields:
                filtered_row[col] = row[col]
    return filtered

def id_transform(data, id_field, new_field, start_id=1):
    '''
    Transform values from id_field into a new ID space. Useful for anonymizing PHI. For example,

        id_transform(data, 'SSN', 'Patient Id')

    generates a 0-based ID for every unique social security number in data.
    '''
    id_dict = {}
    next_id = start_id
    for row in data:
        src_id = row[id_field]
        dst_id = id_dict.get(src_id)
        if dst_id is None:
            dst_id = start_id
            id_dict[src_id] = dst_id
            start_id = start_id + 1
        row[new_field] = dst_id

def cols_to_list(data, target, fields, ignore_empty=True):
    '''
    Combine columns in a row that represent an array (e.g. {'Dx1': x, 'Dx2': y} -> 'Dx': [x, y])
    '''
    for row in data:
        lst = []
        for f in fields:
            v = row.get(f)
            if v or not ignore_empty:
                lst.append(v)
        row[target] = lst

def rows_to_list(data, idkey, target, field, ignore_empty=True):
    '''
    Combine data from adjacent rows into an array when they have the same id.
    e.g. [{'ID':1, 'med':x}, {'ID':1, 'med':y}] -> {'ID':1, 'meds':[x,y]}
    '''
    lst = []
    lastid = None
    for row in data:
        if row[idkey] and row[idkey] != lastid:
            lst = []
            row[target] = lst

        v = row.get(field)
        if v or not ignore_empty:
            lst.append(v)
        
        lastid = row[idkey] or lastid

def unique(data, key):
    '''
    Remove all but the first adjacent row with a repeating value in the field key except.
    e.g. [{'id':1, 'd1':x}, {'id':2, 'd1':y}] -> [{'id':1, 'd1':x}]
    '''
    filtered = []
    lastid = None
    for row in data:
        if row[key] and row[key] != lastid:
            filtered.append(row)
        lastid = row[key] or lastid
    
    return filtered