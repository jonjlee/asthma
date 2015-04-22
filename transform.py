import itertools
from copy import deepcopy

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
    return data

def sort(data, field, descending=False):
    data.sort(key=lambda row: row[field], reverse=descending)

def filter(data, filter_fn):
    filtered = []
    for row in data:
        if filter_fn(row): 
            filtered.append(row)

    return filtered

def remove_fields(data, remove_fields):
    '''Returns a copy of data without the given fields. Data should be a list of maps.
    Fields names are not case-sensitive.'''
    filtered = deepcopy(data)
    remove_fields = set(remove_fields)
    remove_fields = [f.lower() for f in remove_fields]
    for row in filtered:
        fields = list(row.keys())
        fields_lower = [f.lower() for f in fields]
        for i in range(0, len(fields)):
            if fields_lower[i] in remove_fields:
                del row[fields[i]]
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