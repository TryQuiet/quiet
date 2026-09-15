#!/usr/bin/env python3
"""Enable diagnostic control of existing app objects after isolated profiling."""
import argparse, hashlib, json
from pathlib import Path

def prepare(source):
    old = "Object.defineProperty(Class.prototype, key, {...descriptor, value: wrap(name + '.' + key, descriptor.value)})"
    assert source.count(old) == 1
    assert "liveInstances" not in source
    source = source.replace("const classes = {}", "const classes = {}\nconst liveInstances = new Map()")
    source = source.replace(old, """const wrapped = wrap(name + '.' + key, descriptor.value)
    Object.defineProperty(Class.prototype, key, {...descriptor, value: function (...args) {
      if (!liveInstances.has(name)) liveInstances.set(name, new Set())
      liveInstances.get(name).add(this)
      return wrapped.apply(this, args)
    }})""")
    source = source.replace("cpuStart, cpuStop, classes,", "cpuStart, cpuStop, classes, liveInstances,")
    return source

if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__); p.add_argument("output", type=Path)
    args = p.parse_args(); source = Path(__file__).with_name("runtime.cjs").read_text()
    result = prepare(source); args.output.write_text(result)
    print(json.dumps({"sha256": hashlib.sha256(result.encode()).hexdigest(), "purpose": "Diagnostic-only live object capture; use after offline profiling, restore original helper/application after smoke"}))
