/* Copyright (c) 2019, Matthew Finkel.
  * Copyright (c) 2019, Hans-Christoph Steiner.
  * Copyright (c) 2007-2019, The Tor Project, Inc. */
 /* See LICENSE for licensing information */

 #ifndef ORG_TORPROJECT_JNI_TORSERVICE_H
 #define ORG_TORPROJECT_JNI_TORSERVICE_H

 #include <jni.h>

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    createTorConfiguration
  * Signature: ()Z
  */
extern "C" JNIEXPORT jboolean JNICALL
 Java_org_torproject_jni_TorService_createTorConfiguration
 (JNIEnv *, jobject);

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    mainConfigurationSetCommandLine
  * Signature: ([Ljava/lang/String;)Z
  */
extern "C" JNIEXPORT jboolean JNICALL
 Java_org_torproject_jni_TorService_mainConfigurationSetCommandLine
 (JNIEnv *, jobject, jobjectArray);

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    mainConfigurationSetupControlSocket
  * Signature: ()Z
  */
extern "C" JNIEXPORT jboolean JNICALL
 Java_org_torproject_jni_TorService_mainConfigurationSetupControlSocket
 (JNIEnv *, jobject);

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    mainConfigurationFree
  * Signature: ()V
  */
extern "C" JNIEXPORT void JNICALL
 Java_org_torproject_jni_TorService_mainConfigurationFree
 (JNIEnv *, jobject);

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    apiGetProviderVersion
  * Signature: ()Ljava/lang/String;
  */
extern "C" JNIEXPORT jstring JNICALL
 Java_org_torproject_jni_TorService_apiGetProviderVersion
 (JNIEnv *, jobject);

 /*
  * Class:     org_torproject_jni_TorService
  * Method:    runMain
  * Signature: ()I
  */
extern "C" JNIEXPORT jint JNICALL
 Java_org_torproject_jni_TorService_runMain
 (JNIEnv *, jobject);

/*
 * Class:     org_torproject_jni_TorService
 * Method:    prepareFileDescriptor
 */
extern "C" JNIEXPORT jobject JNICALL
Java_org_torproject_jni_TorService_prepareFileDescriptor
        (JNIEnv *env, jclass, jstring);

 #endif /* !defined(ORG_TORPROJECT_JNI_TORSERVICE_H) */
 