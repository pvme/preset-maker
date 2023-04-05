import json

with open('src\data\sorted_familiars.json') as f:
    data = json.load(f)

sorted_data = sorted(data, key=lambda x: x['name'])

with open('src\data\sorted_familiars.json', 'w') as f:
    json.dump(sorted_data, f, indent='\t', separators=(',', ': '))
