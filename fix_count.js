const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('backend');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.match(/mapDoc\(([a-zA-Z0-9_]+)\)\.count/g)) {
        console.log('Matches in', file);
        content = content.replace(/mapDoc\(([a-zA-Z0-9_]+)\)\.count/g, '.data().count');
        fs.writeFileSync(file, content);
        count++;
    }
});
console.log('Fixed files:', count);
