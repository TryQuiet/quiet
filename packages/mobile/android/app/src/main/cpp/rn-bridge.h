#ifndef SRC_RN_BRIDGE_H_
#define SRC_RN_BRIDGE_H_

typedef void (*rn_bridge_cb)(const char* channelName, const char* message);
void rn_register_bridge_cb(rn_bridge_cb);
void rn_bridge_notify(const char* channelName, const char *message);
void rn_register_node_data_dir_path(const char* path);

#define NAPI_C_CTOR(fn)                                                        \
  static void fn(void);                                                        \
  namespace {                                                                  \
      struct fn##_ {                                                           \
        fn##_() { fn(); }                                                      \
      } fn##_v_;                                                               \
  }                                                                            \
  static void fn(void)

#define NM_F_LINKED 0x2

#endif
