FROM node:16.14.2@sha256:6e54786b2ad01667d46524e82806298714f50d2be72b39706770aed55faedbd7
ARG zipbundle

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

RUN mkdir /app
ADD ${zipbundle} /tmp
WORKDIR /app
RUN unzip /tmp/${zipbundle} && rm /tmp/${zipbundle}

COPY 3rd-party /3rd-party
ENV DEBUG=backend:db*,backend:tor*,state-manager:test*
CMD node /app/lib/bot/bot.js -r lkd3mbp7uxe6zja3257upbb2ddz5prehyhp7es3fi2la4u5u2wqdexqd -s 1 -std 600000 -c test0 -u 0 && aws s3 cp /root/data-*.json s3://quiet-performance-data
