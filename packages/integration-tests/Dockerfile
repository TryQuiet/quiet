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
ENV DEBUG=backend:db*,state-manager:test*
CMD node /app/lib/bot/bot.js -r 727x3dlar4kq572e656flkxzaukxifmhladr4uc3zrjga7ax5z7t55yd -m 5 -u 1 -c general && aws s3 cp /root/data-*.json s3://quiet-performance-data
