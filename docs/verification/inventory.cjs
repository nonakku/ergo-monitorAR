// Application counts preserve the historical variable/parameter/catch convention.
const fs = require('node:fs'), path = require('node:path'), acorn = require('acorn');
const root = path.resolve(__dirname, '../..');
function inventory() {
  const rows = [], functions = [], tables = {};
  for (const file of ['script.js', 'RULAworkseet.html', 'docs/verification/inventory.cjs', 'docs/verification/verify.cjs']) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    const scripts = file.endsWith('.html') ? [...raw.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => ({code:m[1], offset:raw.slice(0,m.index + m[0].indexOf('>') + 1).split('\n').length - 1})) : [{code:raw, offset:0}];
    const category = file.startsWith('docs/') ? 'verification' : 'application';
    for (const {code, offset} of scripts) {
      const ast = acorn.parse(code, {ecmaVersion:'latest', locations:true});
      function bind(n, kind, scope, init) {
        if (!n) return;
        if (n.type === 'Identifier') rows.push({category,file,line:n.loc.start.line+offset,column:n.loc.start.column,name:n.name,kind,scope,init:init ? code.slice(init.start,init.end) : kind==='parameter' ? '呼出時の引数' : kind==='catch' ? '捕捉した例外' : 'undefined'});
        else if (n.type === 'ArrayPattern') n.elements.forEach(x => bind(x,kind,scope));
        else if (n.type === 'ObjectPattern') n.properties.forEach(x => bind(x.value || x.argument,kind,scope));
        else if (n.type === 'RestElement') bind(n.argument,kind,scope);
        else if (n.type === 'AssignmentPattern') bind(n.left,kind,scope,n.right);
      }
      function walk(n, scope='top') {
        if (!n || typeof n !== 'object') return;
        if (['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)) {
          const name = n.id?.name || 'anonymous@'+(n.loc.start.line+offset)+(category==='verification' ? ':'+n.loc.start.column : '');
          functions.push({category,file,line:n.loc.start.line+offset,column:n.loc.start.column,endLine:n.loc.end.line+offset,name,scope,async:!!n.async,args:n.params.map(x=>code.slice(x.start,x.end)),source:code.slice(n.start,n.end)});
          scope = name; n.params.forEach(x => bind(x,'parameter',scope));
        } else if (n.type === 'ForStatement') scope += '/for@'+(n.loc.start.line+offset);
        if (n.type === 'VariableDeclarator') {
          bind(n.id,'variable',scope,n.init);
          if (category==='application' && /^table[ABC]_data$/.test(n.id.name)) tables[n.id.name] = JSON.parse(code.slice(n.init.start,n.init.end));
        }
        if (n.type === 'CatchClause') bind(n.param,'catch',scope+'/catch@'+(n.loc.start.line+offset));
        for (const [key,value] of Object.entries(n)) {
          if (['loc','start','end','id','params','param'].includes(key)) continue;
          if (Array.isArray(value)) value.forEach(x => walk(x,scope));
          else if (value && typeof value==='object') walk(value,scope);
        }
      }
      walk(ast);
      // Build all lexical declarations before resolving references (including forward uses).
      const references=[], declared=new WeakSet();
      function declare(n, env) {
        if(!n)return;
        if(n.type==='Identifier') {
          declared.add(n);
          env.bindings.set(n.name,rows.find(row=>row.file===file && row.line===n.loc.start.line+offset && row.column===n.loc.start.column && row.name===n.name) || null);
        } else if(n.type==='ArrayPattern')n.elements.forEach(x=>declare(x,env));
        else if(n.type==='ObjectPattern')n.properties.forEach(x=>declare(x.value || x.argument,env));
        else if(n.type==='RestElement')declare(n.argument,env);
        else if(n.type==='AssignmentPattern')declare(n.left,env);
      }
      function lexical(n, env, parent, key) {
        if(!n || typeof n!=='object')return;
        if(n.type==='FunctionDeclaration')declare(n.id,env);
        if(['Program','BlockStatement','ForStatement','ForOfStatement','ForInStatement','CatchClause','FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)) {
          env={parent:env,bindings:new Map(),functionScope:n.type==='Program' || n.type.includes('Function')};
          if(n.type.includes('Function')){if(n.type==='FunctionExpression')declare(n.id,env);n.params.forEach(x=>declare(x,env));}
          if(n.type==='CatchClause')declare(n.param,env);
        }
        if(n.type==='VariableDeclaration') {
          let target=env; if(n.kind==='var')while(target.parent && !target.functionScope)target=target.parent;
          n.declarations.forEach(x=>declare(x.id,target));
        }
        if(n.type==='Identifier' && !declared.has(n) && !(parent?.type==='MemberExpression' && key==='property' && !parent.computed) && !(parent?.type==='Property' && key==='key' && !parent.computed) && !(['LabeledStatement','BreakStatement','ContinueStatement'].includes(parent?.type) && key==='label'))references.push({n,env});
        for(const [field,value] of Object.entries(n)) {
          if(['loc','start','end'].includes(field))continue;
          if(Array.isArray(value))value.forEach(x=>lexical(x,env,n,field));
          else if(value && typeof value==='object')lexical(value,env,n,field);
        }
      }
      lexical(ast,null);
      for(const {n,env} of references) {
        let target=env;while(target && !target.bindings.has(n.name))target=target.parent;
        const row=target?.bindings.get(n.name);if(row){row.usageLines ||= [];row.usageLines.push(n.loc.start.line+offset);}
      }
    }
  }
  for (const row of rows) row.usageLines = [...new Set(row.usageLines || [])];
  return {counting:'variables + parameters + catch bindings; functions include anonymous callbacks; usageLines resolve lexical bindings, exclude declarations and noncomputed property keys, include shorthand references', rows, functions, tables};
}
if (require.main === module) {
  const result = inventory(); fs.writeFileSync(path.join(__dirname,'inventory.json'), JSON.stringify(result,null,2)+'\n');
  for (const category of ['application','verification']) console.log(category, result.rows.filter(x=>x.category===category).length, 'bindings;', result.functions.filter(x=>x.category===category).length, 'functions');
}
module.exports = inventory;
