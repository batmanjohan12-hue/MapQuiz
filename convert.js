const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'js/data.js');
let data = fs.readFileSync(dataPath, 'utf8');

data = data.replace(/bandera:\s*"([^"]+)"/g, (match, emoji) => {
  if (emoji.length >= 4) {
    const c1 = String.fromCharCode(emoji.codePointAt(0) - 127397).toLowerCase();
    const c2 = String.fromCharCode(emoji.codePointAt(2) - 127397).toLowerCase();
    return `code: "${c1}${c2}"`;
  }
  return match;
});

fs.writeFileSync(dataPath, data);
console.log('Done!');
