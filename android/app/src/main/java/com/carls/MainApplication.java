package com.carls;

import android.app.Application;
import android.net.http.HttpResponseCache;
import android.os.Bundle;
import android.util.Log;

// keep these sorted alphabetically
import com.BV.LinearGradient.LinearGradientPackage;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.geektime.rnonesignalandroid.ReactNativeOneSignalPackage;
import com.github.droibit.android.reactnative.customtabs.CustomTabsPackage;
import com.idehub.GoogleAnalyticsBridge.GoogleAnalyticsBridgePackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.microsoft.codepush.react.CodePush;
import com.oblador.keychain.KeychainPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    protected String getJSBundleFile() {
      return CodePush.getJSBundleFile();
    }

    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        // please keep these sorted alphabetically
        new CodePush(getResources().getString(R.string.reactNativeCodePush_androidDeploymentKey), getApplicationContext(), BuildConfig.DEBUG),
        new CustomTabsPackage(),
        new GoogleAnalyticsBridgePackage(),
        new KeychainPackage(),
        new LinearGradientPackage(),
        new ReactNativeOneSignalPackage(),
        new RNDeviceInfo(),
        new RNViewShotPackage(),
        new VectorIconsPackage()
      );
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);

    // set up network cache
    try {
      File httpCacheDir = new File(getApplicationContext().getCacheDir(), "http");
      long httpCacheSize = 20 * 1024 * 1024; // 20 MiB
      HttpResponseCache.install(httpCacheDir, httpCacheSize);
    } catch (IOException e) {
      Log.i("carls", "HTTP response cache installation failed:", e);
      //      Log.i(TAG, "HTTP response cache installation failed:", e);
    }
  }

  public void onStop() {
    HttpResponseCache cache = HttpResponseCache.getInstalled();
    if (cache != null) {
      cache.flush();
    }
  }
}