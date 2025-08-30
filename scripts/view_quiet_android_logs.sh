#!/bin/bash
adb logcat -v color --pid $(adb shell pidof -s com.quietmobile.debug)
