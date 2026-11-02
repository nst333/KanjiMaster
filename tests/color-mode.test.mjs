import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../src/color-mode.js', import.meta.url), 'utf8');
function boot({saved=null,dark=false,blocked=false,writeBlocked=false}={}) {
 const handlers = {}, writes=[];
 const media={matches:dark,addEventListener:(_,fn)=>handlers.media=fn};
 const select={value:'',addEventListener:(_,fn)=>handlers.select=fn};
 const document={documentElement:{dataset:{design:'legacy'}},readyState:'loading',addEventListener:(_,fn)=>handlers.ready=fn,getElementById:()=>select};
 const window={matchMedia:()=>media,addEventListener:(_,fn)=>handlers.storage=fn};
 const storage={getItem:()=>{if(blocked)throw Error();return saved;},setItem:(...args)=>{if(writeBlocked)throw Error();writes.push(args);}};
 runInNewContext(source,{document,window,localStorage:storage});
 return {document,select,writes,connect:()=>handlers.ready(),change(value){select.value=value;handlers.select();},device(value){media.matches=value;handlers.media();},storage(value,key='kanjimaster.colorMode'){handlers.storage({key,newValue:value});}};
}
test('device mode is resolved before CSS, including blocked or invalid storage',()=>{
 for(const saved of [null,'bad','system'])for(const dark of [false,true]) {
  const p=boot({saved,dark});assert.equal(p.document.documentElement.dataset.colorMode,dark?'dark':'light');
 }
 assert.equal(boot({blocked:true,dark:true}).document.documentElement.dataset.colorMode,'dark');
});
test('saved mode overrides device and remains independent of layout',()=>{
 const p=boot({saved:'light',dark:true});p.connect();p.device(true);
 assert.equal(p.document.documentElement.dataset.colorMode,'light');
 p.change('dark');assert.deepEqual(p.writes,[['kanjimaster.colorMode','dark']]);
 assert.equal(p.document.documentElement.dataset.design,'legacy');
});
test('system choice follows live device changes and can be restored',()=>{
 const p=boot({saved:'dark'});p.connect();p.change('system');
 assert.equal(p.document.documentElement.dataset.colorMode,'light');p.device(true);
 assert.equal(p.document.documentElement.dataset.colorMode,'dark');
});
test('blocked writes and changes in other tabs preserve a usable control',()=>{
 const p=boot({writeBlocked:true});p.connect();assert.doesNotThrow(()=>p.change('dark'));
 assert.equal(p.document.documentElement.dataset.colorMode,'dark');p.storage('light');
 assert.equal(p.select.value,'light');p.storage('dark','kanjimaster.design');
 assert.equal(p.document.documentElement.dataset.colorMode,'light');p.device(true);p.storage(null,null);
 assert.equal(p.select.value,'system');assert.equal(p.document.documentElement.dataset.colorMode,'dark');
});
