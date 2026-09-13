# Reproduces figma/flow.json + figma/*.png from the Figma REST API. Needs FIGMA_TOKEN and the cached
# file JSONs (raw/<key>.json.gz); see design-system/ONBOARDING.md. Usage: python3 extract.py <cache-dir> <figma-dir>
"""Build design-system/figma/flow.json from the cached Figma file JSON of each prototype file in FILES.
Roots: several unwired clusters per file, each a section of the map. `exclude` keeps a screen (and everything
only it reaches) out of the walk; links into an excluded screen are dropped and listed under "excluded".
Link kinds: 'prototype' (designer-wired), 'added' (listed, for review), 'back' (drawn back/close, unwired; history)."""
import gzip,json,os,re,sys,collections,urllib.request,urllib.parse
F,OUT=sys.argv[1],sys.argv[2]; T=os.environ["FIGMA_TOKEN"]
FILES=[
 {"key":"f6Nr5b5wtvk6Xoh1HJZ8Dd","name":"Get started (prototype)",
  "roots":[("2811:2550","Onboarding"),("2922:10009","Server opt-in (creator)"),("3111:4339","Server agree (joiner, v1)")],
  "notes":{
   "3190:10892":"Designer's work in progress: this frame is create--default duplicated with only the heading changed to 'Paste a link to Join' and the input placeholder to 'Link'. Title bar, subtitle and the avatar upload are unchanged.",
   "2922:10009":"In the prototype this is reached after username → Community home → Community switcher, i.e. once the community exists. Both apps show the equivalent offer during community creation (ServerOffer) instead.",
   "3111:4339":"'v1 before we support multiple hosts' — joiner-side agree screen. Not linked from Open invite link or username in the prototype. The implementation shows JoiningOptIn + TermsOfService after username.",
   "3054:4052":"Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent — the captcha closes, the new community shows, then the captcha returns; less likely if you wait before clicking) and #3368 (offline: no loading or timeout message, and a 'joining' screen while creating).",
   "2924:13413":"Open issues on the implementation: #3428 'Reappearing captcha' (9.0.0 prod, Windows/Linux, intermittent) and #3368 (no loading/timeout message when hCAPTCHA cannot load; 'joining' shown while creating).",
   "2811:2370":"A canvas-level instance rather than a frame — what username-populated's Continue goes to. The prototype goes straight to the community after username; the implementation inserts ToS / captcha here when a server is involved.",
  },
  "display":{"3190:10892":"Paste a link to Join (frame 'Container', WIP)"},
  "exclude":{}},
 # The user's second prototype (2026-09-13): the join path after the invite link is pasted. Scope is the
 # username, Agree & join and joining-progress screens; everything else in the file is excluded below.
 {"key":"dSEZJr9crJjcV3ILogea9C","name":"Join from invite link + prototype",
  "roots":[("2811:2741","Join from invite link"),("2811:2770","Join from invite link")],
  "notes":{
   "2811:2741":"The joiner's username screen, drawn in its own prototype rather than in Get started. Unlike the create-side username frames it shows a titled bar ('Choose a username') with its divider, which is what the bar-title decision already carves out for the username screen.",
   "2811:2749":"Same frame with the name typed; its Continue is wired to Agree & join, so in this prototype the joiner agrees after choosing a username.",
   "2811:2724":"Joiner-side consent, naming the server (api.tryquiet.org) in the body rather than in a heading. The other file draws two more agree screens: 'Agree & join — server opt-in' (creator, 3054:4090) and 'Use Quiet's server? (v1)' (3111:4339).",
   "2894:3382":"The QSS joining progress: the community chrome is already drawn, with the globe, 'Joining now!' and the bar over it. No Tor explanation. The frame draws no status line under the bar; both apps render one there today (desktop JoiningPanelComponent, mobile ConnectionProcess) and it is kept by decision. Its own prototype link continues to Community home (2811:2769 in this file), which is out of this section's scope.",
   "2811:2770":"App start, not the join step: the Quiet logo, the bar, the status 'Starting Quiet' and the status message 'Connecting to Tor…'. Kept as the drawn evidence for the status line under the bar; the Tor copy is exactly what the QSS variant drops. Reached in the prototype from the Invite link page (2811:2781), which is out of scope.",
  },
  "display":{},
  "exclude":{
   "2811:2732":"Account recovery — out of scope (user, 2026-09-13).",
   "2811:2688":"Account recovery, key pasted — out of scope (user, 2026-09-13).",
   "2811:2704":"Account recovery, second state — out of scope (user, 2026-09-13).",
   "2811:2660":"Account recovery, third state — out of scope (user, 2026-09-13).",
   "2811:2757":"Join community three-way choice — the Get started file's own 'join-community' (2811:2562) is already a stage.",
   "2811:2769":"Community home — already a stage from the Get started file (2811:2370).",
   "2811:2781":"The web invite-link landing page (browser, not the app).",
   "2811:2821":"A screenshot of the invite link in a browser, not a Quiet screen.",
  }},
]
# (source file, source screen, element name, target file, target screen, note)
ADDED=[("f6Nr5b5wtvk6Xoh1HJZ8Dd","2811:2455","Button","f6Nr5b5wtvk6Xoh1HJZ8Dd","3190:10892","Not wired in the prototype; the 'Paste a link' button on Open invite link is the obvious origin of the drawn paste screen."),
       ("f6Nr5b5wtvk6Xoh1HJZ8Dd","3190:10892","Button","dSEZJr9crJjcV3ILogea9C","2811:2741","Not wired in either file: the paste screen's Continue (3190:10901) has no destination, and the Join-from-invite-link prototype starts at its own username screen (2811:2741). Added so the join path is walkable end to end.")]
