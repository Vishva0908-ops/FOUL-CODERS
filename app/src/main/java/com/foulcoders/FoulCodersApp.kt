package com.foulcoders

import android.app.Application
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.browser.trusted.TrustedWebActivityApplication

/**
 * Application class for FoulCoders TWA app.
 * Initializes TWA components and verifies browser availability.
 */
class FoulCodersApp : Application() {

    companion object {
        private const val TAG = "FoulCodersApp"
        const val PACKAGE_NAME = "com.foulcoders.app"
        const val WEBSITE_URL = "https://foul-coders.vercel.app"
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "FoulCodersApp initialized")
        Log.d(TAG, "Targeting TWA URL: $WEBSITE_URL")

        initializeTwaComponents()
    }

    /**
     * Initializes Trusted Web Activity components.
     * Verifies that a compatible browser is available.
     */
    private fun initializeTwaComponents() {
        try {
            // Check for Chrome availability (required for TWA)
            val chromePackage = "com.android.chrome"
            val packageManager = packageManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val chromeAvailable = packageManager.getPackageInfo(
                    chromePackage,
                    PackageManager.PackageInfoFlags.of(0)
                )
                Log.d(TAG, "Chrome version available: ${chromeAvailable.versionName}")
            }

            // Log browser fallback status
            logBrowserAvailability()

        } catch (e: PackageManager.NameNotFoundException) {
            Log.w(TAG, "Chrome not found, will use browser fallback")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing TWA components", e)
        }
    }

    /**
     * Logs availability of browsers for TWA fallback.
     */
    private fun logBrowserAvailability() {
        val fallbackBrowsers = listOf(
            "com.android.chrome",
            "org.chromium.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.google.android.apps.chrome"
        )

        fallbackBrowsers.forEach { packageName ->
            try {
                val packageInfo = packageManager.getPackageInfo(packageName, 0)
                Log.d(TAG, "Found browser: $packageName (${packageInfo.versionName})")
            } catch (e: PackageManager.NameNotFoundException) {
                // Browser not installed, skip
            }
        }
    }
}
