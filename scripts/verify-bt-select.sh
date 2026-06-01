#!/usr/bin/env bash
set -euo pipefail
VERIFY_DIR=/tmp/grabbit-bt-select-verify
rm -rf "$VERIFY_DIR"
mkdir -p "$VERIFY_DIR/downloads"
: > "$VERIFY_DIR/session"
resources/aria2/linux-x64/aria2c \
  --enable-rpc=true \
  --rpc-listen-all=false \
  --rpc-listen-port=16800 \
  --rpc-secret=grabbit \
  --dir="$VERIFY_DIR/downloads" \
  --input-file="$VERIFY_DIR/session" \
  --save-session="$VERIFY_DIR/session" \
  --summary-interval=0 >"$VERIFY_DIR/aria2.log" 2>&1 &
PID=$!
cleanup(){ kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; }
trap cleanup EXIT
python3 - <<'PY'
import json, time, urllib.request
url='http://127.0.0.1:16800/jsonrpc'
for _ in range(50):
    try:
        req=urllib.request.Request(url, data=json.dumps({'jsonrpc':'2.0','id':'v','method':'aria2.getVersion','params':['token:grabbit']}).encode(), headers={'content-type':'application/json'})
        print('aria2 version=' + json.loads(urllib.request.urlopen(req, timeout=1).read())['result']['version'])
        break
    except Exception:
        time.sleep(0.1)
else:
    raise SystemExit('aria2 rpc not ready')
PY
GID=$(python3 - <<'PY'
import base64,json,urllib.request
payload={'jsonrpc':'2.0','id':'add','method':'aria2.addTorrent','params':['token:grabbit', base64.b64encode(open('/tmp/grabbit-sample.torrent','rb').read()).decode(), [], {'select-file':'1'}]}
req=urllib.request.Request('http://127.0.0.1:16800/jsonrpc', data=json.dumps(payload).encode(), headers={'content-type':'application/json'})
res=json.loads(urllib.request.urlopen(req).read())
if 'error' in res: raise SystemExit(res['error'])
print(res['result'])
PY
)
echo "gid=$GID"
python3 - "$GID" <<'PY'
import json,sys,urllib.request,time
gid=sys.argv[1]
keys=['gid','status','files','bittorrent','totalLength']
for _ in range(20):
    tasks=[]
    for method, params in [('aria2.tellWaiting',[0,10,keys]), ('aria2.tellActive',[keys])]:
        payload={'jsonrpc':'2.0','id':'tell','method':method,'params':['token:grabbit',*params]}
        req=urllib.request.Request('http://127.0.0.1:16800/jsonrpc', data=json.dumps(payload).encode(), headers={'content-type':'application/json'})
        tasks += json.loads(urllib.request.urlopen(req).read())['result']
    task=next((task for task in tasks if task.get('gid')==gid), None)
    if task:
        print(json.dumps(task, indent=2, ensure_ascii=False))
        selected=[f.get('selected') for f in task.get('files', [])]
        if selected[:2] != ['true','false']:
            raise SystemExit(f'unexpected file selection: {selected}')
        print('select-file verified: only file #1 selected')
        break
    time.sleep(0.2)
else:
    raise SystemExit('task not visible')
PY
