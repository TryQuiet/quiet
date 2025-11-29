#ifndef SRC_RN_BRIDGE_H_
#define SRC_RN_BRIDGE_H_

#include <map>
#include <mutex>
#include <queue>
#include <string>
#include <cstring>
#include <cstdlib>
#include <utility>
#include "node_api.h"
#include "uv.h"

class Channel;
typedef void (*rn_bridge_cb)(const char* channelName, const char* message);
void rn_register_bridge_cb(rn_bridge_cb);
void rn_bridge_notify(const char* channelName, const char *message);
void FlushMessageQueue(uv_async_t* handle);

// UNUSED on Android, used in iOS rn-bridge though...
// void rn_register_node_data_dir_path(const char* path);

// NAPI macros and constants we need to hook into nodejs mobile:
#define NM_F_LINKED 0x2

#define DECLARE_NAPI_METHOD(name, func)                          \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

#define GET_AND_THROW_LAST_ERROR(env)                                    \
  do {                                                                   \
    const napi_extended_error_info *error_info;                          \
    napi_get_last_error_info((env), &error_info);                        \
    bool is_pending;                                                     \
    napi_is_exception_pending((env), &is_pending);                       \
    /* If an exception is already pending, don't rethrow it */           \
    if (!is_pending) {                                                   \
      const char* error_message = error_info->error_message != NULL ?    \
        error_info->error_message :                                      \
        "empty error message";                                           \
      napi_throw_error((env), NULL, error_message);                      \
    }                                                                    \
  } while (0)

#define NAPI_ASSERT_BASE(env, assertion, message, ret_val)               \
  do {                                                                   \
    if (!(assertion)) {                                                  \
      napi_throw_error(                                                  \
          (env),                                                         \
        NULL,                                                            \
          "assertion (" #assertion ") failed: " message);                \
      return ret_val;                                                    \
    }                                                                    \
  } while (0)

// Returns NULL on failed assertion.
// This is meant to be used inside napi_callback methods.
#define NAPI_ASSERT(env, assertion, message)                             \
  NAPI_ASSERT_BASE(env, assertion, message, NULL)


#define NAPI_CALL_BASE(env, the_call, ret_val)                           \
  do {                                                                   \
    if ((the_call) != napi_ok) {                                         \
      GET_AND_THROW_LAST_ERROR((env));                                   \
      return ret_val;                                                    \
    }                                                                    \
  } while (0)

// Returns NULL if the_call doesn't return napi_ok.
#define NAPI_CALL(env, the_call)                                         \
  NAPI_CALL_BASE(env, the_call, NULL)


#define NAPI_C_CTOR(fn)                                                        \
  static void fn(void);                                                        \
  namespace {                                                                  \
      struct fn##_ {                                                           \
        fn##_() { fn(); }                                                      \
      } fn##_v_;                                                               \
  }                                                                            \
  static void fn(void)

#endif
