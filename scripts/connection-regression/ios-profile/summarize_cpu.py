#!/usr/bin/env python3
"""Summarize V8 samples without copying source, paths, or application arguments."""
import argparse
from collections import Counter
import json
from pathlib import Path


def summarize(profile):
    nodes = {node['id']: node for node in profile['nodes']}
    parents = {child: node['id'] for node in profile['nodes'] for child in node.get('children', [])}
    buckets = Counter()
    ancestors = Counter()
    for sample, delta in zip(profile['samples'], profile['timeDeltas']):
        frame = nodes[sample]['callFrame']
        name, url = frame['functionName'], frame['url']
        if name == '(idle)':
            bucket = 'idle'
        elif 'libsodium-sumo' in url:
            bucket = 'libsodium'
        elif name == '(garbage collector)':
            bucket = 'gc'
        else:
            bucket = 'other'
        buckets[bucket] += delta
        seen = set()
        while sample in nodes:
            frame = nodes[sample]['callFrame']
            if any(part in frame['url'] for part in ['3rd-party/auth/packages/auth/', '3rd-party/auth/packages/crdx/']):
                seen.add(frame['functionName'] or '(anonymous LFA function)')
            sample = parents.get(sample)
        for ancestor in seen:
            ancestors[ancestor] += delta
    return {
        'sampledMs': sum(buckets.values()) / 1000,
        'selfMsByCategory': {key: value / 1000 for key, value in buckets.items()},
        'inclusiveLfaMs': {key: value / 1000 for key, value in ancestors.most_common(25)},
        'note': 'Inclusive ancestor times overlap; do not add them together.',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('profile', type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(json.loads(args.profile.read_text())), indent=2))
