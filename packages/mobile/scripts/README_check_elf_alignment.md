# Check 16KB ELF Alignment 

- https://developer.android.com/guide/practices/page-sizes

First make an APK of Quiet, this can easily be done in Android Studio by going to 

Build -> Generate App Bundles or APKs -> Build APKs


Then run the script wiht the APK 

```bash

# see alignment of all 16KBs
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


