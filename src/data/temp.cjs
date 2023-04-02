const fs = require('fs');
const fileName = './sorted_items.json';
const file = require(fileName);

for(let i = 0 ; i < file.length ; i++) {
    file[i].wikiLink = "https://runescape.wiki/w/"+file[i].name.replace(/ /g, "_");
}
    
fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
  if (err) return console.log(err);
  console.log(JSON.stringify(file));
  console.log('writing to ' + fileName);
});