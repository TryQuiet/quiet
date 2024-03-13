---
sidebar_position: 1
title: Overview
---

# Overview of Quiet Documentation

Quiet uses [Docusaurus](https://docusaurus.io/) to organize and serve documentation.  Docusaurus can use Markdown or React on its pages and has an array of plugins, official and community built, that enable new and interesting behaviors.

## Running Docusaurus

Docusaurus comes with a set of `npm` commands for building/running the documentation site locally or in production.  Convenience methods are provided in the root `package.json` for running these commands.

### Running the Site Locally

```
npm run docs:start
```

This is the easiest method for testing/viewing logs locally as it doesn't require pre-compiling and will restart automatically on code changes.

### Building the Site

```
npm run docs:build
```

This command will build the documentation site for serving locally/in production.  This is only necessary if you are deploying the code or want to run the site in "production" form.

### Serving the Site

```
npm run docs:serve
```

This will serve the built version of the documentation site locally.

### Deploying the Site (DO NOT USE)

```
npm run docs:deploy
```

This will deploy the documentation site to github pages.


:::caution
Deploying the documentation site is not yet implemented so leave this alone for now!
:::

