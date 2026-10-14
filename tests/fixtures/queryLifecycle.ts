import fs from 'node:fs';
import {expect,type Page} from '@playwright/test';
// Read-only lifecycle evidence from the actual source or freshly built client.
// No response bodies, credentials or private records are returned or logged.
function runtimePath(page:Page){
 let path='/src/shared/query/queryClient.ts';
 if(new URL(page.url()).port==='5193'){const audit=JSON.parse(fs.readFileSync('dist/bundle-audit.json','utf8')) as {fileName:string;modules:string[]}[];const runtime=audit.find(c=>c.modules.some(m=>m.endsWith('/shared/query/queryClient.ts')));if(!runtime)throw new Error('Fresh build has no centralized Query client module.');path='/'+runtime.fileName;}
 return path;
}
export async function invalidateReaderForTest(page:Page,role:string,resource:readonly string[]){
 const path=runtimePath(page);
 await page.evaluate(async({path,role,resource})=>{type Query={queryKey:readonly unknown[]};type Client={getQueryCache:()=>unknown;invalidateQueries:(filters:object)=>Promise<void>};const module=await import(path);const client=Object.values(module).find((value:unknown):value is Client=>typeof value==='object'&&value!==null&&'getQueryCache'in value);if(!client)throw new Error('Central QueryClient missing.');await client.invalidateQueries({predicate:(q:Query)=>q.queryKey[2]===role&&q.queryKey.some((_,index)=>index>=5&&resource.every((part,i)=>q.queryKey[index+i]===part)),refetchType:'none'});},{path,role,resource:[...resource]});
}
export async function waitForQueryReader(page:Page,role:string,resource:readonly string[],idle=false){
 const path=runtimePath(page);
 await expect.poll(()=>page.evaluate(async({path,role,resource,idle})=>{type Query={queryKey:readonly unknown[];getObserversCount:()=>number;state:{fetchStatus:string}};type Client={getQueryCache:()=>{getAll:()=>Query[]}};const module=await import(path);const client=Object.values(module).find((value:unknown):value is Client=>typeof value==='object'&&value!==null&&'getQueryCache'in value&&typeof value.getQueryCache==='function');return !!client?.getQueryCache().getAll().some(q=>q.queryKey[2]===role&&resource.every((part,i)=>q.queryKey[5+i]===part)&&q.getObserversCount()>0&&(!idle||q.state.fetchStatus==='idle'));},{path,role,resource:[...resource],idle})).toBe(true);
}
export async function getQueryCollectionSize(page:Page,role:string,resource:readonly string[]){return page.evaluate(async({path,role,resource})=>{type Query={queryKey:readonly unknown[];state:{data?:unknown}};type Client={getQueryCache:()=>{getAll:()=>Query[]}};const module=await import(path),client=Object.values(module).find((value:unknown):value is Client=>typeof value==='object'&&value!==null&&'getQueryCache'in value&&typeof value.getQueryCache==='function');const rows=client?.getQueryCache().getAll().find(q=>q.queryKey[2]===role&&resource.every((part,i)=>q.queryKey[5+i]===part))?.state.data;return Array.isArray(rows)?rows.length:0;},{path:runtimePath(page),role,resource:[...resource]});}
export async function isReaderInvalidated(page:Page,role:string,resource:string){return page.evaluate(async({path,role,resource})=>{type Query={queryKey:readonly unknown[];state:{isInvalidated:boolean}};type Client={getQueryCache:()=>{getAll:()=>Query[]}};const module=await import(path),client=Object.values(module).find((value:unknown):value is Client=>typeof value==='object'&&value!==null&&'getQueryCache'in value);return client?.getQueryCache().getAll().find(q=>q.queryKey[2]===role&&q.queryKey.includes(resource))?.state.isInvalidated;},{path:runtimePath(page),role,resource});}
export async function waitForQueryReadersIdle(page:Page,role:string,resource:readonly string[],count:number){
 const path=runtimePath(page);
 await expect.poll(()=>page.evaluate(async({path,role,resource,count})=>{type Query={queryKey:readonly unknown[];getObserversCount:()=>number;state:{fetchStatus:string}};type Client={getQueryCache:()=>{getAll:()=>Query[]}};const module=await import(path),client=Object.values(module).find((value:unknown):value is Client=>typeof value==='object'&&value!==null&&'getQueryCache'in value&&typeof value.getQueryCache==='function');const readers=client?.getQueryCache().getAll().filter(q=>q.queryKey[2]===role&&resource.every((part,i)=>q.queryKey[5+i]===part)&&q.getObserversCount()>0)??[];return readers.length===count&&readers.every(q=>q.state.fetchStatus==='idle');},{path,role,resource:[...resource],count})).toBe(true);
}
