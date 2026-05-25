rootProject.extra["compileSdkVersion"] = 36
rootProject.extra["minSdkVersion"] = 26
rootProject.extra["targetSdkVersion"] = 35
rootProject.extra["buildToolsVersion"] = "36.0.0"

// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.facebook.react.rootproject") apply false
}



buildscript {

    dependencies {
        classpath(libs.gradle)
        classpath(libs.google.services)
        classpath(libs.react.native.gradle.plugin)
        classpath(libs.gradle.download.task)
        classpath(libs.kotlin.gradle.plugin)
        // put application dependnecies in app/build.gralde, not hee
    }
}
