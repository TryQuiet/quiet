/**
 * The code in this file is from
 * https://github.com/nodejs-mobile/nodejs-mobile-react-native/blob/c27c483698e2eb0dcaf87028bc4963a321b4d4f8/android/src/main/cpp/rn-bridge.h
 * and is licensed under
 * external-licenses/nodejs-mobile-react-native.license.txt.
 */

#ifndef SRC_RN_BRIDGE_H_
#define SRC_RN_BRIDGE_H_

typedef void (*rn_bridge_cb)(const char* channelName, const char* message);
void rn_register_bridge_cb(rn_bridge_cb);
void rn_bridge_notify(const char* channelName, const char *message);
void rn_register_node_data_dir_path(const char* path);

#endif
