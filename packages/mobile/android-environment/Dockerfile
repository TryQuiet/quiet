FROM node:14-buster

RUN apt-get update && apt-get install -y android-sdk openjdk-11-jdk wget zip

ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk-amd64/

ENV ANDROID_SDK_ROOT=/usr/lib/android-sdk
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/platform-tools

RUN chown 1000 ${ANDROID_SDK_ROOT} ; chmod g+w ${ANDROID_SDK_ROOT}

# Install SDK command line tools
WORKDIR ${ANDROID_SDK_ROOT}
RUN yes | wget -c https://dl.google.com/android/repository/commandlinetools-linux-8092744_latest.zip
RUN unzip commandlinetools-linux-8092744_latest.zip
RUN mv cmdline-tools latest
RUN mkdir cmdline-tools
RUN mv latest cmdline-tools

ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin

# Accept SDK licenses
WORKDIR ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin
RUN yes | ./sdkmanager --licenses

RUN ./sdkmanager --install "platforms;android-33" "platforms;android-26" "build-tools;33.0.0" "build-tools;30.0.3" "cmake;3.18.1" "platform-tools"

# Install Android NDK
WORKDIR ${ANDROID_SDK_ROOT}
RUN yes | wget -c https://dl.google.com/android/repository/android-ndk-r21e-linux-x86_64.zip
RUN unzip android-ndk-r21e-linux-x86_64.zip

ENV ANDROID_NDK_HOME=/usr/lib/android-sdk/android-ndk-r21e
ENV PATH=${PATH}:${ANDROID_NDK_HOME}

RUN mkdir /home/node/.gradle
RUN chown -R 1000:1000 /home/node/.gradle
RUN echo NDK_PATH=/usr/lib/android-sdk/android-ndk-r21e >> /home/node/.gradle/gradle.properties

WORKDIR /app/packages/mobile
