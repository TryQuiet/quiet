# Reproduces figma/flow.json + figma/*.png from the Figma REST API. Needs FIGMA_TOKEN and a cached
# file JSON (raw/<key>.json.gz); see design-system/ONBOARDING.md. Usage: python3 extract.py <cache-dir> <figma-dir>
"""Build design-system/figma/flow.json from the cached Figma file JSON.
Roots: several unwired clusters in the file, each a section of the map.
Link kinds: 'prototype' (designer-wired), 'added' (listed, for review), 'back' (drawn back/close, unwired; history)."""
import gzip,json,os,re,sys,collections,urllib.request,urllib.parse
F,OUT=sys.argv[1],sys.argv[2]; KEY="f6Nr5b5wtvk6Xoh1HJZ8Dd"; T=os.environ["FIGMA_TOKEN"]
ROOTS=[("2811:2550","Onboarding"),("2922:10009","Server opt-in (creator)"),("3111:4339","Server agree (joiner, v1)")]
ADDED=[("2811:2455","Button","3190:10892","Not wired in the prototype; the 'Paste a link' button on Open invite link is the obvious origin of the drawn paste screen.")]
NOTES={
 "3190:10892":"Designer's work in progress: this frame is create--default duplicated with only the heading changed to 'Paste a link to Join' and the input placeholder to 'Link'. Title bar, subtitle and the avatar upload are unchanged.",
 "2922:10009":"In the prototype this is reached after username → Community home → Community switcher, i.e. once the community exists. Both apps show the equivalent offer during community creation (ServerOffer) instead.",
 "3111:4339":"'v1 before we support multiple hosts' — joiner-side agree screen. Not linked from Open invite link or username in the prototype. The implementation shows JoiningOptIn + TermsOfService after username.",
 "3054:4052":"Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent — the captcha closes, the new community shows, then the captcha returns; less likely if you wait before clicking) and #3368 (offline: no loading or timeout message, and a 'joining' screen while creating).",
 "2924:13413":"Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent) and #3368 (no loading/timeout message when hCAPTCHA cannot load; 'joining' shown while creating).",
 "2811:2370":"A canvas-level instance rather than a frame — what username-populated's Continue goes to. The prototype goes straight to the community after username; the implementation inserts ToS / captcha here when a server is involved.",
}
DISPLAY={"3190:10892":"Paste a link to Join (frame 'Container', WIP)"}
raw=json.load(gzip.open(f"{F}/raw/{KEY}.json.gz","rt")); parent={}; nodes={}
def walk(n,p=None):
    nodes[n["id"]]=n; parent[n["id"]]=p
    for c in n.get("children") or []: walk(c,n["id"])
for page in raw["document"]["children"]: walk(page,None)
def is_screen(n,p):
    bb=n.get("absoluteBoundingBox") or {}
    return p.get("type") in ("CANVAS","SECTION") and (n.get("type")=="FRAME" or (n.get("type")=="INSTANCE" and bb.get("width",0)>=300 and bb.get("height",0)>=300))
def screen_of(nid):
    cur=nid; best=None
    while cur and parent.get(cur):
        n=nodes[cur]; p=nodes[parent[cur]]
        if is_screen(n,p): best=cur
        cur=parent[cur]
    return best
def rect(n,sb):
    b=n.get("absoluteBoundingBox") or {}
    return {"x":round(b.get("x",0)-sb["x"]),"y":round(b.get("y",0)-sb["y"]),"w":round(b.get("width",0)),"h":round(b.get("height",0))}
links=collections.defaultdict(list); wired=set()
for nid,n in nodes.items():
    tg=set([n["transitionNodeID"]] if n.get("transitionNodeID") else [])
    for i in n.get("interactions") or []:
        for a in i.get("actions") or []:
            if a.get("destinationId"): tg.add(a["destinationId"])
    if not tg: continue
    src=screen_of(nid)
    if not src: continue
    for t in tg:
        dst=screen_of(t) if t in nodes else None
        if dst and dst!=src:
            links[src].append({**rect(n,nodes[src]["absoluteBoundingBox"]),"label":n.get("name",""),"dst":dst,"kind":"prototype"}); wired.add(nid)
for src,elname,dst,note in ADDED:
    el=next((c for c in nodes if screen_of(c)==src and nodes[c].get("name")==elname and nodes[c].get("type")=="INSTANCE"),None)
    assert el, f"added-link element {elname} not found in {src}"
    links[src].append({**rect(nodes[el],nodes[src]["absoluteBoundingBox"]),"label":nodes[el]["name"],"dst":dst,"kind":"added","note":note}); wired.add(el)
def is_backish(nid):
    n=nodes[nid]; nm=n.get("name",""); p=nodes.get(parent.get(nid) or "",{})
    return nm in ("Close","hotspot-back") or (nm=="Glyph" and p.get("name")=="LeftZ")
