package com.quietmobile;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.quietmobile.Communication.CommunicationModulePackage;
import com.quietmobile.Utils.Const;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  public static String PACKAGE_NAME;

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
          packages.add(new CommunicationModulePackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
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
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    PACKAGE_NAME = getApplicationContext().getPackageName();
    createForegroundServiceNotificationChannel();
    createNotificationChannel();
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.quietmobile.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }

  private void createForegroundServiceNotificationChannel() {
      // Create the NotificationChannel, but only on API 26+ because
      // the NotificationChannel class is new and not in the support library
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          CharSequence name = getString(R.string.foreground_service_channel_name);
          String description = getString(R.string.foreground_service_channel_description);
          int importance = NotificationManager.IMPORTANCE_HIGH;
          NotificationChannel channel = new NotificationChannel(Const.FOREGROUND_SERVICE_NOTIFICATION_CHANNEL_ID, name, importance);
          channel.setDescription(description);
          // Register the channel with the system; you can't change the importance
          // or other notification behaviors after this
          NotificationManager notificationManager = getSystemService(NotificationManager.class);
          notificationManager.createNotificationChannel(channel);
      }
  }

  private void createNotificationChannel() {
      // Create the NotificationChannel, but only on API 26+ because
      // the NotificationChannel class is new and not in the support library
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          CharSequence name = getString(R.string.notification_channel_name);
          String description = getString(R.string.notification_channel_description);
          int importance = NotificationManager.IMPORTANCE_HIGH;
          NotificationChannel channel = new NotificationChannel(Const.INCOMING_MESSAGES_CHANNEL_ID, name, importance);
          channel.setDescription(description);
          // Register the channel with the system; you can't change the importance
          // or other notification behaviors after this
          NotificationManager notificationManager = getSystemService(NotificationManager.class);
          notificationManager.createNotificationChannel(channel);
      }
  }
}
