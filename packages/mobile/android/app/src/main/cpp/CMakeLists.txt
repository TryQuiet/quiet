cmake_minimum_required(VERSION 3.4.1)

add_library( # Sets the name of the library.
             backend-worker

             # Sets the library as a shared library.
             SHARED

             # Provides a relative path to your source file(s).
             ./backend-worker.cpp
           )

find_library(log-lib
             log )

target_link_libraries( # Specifies the target library.
                       backend-worker

                       # Links the target library to the log library
                       # included in the NDK.
                       ${log-lib} )