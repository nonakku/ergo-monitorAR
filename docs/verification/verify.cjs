// Run from any directory. All generated files stay next to this runner.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const vm = require('node:vm'), crypto = require('node:crypto'), {spawn} = require('node:child_process');
const {chromium} = require('playwright'), inventory = require('./inventory.cjs');
const root = path.resolve(__dirname,'../..');
const result = {startedAt:new Date().toISOString(), dateJST:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date()), environment:{node:process.version,playwright:require('playwright/package.json').version,acorn:require('acorn/package.json').version,platform:process.platform}, assertions:[], pageErrors:[], dialogs:[], httpFailures:[], externalRequests:[], localRequests:[], limitations:['Synthetic camera; no verified human posture, real permission dialog, real OS camera, performance or clinical validity.','Expected defective input behavior is asserted separately; assertions passing does not mean the application is exception-free.']};
const appFiles = ['script.js','index.html','rula.html','RULAworkseet.html','style.css'];
function hashes() { return Object.fromEntries(appFiles.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])); }
const before = hashes();
async function check(name, action) {
  try { await action(); result.assertions.push({name,status:'passed'}); }
  catch (error) { result.assertions.push({name,status:'failed',error:String(error.stack || error)}); }
}
async function main() {
  await check('AST: original 122 bindings / 20 functions and all original tables',()=>{
    const data = inventory();
    assert.equal(data.rows.filter(x=>x.category==='application').length,122);
    assert.equal(data.functions.filter(x=>x.category==='application').length,20);
    assert.equal(data.tables.tableC_data.length,8); assert.ok(data.tables.tableC_data.every(x=>x.length===7));
    fs.writeFileSync(path.join(__dirname,'inventory.json'),JSON.stringify(data,null,2)+'\n');
  });
  await check('math: trunk/knee thresholds, rounding, normalized aspect, degenerate and NaN',()=>{
    const element = ()=>({classList:{toggle(){},add(){},remove(){}},style:{},querySelector:()=>element(),addEventListener(){},getContext:()=>({}),checked:true});
    const context = vm.createContext({document:{getElementById:()=>element(),querySelector:()=>element()},localStorage:{getItem:()=>null},console});
    vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8'),context);
    for (const [t,k,expected] of [[0,180,0],[14.999,180,0],[15,180,30],[29.999,180,30],[30,180,60],[44.999,180,60],[45,180,100],[180,180,100],[30,119.999,40],[30,120,50],[30,149.999,50],[30,150,60],[0,119,0],[45,149,90],[NaN,NaN,100],[-10,-10,0],[Infinity,Infinity,100]]) assert.equal(vm.runInContext(`estimateLoadLevel(${t},${k})`,context),expected);
    assert.equal(vm.runInContext('calculateAngle({x:0,y:0},{x:0,y:1},{x:0,y:2})',context),180);
    assert.equal(vm.runInContext('calculateAngle({x:0,y:0},{x:0,y:0},{x:0,y:0})',context),0);
    assert.equal(vm.runInContext('calculateTrunkAngle({x:.25,y:.25},{x:.5,y:.5})',context),45);
    assert.ok(Math.abs(vm.runInContext('calculateTrunkAngle({x:160,y:120},{x:320,y:240})',context)-53.13010235415598)<1e-10);
    assert.equal(vm.runInContext('Math.round(29.6)',context),30); assert.equal(vm.runInContext('estimateLoadLevel(29.6,150)',context),30);
    assert.equal(vm.runInContext('getStatusClass(20,[20,40])',context),'warning'); assert.equal(vm.runInContext('getStatusClass(40,[20,40])',context),'danger');
  });
  // Python owns the socket assignment; no preselected port, and no unrelated processes are killed.
  const server = spawn(process.env.PYTHON || 'python3',['-u','-m','http.server','0','--bind','127.0.0.1','--directory',root],{stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    const base = await new Promise((resolve,reject)=>{
      const timer = setTimeout(()=>reject(new Error('HTTP server did not report its port')),10000);
      server.stdout.on('data',chunk=>{const port=String(chunk).match(/port (\d+)/);if(port){clearTimeout(timer);resolve('http://127.0.0.1:'+port[1]);}});
      server.once('error',error=>{clearTimeout(timer);reject(error);}); server.once('exit',code=>{clearTimeout(timer);reject(new Error('HTTP server exited: '+code));});
    });
    result.environment.python = (await new Promise(resolve=>{let text='';const child=spawn(process.env.PYTHON || 'python3',['--version']);child.stdout.on('data',x=>text+=x);child.once('close',()=>resolve(text.trim()));}));
    await check('HTTP: app/MediaPipe/font assets return 200 with exact disk bytes',async()=>{
      for (const file of [...appFiles,...fs.readdirSync(path.join(root,'vendor/mediapipe/pose')).map(x=>'vendor/mediapipe/pose/'+x),'vendor/mediapipe/camera_utils/camera_utils.js',...fs.readdirSync(path.join(root,'vendor/fonts')).map(x=>'vendor/fonts/'+x)]) {
        const response=await fetch(base+'/'+file); assert.equal(response.status,200,file);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(path.join(root,file)),file);
      }
    });
    const args = ['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'];
    if (process.env.CHROMIUM_NO_SANDBOX==='1') args.push('--no-sandbox');
    browser = await chromium.launch({headless:true,args,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
    result.environment.chromium = browser.version(); result.environment.chromiumPath = process.env.CHROMIUM_PATH || 'Playwright-managed'; result.environment.noSandbox = process.env.CHROMIUM_NO_SANDBOX==='1';
    const context = await browser.newContext({permissions:['camera'],viewport:{width:1280,height:960}}), page = await context.newPage();
    let stage = 'initial';
    page.on('pageerror',error=>result.pageErrors.push({stage,message:error.message}));
    page.on('dialog',async dialog=>{result.dialogs.push({stage,type:dialog.type(),message:dialog.message()});await dialog.dismiss();});
    context.on('request',request=>{if(new URL(request.url()).origin!==base)result.externalRequests.push(request.url());else result.localRequests.push(new URL(request.url()).pathname);});
    context.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))result.httpFailures.push({url:response.url(),status:response.status()});});
    await page.goto(base);
    await check('browser: idle, mirror transform/persistence, 390px viewport',async()=>{
      assert.equal(await page.locator('#video-idle').isVisible(),true); assert.equal(await page.locator('#stop-btn').isDisabled(),true);
      assert.equal(await page.locator('#mirror-toggle').isChecked(),true);
      assert.match(await page.locator('#webcam').evaluate(x=>getComputedStyle(x).transform),/-1/);
      await page.locator('#mirror-toggle').uncheck(); await page.reload(); assert.equal(await page.locator('#mirror-toggle').isChecked(),false);
      assert.equal(await page.locator('#webcam').evaluate(x=>getComputedStyle(x).transform),'none');
      await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#start-btn').isVisible(),true);await page.setViewportSize({width:1280,height:960});
    });
    await page.evaluate(()=>{window.testCallbacks=0;const original=onResults;onResults=r=>{window.testCallbacks++;original(r);};});
    await check('browser: real MediaPipe/WASM fake camera start, stop and restart',async()=>{
      for (const cycle of [1,2]) {
        stage='camera cycle '+cycle; await page.evaluate(()=>window.testCallbacks=0); await page.locator('#start-btn').click();
        await page.waitForFunction(()=>window.testCallbacks>=3,null,{timeout:90000});
        assert.equal(await page.locator('#stop-btn').isEnabled(),true);
        await page.evaluate(()=>window.testTracks=video.srcObject.getTracks()); await page.locator('#stop-btn').click();
        assert.equal(await page.evaluate(()=>window.testTracks.every(x=>x.readyState==='ended') && video.srcObject===null),true);
        assert.equal(await page.locator('#score').textContent(),'--'); assert.equal(await page.locator('#start-btn').isEnabled(),true);assert.equal(await page.locator('#video-idle').isVisible(),true);
      }
    });
    stage='synthetic input';
    await check('browser: UI, missing/short landmarks, invalid coordinates, visibility and skeleton boundary',async()=>{
      result.synthetic = await page.evaluate(()=>{
        const points=Array.from({length:33},()=>({x:.5,y:.5,visibility:1}));
        points[11]=points[12]={x:.25,y:.25,visibility:1};points[25]={x:.5,y:.75,visibility:1};points[27]={x:.5,y:1,visibility:1};
        updateUI(points);const valid={score:scoreEl.textContent,trunk:trunkAngleEl.textContent,knee:kneeAngleEl.textContent,level:loadLevelEl.textContent,barWidth:loadBarEl.style.width,loadStatus:loadLevelEl.className,scoreStatus:scoreEl.className,barStatus:loadBarEl.className};
        updateUI(null); updateUI([]); const retained=scoreEl.textContent;onResults({});const missingRetained=scoreEl.textContent;
        let shortError;try{drawSkeleton([]);}catch(error){shortError=error.name;}
        points[11].x=NaN; updateUI(points);const invalid={score:scoreEl.textContent,trunk:trunkAngleEl.textContent,level:loadLevelEl.textContent};
        const colors=[], strokes=[], originalStroke=ctx.stroke; let strokeCount=0;
        ctx.stroke=function(){strokeCount++;originalStroke.call(ctx);};
        try {for(const angle of [20,20.001,40,40.001]){strokeCount=0;points[11]=points[12]={x:.5-Math.tan(angle*Math.PI/180)*.25,y:.25,visibility:.5};points.forEach(x=>x.visibility=.5);drawSkeleton(points);colors.push(ctx.strokeStyle);strokes.push(strokeCount);}}
        finally {ctx.stroke=originalStroke;}
        return {valid,retained,missingRetained,shortError,invalid,colors,strokes};
      });
      assert.deepEqual(result.synthetic.valid,{score:'0',trunk:'45°',knee:'180°',level:'危険',barWidth:'100%',loadStatus:'status-pill pill-danger',scoreStatus:'score-value status-danger',barStatus:'metric-bar-fill bg-danger'});assert.equal(result.synthetic.retained,'0');assert.equal(result.synthetic.missingRetained,'0');assert.equal(result.synthetic.shortError,'TypeError');
      assert.deepEqual(result.synthetic.invalid,{score:'0',trunk:'NaN°',level:'危険'}); assert.deepEqual(result.synthetic.colors,['#4ade80','#facc15','#facc15','#f87171']);assert.deepEqual(result.synthetic.strokes,[1,1,1,1]);
    });
    await check('browser: explanation link and return, worksheet default/maximum, 56 Table C index states',async()=>{
      const popupPromise=page.waitForEvent('popup');await page.locator('a[href="rula.html"]').click();const popup=await popupPromise;
      try {await popup.waitForLoadState();assert.equal(await popup.title(),'RULAとは？ - ErgoMonitorMR');assert.equal(popup.url(),base+'/rula.html');await popup.locator('a[href="index.html"]').click();assert.equal(await popup.title(),'ErgoMonitor AR');assert.equal(popup.url(),base+'/index.html');}
      finally {await popup.close();}
      await page.goto(base+'/RULAworkseet.html'); assert.equal(await page.locator('#final_rula_score').innerText(),'1');
      for (const [id,value] of Object.entries({a1:'4',a2:'2',a3:'3',a4:'2',a6:'1',a7:'3',b9:'4',b10:'4',b11:'2',b13:'1',b14:'3'})) await page.locator('#'+id).selectOption(value);
      for(const id of ['a1_adj1','a1_adj2','a2_adj','a3_adj','b9_adj1','b9_adj2','b10_adj1','b10_adj2'])await page.locator('#'+id).check();
      assert.equal(await page.locator('#box_finalA').innerText(),'13');assert.equal(await page.locator('#box_finalB').innerText(),'13');assert.equal(await page.locator('#final_rula_score').innerText(),'7');assert.equal(await page.locator('#tc_8_7.highlight').count(),1);assert.equal(await page.locator('td.highlight').count(),3);
      await page.reload();assert.equal(await page.locator('#final_rula_score').innerText(),'1');
      result.tableC = await page.evaluate(()=>{
        const states=[];for(let a=1;a<=8;a++)for(let b=1;b<=7;b++){
          // Fault-injected muscle scores exercise every final index, not claimed as normal UI input.
          document.getElementById('a6').add(new Option(String(a-1),String(a-1)));document.getElementById('a6').value=String(a-1);
          document.getElementById('b13').add(new Option(String(b-1),String(b-1)));document.getElementById('b13').value=String(b-1);calcRULA();
          states.push({a,b,score:Number(document.getElementById('final_rula_score').innerText),highlight:document.getElementById(`tc_${a}_${b}`).classList.contains('highlight'),count:document.querySelectorAll('td.highlight').length});
        }return states;
      });
      for (const state of result.tableC) {assert.equal(state.score,inventory().tables.tableC_data[state.a-1][state.b-1]);assert.equal(state.highlight,true);assert.equal(state.count,3);}
      assert.equal(result.tableC[0].score,1);assert.equal(result.tableC[55].score,7);
      result.worksheetInvalid=await page.evaluate(()=>{document.getElementById('a1').value='invalid';try{calcRULA();return 'no error';}catch(error){return error.name;}});assert.equal(result.worksheetInvalid,'TypeError');
    });
    await check('browser: injected denied/missing errors show inline UI; vendor alerts recorded and dismissed',async()=>{
      const denied=await browser.newContext(), q=await denied.newPage();
      denied.on('request',request=>{if(new URL(request.url()).origin!==base)result.externalRequests.push(request.url());});
      q.on('pageerror',error=>result.pageErrors.push({stage:'injected camera error',message:error.message}));
      q.on('dialog',async dialog=>{result.dialogs.push({stage:'injected camera error',type:dialog.type(),message:dialog.message()});await dialog.dismiss();});
      try {
        await q.addInitScript(()=>navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('test denied','NotAllowedError')));await q.goto(base);
        await q.locator('#start-btn').click();await q.locator('#video-error').waitFor({state:'visible'}); assert.match(await q.locator('#video-error-text').innerText(),/アクセスを許可/);assert.equal(await q.locator('#start-btn').isEnabled(),true);
        await q.evaluate(()=>navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('test missing','NotFoundError')));await q.locator('#start-btn').click();await q.waitForFunction(()=>document.getElementById('video-error-text').innerText.includes('カメラが見つかりませんでした'));
      } finally {await denied.close();}
    });
    await check('browser: zero external requests and zero HTTP asset failures',()=>{assert.deepEqual(result.externalRequests,[]);assert.deepEqual(result.httpFailures,[]);});
  } finally {
    if(browser)await browser.close(); if(server.pid && server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('close',resolve));}
  }
}
main().catch(error=>result.assertions.push({name:'runner prerequisites',status:'failed',error:String(error.stack || error)})).finally(()=>{
  result.finishedAt=new Date().toISOString();result.sourceHashes=before;result.appFilesUnchanged=JSON.stringify(before)===JSON.stringify(hashes());
  result.assertionStatus=result.assertions.every(x=>x.status==='passed')&&result.appFilesUnchanged?'passed':'failed';result.applicationExceptionFree=result.pageErrors.length===0;
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({assertionStatus:result.assertionStatus,assertions:result.assertions,pageErrors:result.pageErrors,applicationExceptionFree:result.applicationExceptionFree,appFilesUnchanged:result.appFilesUnchanged},null,2));
  if(result.assertionStatus==='failed')process.exitCode=1;
});
