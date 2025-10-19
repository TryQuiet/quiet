#include <android/log.h>
#include <cstdlib>
#include <jni.h>
#include <pthread.h>
#include <string>
#include <unistd.h>

#include "node.h"
#include "rn-bridge.h"

// cache the environment variable for the thread running node to call into java
JNIEnv *cacheEnvPointer = nullptr;

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_BackendWorker_sendMessageToNodeChannel(
    JNIEnv *env, jobject /* this */, jstring channelName, jstring message) {
  const char *nativeChannelName = env->GetStringUTFChars(channelName, nullptr);
  const char *nativeMessage = env->GetStringUTFChars(message, nullptr);
  rn_bridge_notify(nativeChannelName, nativeMessage);
  env->ReleaseStringUTFChars(channelName, nativeChannelName);
  env->ReleaseStringUTFChars(message, nativeMessage);
}

extern "C" int callIntoNode(int argc, char *argv[]) {
  const int exit_code = node::Start(argc, argv);
  return exit_code;
}

#if defined(__arm__)
#define CURRENT_ABI_NAME "armeabi-v7a"
#elif defined(__aarch64__)
#define CURRENT_ABI_NAME "arm64-v8a"
#elif defined(__i386__)
#define CURRENT_ABI_NAME "x86"
#elif defined(__x86_64__)
#define CURRENT_ABI_NAME "x86_64"
#else
#error "Trying to compile for an unknown ABI."
#endif

extern "C" JNIEXPORT jstring JNICALL
Java_com_quietmobile_Backend_NodeProjectManager_getCurrentABIName(
    JNIEnv *env, jobject /* this */) {
  return env->NewStringUTF(CURRENT_ABI_NAME);
}

extern "C" JNIEXPORT void JNICALL
Java_com_quietmobile_Backend_BackendWorker_registerNodeDataDirPath(
    JNIEnv *env, jobject /* this */, jstring dataDir) {
  const char *nativeDataDir = env->GetStringUTFChars(dataDir, nullptr);
  env->ReleaseStringUTFChars(dataDir, nativeDataDir);
}

void rcv_message(const char *channel_name, const char *msg) {
  JNIEnv *env = cacheEnvPointer;
  if (!env)
    return;
  jclass cls2 = env->FindClass("com/quietmobile/Backend/BackendWorker");
  if (cls2 != nullptr) {
    jmethodID m_sendMessage = env->GetStaticMethodID(
        cls2, "handleNodeMessages", "(Ljava/lang/String;Ljava/lang/String;)V");
    if (m_sendMessage != nullptr) {
      jstring java_channel_name = env->NewStringUTF(channel_name);
      jstring java_msg = env->NewStringUTF(msg);
      env->CallStaticVoidMethod(cls2, m_sendMessage, java_channel_name,
                                java_msg);
      env->DeleteLocalRef(java_channel_name);
      env->DeleteLocalRef(java_msg);
    }
  }
  env->DeleteLocalRef(cls2);
}

// Start threads to redirect stdout and stderr to logcat.
int pipe_stdout[2];
int pipe_stderr[2];
pthread_t thread_stdout;
pthread_t thread_stderr;
const char *ADBTAG = "NODEJS-MOBILE";

void *thread_stderr_func(void *) {
  ssize_t redirect_size;
  char buf[2048];
  while ((redirect_size = read(pipe_stderr[0], buf, sizeof buf - 1)) > 0) {
    //__android_log will add a new line anyway.
    if (buf[redirect_size - 1] == '\n')
      --redirect_size;
    buf[redirect_size] = 0;
    __android_log_write(ANDROID_LOG_ERROR, ADBTAG, buf);
  }
  return nullptr;
}

void *thread_stdout_func(void *) {
  ssize_t redirect_size;
  char buf[2048];
  while ((redirect_size = read(pipe_stdout[0], buf, sizeof buf - 1)) > 0) {
    //__android_log will add a new line anyway.
    if (buf[redirect_size - 1] == '\n')
      --redirect_size;
    buf[redirect_size] = 0;
    __android_log_write(ANDROID_LOG_INFO, ADBTAG, buf);
  }
  return nullptr;
}

int start_redirecting_stdout_stderr() {
  // set stdout as unbuffered.
  setvbuf(stdout, nullptr, _IONBF, 0);
  pipe(pipe_stdout);
  dup2(pipe_stdout[1], STDOUT_FILENO);

  // set stderr as unbuffered.
  setvbuf(stderr, nullptr, _IONBF, 0);
  pipe(pipe_stderr);
  dup2(pipe_stderr[1], STDERR_FILENO);

  int stdout_thread_create = pthread_create(&thread_stdout, nullptr, thread_stdout_func, nullptr);
  if (stdout_thread_create != 0) // may return EAGAIN, EPERM or EINVAL on error
    return stdout_thread_create;

  pthread_detach(thread_stdout);

  int stderr_thread_create = pthread_create(&thread_stderr, nullptr, thread_stderr_func, nullptr);

  if (stderr_thread_create != 0)
    return stderr_thread_create;

  pthread_detach(thread_stderr);

  return 0;
}

