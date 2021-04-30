FROM node:14

RUN apt update && apt install -y

WORKDIR /usr/app

RUN npm install -g node-pre-gyp@0.10.0 typescript ts-node
# Overwritten on aws for entry node:
ENV HIDDEN_SERVICE_SECRET=ED25519-V3:gOK0SNEHSRCEd3ld9Z4RpegEN2/IN3a+lxyGvNO9vUaG6QQMgqbiu5kTV5YzLghOoDGffQx7bai0rjVlSs5mAw==

COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
# CMD ["ts-node", "src/tracker/service.ts"]  // TODO: Uncomment to use the tracker
CMD ["ts-node", "src/entryNode.ts"]
