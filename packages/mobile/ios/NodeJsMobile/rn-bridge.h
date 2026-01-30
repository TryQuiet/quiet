#ifndef SRC_RN_BRIDGE_H_
#define SRC_RN_BRIDGE_H_

#define ARGC_CHANNEL_NAME_MSG 2

/**
 * Some helper macros from node/test/addons-napi/common.h
 */

#define NM_F_LINKED 0x2
// Empty value so that macros here are able to return NULL or void
#define NAPI_RETVAL_NOTHING  // Intentionally blank #define

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

typedef void (*rn_bridge_cb)(const char* channelName, const char* message);
void rn_register_bridge_cb(rn_bridge_cb);
void rn_bridge_notify(const char* channelName, const char *message);
void rn_register_node_data_dir_path(const char* path);

/*
we can no longer call NAPI_MODULE_X(rn_bridge, Init, NULL, NM_F_LINKED), the last
two params are dropped when the macro expands in 18.20.4, meaning the crucial NM_F_LINKED
gets ignored and nodejs can't bind "registerChannel" in Quiet JavaScript to
Method_RegisterChannel defined here.

By unrolling macros in node_api.h we can register a working napi_module struct
with NM_F_LINKED and pass that into napi_module_register.

In Node 18.20.4 napi_module_register in fact converts this older NAPI_MODULE API
to the newer NODE_MODULE_API so long as we pass in a pointer to a valid napi_module struct.

// Registers a NAPI module.
void NAPI_CDECL napi_module_register(napi_module* mod) {
  node::node_module* nm =
      new node::node_module(node::napi_module_to_node_module(mod));
  node::node_module_register(nm);
}
*/

#define NAPI_C_CTOR(fn)                                                        \
  static void fn(void);                                                        \
  namespace {                                                                  \
      struct fn##_ {                                                           \
        fn##_() { fn(); }                                                      \
      } fn##_v_;                                                               \
  }                                                                            \
  static void fn(void)



#endif
