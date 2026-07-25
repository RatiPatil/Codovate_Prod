module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // We only want to modify files that actually contain .data()
  let hasModifications = false;

  // 1. Replace snapshot.docs.map(doc => doc.data()) with mapDocs(snapshot)
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: { name: 'map' }
    }
  }).forEach(path => {
    const object = path.node.callee.object;
    if (object && object.type === 'MemberExpression' && object.property.name === 'docs') {
      const args = path.node.arguments;
      if (args.length === 1 && (args[0].type === 'ArrowFunctionExpression' || args[0].type === 'FunctionExpression')) {
        const func = args[0];
        let returnsData = false;
        
        // If doc => doc.data()
        if (func.body.type === 'CallExpression' && 
            func.body.callee.type === 'MemberExpression' && 
            func.body.callee.property.name === 'data') {
          returnsData = true;
        } 
        // If doc => { return doc.data(); }
        else if (func.body.type === 'BlockStatement') {
          const body = func.body.body;
          if (body.length === 1 && body[0].type === 'ReturnStatement') {
            const ret = body[0].argument;
            if (ret && ret.type === 'CallExpression' && 
                ret.callee.type === 'MemberExpression' && 
                ret.callee.property.name === 'data') {
              returnsData = true;
            }
          }
        }

        if (returnsData) {
          const snapshotNode = object.object; 
          j(path).replaceWith(
            j.callExpression(j.identifier('mapDocs'), [snapshotNode])
          );
          hasModifications = true;
        }
      }
    }
  });

  // 2. Replace doc.data() with mapDoc(doc)
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      property: { name: 'data' }
    }
  }).forEach(path => {
    const object = path.node.callee.object;
    if (fileInfo.path.includes('firestoreMapper.js')) return;

    j(path).replaceWith(
      j.callExpression(j.identifier('mapDoc'), [object])
    );
    hasModifications = true;
  });

  if (hasModifications) {
    const pathSegments = fileInfo.path.split(/\\|\//); 
    const backendIdx = pathSegments.indexOf('backend');
    let depth = 0;
    if (backendIdx !== -1) {
      depth = pathSegments.length - backendIdx - 2; 
    }
    
    let requirePath = '../utils/firestoreMapper';
    if (depth === 2) requirePath = '../../utils/firestoreMapper';
    else if (depth === 0) requirePath = './utils/firestoreMapper';

    const importDec = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.objectPattern([
          j.objectProperty(j.identifier('mapDoc'), j.identifier('mapDoc'), false, true),
          j.objectProperty(j.identifier('mapDocs'), j.identifier('mapDocs'), false, true)
        ]),
        j.callExpression(j.identifier('require'), [j.literal(requirePath)])
      )
    ]);
    
    const existingImports = root.find(j.VariableDeclarator, {
      id: { type: 'ObjectPattern' }
    }).filter(p => {
      return p.node.id.properties.some(prop => prop.key && prop.key.name === 'mapDoc');
    });

    if (existingImports.length === 0) {
      const requires = root.find(j.VariableDeclaration).filter(p => {
        return j(p).find(j.CallExpression, { callee: { name: 'require' } }).length > 0;
      });
      if (requires.length > 0) {
        requires.at(requires.length - 1).insertAfter(importDec);
      } else {
        root.get().node.program.body.unshift(importDec);
      }
    }
    
    return root.toSource({ quote: 'single' });
  }
  return null;
};
