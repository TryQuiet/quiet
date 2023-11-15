# Title: 
Handle possibility of multiple replication events in certificate requests at the same time

## Status: 
accepted

## Context: 
Kinga discovered a bug where when the owner is offline and several (3) users with the same name have joined, sometimes the owner can register two users with the same name

## Decision: 
Introducing a locking mechanism to prevent the next event from being processed if the previous one is still being processed

## Consequences: 
We added queue concept and events will be processed individually in chronological order

## Code location: 
backend -> storage.service.ts

## Date: 
07-11-2023