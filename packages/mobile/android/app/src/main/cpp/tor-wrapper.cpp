#include <jni.h>

#include "org_torproject_jni_TorService.h"

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_mainConfigurationSetupControlSocket(
        JNIEnv *env,
        jobject thisObj)
{
    Java_org_torproject_jni_TorService_mainConfigurationSetupControlSocket(env, thisObj);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_runMain(
        JNIEnv *env,
        jobject thisObj)
{
    Java_org_torproject_jni_TorService_runMain(env, thisObj);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_createTorConfiguration(
        JNIEnv *env,
        jobject thisObj)
{
    Java_org_torproject_jni_TorService_createTorConfiguration(env, thisObj);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_prepareFileDescriptor(
        JNIEnv *env,
        jclass thisClass,
        jstring stringArgv)
{
    Java_org_torproject_jni_TorService_prepareFileDescriptor(env, thisClass, stringArgv);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_mainConfigurationSetCommandLine(
        JNIEnv *env,
        jobject thisObj,
        jobjectArray arrArgv)
{
    Java_org_torproject_jni_TorService_mainConfigurationSetCommandLine(env, thisObj, arrArgv);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_TorHandler_mainConfigurationFree(
        JNIEnv *env,
        jobject thisObj)
{
    Java_org_torproject_jni_TorService_mainConfigurationFree(env, thisObj);
}
