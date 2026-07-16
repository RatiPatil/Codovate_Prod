const fs = require('fs');
const path = require('path');

function checkImportsCase(dir) {
    let hasError = false;
    const files = walkSync(dir);
    
    files.forEach(file => {
        if (!file.endsWith('.js') && !file.endsWith('.jsx')) return;
        
        const content = fs.readFileSync(file, 'utf8');
        const regex = /import\s+.*?from\s+['"](.*?)['"]|import\(['"](.*?)['"]\)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            const importPath = match[1] || match[2];
            
            if (importPath && importPath.startsWith('.')) {
                let absolutePath = path.resolve(path.dirname(file), importPath);
                
                if (!path.extname(absolutePath)) {
                    if (fs.existsSync(absolutePath + '.jsx')) {
                        absolutePath += '.jsx';
                    } else if (fs.existsSync(absolutePath + '.js')) {
                        absolutePath += '.js';
                    } else if (fs.existsSync(absolutePath + '/index.jsx')) {
                        absolutePath += '/index.jsx';
                    } else if (fs.existsSync(absolutePath + '/index.js')) {
                        absolutePath += '/index.js';
                    } else if (fs.existsSync(absolutePath + '.css')) {
                        absolutePath += '.css';
                    }
                }
                
                if (fs.existsSync(absolutePath)) {
                    const dirName = path.dirname(absolutePath);
                    const baseName = path.basename(absolutePath);
                    const actualFiles = fs.readdirSync(dirName);
                    
                    if (!actualFiles.includes(baseName)) {
                        console.log('CASE MISMATCH in file:', file);
                        console.log('Imported as:', importPath);
                        console.log('Resolved exactly to:', baseName);
                        console.log('Available files:', actualFiles.join(', '));
                        console.log('---');
                        hasError = true;
                    }
                }
            }
        }
    });
    
    return hasError;
}

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));
    });
    return filelist;
}

const error = checkImportsCase(path.join(__dirname, 'frontend/src'));
if (!error) console.log('All imports are case-correct!');