seen=[]; section={}
for root,sec in ROOTS:
    if root not in seen: seen.append(root); section[root]=sec
    q=[root]
    while q:
        s=q.pop(0)
        for l in links.get(s,[]):
            if l["dst"] not in seen: seen.append(l["dst"]); section[l["dst"]]=sec; q.append(l["dst"])
for s in seen:
    sb=nodes[s]["absoluteBoundingBox"]
    for nid in [i for i in nodes if screen_of(i)==s and i!=s and is_backish(i)]:
        if nid in wired or (parent.get(nid) in wired) or any(c["id"] in wired for c in (nodes[nid].get("children") or [])): continue
        links[s].append({**rect(nodes[nid],sb),"label":nodes[nid]["name"],"dst":None,"kind":"back"}); wired.add(nid)
def base(t):
    t=re.sub(r'(?<=[A-Za-z])(?=[0-9])|(?<=[0-9])(?=[A-Za-z])','-',t)
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',t.lower())).strip('-')
counts=collections.Counter(base(nodes[s]["name"]) for s in seen)
slug={s:(base(nodes[s]["name"]) if counts[base(nodes[s]["name"])]==1 else f"{base(nodes[s]['name'])}-{s.replace(':','-')}") for s in seen}
disp={s:DISPLAY.get(s, nodes[s]["name"] if counts[base(nodes[s]["name"])]==1 else f"{nodes[s]['name']} ({s})") for s in seen}
def title_bar(n):
    for x in [c for c in nodes.values() if False]: pass
    stack=[n]
    while stack:
        x=stack.pop()
        if x.get("type")=="INSTANCE" and (x.get("name") or "").startswith("Title bar"):
            h=round((x.get("absoluteBoundingBox") or {}).get("height",0)); q=[x]; text=None
            while q:
                y=q.pop()
                if y.get("type")=="TEXT" and y.get("name")=="Title" and (y.get("characters") or "").strip(): text=y["characters"].strip(); break
                q.extend(y.get("children") or [])
            if text=="Title": text=None
            return {"height":h,"text":text}
        stack.extend(x.get("children") or [])
    return None
frames=[]
for s in seen:
    n=nodes[s]; bb=n["absoluteBoundingBox"]; fl=[]
    for l in links.get(s,[]):
        d={k:v for k,v in l.items() if k!="dst"}; d["target"]=slug[l["dst"]] if l["dst"] else None; fl.append(d)
    frames.append({"slug":slug[s],"name":n["name"],"display":disp[s],"node":s,"section":section[s],"width":round(bb["width"]),"height":round(bb["height"]),
                   "png":slug[s]+".png","url":f"https://www.figma.com/design/{KEY}?node-id={s.replace(':','-')}","note":NOTES.get(s),"titleBar":title_bar(n),"links":fl})
keep={f["png"] for f in frames}
for fn in os.listdir(OUT):
    if fn.endswith(".png") and fn not in keep: os.remove(os.path.join(OUT,fn))
need=[f for f in frames if not os.path.exists(os.path.join(OUT,f["png"]))]
for i in range(0,len(need),20):
    batch=need[i:i+20]; qs=urllib.parse.urlencode({"ids":",".join(f["node"] for f in batch),"format":"png","scale":"2"})
    r=urllib.request.Request(f"https://api.figma.com/v1/images/{KEY}?{qs}",headers={"X-Figma-Token":T})
    imgs=json.load(urllib.request.urlopen(r,timeout=300)).get("images") or {}
    for f in batch:
        u=imgs.get(f["node"]); assert u, f["slug"]
        open(os.path.join(OUT,f["png"]),"wb").write(urllib.request.urlopen(u,timeout=300).read())
for f in frames: f["bytes"]=os.path.getsize(os.path.join(OUT,f["png"]))
sections=[s for _,s in ROOTS]
# the desktop shell (Quiet Design Library 'Modal full-window'): geometry measured from the library file
SHELL={"file":"0j7Nna9zWmfOSNmRmQK1Uh","node":"5825:29938","png":"desktop/desktop-modal-full-window-shell.png","width":715,"height":929,
       "topBar":{"y":0,"h":36},"titleBar":{"y":36,"h":60},"titleZone":{"x":226,"y":44,"w":264,"h":44},"backZone":{"x":14,"y":52,"w":28,"h":28},"content":{"x":0,"y":96,"w":715,"h":833}}
json.dump({"file":KEY,"start":slug[ROOTS[0][0]],"sections":sections,"shell":SHELL,"frames":frames},open(os.path.join(OUT,"flow.json"),"w"),indent=1)
kinds=collections.Counter(l["kind"] for f in frames for l in f["links"]); per=collections.Counter(f["section"] for f in frames)
print(f"screens {len(frames)} {dict(per)} (exported {len(need)} new) · links {dict(kinds)} · {sum(f['bytes'] for f in frames)/1048576:.1f} MB")
print("slugs:", ", ".join(f["slug"] for f in frames))
