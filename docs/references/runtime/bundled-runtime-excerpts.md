# 同梱ランタイムの読解用抜粋

対象コミット: `1214b9bf67b1b18fe3e33e7a3b4eeab3981ef880`。2026-10-13 JSTコード確認。省略あり。一般資料ではなく同梱実コードの抜粋。

## vendor/mediapipe/pose/pose_solution_wasm_bin.js:9 — `function getBinaryPromise`

文字オフセット 18980、ファイルSHA-256 `3fcfd9574a04fcf4a0b9271b9b4429c6b9a70278300a5e54c45ddf2001e41422`。

```javascript
nd sync fetching of the wasm failed"}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"&&!isFileURI(wasmBinaryFile)){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}else{if(readAsync){return new Promise(function(resolve,reject){readAsync(wasmBinaryFile,function(response){resolve(new Uint8Array(response))},reject)})}}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"env":asmLibraryArg,"wasi_snapshot_preview1":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["memory"];assert(wasmMemory,"memory not found in wasm exports");updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["__indirect_function_table"];assert(wasmTable,"table not found in wasm exports");addOnInit(Module["asm"]["__wasm_call_ctors"]);re
```

## vendor/mediapipe/pose/pose_solution_wasm_bin.js:9 — `function instantiateAsync`

文字オフセット 20975、ファイルSHA-256 `3fcfd9574a04fcf4a0b9271b9b4429c6b9a70278300a5e54c45ddf2001e41422`。

```javascript
program-stall-in-downloading-or-preparing")}abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&!ENVIRONMENT_IS_NODE&&typeof fetch=="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);readyPromiseReject(e)}}instantiateAsync().catch(readyPromiseReject);return{}}var tempDouble;var tempI64;var ASM_CONSTS={605540:$0=>{const canvas=Emval.toValue($0);const context=canvas.getContext("webgpu");return JsValStore.add(context.getCurrentTexture())},605675:($0,$1,$2,$3,$4)=>{const drawabl
```

## vendor/mediapipe/pose/pose_solution_simd_wasm_bin.js:9 — `function getBinaryPromise`

文字オフセット 18985、ファイルSHA-256 `3983d1dca31d945d81abb70b18dd61f28ef4736e112463d7cfb1cbadef588127`。

```javascript
nd sync fetching of the wasm failed"}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"&&!isFileURI(wasmBinaryFile)){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}else{if(readAsync){return new Promise(function(resolve,reject){readAsync(wasmBinaryFile,function(response){resolve(new Uint8Array(response))},reject)})}}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"env":asmLibraryArg,"wasi_snapshot_preview1":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmMemory=Module["asm"]["memory"];assert(wasmMemory,"memory not found in wasm exports");updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["__indirect_function_table"];assert(wasmTable,"table not found in wasm exports");addOnInit(Module["asm"]["__wasm_call_ctors"]);re
```

## vendor/mediapipe/pose/pose_solution_simd_wasm_bin.js:9 — `function instantiateAsync`

文字オフセット 20980、ファイルSHA-256 `3983d1dca31d945d81abb70b18dd61f28ef4736e112463d7cfb1cbadef588127`。

```javascript
program-stall-in-downloading-or-preparing")}abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&!ENVIRONMENT_IS_NODE&&typeof fetch=="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);readyPromiseReject(e)}}instantiateAsync().catch(readyPromiseReject);return{}}var tempDouble;var tempI64;var ASM_CONSTS={605156:$0=>{const canvas=Emval.toValue($0);const context=canvas.getContext("webgpu");return JsValStore.add(context.getCurrentTexture())},605291:($0,$1,$2,$3,$4)=>{const drawabl
```

## vendor/mediapipe/pose/pose_solution_packed_assets_loader.js:189 — `pose_detection.tflite`

文字オフセット 7905、ファイルSHA-256 `d7aa29b7d8e11b5c97a58d719e982dd15c2de72995d95112d60492b854840a36`。

```javascript
{"filename": "/third_party/mediapipe/modules/pose_detection/pose_detection.tflite", "start": 0, "end": 2962288}], "remote_package_size": 2962288});

  })();

```
