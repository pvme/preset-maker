import json

with open('src\data\sorted_items.json') as f:
    data = json.load(f)

sorted_data = sorted(data, key=lambda x: x['name'])

with open('src\data\sorted_items.json', 'w') as f:
    json.dump(sorted_data, f)
