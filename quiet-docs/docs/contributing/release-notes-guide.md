---
sidebar_position: 4
title: Release Notes
---

# Release Notes Process and Style Guide

## Overview

We want users to know what's new in Quiet with each release, and we want people interested in using Quiet to be able to follow our progress. This document describes a process for creating release notes that are readable and informative to a wide audience. 

## Model release notes

* [Mobile v2.1.1](https://github.com/TryQuiet/quiet/releases/tag/%40quiet%2Fmobile%402.1.1)
* [Mobile v2.0.1](https://github.com/TryQuiet/quiet/releases/tag/%40quiet%2Fmobile%402.0.1)

## Process/Checklist

Follow these steps to make sure the changelog is maximally readable and informative:

### Add

- [ ] All significant items since the last release, including items from the preceding alpha releases. 
- [ ] Any big high level features that are broken into small changelog entries (e.g. "user can join community without owner being online")
- [ ] Thank you's to external contributors (check items to see if they were contributed by somebody external, and add "Thanks @username!")

### Remove

- [ ] Changelog items that cannot be made understandable to the user.
- [ ] "Refactor" items unless they bring some user benefit like performance.
- [ ] Any items about tests because they're not always relevant to the user.
- [ ] Any items about dependency updates.
- [ ] Any items about minor dependency updates. We can still list major ones (like Electron, React Native, OrbitDB, IPFS, Tor, libp2p, etc.) under improvements.
- [ ] Any fixes that relate to previously-unreleased features, since from the user's point of view these are included in the new feature.

### Group and Rewrite

- [ ] Group new features, improvements, fixes, breaking changes, and notes
- [ ] Rewrite items as result-oriented complete sentences under "Fixes:" category like "peers now dial..." or "long messages are no longer truncated..." 
- [ ] Rewrite improvements as noun phrases. e.g. "Better descriptions of the joining process"
- [ ] Use standard capitalization and punctuation of sentences. 

## Changelog best practices

- [ ] fixes in the changelog should reference the issue they fix!
- [ ] Make all changelog items understandable to a technical user whenever possible, assuming no knowledge of Quiet internals. 
- [ ] When the fix refers to an issue, mention the problem the fix is solving in the changelog entry  (e.g. "network data proceeding when using custom protocol multiple times" should be "fixes unclear UI when joining a second community by changing how we handle custom URIs" or something like that) 
- [ ] Be consistent. Let’s use “fix:” “improvement”, “breaking change:” and not “fixed” or “fixes”.
- [ ] When possible, keep in mind the release notes style guide when writing changelog items; this will make assembling release notes easier. 
