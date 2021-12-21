## Getting started
To get started working in monorepo, you need to remember about two things:

1. Install monorepo's dependencies 

```
npm install
```

2. Bootstrap project with lerna. It will take care of the package's dependencies and trigger prepublish script which builds them.

```
lerna bootstrap
```

After that you're free to go

----

## Versioning packages
Project uses independent versioning. To create a relese run:

```
lerna version <patch|minor|major>
```

## Handy tips
Lerna takes care of all the packages. You can execute scripts is every pakcage by simpy running:

```
lerna run <script> --stream
```

To limit script execution to specific package, add scope to the command

```
lerna run <script> --stream --scope <package-name>
```

Available package names are:
- @zbayapp/identity
- @zbayapp/nectar
- e2e-tests
- integration-tests
- waggle
- zbay
