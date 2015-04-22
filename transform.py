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