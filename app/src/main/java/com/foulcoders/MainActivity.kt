package com.foulcoders

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.browser.customtabs.CustomTabsServiceConnection

/**
 * Main Activity for FoulCoders TWA.
 * Launches the web app using Chrome Custom Tabs with TWA support.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        const val WEBSITE_URL = "https://foul-coders.vercel.app"
        const val CUSTOM_SCHEME = "foulcoders"

        // Custom User-Agent string to identify app users
        const val CUSTOM_USER_AGENT = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile FoulCodersApp/1.0"

        private const val CHROME_PACKAGE = "com.android.chrome"
    }

    private var customTabsClient: CustomTabsClient? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "MainActivity created")
        Log.d(TAG, "Launching TWA for: $WEBSITE_URL")

        // Bind to Chrome Custom Tabs service
        bindCustomTabsService()
    }

    /**
     * Binds to Chrome's Custom Tabs service
     */
    private fun bindCustomTabsService() {
        val connection = object : CustomTabsServiceConnection() {
            override fun onCustomTabsServiceConnected(
                componentName: android.content.ComponentName,
                client: CustomTabsClient
            ) {
                Log.d(TAG, "Custom Tabs service connected")
                customTabsClient = client
                client.warmup(0L)
                launchCustomTabs()
            }

            override fun onServiceDisconnected(componentName: android.content.ComponentName) {
                Log.d(TAG, "Custom Tabs service disconnected")
                customTabsClient = null
            }
        }

        // Try to bind to Chrome
        try {
            CustomTabsClient.bindCustomTabsService(this, CHROME_PACKAGE, connection)
        } catch (e: Exception) {
            Log.e(TAG, "Error binding Custom Tabs service", e)
            launchBrowserFallback()
        }
    }

    /**
     * Launches the web app using Chrome Custom Tabs
     */
    private fun launchCustomTabs() {
        try {
            val customTabsIntent = CustomTabsIntent.Builder()
                .setDefaultColorSchemeParams(
                    androidx.browser.customtabs.CustomTabColorSchemeParams.Builder()
                        .setToolbarColor(getColor(R.color.primary))
                        .setNavigationBarColor(getColor(R.color.primary))
                        .build()
                )
                .setColorScheme(androidx.browser.customtabs.CustomTabsIntent.COLOR_SCHEME_SYSTEM)
                .setShowTitle(true)
                .setUrlBarHidingEnabled(true)
                .build()

            // Launch the URL
            customTabsIntent.launchUrl(this, Uri.parse(WEBSITE_URL))
            Log.d(TAG, "Custom Tabs launched")

            // Close this activity since Chrome handles the rest
            finish()

        } catch (e: Exception) {
            Log.e(TAG, "Error launching Custom Tabs", e)
            launchBrowserFallback()
        }
    }

    /**
     * Last resort fallback to open URL in default browser
     */
    private fun launchBrowserFallback() {
        Log.d(TAG, "Launching browser fallback")

        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse(WEBSITE_URL)
            }
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            Log.e(TAG, "Error launching browser", e)
        }
    }

    override fun onResume() {
        super.onResume()
        Log.d(TAG, "MainActivity resumed")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "MainActivity destroyed")
    }
}
