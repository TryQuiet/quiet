FROM node:14

RUN apt update && apt install -y

WORKDIR /usr/app

COPY . .

RUN npm install -g node-pre-gyp@0.10.0 typescript ts-node

RUN npm install

CMD ["ts-node", "src/socket/test.ts"]
