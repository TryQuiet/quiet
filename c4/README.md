# Quiet C4 Diagrams

Quiet architecture presented on C4 diagrams. Currently it uses 2 diagrams - Context and Container.

Made in Structurzir

Current views saved in `/current`

## Run locally

1. Make sure you have Docker installed
2. Run command in terminal: ```docker pull structurizr/lite```
3. Run docker container inside your Quiet directory and choosen porsts, example : ```docker run -it --rm -p 8080:8080 -v /__PATH_TO_REPOSITORY__/c4:/usr/local/structurizr structurizr/lite```
4. Open `http://localhost:8080/`

## Editing

Everything is in file `workspace.dsl`

After change, save file and reload page.

Highly recommend extenstions for VSC: C4 DSL Extension and Structurizr.

## Docs

https://c4model.com/

https://docs.structurizr.com/