def load(key):
    raw=json.load(gzip.open(f"{F}/raw/{key}.json.gz","rt")); nodes={}; parent={}
    def walk(n,p=None):
        nodes[n["id"]]=n; parent[n["id"]]=p
        for c in n.get("children") or []: walk(c,n["id"])
    for page in raw["document"]["children"]: walk(page,None)
    return nodes,parent
DOC={f["key"]:load(f["key"]) for f in FILES}; SPEC={f["key"]:f for f in FILES}; PRIMARY=FILES[0]["key"]
def is_screen(n,p):
    bb=n.get("absoluteBoundingBox") or {}
    return p.get("type") in ("CANVAS","SECTION") and (n.get("type")=="FRAME" or (n.get("type")=="INSTANCE" and bb.get("width",0)>=300 and bb.get("height",0)>=300))
_so={}
def screen_of(key,nid):
    if (key,nid) in _so: return _so[(key,nid)]
    nodes,parent=DOC[key]; cur=nid; best=None
    while cur and parent.get(cur):
        n=nodes[cur]; p=nodes[parent[cur]]
        if is_screen(n,p): best=cur
        cur=parent[cur]
    _so[(key,nid)]=best; return best
def visible(key,nid):
    nodes,parent=DOC[key]; cur=nid
    while cur:
        if nodes[cur].get("visible",True) is False: return False
        cur=parent.get(cur)
    return True
def rect(n,sb):
    b=n.get("absoluteBoundingBox") or {}
    return {"x":round(b.get("x",0)-sb["x"]),"y":round(b.get("y",0)-sb["y"]),"w":round(b.get("width",0)),"h":round(b.get("height",0))}
links=collections.defaultdict(list); wired=set()
for key,(nodes,parent) in DOC.items():
    for nid,n in nodes.items():
        tg=set([n["transitionNodeID"]] if n.get("transitionNodeID") else [])
        for i in n.get("interactions") or []:
            for a in i.get("actions") or []:
                if a.get("destinationId"): tg.add(a["destinationId"])
        if not tg: continue
        src=screen_of(key,nid)
        if not src: continue
        for t in tg:
            dst=screen_of(key,t) if t in nodes else None
            if dst and dst!=src:
                links[(key,src)].append({**rect(nodes[nid],nodes[src]["absoluteBoundingBox"]),"label":n.get("name",""),"dst":(key,dst),"kind":"prototype"}); wired.add((key,nid))
