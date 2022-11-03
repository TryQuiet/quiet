FROM node:16.14.2
ARG zipbundle

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

RUN mkdir /app
ADD ${zipbundle} /tmp
WORKDIR /app
RUN unzip /tmp/${zipbundle} && rm /tmp/${zipbundle}

COPY 3rd-party /3rd-party
ENV DEBUG=backend*
CMD node /app/lib/torManager/torRegistrarTest.js -p 4 -m regular && node /app/lib/torManager/torRegistrarTest.js -p 4 -m newnym

