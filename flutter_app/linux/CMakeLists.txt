cmake_minimum_required(VERSION 3.10)
project(letese_trading LANGUAGES CXX)

set(CMAKE_INSTALL_RPATH "$ORIGIN/lib")
set(CMAKE_BUILD_TYPE Release)

set(FLUTTER_ROOT "$ENV{HOME}/snap/flutter/common/flutter")
if(NOT EXISTS "${FLUTTER_ROOT}/bin/flutter")
  set(FLUTTER_ROOT "$ENV{FLUTTER_ROOT}")
endif()
if(NOT EXISTS "${FLUTTER_ROOT}/bin/flutter")
  set(FLUTTER_ROOT "/opt/flutter/flutter")
endif()

set(FLUTTER_ENGINE_LIBRARY "${FLUTTER_ROOT}/bin/cache/artifacts/engine/linux-x64/libflutter_linux_gtk.so")

include(${FLUTTER_ROOT}/packages/flutter_tools/cmake/gallery/flutter_wrapper.cmake)

flutter_target_build_notifier()