for skey,snode,elname,dkey,dnode,note in ADDED:
    nodes,_=DOC[skey]
    el=next((c for c in nodes if screen_of(skey,c)==snode and nodes[c].get("name")==elname and nodes[c].get("type")=="INSTANCE"),None)
    assert el, f"added-link element {elname} not found in {snode}"
    links[(skey,snode)].append({**rect(nodes[el],nodes[snode]["absoluteBoundingBox"]),"label":nodes[el]["name"],"dst":(dkey,dnode),"kind":"added","note":note}); wired.add((skey,el))
def is_backish(key,nid):
    nodes,parent=DOC[key]; n=nodes[nid]; nm=n.get("name",""); p=nodes.get(parent.get(nid) or "",{})
    return (nm in ("Close","hotspot-back") or (nm=="Glyph" and p.get("name")=="LeftZ")) and visible(key,nid)
seen=[]; section={}
for fs in FILES:
    key=fs["key"]
    for root,sec in fs["roots"]:
        if (key,root) not in seen: seen.append((key,root)); section[(key,root)]=sec
        q=[root]
        while q:
            s=q.pop(0)
            for l in links.get((key,s),[]):
                dk,dn=l["dst"]
                if dk!=key or dn in fs["exclude"]: continue          # cross-file and excluded targets are not walked
                if (key,dn) not in seen: seen.append((key,dn)); section[(key,dn)]=sec; q.append(dn)
for key,s in seen:
    nodes,parent=DOC[key]; sb=nodes[s]["absoluteBoundingBox"]
    for nid in [i for i in nodes if screen_of(key,i)==s and i!=s and is_backish(key,i)]:
        if (key,nid) in wired or ((key,parent.get(nid)) in wired) or any((key,c["id"]) in wired for c in (nodes[nid].get("children") or [])): continue
        links[(key,s)].append({**rect(nodes[nid],sb),"label":nodes[nid]["name"],"dst":None,"kind":"back"}); wired.add((key,nid))
def base(t):
    t=re.sub(r'(?<=[A-Za-z])(?=[0-9])|(?<=[0-9])(?=[A-Za-z])','-',t)
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',t.lower())).strip('-')
# Slugs (and so story ids) are unique across every file: a name already taken by an earlier file, or used twice
# inside one file, gets the node id appended.
taken=set(); slug={}; disp={}
for fs in FILES:
    key=fs["key"]; nodes,_=DOC[key]; mine=[s for k,s in seen if k==key]
    counts=collections.Counter(base(nodes[s]["name"]) for s in mine)
    for s in mine:
        b=base(nodes[s]["name"]); uniq=counts[b]==1 and b not in taken
        slug[(key,s)]=b if uniq else f"{b}-{s.replace(':','-')}"; taken.add(slug[(key,s)])
        disp[(key,s)]=fs["display"].get(s, nodes[s]["name"] if uniq else f"{nodes[s]['name']} ({s})")
def title_bar(n):
    stack=[n]
    while stack:
        x=stack.pop()
        if x.get("type")=="INSTANCE" and (x.get("name") or "").startswith("Title bar"):
            # The prototype hides the bar's title on full-screen (h1) stages: only the back/close glyph shows and the
            # heading is the title. Respect Figma's visible:false on the text and its ancestors (user, 2026-09-13).
            h=round((x.get("absoluteBoundingBox") or {}).get("height",0)); q=[(x, x.get("visible", True) is not False)]; text=None; shown=False
            while q:
                y,vis=q.pop()
                if y.get("type")=="TEXT" and y.get("name")=="Title" and (y.get("characters") or "").strip():
                    text=y["characters"].strip(); shown=vis; break
                q.extend((c, vis and c.get("visible", True) is not False) for c in (y.get("children") or []))
            if text=="Title": text=None
            return {"height":h,"text":text if shown else None,"hiddenTitle":(text if (text and not shown) else None)}
        stack.extend(x.get("children") or [])
    return None
