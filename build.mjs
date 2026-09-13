import {mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});
await mkdir('dist/client',{recursive:true});
for(const file of ['index.html','cart.css','cart.js','cart-core.js']) await copyFile(file,`dist/client/${file}`);
await cp('assets','dist/client/assets',{recursive:true});
await writeFile('dist/server/index.js', 'export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n');
console.log('Static site built in dist/client with a Worker asset entrypoint.');
