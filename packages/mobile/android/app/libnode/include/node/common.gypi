{
  'variables': {
    'configuring_node%': 0,
    'asan%': 0,
    'werror': '',                     # Turn off -Werror in V8 build.
    'visibility%': 'hidden',          # V8's visibility setting
    'target_arch%': 'ia32',           # set v8's target architecture
    'host_arch%': 'ia32',             # set v8's host architecture
    'want_separate_host_toolset%': 0, # V8 should not build target and host
    'library%': 'static_library',     # allow override to 'shared_library' for DLL/.so builds
    'component%': 'static_library',   # NB. these names match with what V8 expects
    'msvs_multi_core_compile': '0',   # we do enable multicore compiles, but not using the V8 way
    'enable_pgo_generate%': '0',
    'enable_pgo_use%': '0',
    'python%': 'python',

    'node_shared%': 'false',
    'force_dynamic_crt%': 0,
    'node_use_v8_platform%': 'true',
    'node_use_bundled_v8%': 'true',
    'node_module_version%': '',
    'node_with_ltcg%': '',
    'node_shared_openssl%': 'false',

    'node_tag%': '',
    'uv_library%': 'static_library',

    'clang%': 0,

    'openssl_fips%': '',

    # Don't use ICU data file (icudtl.dat) from V8, we use our own.
    'icu_use_data_file_flag%': 0,

    # Reset this number to 0 on major V8 upgrades.
    # Increment by one for each non-official patch applied to deps/v8.
    'v8_embedder_string': '-node.44',

    ##### V8 defaults for Node.js #####

    # Old time default, now explicitly stated.
    'v8_use_snapshot': 1,

    # Turn on SipHash for hash seed generation, addresses HashWick
    'v8_use_siphash': 'true',

    # These are more relevant for V8 internal development.
    # Refs: https://github.com/nodejs/node/issues/23122
    # Refs: https://github.com/nodejs/node/issues/23167
    # Enable compiler warnings when using V8_DEPRECATED apis from V8 code.
    'v8_deprecation_warnings': 0,
    # Enable compiler warnings when using V8_DEPRECATE_SOON apis from V8 code.
    'v8_imminent_deprecation_warnings': 0,

    # Enable disassembler for `--print-code` v8 options
    'v8_enable_disassembler': 1,

    # Sets -dOBJECT_PRINT.
    'v8_enable_object_print%': 1,

    # https://github.com/nodejs/node/pull/22920/files#r222779926
    'v8_enable_handle_zapping': 0,

    # Disable V8 untrusted code mitigations.
    # See https://github.com/v8/v8/wiki/Untrusted-code-mitigations
    'v8_untrusted_code_mitigations': 0,

    # This is more of a V8 dev setting
    # https://github.com/nodejs/node/pull/22920/files#r222779926
    'v8_enable_fast_mksnapshot': 0,

    'v8_win64_unwinding_info': 1,

    # TODO(refack): make v8-perfetto happen
    'v8_use_perfetto': 0,

    ##### end V8 defaults #####

    'conditions': [
      ['target_arch=="arm64"', {
        # Disabled pending https://github.com/nodejs/node/issues/23913.
        'openssl_no_asm%': 1,
      }, {
        'openssl_no_asm%': 0,
      }],
      ['OS == "win"', {
        'os_posix': 0,
        'v8_postmortem_support%': 0,
      }, {
        'os_posix': 1,
        'v8_postmortem_support%': 1,
      }],
      ['v8_use_snapshot==1', {
        'conditions': [
          ['GENERATOR == "ninja"', {
            'obj_dir': '<(PRODUCT_DIR)/obj',
            'v8_base': '<(PRODUCT_DIR)/obj/tools/v8_gypfiles/libv8_snapshot.a',
           }, {
            'obj_dir%': '<(PRODUCT_DIR)/obj.target',
            'v8_base': '<(PRODUCT_DIR)/obj.target/tools/v8_gypfiles/libv8_snapshot.a',
          }],
          ['OS == "win"', {
            'obj_dir': '<(PRODUCT_DIR)/obj',
            'v8_base': '<(PRODUCT_DIR)/lib/libv8_snapshot.a',
          }],
          ['OS == "mac" or OS == "ios"', {
            'obj_dir%': '<(PRODUCT_DIR)/obj.target',
            'v8_base': '<(PRODUCT_DIR)/libv8_snapshot.a',
          }],
        ],
      }, {
        'conditions': [
          ['GENERATOR == "ninja"', {
            'obj_dir': '<(PRODUCT_DIR)/obj',
            'v8_base': '<(PRODUCT_DIR)/obj/tools/v8_gypfiles/libv8_nosnapshot.a',
           }, {
            'obj_dir%': '<(PRODUCT_DIR)/obj.target',
            'v8_base': '<(PRODUCT_DIR)/obj.target/tools/v8_gypfiles/libv8_nosnapshot.a',
          }],
          ['OS == "win"', {
            'obj_dir': '<(PRODUCT_DIR)/obj',
            'v8_base': '<(PRODUCT_DIR)/lib/libv8_nosnapshot.a',
          }],
          ['OS == "mac" or OS == "ios"', {
            'obj_dir%': '<(PRODUCT_DIR)/obj.target',
            'v8_base': '<(PRODUCT_DIR)/libv8_nosnapshot.a',
          }],
        ],
      }],
      ['openssl_fips != ""', {
        'openssl_product': '<(STATIC_LIB_PREFIX)crypto<(STATIC_LIB_SUFFIX)',
      }, {
        'openssl_product': '<(STATIC_LIB_PREFIX)openssl<(STATIC_LIB_SUFFIX)',
      }],
      ['OS=="mac" or OS == "ios"', {
        'clang%': 1,
      }],
      ['target_arch in "ppc64 s390x"', {
        'v8_enable_backtrace': 1,
      }],
    ],
  },

  'target_defaults': {
    'default_configuration': 'Release',
    'configurations': {
      'Debug': {
        'variables': {
          'v8_enable_handle_zapping': 1,
          'conditions': [
            ['node_shared != "true"', {
              'MSVC_runtimeType': 1,    # MultiThreadedDebug (/MTd)
            }, {
              'MSVC_runtimeType': 3,    # MultiThreadedDebugDLL (/MDd)
            }],
          ],
        },
        'defines': [ 'DEBUG', '_DEBUG', 'V8_ENABLE_CHECKS' ],
        'cflags': [ '-g', '-O0' ],
        'conditions': [
          ['OS=="aix"', {
            'cflags': [ '-gxcoff' ],
            'ldflags': [ '-Wl,-bbigtoc' ],
          }],
          ['OS == "android"', {
            'cflags': [ '-fPIC' ],
            'ldflags': [ '-fPIC' ]
          }],
        ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'BasicRuntimeChecks': 3,        # /RTC1
            'MinimalRebuild': 'false',
            'OmitFramePointers': 'false',
            'Optimization': 0,              # /Od, no optimization
            'RuntimeLibrary': '<(MSVC_runtimeType)',
          },
          'VCLinkerTool': {
            'LinkIncremental': 2, # enable incremental linking
          },
        },
        'xcode_settings': {
          'GCC_OPTIMIZATION_LEVEL': '0', # stop gyp from defaulting to -Os
        },
      },
      'Release': {
        'variables': {
          'v8_enable_handle_zapping': 0,
          'pgo_generate': ' -fprofile-generate ',
          'pgo_use': ' -fprofile-use -fprofile-correction ',
          'lto': ' -flto=4 -fuse-linker-plugin -ffat-lto-objects ',
          'conditions': [
            ['node_shared != "true"', {
              'MSVC_runtimeType': 0    # MultiThreaded (/MT)
            }, {
              'MSVC_runtimeType': 2   # MultiThreadedDLL (/MD)
            }],
          ],
        },
        'cflags': [ '-O3' ],
        'conditions': [
          ['OS=="solaris"', {
            # pull in V8's postmortem metadata
            'ldflags': [ '-Wl,-z,allextract' ]
          }],
          ['OS!="mac" and OS!="ios" and OS!="win"', {
            'cflags': [ '-fno-omit-frame-pointer' ],
          }],
          ['OS=="linux"', {
            'conditions': [
              ['enable_pgo_generate=="true"', {
                'cflags': ['<(pgo_generate)'],
                'ldflags': ['<(pgo_generate)'],
              },],
              ['enable_pgo_use=="true"', {
                'cflags': ['<(pgo_use)'],
                'ldflags': ['<(pgo_use)'],
              },],
              ['enable_lto=="true"', {
                'cflags': ['<(lto)'],
                'ldflags': ['<(lto)'],
              },],
            ],
          },],
          ['OS == "android"', {
            'cflags': [ '-fPIC' ],
            'ldflags': [ '-fPIC' ]
          }],
        ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'EnableFunctionLevelLinking': 'true',
            'EnableIntrinsicFunctions': 'true',
            'FavorSizeOrSpeed': 1,          # /Ot, favor speed over size
            'InlineFunctionExpansion': 2,   # /Ob2, inline anything eligible
            'OmitFramePointers': 'true',
            'Optimization': 3,              # /Ox, full optimization
            'RuntimeLibrary': '<(MSVC_runtimeType)',
            'RuntimeTypeInfo': 'false',
          }
        },
        'xcode_settings': {
          'GCC_OPTIMIZATION_LEVEL': '3', # stop gyp from defaulting to -Os
        },
      }
    },

    # Defines these mostly for node-gyp to pickup, and warn addon authors of
    # imminent V8 deprecations, also to sync how dependencies are configured.
    'defines': [
      'V8_DEPRECATION_WARNINGS',
      'V8_IMMINENT_DEPRECATION_WARNINGS',
    ],

    # Forcibly disable -Werror.  We support a wide range of compilers, it's
    # simply not feasible to squelch all warnings, never mind that the
    # libraries in deps/ are not under our control.
    'cflags!': ['-Werror'],
    'msvs_settings': {
      'VCCLCompilerTool': {
        'BufferSecurityCheck': 'true',
        'DebugInformationFormat': 1,          # /Z7 embed info in .obj files
        'ExceptionHandling': 0,               # /EHsc
        'MultiProcessorCompilation': 'true',
        'StringPooling': 'true',              # pool string literals
        'SuppressStartupBanner': 'true',
        'WarnAsError': 'false',
        'WarningLevel': 3,                    # /W3
      },
      'VCLinkerTool': {
        'target_conditions': [
          ['_type=="executable"', {
            'SubSystem': 1,                   # /SUBSYSTEM:CONSOLE
          }],
        ],
        'conditions': [
          ['target_arch=="ia32"', {
            'TargetMachine' : 1,              # /MACHINE:X86
          }],
          ['target_arch=="x64"', {
            'TargetMachine' : 17,             # /MACHINE:X64
          }],
          ['target_arch=="arm64"', {
            'TargetMachine' : 0,              # NotSet. MACHINE:ARM64 is inferred from the input files.
          }],
        ],
        'GenerateDebugInformation': 'true',
        'SuppressStartupBanner': 'true',
      },
    },
    # Disable warnings:
    # - "C4251: class needs to have dll-interface"
    # - "C4275: non-DLL-interface used as base for DLL-interface"
    #   Over 10k of these warnings are generated when compiling node,
    #   originating from v8.h. Most of them are false positives.
    #   See also: https://github.com/nodejs/node/pull/15570
    #   TODO: re-enable when Visual Studio fixes these upstream.
    #
    # - "C4267: conversion from 'size_t' to 'int'"
    #   Many any originate from our dependencies, and their sheer number
    #   drowns out other, more legitimate warnings.
    # - "C4244: conversion from 'type1' to 'type2', possible loss of data"
    #   Ususaly safe. Disable for `dep`, enable for `src`
    'msvs_disabled_warnings': [4351, 4355, 4800, 4251, 4275, 4244, 4267],
    'msvs_cygwin_shell': 0, # prevent actions from trying to use cygwin

    'conditions': [
      [ 'configuring_node', {
        'msvs_configuration_attributes': {
          'OutputDirectory': '<(DEPTH)/out/$(Configuration)/',
          'IntermediateDirectory': '$(OutDir)obj/$(ProjectName)/'
        },
      }],
      [ 'target_arch=="x64"', {
        'msvs_configuration_platform': 'x64',
      }],
      [ 'target_arch=="arm64"', {
        'msvs_configuration_platform': 'arm64',
      }],
      ['asan == 1 and OS != "mac" and OS !="ios"', {
        'cflags+': [
          '-fno-omit-frame-pointer',
          '-fsanitize=address',
          '-fsanitize-address-use-after-scope',
        ],
        'defines': [ 'LEAK_SANITIZER', 'V8_USE_ADDRESS_SANITIZER' ],
        'cflags!': [ '-fomit-frame-pointer' ],
        'ldflags': [ '-fsanitize=address' ],
      }],
      ['asan == 1 and (OS == "mac" or OS=="ios")', {
        'xcode_settings': {
          'OTHER_CFLAGS+': [
            '-fno-omit-frame-pointer',
            '-gline-tables-only',
            '-fsanitize=address',
            '-DLEAK_SANITIZER'
          ],
          'OTHER_CFLAGS!': [
            '-fomit-frame-pointer',
          ],
        },
        'target_conditions': [
          ['_type!="static_library"', {
            'xcode_settings': {'OTHER_LDFLAGS': ['-fsanitize=address']},
          }],
        ],
      }],
      ['OS == "win"', {
        'defines': [
          'WIN32',
          # we don't really want VC++ warning us about
          # how dangerous C functions are...
          '_CRT_SECURE_NO_DEPRECATE',
          # ... or that C implementations shouldn't use
          # POSIX names
          '_CRT_NONSTDC_NO_DEPRECATE',
          # Make sure the STL doesn't try to use exceptions
          '_HAS_EXCEPTIONS=0',
          'BUILDING_V8_SHARED=1',
          'BUILDING_UV_SHARED=1',
        ],
      }],
      [ 'OS in "linux freebsd openbsd solaris aix"', {
        'cflags': [ '-pthread' ],
        'ldflags': [ '-pthread' ],
      }],
      [ 'OS in "linux freebsd openbsd solaris android aix cloudabi"', {
        'cflags': [ '-Wall', '-Wextra', '-Wno-unused-parameter', ],
        'cflags_cc': [ '-fno-rtti', '-fno-exceptions', '-std=gnu++1y' ],
        'defines': [ '__STDC_FORMAT_MACROS' ],
        'ldflags': [ '-rdynamic' ],
        'target_conditions': [
          # The 1990s toolchain on SmartOS can't handle thin archives.
          ['_type=="static_library" and OS=="solaris"', {
            'standalone_static_library': 1,
          }],
          ['OS=="openbsd"', {
            'cflags': [ '-I/usr/local/include' ],
            'ldflags': [ '-Wl,-z,wxneeded' ],
          }],
        ],
        'conditions': [
          [ 'target_arch=="ia32"', {
            'cflags': [ '-m32' ],
            'ldflags': [ '-m32' ],
          }],
          [ 'target_arch=="x32"', {
            'cflags': [ '-mx32' ],
            'ldflags': [ '-mx32' ],
          }],
          [ 'target_arch=="x64"', {
            'cflags': [ '-m64' ],
            'ldflags': [ '-m64' ],
          }],
          [ 'target_arch=="ppc" and OS!="aix"', {
            'cflags': [ '-m32' ],
            'ldflags': [ '-m32' ],
          }],
          [ 'target_arch=="ppc64" and OS!="aix"', {
            'cflags': [ '-m64', '-mminimal-toc' ],
            'ldflags': [ '-m64' ],
          }],
          [ 'target_arch=="s390x"', {
            'cflags': [ '-m64', '-march=z196' ],
            'ldflags': [ '-m64', '-march=z196' ],
          }],
          [ 'OS=="solaris"', {
            'cflags': [ '-pthreads' ],
            'ldflags': [ '-pthreads' ],
            'cflags!': [ '-pthread' ],
            'ldflags!': [ '-pthread' ],
          }],
          [ 'node_shared=="true"', {
            'cflags': [ '-fPIC' ],
          }],
        ],
      }],
      [ 'OS=="aix"', {
        'variables': {
          # Used to differentiate `AIX` and `OS400`(IBM i).
          'aix_variant_name': '<!(uname -s)',
        },
        'cflags': [ '-maix64', ],
        'ldflags!': [ '-rdynamic', ],
        'ldflags': [
          '-Wl,-bbigtoc',
          '-maix64',
        ],
        'conditions': [
          [ '"<(aix_variant_name)"=="OS400"', {            # a.k.a. `IBM i`
            'ldflags': [
              '-Wl,-blibpath:/QOpenSys/pkgs/lib:/QOpenSys/usr/lib',
              '-Wl,-brtl',
            ],
          }, {                                             # else it's `AIX`
            # Disable the following compiler warning:
            #
            #   warning: visibility attribute not supported in this
            #   configuration; ignored [-Wattributes]
            #
            # This is gcc complaining about __attribute((visibility("default"))
            # in static library builds. Legitimate but harmless and it drowns
            # out more relevant warnings.
            'cflags': [ '-Wno-attributes' ],
            'ldflags': [
              '-Wl,-blibpath:/usr/lib:/lib:/opt/freeware/lib/pthread/ppc64',
            ],
          }],
        ],
      }],
      ['OS=="android"', {
        'target_conditions': [
          ['_toolset=="target"', {
            'defines': [ '_GLIBCXX_USE_C99_MATH' ],
            'libraries': [ '-llog' ],
          }],
          ['_type=="loadable_module"', {
            'conditions': [
              # While loading a native node module, Android needs to have a
              # (NEEDED) entry for libnode.so, or it won't be able to locate
              # referenced symbols.
              # We link to the binary libraries that are distributed with the
              # nodejs-mobile headers so the (NEEDED) entry is created
              [ 'target_arch=="arm"', {
                'libraries': ['>(node_root_dir)/bin/armeabi-v7a/libnode.so'],
              }],
              [ 'target_arch=="arm64"', {
                'libraries': ['>(node_root_dir)/bin/arm64-v8a/libnode.so'],
              }],
              [ 'target_arch=="x86"', {
                'libraries': ['>(node_root_dir)/bin/x86/libnode.so'],
              }],
              [ 'target_arch=="x86_64"', {
                'libraries': ['>(node_root_dir)/bin/x86_64/libnode.so'],
              }],
            ],
          }],
        ],
      }],
      ['OS=="mac"', {
        'defines': ['_DARWIN_USE_64_BIT_INODE=1'],
        'xcode_settings': {
          'ALWAYS_SEARCH_USER_PATHS': 'NO',
          'GCC_CW_ASM_SYNTAX': 'NO',                # No -fasm-blocks
          'GCC_DYNAMIC_NO_PIC': 'NO',               # No -mdynamic-no-pic
                                                    # (Equivalent to -fPIC)
          'GCC_ENABLE_CPP_EXCEPTIONS': 'NO',        # -fno-exceptions
          'GCC_ENABLE_CPP_RTTI': 'NO',              # -fno-rtti
          'GCC_ENABLE_PASCAL_STRINGS': 'NO',        # No -mpascal-strings
          'PREBINDING': 'NO',                       # No -Wl,-prebind
          'MACOSX_DEPLOYMENT_TARGET': '10.10',      # -mmacosx-version-min=10.10
          'USE_HEADERMAP': 'NO',
          'OTHER_CFLAGS': [
            '-fno-strict-aliasing',
          ],
          'WARNING_CFLAGS': [
            '-Wall',
            '-Wendif-labels',
            '-W',
            '-Wno-unused-parameter',
          ],
        },
        'target_conditions': [
          ['_type!="static_library"', {
            'xcode_settings': {
              'OTHER_LDFLAGS': [
                '-Wl,-no_pie',
                '-Wl,-search_paths_first',
              ],
            },
          }],
        ],
        'conditions': [
          ['target_arch=="ia32"', {
            'xcode_settings': {'ARCHS': ['i386']},
          }],
          ['target_arch=="x64"', {
            'xcode_settings': {'ARCHS': ['x86_64']},
          }],
          ['target_arch=="arm64"', {
            'xcode_settings': {
              'ARCHS': ['arm64'],
              'OTHER_LDFLAGS!': [
                '-Wl,-no_pie',
              ],
            },
          }],
          ['clang==1', {
            'xcode_settings': {
              'GCC_VERSION': 'com.apple.compilers.llvm.clang.1_0',
              'CLANG_CXX_LANGUAGE_STANDARD': 'gnu++1y',  # -std=gnu++1y
              'CLANG_CXX_LIBRARY': 'libc++',
            },
          }],
        ],
      }],
      ['OS=="ios"', {
        'defines': ['_DARWIN_USE_64_BIT_INODE=1'],
        'xcode_settings': {
          'ALWAYS_SEARCH_USER_PATHS': 'NO',
          'GCC_CW_ASM_SYNTAX': 'NO',                # No -fasm-blocks
          'GCC_DYNAMIC_NO_PIC': 'NO',               # No -mdynamic-no-pic
                                                    # (Equivalent to -fPIC)
          'GCC_ENABLE_CPP_EXCEPTIONS': 'NO',        # -fno-exceptions
          'GCC_ENABLE_CPP_RTTI': 'NO',              # -fno-rtti
          'GCC_ENABLE_PASCAL_STRINGS': 'NO',        # No -mpascal-strings
          'PREBINDING': 'NO',                       # No -Wl,-prebind
          'IPHONEOS_DEPLOYMENT_TARGET': '9.0',      # -miphoneos-version-min=9.0
          'USE_HEADERMAP': 'NO',
          'OTHER_CFLAGS': [
            '-fno-strict-aliasing',
          ],
          'WARNING_CFLAGS': [
            '-Wall',
            '-Wendif-labels',
            '-W',
            '-Wno-unused-parameter',
          ],
        },
        'target_conditions': [
          ['_type!="static_library"', {
            'xcode_settings': {
              'OTHER_LDFLAGS': [
                '-Wl,-no_pie',
                '-Wl,-search_paths_first',
              ],
            },
          }],
        ],
        'conditions': [
          ['target_arch=="ia32"', {
            'xcode_settings': {'ARCHS': ['i386']},
          }],
          ['target_arch=="x64"', {
            'xcode_settings': {'ARCHS': ['x86_64']},
          }],
          [ 'target_arch in "arm64 arm armv7s"', {
            'xcode_settings': {
              'OTHER_CFLAGS': [
                '-fembed-bitcode'
              ],
              'OTHER_CPLUSPLUSFLAGS': [
                '-fembed-bitcode'
              ],
            }
          }],
          [ 'target_arch=="arm64"', {
            'xcode_settings': {'ARCHS': ['arm64']},
          }],
          [ 'target_arch=="arm"', {
            'xcode_settings': {'ARCHS': ['armv7']},
          }],
          [ 'target_arch=="armv7s"', {
            'xcode_settings': {'ARCHS': ['armv7s']},
          }],
          ['clang==1', {
            'xcode_settings': {
              'GCC_VERSION': 'com.apple.compilers.llvm.clang.1_0',
              'CLANG_CXX_LANGUAGE_STANDARD': 'gnu++1y',  # -std=gnu++1y
              'CLANG_CXX_LIBRARY': 'libc++',
            },
          }],
          ['target_arch=="x64" or target_arch=="ia32"', {
            'xcode_settings': { 'SDKROOT': 'iphonesimulator' },
          }, {
            'xcode_settings': { 'SDKROOT': 'iphoneos', 'ENABLE_BITCODE': 'YES' },
          }],
        ],
      }],
      ['OS=="freebsd" and node_use_dtrace=="true"', {
        'libraries': [ '-lelf' ],
      }],
      ['OS=="freebsd"', {
        'ldflags': [
          '-Wl,--export-dynamic',
        ],
      }],
      # if node is built as an executable,
      #      the openssl mechanism for keeping itself "dload"-ed to ensure proper
      #      atexit cleanup does not apply
      ['node_shared_openssl!="true" and node_shared!="true"', {
        'defines': [
          # `OPENSSL_NO_PINSHARED` prevents openssl from dload
          #      current node executable,
          #      see https://github.com/nodejs/node/pull/21848
          #      or https://github.com/nodejs/node/issues/27925
          'OPENSSL_NO_PINSHARED'
        ],
      }],
      ['node_shared_openssl!="true"', {
        # `OPENSSL_THREADS` is defined via GYP for openSSL for all architectures.
        'defines': [
          'OPENSSL_THREADS',
        ],
      }],
      ['node_shared_openssl!="true" and openssl_no_asm==1', {
        'defines': [
          'OPENSSL_NO_ASM',
        ],
      }],
    ],
  }
}
