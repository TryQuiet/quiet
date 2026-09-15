# Native crypto for the iOS backend

Node Mobile 18.20.4 on iOS runs V8 without JIT and exposes no WebAssembly.
The normal libsodium wrapper therefore uses interpreted JavaScript for its
elliptic-curve operations. Quiet's iOS backend already includes native OpenSSL;
this adapter uses that implementation without adding an addon or changing the
app's native frameworks.

The backend webpack rule wraps the resolved `libsodium-wrappers-sumo` module.
On `process.platform === 'ios'`, its `ready` promise completes after the adapter
has installed and passed its capability/interoperability checks. Other platforms
keep the original implementation. This targets the backend only; it does not
change React Native or WebView crypto.

Six operations are accelerated:

- Ed25519 seed keypair generation, detached signing and signature verification;
- X25519 public-key derivation;
- `crypto_box_easy` and `crypto_box_open_easy`: native X25519, then sodium's own
  HSalsa20 and XSalsa20-Poly1305 primitives, exactly as in sodium's box construction.

Keysets, signatures, ciphertexts and nonces retain their current formats. There
is no protocol version, key migration or QSS dependency. Every message signature
is still verified. This adapter does not cache keys or weaken LFA's keyset,
manifest, membership or authorization checks.

## Compatibility boundaries

Node imports Ed25519/X25519 raw keys through their standard RFC 8410 DER wrappers.
Sodium's 64-byte Ed25519 secret key also contains its public key; signing checks
that half against the derived public key. Inconsistent keys use the original
sodium operation, preserving its behavior instead of silently repairing the key.

OpenSSL alone is insufficient as a drop-in Ed25519 verifier: it can accept some
small-order encodings rejected by sodium. The adapter delegates small-order or
noncanonical public keys/signature points and noncanonical signature scalars to
sodium. Ordinary encodings use OpenSSL's verification equation. Public-encoding
checks follow [libsodium 1.0.19's verifier](https://github.com/jedisct1/libsodium/blob/1.0.19/src/libsodium/crypto_sign/ed25519/ref10/open.c)
and [small-order checks](https://github.com/jedisct1/libsodium/blob/1.0.19/src/libsodium/crypto_core/ed25519/ref10/ed25519_ref10.c).
They do not operate on secret scalars. X25519's low-order/zero shared-secret
rejection is retained and covered by the differential corpus.

The adapter activates only for the reviewed sodium core version **1.0.19**
(currently `libsodium-wrappers-sumo` 0.7.13). If the version or required native
capabilities differ, initialization keeps sodium intact and emits one warning.
A sodium upgrade must repeat the differential and physical-device checks before
extending that version condition. Runtime decrypt/verify failures propagate;
there is no success-on-error fallback. Exceptional Ed25519 inputs still undergo
sodium verification and retain sodium's rejection policy.

No input buffers are mutated or retained. Temporary DER secret-key buffers and
shared secrets are cleared after use; returned byte arrays are independent.
The original sodium output encodings are retained, including their errors. For
example, this Node Mobile build lacks ICU support needed by sodium's base64/text
conversion; the adapter does not introduce a separate codec. LFA uses binary
outputs and its existing base58 codec.

## Validation

After the normal repository bootstrap, run:

```sh
npm run test:native-crypto --prefix packages/backend
```

The command is included in backend `pretest` and `pretest-ci`. Tests cover:

- byte-identical keys, signatures and box ciphertext, bidirectional decryption;
- altered messages, ciphertext, nonce, key and inconsistent secret/public halves;
- input offsets, mutation/reuse, unsupported lengths/types/formats;
- 151 Ed25519 and 518 X25519 Wycheproof cases against LFA's resolved sodium;
- small-order and noncanonical Ed25519 inputs, including identity-point forgery;
- platform selection, atomic capability/version fallback and repeated installation;
- a real webpack build using the production loader, proving activation before
  consumers await `ready`, on iOS only.

The shared checks can also execute inside the physical iPhone's embedded Node.
Vector provenance and checksums are in [test-vectors/README.md](test-vectors/README.md).
The diagnostic report lives in `scripts/connection-regression/reports/`; the
runtime change does not depend on that profiling harness.
