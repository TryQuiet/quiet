# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html

# Sets the minimum version of CMake required to build the native library.

cmake_minimum_required(VERSION 3.13)

# RN's Gradle plugin cannot inject its default CMake file when the app owns one.
# Build appmodules with RN's generated component descriptors and module providers
# alongside the independent Node bridge below.
project(appmodules)
if(DEFINED REACT_ANDROID_DIR)
    include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
endif()

# Creates and names a library, sets it as either STATIC
# or SHARED, and provides the relative paths to its source code.
# You can define multiple libraries, and CMake builds them for you.
# Gradle automatically packages shared libraries with your APK.

add_library( # Sets the name of the library.
             own-native-lib

             # Sets the library as a shared library.
             SHARED

             # Provides a relative path to your source file(s).
             src/main/cpp/own-native-lib.cpp
             src/main/cpp/rn-bridge.cpp
           )

target_include_directories(own-native-lib PRIVATE libnode/include/node/ src/main/cpp/)
target_compile_features(own-native-lib PRIVATE cxx_std_20)

add_library( libnode
             SHARED
             IMPORTED )

set_target_properties( # Specifies the target library.
                       libnode

                       # Specifies the parameter you want to define.
                       PROPERTIES IMPORTED_LOCATION

                       # Provides the path to the library you want to import.
                       ${CMAKE_SOURCE_DIR}/libnode/bin/${ANDROID_ABI}/libnode.so )

# Searches for a specified prebuilt library and stores the path as a
# variable. Because CMake includes system libraries in the search path by
# default, you only need to specify the name of the public NDK library
# you want to add. CMake verifies that the library exists before
# completing its build.

find_library( # Sets the name of the path variable.
              log-lib

              # Specifies the name of the NDK library that
              # you want CMake to locate.
              log )

# Specifies libraries CMake should link to your target library. You
# can link multiple libraries, such as libraries you define in this
# build script, prebuilt third-party libraries, or system libraries.

target_link_libraries( # Specifies the target library.
                       own-native-lib

                       libnode

                       # Links the target library to the log library
                       # included in the NDK.
                       ${log-lib} )
