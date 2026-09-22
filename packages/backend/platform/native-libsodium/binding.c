// A synchronous Node-API bridge. Crypto and verification policy belong to libsodium.
#include <node_api.h>
#include <sodium.h>
#include <stdint.h>

#define CHECK(call) do { if ((call) != napi_ok) { \
  napi_throw_error(env, NULL, "Node-API failure"); return NULL; } } while (0)

typedef struct { unsigned char *data; size_t size; } bytes;

static int input(napi_env env, napi_value value, size_t expected, bytes *out) {
  bool typed = false, ordinary = false, detached = false;
  napi_typedarray_type type;
  napi_value buffer;
  size_t offset;
  if (napi_is_typedarray(env, value, &typed) != napi_ok || !typed ||
      napi_get_typedarray_info(env, value, &type, &out->size,
                              (void **) &out->data, &buffer, &offset) != napi_ok ||
      type != napi_uint8_array ||
      napi_is_arraybuffer(env, buffer, &ordinary) != napi_ok || !ordinary ||
      napi_is_detached_arraybuffer(env, buffer, &detached) != napi_ok || detached ||
      (expected != SIZE_MAX && out->size != expected)) {
    napi_throw_type_error(env, NULL, "Expected an attached Uint8Array of the required length");
    return 0;
  }
  return 1;
}

static napi_value output(napi_env env, size_t size, unsigned char **data) {
  napi_value buffer, array;
  CHECK(napi_create_arraybuffer(env, size, (void **) data, &buffer));
  CHECK(napi_create_typedarray(env, napi_uint8_array, size, buffer, 0, &array));
  return array;
}

static int arguments(napi_env env, napi_callback_info info, size_t count, napi_value *args) {
  size_t actual = count;
  if (napi_get_cb_info(env, info, &actual, args, NULL, NULL) != napi_ok || actual != count) {
    napi_throw_type_error(env, NULL, "Missing crypto arguments");
    return 0;
  }
  return 1;
}

static napi_value seed_keypair(napi_env env, napi_callback_info info) {
  napi_value args[1], pk_value, sk_value, result;
  bytes seed;
  unsigned char *pk, *sk;
  if (!arguments(env, info, 1, args) || !input(env, args[0], crypto_sign_SEEDBYTES, &seed)) return NULL;
  pk_value = output(env, crypto_sign_PUBLICKEYBYTES, &pk);
  if (!pk_value) return NULL;
  sk_value = output(env, crypto_sign_SECRETKEYBYTES, &sk);
  if (!sk_value) return NULL;
  if (crypto_sign_seed_keypair(pk, sk, seed.data) != 0) {
    sodium_memzero(sk, crypto_sign_SECRETKEYBYTES);
    napi_throw_error(env, NULL, "Key generation failed"); return NULL;
  }
  CHECK(napi_create_object(env, &result));
  CHECK(napi_set_named_property(env, result, "publicKey", pk_value));
  CHECK(napi_set_named_property(env, result, "privateKey", sk_value));
  return result;
}

static napi_value scalarmult_base(napi_env env, napi_callback_info info) {
  napi_value args[1], result;
  bytes sk;
  unsigned char *pk;
  if (!arguments(env, info, 1, args) || !input(env, args[0], crypto_scalarmult_SCALARBYTES, &sk)) return NULL;
  result = output(env, crypto_scalarmult_BYTES, &pk);
  if (!result) return NULL;
  if (crypto_scalarmult_base(pk, sk.data) != 0) {
    napi_throw_error(env, NULL, "Scalar multiplication failed"); return NULL;
  }
  return result;
}

static napi_value sign_detached(napi_env env, napi_callback_info info) {
  napi_value args[2], result;
  bytes message, sk;
  unsigned char *signature;
  if (!arguments(env, info, 2, args) || !input(env, args[0], SIZE_MAX, &message) ||
      !input(env, args[1], crypto_sign_SECRETKEYBYTES, &sk)) return NULL;
  result = output(env, crypto_sign_BYTES, &signature);
  if (!result) return NULL;
  if (crypto_sign_detached(signature, NULL, message.data, message.size, sk.data) != 0) {
    napi_throw_error(env, NULL, "Signing failed"); return NULL;
  }
  return result;
}

static napi_value verify_detached(napi_env env, napi_callback_info info) {
  napi_value args[3], result;
  bytes signature, message, pk;
  if (!arguments(env, info, 3, args) || !input(env, args[0], crypto_sign_BYTES, &signature) ||
      !input(env, args[1], SIZE_MAX, &message) || !input(env, args[2], crypto_sign_PUBLICKEYBYTES, &pk)) return NULL;
  CHECK(napi_get_boolean(env, crypto_sign_verify_detached(signature.data, message.data,
                          message.size, pk.data) == 0, &result));
  return result;
}

static napi_value box(napi_env env, napi_callback_info info, int decrypt) {
  napi_value args[4], result;
  bytes message, nonce, pk, sk;
  unsigned char *out;
  if (!arguments(env, info, 4, args) || !input(env, args[0], SIZE_MAX, &message) ||
      !input(env, args[1], crypto_box_NONCEBYTES, &nonce) ||
      !input(env, args[2], crypto_box_PUBLICKEYBYTES, &pk) ||
      !input(env, args[3], crypto_box_SECRETKEYBYTES, &sk)) return NULL;
  if ((decrypt && message.size < crypto_box_MACBYTES) ||
      (!decrypt && message.size > SIZE_MAX - crypto_box_MACBYTES)) {
    napi_throw_type_error(env, NULL, "Invalid box length"); return NULL;
  }
  size_t size = decrypt ? message.size - crypto_box_MACBYTES : message.size + crypto_box_MACBYTES;
  result = output(env, size, &out);
  if (!result) return NULL;
  int status = decrypt ? crypto_box_open_easy(out, message.data, message.size, nonce.data, pk.data, sk.data)
                       : crypto_box_easy(out, message.data, message.size, nonce.data, pk.data, sk.data);
  if (status != 0) {
    sodium_memzero(out, size);
    napi_throw_error(env, NULL, "Box operation failed"); return NULL;
  }
  return result;
}
static napi_value box_easy(napi_env env, napi_callback_info info) { return box(env, info, 0); }
static napi_value box_open_easy(napi_env env, napi_callback_info info) { return box(env, info, 1); }

NAPI_MODULE_INIT() {
  if (sodium_init() < 0) { napi_throw_error(env, NULL, "sodium_init failed"); return NULL; }
  const napi_property_descriptor functions[] = {
    {"crypto_sign_seed_keypair", NULL, seed_keypair, NULL, NULL, NULL, napi_default, NULL},
    {"crypto_scalarmult_base", NULL, scalarmult_base, NULL, NULL, NULL, napi_default, NULL},
    {"crypto_sign_detached", NULL, sign_detached, NULL, NULL, NULL, napi_default, NULL},
    {"crypto_sign_verify_detached", NULL, verify_detached, NULL, NULL, NULL, napi_default, NULL},
    {"crypto_box_easy", NULL, box_easy, NULL, NULL, NULL, napi_default, NULL},
    {"crypto_box_open_easy", NULL, box_open_easy, NULL, NULL, NULL, napi_default, NULL},
  };
  CHECK(napi_define_properties(env, exports, sizeof functions / sizeof functions[0], functions));
  napi_value version;
  CHECK(napi_create_string_utf8(env, sodium_version_string(), NAPI_AUTO_LENGTH, &version));
  CHECK(napi_set_named_property(env, exports, "version", version));
  return exports;
}
