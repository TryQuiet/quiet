#!/usr/bin/env python3
"""Render the measured phone scaling curves from the sanitized result artifact."""
import argparse
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def plot(data, output):
    fig, axes = plt.subplots(1, 3, figsize=(12, 3.8), layout='constrained')
    message_rows = [r for r in data['runs']['ios-message-scale'] if r['phase'] == 'decryptAndVerify']
    axes[0].loglog([r['completed'] for r in message_rows], [r['ms'] / 1000 for r in message_rows], 'o-', color='#126782')
    axes[0].set(title='One pass through encrypted messages', xlabel='Messages (2-member team)', ylabel='Processing time (seconds)')
    axes[0].set_xticks([1, 10, 100, 1000], ['1', '10', '100', '1,000'])
    loads = [r for r in data['runs']['ios-user-scale'] if r['phase'] == 'load']
    axes[1].plot([r['users'] for r in loads], [r['ms'] / 1000 for r in loads], 'o-', color='#a33b20')
    axes[1].set(title='Load a valid membership graph', xlabel='Users', ylabel='Processing time (seconds)')
    sizes = [10, 25, 50, 100]
    scans = [data['cpuProfiles'][f'users-load-{n}-member']['inclusiveLfaMs']['establishedCommitments'] / 1000 for n in sizes]
    axes[2].plot(sizes, scans, 'o-', color='#735290')
    axes[2].set(title='Rebuild existing key commitments', xlabel='Users', ylabel='Sampled inclusive time (seconds)')
    for axis in axes:
        axis.grid(alpha=0.22)
        axis.spines[['top', 'right']].set_visible(False)
    fig.suptitle('Quiet 10 alpha · physical iPhone 16e / iOS 18.5 · local processing, no network in benchmark', fontsize=11)
    fig.savefig(output, dpi=180)
    plt.close(fig)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('data', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    plot(json.loads(args.data.read_text()), args.output)
