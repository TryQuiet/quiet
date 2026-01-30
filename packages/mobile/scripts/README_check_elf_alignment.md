# Check 16KB ELF Alignment 

- https://developer.android.com/guide/practices/page-sizes

To test Quiet on Android's native dependencies for 16KB Aligned Page Size you can use the `build_apk_and_test_alignment.sh` script. This script uses google's ELF Alignment script, 
which seemingly does not pick up on native nodejs modules in Quiet's APK (ie classic-level, 
basically any .node bianry which has C/C++ code and is compiled for arm64 android...)


```bash
npm run bootstrap # make sure everythings up to date...
cd quiet/packages/mobile/scripts
./build_apk_and_test_alignment.sh
```

# you can use Google's script directly like so:
```bash
# see alignment of all native binaries in the APK 
./check_elf_alignment.sh ~/quiet/packages/mobile/android/app/build/outputs/apk/standard/debug/app-standard.APK

# see ones that aren't 16KB Aligned, and therefore need to be updated
./check_elf_alignment.sh ~/Desktop/quiet/packages/mobile/android/app/build/outputs/apk/standard/debug/app-standard-debug.apk | grep UNALIGNED
```

You get this kind of output. `ALIGNED` is a pass, and `UNALIGNED` libraries need to be rebuilt in such a way that they're 16KB aligned

```
=== ELF alignment ===
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libnode.so: \e[31mUNALIGNED\e[0m (2**12)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libgifimage.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libjsi.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libnative-filters.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libfbjni.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/librnscreens.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libown-native-lib.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libnative-imagetranscoder.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libtor.so: \e[31mUNALIGNED\e[0m (2**12)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libjsc.so: \e[31mUNALIGNED\e[0m (2**12)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libimagepipeline.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libc++_shared.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libsodium.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libjnidispatch.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libreactnative.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libjsctooling.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libglide-webp.so: \e[32mALIGNED\e[0m (2**14)
/var/folders/51/8996x1_x5bj3khs7h33_s6y40000gn/T/app-standard-debug_out_XXXXX.uN2vYOqhbu/lib/arm64-v8a/libavif_android.so: \e[32mALIGNED\e[0m (2**14)
\e[31mFound 3 unaligned libs (only arm64-v8a/x86_64 libs need to be aligned).\e[0m
```

