pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
}

@Suppress("UnstableApiUsage")
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("$rootDir/../node_modules/react-native/android") }
        maven { url = uri("$rootDir/../node_modules/detox/Detox-android") }
        maven { url = uri("https://mvnrepository.com/artifact/commons-io/commons-io") }
        maven {
            url = uri("https://central.sonatype.com/repository/maven/")
            // Only search this repository for the specific dependency
            content {
                includeModule("com.goterl", "lazysodium-java")
            }
        }
    }
}

rootProject.name = "QuietMobile"
apply(from = "../node_modules/@react-native-community/cli-platform-android/native_modules.gradle")
val applyNativeModulesSettingsGradle: groovy.lang.Closure<Any> by extra
applyNativeModulesSettingsGradle(settings)
include(":app", ":react-native-fs")
includeBuild("../node_modules/@react-native/gradle-plugin")