#include <jni.h>
#include <cstdio>


extern "C" JNIEXPORT jint JNICALL Java_com_zbaymobile_BackendWorker_testJNIfunction(JNIEnv* env, jobject obj, jint a, jint b)
{
    printf("Hello CPP");
    return a + b;
}
