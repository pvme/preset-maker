import json
import os

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

# Additional valid domains can be added here
valid_domains = ["https://i.imgur.com"]
def find_invalid_domains(json_array):
    invalid_domains = []
    for obj in json_array:
        image = obj.get("image")
        if not any(image.startswith(domain) for domain in valid_domains):
          invalid_domains.append(obj.get("label") + " - " + image)
    return invalid_domains

# Works for both Unix/macOS and Windows
sorted_items_path = os.path.join('src', 'data', 'sorted_items.json')

with open(sorted_items_path) as f:
    data = json.load(f)
    duplicates = find_duplicate_objects(data)
    if duplicates:
        print("The following objects have duplicate labels:")
        for obj in duplicates:
            print(obj)
    invalid_domains = find_invalid_domains(data)
    if invalid_domains:
        print("The following objects have invalid domains (valid domains = " + ', '.join(valid_domains, ) + "):")
        for obj in invalid_domains:
            print(obj)

sorted_data = sorted(data, key=lambda x: x['name'])

with open(sorted_items_path, 'w') as f:
    json.dump(sorted_data, f, indent='\t', separators=(',', ': '))
