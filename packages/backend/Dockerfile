FROM node:14

RUN apt-get update && apt-get upgrade -y
WORKDIR /usr/app

RUN npm install -g node-pre-gyp@0.10.0 typescript ts-node
# Overwritten on aws for entry node:
ENV HIDDEN_SERVICE_SECRET=ED25519-V3:gOK0SNEHSRCEd3ld9Z4RpegEN2/IN3a+lxyGvNO9vUaG6QQMgqbiu5kTV5YzLghOoDGffQx7bai0rjVlSs5mAw==
ENV HIDDEN_SERVICE_SECRET_REGISTRATION=ED25519-V3:cGYs+GzhgL/34o7nPr2MLvm+szUA5yV6CdXe8RFj0FBIqHUUKQxx/dJKopHjTZAsbgqc/WzMp7qAIVA1ZPVxBA==
ENV PEERID_FILE=entryNodePeerId.json
ENV DEBUG=waggle:*

COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .

CMD ["ts-node", "src/entryNode.ts"]