// node's libUV requires all arguments being on contiguous memory.
extern "C" jobject JNICALL
Java_com_quietmobile_Backend_BackendWorker_startNodeWithArguments(
    JNIEnv *env, jobject /* this */, jobjectArray arguments,
    jstring modulesPath, jstring dataPath, jobjectArray envVars) {
  // Set the builtin_modules path to NODE_PATH.
  const char *path_path = env->GetStringUTFChars(modulesPath, nullptr);
  const char *logs = "/logs";
  jstring logs_js = env->NewStringUTF(logs);
  jclass cls_StringBuilder = env->FindClass("java/lang/StringBuilder");
  jmethodID ctr_StringBuilder =
      env->GetMethodID(cls_StringBuilder, "<init>", "(I)V");
  jobject stringBuilder =
      env->NewObject(cls_StringBuilder, ctr_StringBuilder, 100);
  jmethodID mid_StringBuilder_append =
      env->GetMethodID(cls_StringBuilder, "append",
                       "(Ljava/lang/String;)Ljava/lang/StringBuilder;");
  for (auto str : {dataPath, logs_js}) {
    env->CallObjectMethod(stringBuilder, mid_StringBuilder_append, str);
  }
  jmethodID mid_StringBuilder_toString =
      env->GetMethodID(cls_StringBuilder, "toString", "()Ljava/lang/String;");
  auto js_log_path =
      (jstring)env->CallObjectMethod(stringBuilder, mid_StringBuilder_toString);
  const char *log_path = env->GetStringUTFChars(js_log_path, nullptr);

  setenv("NODE_PATH", path_path, 1);
  setenv("DEBUG",
         "backend*,quiet*,state-manager*,desktop*,utils*,identity*,common*,"
         "libp2p*,helia*,blockstore*",
         1);
  setenv("COLORIZE", "false", 1);
  setenv("LOG_TO_FILE", "true", 1);
  setenv("LOG_DIR", log_path, 1);

  // Set custom environment variables from envVars array
  if (envVars != nullptr) {
    jsize env_count = env->GetArrayLength(envVars);
    for (int i = 0; i < env_count; i++) {
      const char *env_entry = env->GetStringUTFChars(
          (jstring)env->GetObjectArrayElement(envVars, i), nullptr);
      // env_entry is in the form KEY=VALUE
      const char *eq_pos = strchr(env_entry, '=');
      if (eq_pos) {
        size_t key_len = eq_pos - env_entry;
        char key[128] = {0};
        strncpy(key, env_entry, key_len);
        const char *value = eq_pos + 1;
        setenv(key, value, 1);
      }
      env->ReleaseStringUTFChars(
          (jstring)env->GetObjectArrayElement(envVars, i), env_entry);
    }
  }

  // argc
  jsize argument_count = env->GetArrayLength(arguments);

  // Compute byte size need for all arguments in contiguous memory.
  size_t c_arguments_size = 0;
  for (int i = 0; i < argument_count; i++) {
    c_arguments_size += strlen(env->GetStringUTFChars(
        (jstring)env->GetObjectArrayElement(arguments, i), nullptr));
    c_arguments_size++; // for '\0'
  }

  // Stores arguments in contiguous memory.
  char *args_buffer = (char *) calloc(c_arguments_size, sizeof(char));
  // argv to pass into node.
  char *argv[argument_count];

  // To iterate through the expected start position of each argument in
  // args_buffer.
  char *current_args_position = args_buffer;

  // Populate the args_buffer and argv.
  for (int i = 0; i < argument_count; i++) {
    const char *current_argument = env->GetStringUTFChars(
        (jstring)env->GetObjectArrayElement(arguments, i), 0);

    // Copy current argument to its expected position in args_buffer
    strncpy(current_args_position, current_argument, strlen(current_argument));

    // Save current argument start position in argv
    argv[i] = current_args_position;

    // Increment to the next argument's expected position.
    current_args_position += strlen(current_args_position) + 1;
  }

  free(args_buffer);

  rn_register_bridge_cb(&rcv_message);

  cacheEnvPointer = env;

  // Start threads to show stdout and stderr in logcat.
  if (start_redirecting_stdout_stderr() == -1) {
    __android_log_write(
        ANDROID_LOG_ERROR, ADBTAG,
        "Couldn't start redirecting stdout and stderr to logcat.");
  }

  // Start node, with argc and argv.
  callIntoNode(argument_count, argv);

  return nullptr;
}
