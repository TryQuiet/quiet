#include <jni.h>


JNIEXPORT jint JNICALL Java_com_zbaymobile_BackendWorker_testJNIfunction(JNIEnv *pEnv, jobject thiz, jint a, jint b)
{
    return a + b;
}