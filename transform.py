from copy import deepcopy

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
