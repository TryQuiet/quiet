# Wycheproof interoperability vectors

Copied without changes from [C2SP/Wycheproof](https://github.com/C2SP/wycheproof/tree/3fa63dd0344abb611f1fb1d77e119938603ea230/testvectors_v1), commit `3fa63dd0344abb611f1fb1d77e119938603ea230`. Distributed under Apache-2.0; see LICENSE.

- ed25519.json: `752d2ea7d7c6cf4736381b6cbacb61f8182b126ab7cd9b058f00c50084975536`
- x25519.json: `35c3f5231cf25cc640b524d403461deee9e49441d5d915a3a25b2c8ff5adbe7d`

Tests compare the adapter against the exact libsodium version resolved by LFA. Wycheproof's valid/invalid classifications are also checked where libsodium has a strict classification; acceptable curve encodings preserve libsodium's policy. These vectors are public test keys, never application data.
