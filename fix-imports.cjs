const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src', 'pages', 'admin');
const studentAiDir = path.join(__dirname, 'frontend', 'src', 'pages', 'student', 'ai');

function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      replaceInDir(itemPath);
    } else if (itemPath.endsWith('.jsx')) {
      let content = fs.readFileSync(itemPath, 'utf8');
      let modified = false;

      // Fix admin paths (depth 3 instead of 4)
      if (itemPath.includes(path.join('pages', 'admin'))) {
        if (content.includes('../../../../')) {
          content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\//g, '../../../');
          modified = true;
        }
      }
      
      // Fix student ai dashboard (depth 3)
      if (itemPath.includes(path.join('pages', 'student', 'ai'))) {
        if (content.includes('../../api/')) {
          content = content.replace(/\.\.\/\.\.\/api\//g, '../../../api/');
          modified = true;
        }
        if (content.includes('../../../components/')) {
          // just in case it was wrong
          // Wait, AiDashboard had `../../../components/admin/ui/Button` which is correct since:
          // pages/student/ai -> ../../../ -> src
          // src/components -> Correct!
        }
      }

      if (modified) {
        fs.writeFileSync(itemPath, content);
        console.log(`Fixed ${itemPath}`);
      }
    }
  }
}

replaceInDir(srcDir);
replaceInDir(studentAiDir);
console.log('Done');