frames=[]; dropped=[]
for key,s in seen:
    nodes,_=DOC[key]; fs=SPEC[key]; n=nodes[s]; bb=n["absoluteBoundingBox"]; fl=[]
    for l in links.get((key,s),[]):
        d={k:v for k,v in l.items() if k!="dst"}
        if l["dst"] is None: d["target"]=None
        elif l["dst"] in slug: d["target"]=slug[l["dst"]]
        else: dropped.append((slug[(key,s)],l["label"],l["dst"][1])); continue
        fl.append(d)
    f={"slug":slug[(key,s)],"name":n["name"],"display":disp[(key,s)],"node":s}
    if key!=PRIMARY: f["file"]=key; f["fileName"]=fs["name"]
    f.update({"section":section[(key,s)],"width":round(bb["width"]),"height":round(bb["height"]),
              "png":slug[(key,s)]+".png","url":f"https://www.figma.com/design/{key}?node-id={s.replace(':','-')}",
              "note":fs["notes"].get(s),"titleBar":title_bar(n),"links":fl})
    frames.append(f)
excluded=[{"file":fs["key"],"fileName":fs["name"],"section":fs["roots"][0][1],"node":nid,
           "name":DOC[fs["key"]][0][nid]["name"],"why":why}
          for fs in FILES for nid,why in fs["exclude"].items()]
keep={f["png"] for f in frames}
for fn in os.listdir(OUT):
    if fn.endswith(".png") and fn not in keep: os.remove(os.path.join(OUT,fn))
need=[(key,f) for (key,_),f in zip(seen,frames) if not os.path.exists(os.path.join(OUT,f["png"]))]
for key in {k for k,_ in need}:
    batch_all=[f for k,f in need if k==key]
    for i in range(0,len(batch_all),20):
        batch=batch_all[i:i+20]; qs=urllib.parse.urlencode({"ids":",".join(f["node"] for f in batch),"format":"png","scale":"2"})
        r=urllib.request.Request(f"https://api.figma.com/v1/images/{key}?{qs}",headers={"X-Figma-Token":T})
        imgs=json.load(urllib.request.urlopen(r,timeout=300)).get("images") or {}
        for f in batch:
            u=imgs.get(f["node"]); assert u, f["slug"]
            open(os.path.join(OUT,f["png"]),"wb").write(urllib.request.urlopen(u,timeout=300).read())
for f in frames: f["bytes"]=os.path.getsize(os.path.join(OUT,f["png"]))
sections=[]
for fs in FILES:
    for _,sec in fs["roots"]:
        if sec not in sections: sections.append(sec)
# the desktop shell (Quiet Design Library 'Modal full-window'): geometry measured from the library file
SHELL={"file":"0j7Nna9zWmfOSNmRmQK1Uh","node":"5825:29938","png":"desktop/desktop-modal-full-window-shell.png","width":715,"height":929,
       "topBar":{"y":0,"h":36},"titleBar":{"y":36,"h":60},"titleZone":{"x":226,"y":44,"w":264,"h":44},"backZone":{"x":14,"y":52,"w":28,"h":28},"content":{"x":0,"y":96,"w":715,"h":833}}
json.dump({"file":PRIMARY,"start":slug[(PRIMARY,FILES[0]["roots"][0][0])],"sections":sections,
           "files":[{"key":fs["key"],"name":fs["name"]} for fs in FILES],"excluded":excluded,
           "shell":SHELL,"frames":frames},open(os.path.join(OUT,"flow.json"),"w"),indent=1)
kinds=collections.Counter(l["kind"] for f in frames for l in f["links"]); per=collections.Counter(f["section"] for f in frames)
print(f"screens {len(frames)} {dict(per)} (exported {len(need)} new) · links {dict(kinds)} · {sum(f['bytes'] for f in frames)/1048576:.1f} MB")
for s,label,dst in dropped: print(f"  link dropped (excluded target): {s} → {dst} ({label})")
print("slugs:", ", ".join(f["slug"] for f in frames))
