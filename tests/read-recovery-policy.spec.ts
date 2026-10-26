import {test,expect} from '@playwright/test';
const cases=[...([408,429,500,502,503,504].map(status=>({name:String(status),retry:true}))),...([400,401,403,404,409,422].map(status=>({name:String(status),retry:false}))),{name:'network',retry:true},{name:'timeout',retry:true},{name:'abort',retry:false},{name:'malformed',retry:false},{name:'wrapped-network',retry:true}];
for(const scenario of cases)test(`F01 pure-read policy: ${scenario.name}`,async({page})=>{
 await page.goto('/loading-harness.html');
 const result=await page.evaluate(async name=>{
  const {queryClient}=await import('/src/shared/query/queryClient.ts');const {safeReadOptions}=await import('/src/shared/query/safeReadPolicy.ts');
  let calls=0;let error:Error;
  if(/^\d+$/.test(name))error=Object.assign(new Error('Synthetic HTTP failure'),{status:Number(name)});
  else if(name==='network')error=new TypeError('Synthetic network failure');
  else if(name==='wrapped-network')error=Object.assign(new Error('Synthetic wrapped network failure'),{status:undefined,cause:new TypeError('Synthetic network failure')});
  else error=Object.assign(new Error('Synthetic failure'),{name:name==='timeout'?'TimeoutError':name==='abort'?'AbortError':'SyntaxError'});
  try {const data=await queryClient.fetchQuery({...safeReadOptions,queryKey:['safe-read-policy',name],queryFn:async()=>{calls++;if(calls===1)throw error;return 'verified';}});return {calls,data};}
  catch{return {calls,data:null};}
 },scenario.name);
 expect(result).toEqual({calls:scenario.retry?2:1,data:scenario.retry?'verified':null});
});
test('F01: unclassified GET queries and academic mutations retain zero automatic retries',async({page})=>{
 await page.goto('/loading-harness.html');
 const result=await page.evaluate(async()=>{
  const {queryClient}=await import('/src/shared/query/queryClient.ts');let reads=0,writes=0;
  await queryClient.fetchQuery({queryKey:['unclassified-generated-get'],queryFn:async()=>{reads++;throw new TypeError('Synthetic uncertain generation');}}).catch(()=>{});
  const mutation=queryClient.getMutationCache().build(queryClient,{mutationFn:async()=>{writes++;throw new TypeError('Synthetic uncertain academic write');}});
  await mutation.execute(undefined).catch(()=>{});return {reads,writes};
 });expect(result).toEqual({reads:1,writes:1});
});
test('F01: retry budget stops after two failed pure-read attempts',async({page})=>{
 await page.goto('/loading-harness.html');const result=await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');const {safeReadOptions}=await import('/src/shared/query/safeReadPolicy.ts');let calls=0;await queryClient.fetchQuery({...safeReadOptions,queryKey:['bounded-failure'],queryFn:async()=>{calls++;throw Object.assign(new Error('Synthetic unavailable'),{status:503});}}).catch(()=>{});return calls;});expect(result).toBe(2);
});
