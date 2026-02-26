# https://hub.docker.com/layers/library/node/20.20.0/images/sha256-053db972c542da7788a8cd36aded7e42a8e9ae55e23b18c26c5878b8dcf99972
FROM node:20.20.0@sha256:65b74d0fb42134c49530a8c34e9f3e4a2fb8e1f99ac4a0eb4e6f314b426183a2

RUN apt-get update && apt-get install -y android-sdk openjdk-17-jdk wget zip
RUN ls /usr/lib/jvm/
ENV JAVA_HOME /usr/lib/jvm/java-17-openjdk-amd64/

ENV ANDROID_HOME=/usr/lib/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/platform-tools

RUN chown 1000 ${ANDROID_HOME} ; chmod g+w ${ANDROID_HOME}

# Install SDK command line tools
WORKDIR ${ANDROID_HOME}
RUN yes | wget -c https://dl.google.com/android/repository/commandlinetools-linux-8092744_latest.zip
RUN unzip commandlinetools-linux-8092744_latest.zip
RUN mv cmdline-tools latest
RUN mkdir cmdline-tools
RUN mv latest cmdline-tools

ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin

# Accept SDK licenses
WORKDIR ${ANDROID_HOME}/cmdline-tools/latest/bin
RUN yes | ./sdkmanager --licenses

RUN ./sdkmanager --install "platforms;android-35" "platforms;android-34" "platforms;android-33" "platforms;android-26" "build-tools;35.0.0" "build-tools;34.0.0" "build-tools;33.0.1" "cmake;3.22.1" "platform-tools"

# Install Android NDK
WORKDIR ${ANDROID_HOME}
RUN yes | wget -c https://dl.google.com/android/repository/android-ndk-r28c-linux.zip
RUN unzip android-ndk-r28c-linux.zip

ENV ANDROID_NDK_HOME=/usr/lib/android-sdk/android-ndk-r28c
ENV PATH=${PATH}:${ANDROID_NDK_HOME}

RUN mkdir /home/node/.gradle
RUN chown -R 1000:1000 /home/node/.gradle
RUN echo NDK_PATH=/usr/lib/android-sdk/android-ndk-r28c >> /home/node/.gradle/gradle.properties

WORKDIR /app/packages/mobile
