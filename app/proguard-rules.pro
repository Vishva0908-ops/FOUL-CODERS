# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep TWA classes
-keep class com.google.androidbrowserhelper.trusted.** { *; }
-keep class androidx.browser.trusted.** { *; }

# Keep Custom Tabs classes
-keep class androidx.customtabs.** { *; }

# Keep Launcher Activity
-keep class com.foulcoders.MainActivity { *; }

# If you are using unique service names, keep them
-keep class com.foulcoders.** { *; }

# Prevent stripping of TWA metadata
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes InnerClasses,EnclosingMethod

# Gson rules (if used)
-keepattributes Signature
-keepattributes *Annotation*
