FROM node:26.12.1@sha256:a98e6fda54fdbb22d4238054cca9a2a113bcd1191c09193a535aae22f400aa8e
ARG zipbundle
ENV PEERS_NUMBER 20
ENV TOR_TEST_MODE regular
ENV TOR_BIN_NAME tor
ENV VANGUARDS_ENABLED auto
ENV NUM_ENTRY_GUARDS 0

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

RUN mkdir /app
ADD ${zipbundle} /tmp
WORKDIR /app
RUN unzip /tmp/${zipbundle} && rm /tmp/${zipbundle}

COPY 3rd-party /3rd-party
ENV DEBUG=backend*
CMD timeout 4h node /app/backend-bundle/bundle.cjs -p ${PEERS_NUMBER} -m ${TOR_TEST_MODE} -t ${TOR_BIN_NAME} -v ${VANGUARDS_ENABLED} -g ${NUM_ENTRY_GUARDS} && aws s3 cp /app/tor_*.json s3://tor-connection-data