"""Fetch pinned official runtime references; preserve bytes and record provenance.
Run with Python 3.12+ from any directory. npm archives verified before extraction.
"""
import base64, concurrent.futures, datetime, hashlib, io, json, tarfile, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent
MDN = "19370346042efad9e179fbf1f55deeeadee98c40"
DOTNET = "b3f744389f83f55a54e9d9e4cad4b1fef80f5757"
PYTHON = "58ed60b7415e218ce3d608302e39b5e55bfb0e88"
IBM = "763c36ef9117782905ae010056dfbe8fd2653a25"
POWERSHELL = "a3de8f22552170e70852470d46cd52cd9ca471ec"
MDN_PATHS = {
 "mdn-script.md": "files/en-us/web/html/reference/elements/script/index.md",
 "mdn-dom-introduction.md": "files/en-us/web/api/document_object_model/index.md",
 "mdn-events.md": "files/en-us/web/api/eventtarget/addeventlistener/index.md",
 "mdn-execution-model.md": "files/en-us/web/javascript/reference/execution_model/index.md",
 "mdn-async-function.md": "files/en-us/web/javascript/reference/statements/async_function/index.md",
 "mdn-getusermedia.md": "files/en-us/web/api/mediadevices/getusermedia/index.md",
 "mdn-srcobject.md": "files/en-us/web/api/htmlmediaelement/srcobject/index.md",
 "mdn-play.md": "files/en-us/web/api/htmlmediaelement/play/index.md",
 "mdn-video-width.md": "files/en-us/web/api/htmlvideoelement/videowidth/index.md",
 "mdn-track-stop.md": "files/en-us/web/api/mediastreamtrack/stop/index.md",
 "mdn-raf.md": "files/en-us/web/api/window/requestanimationframe/index.md",
 "mdn-canvas2d.md": "files/en-us/web/api/canvasrenderingcontext2d/index.md",
 "mdn-canvas-width.md": "files/en-us/web/api/htmlcanvaselement/width/index.md",
 "mdn-webgl.md": "files/en-us/web/api/webgl_api/index.md",
 "mdn-wasm.md": "files/en-us/webassembly/index.md",
 "mdn-wasm-streaming.md": "files/en-us/webassembly/reference/javascript_interface/instantiatestreaming_static/index.md",
 "mdn-fetch.md": "files/en-us/web/api/window/fetch/index.md",
 "mdn-cors.md": "files/en-us/web/http/guides/cors/index.md",
 "mdn-origin.md": "files/en-us/web/security/defenses/same-origin_policy/index.md",
 "mdn-mime.md": "files/en-us/web/http/guides/mime_types/index.md",
 "mdn-localstorage.md": "files/en-us/web/api/window/localstorage/index.md",
 "mdn-font-face.md": "files/en-us/web/css/reference/at-rules/@font-face/index.md",
 "mdn-font-display.md": "files/en-us/web/css/reference/at-rules/@font-face/font-display/index.md",
 "mdn-LICENSE.md": "LICENSE.md",
}
SOURCES = [(f,"mdn/content",MDN,p) for f,p in MDN_PATHS.items()] + [
 ("dotnet-LICENSE","dotnet/dotnet-api-docs",DOTNET,"LICENSE"),
 ("powershell-LICENSE","MicrosoftDocs/PowerShell-Docs",POWERSHELL,"LICENSE.md"),
 ("dotnet-HttpListener.xml","dotnet/dotnet-api-docs",DOTNET,"xml/System.Net/HttpListener.xml"),
 ("python-http-server.rst","python/cpython",PYTHON,"Doc/library/http.server.rst"),
 ("python-http-server.py","python/cpython",PYTHON,"Lib/http/server.py"),
 ("python-LICENSE","python/cpython",PYTHON,"LICENSE"),
 ("ibm-plex-LICENSE.txt","IBM/plex",IBM,"LICENSE.txt"),
 ("powershell-execution-policies.md","MicrosoftDocs/PowerShell-Docs",POWERSHELL,"reference/7.5/Microsoft.PowerShell.Core/About/about_Execution_Policies.md"),
]
def get(url):
 with urllib.request.urlopen(url, timeout=45) as r:
  return r.read(), r.status, r.headers.get("Content-Type")
def stamp():
 return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save_one(item):
 f,repo,commit,path = item
 url=f"https://raw.githubusercontent.com/{repo}/{commit}/{path}"
 rec={"file":f,"url":url,"upstream_path":path,"commit":commit,"version":None,"retrieved_at_utc":stamp(),"retrieved_date_jst":datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()}
 try:
  raw,status,mime=get(url); (ROOT/f).write_bytes(raw)
  rec.update(status=status,content_type=mime,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
 except Exception as e: rec.update(error=str(e))
 return rec
if __name__=="__main__":
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: records=list(pool.map(save_one,SOURCES))
 for name,version,prefix in [("pose","0.5.1675469404","npm-pose"),("camera_utils","0.3.1675466862","npm-camera-utils")]:
  url=f"https://registry.npmjs.org/@mediapipe/{name}/{version}"
  raw,status,mime=get(url); meta=json.loads(raw); filename=prefix+"-metadata.json"; (ROOT/filename).write_bytes(raw)
  records.append(dict(file=filename,url=url,commit=None,version=version,retrieved_at_utc=stamp(),retrieved_date_jst=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat(),status=status,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest()))
  archive,astatus,amime=get(meta["dist"]["tarball"])
  alg,b64=meta["dist"]["integrity"].split("-",1)
  assert base64.b64encode(hashlib.new(alg,archive).digest()).decode()==b64
  assert hashlib.sha1(archive).hexdigest()==meta["dist"]["shasum"]
  dist={"package":name,"version":version,"url":meta["dist"]["tarball"],"tarball_saved":False,"bytes":len(archive),"sha256":hashlib.sha256(archive).hexdigest(),"dist_integrity_verified":True,"dist_shasum_verified":True,"vendor_comparison":[]}
  with tarfile.open(fileobj=io.BytesIO(archive),mode="r:gz") as tf:
   for member in ["package/package.json","package/index.d.ts"]:
    data=tf.extractfile(member).read(); f=prefix+"-"+member.split("/")[-1]; (ROOT/f).write_bytes(data)
    records.append(dict(file=f,url=meta["dist"]["tarball"],archive_member=member,commit=None,version=version,retrieved_at_utc=stamp(),retrieved_date_jst=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat(),bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
   for local in sorted((ROOT.parents[2]/"vendor"/"mediapipe"/name).glob("*")):
    data=tf.extractfile("package/"+local.name).read(); actual=local.read_bytes()
    dist["vendor_comparison"].append(dict(file=str(local.relative_to(ROOT.parents[2])),bytes=len(actual),sha256=hashlib.sha256(actual).hexdigest(),tarball_member_sha256=hashlib.sha256(data).hexdigest(),identical=actual==data))
  (ROOT/(prefix+"-verification.json")).write_text(json.dumps(dist,indent=2)+"\n")
 (ROOT/"sources.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n")
 for rec in records: print(rec["file"],rec.get("status","archive"),rec.get("error",rec.get("bytes")))
