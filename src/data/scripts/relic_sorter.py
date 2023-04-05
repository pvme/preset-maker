import json

with open('src\data\sorted_relics.json') as f:
    data = json.load(f)

sorted_data = sorted(data, key=lambda x: x['name'])

with open('src\data\sorted_relics.json', 'w') as f:
    json.dump(sorted_data, f, indent='\t', separators=(',', ': '))
