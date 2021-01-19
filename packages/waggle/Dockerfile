FROM node:14

RUN apt update && apt install -y

WORKDIR /usr/app

COPY . .

RUN npm install -g node-pre-gyp@0.10.0 typescript ts-node
ENV HIDDEN_SERVICE_SECRET=PT0gZWQyNTUxOXYxLXNlY3JldDogdHlwZTAgPT0AAADQZeSBmBABj5X+4zo98d+zOfFEygXVYajYaTzthFtLa4muclClSkstifM4SQsaJlFkJN//FZsBfMSLTDPubgCP
RUN npm install

CMD ["ts-node", "src/test.ts"]
