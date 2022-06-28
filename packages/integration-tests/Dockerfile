FROM node:16.14.2
ARG zipbundle
RUN node -v
RUN mkdir /app
ADD ${zipbundle} /tmp
WORKDIR /app
RUN unzip /tmp/${zipbundle} && rm /tmp/${zipbundle}

COPY 3rd-party /3rd-party
ENV DEBUG=backend*,nectar*,state-manager:test*
CMD node /app/lib/bot/bot.js -r 727x3dlar4kq572e656flkxzaukxifmhladr4uc3zrjga7ax5z7t55yd -m 10 -u 1
# ENTRYPOINT ["tail", "-f", "/dev/null"] # debug