import json


def find_duplicate_objects(json_array):
    labels = set()
    duplicates = []
    for obj in json_array:
        label = obj.get("label")
        if label in labels:
            duplicates.append(obj)
        else:
            labels.add(label)
    return duplicates


with open('src\data\sorted_items.json') as f:
    data = json.load(f)
    duplicates = find_duplicate_objects(data)
    if duplicates:
        print("The following objects have duplicate labels:")
        for obj in duplicates:
            print(obj)

sorted_data = sorted(data, key=lambda x: x['name'])

with open('src\data\sorted_items.json', 'w') as f:
    json.dump(sorted_data, f)
