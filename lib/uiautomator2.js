import { exec } from 'teen_process';
import { JWProxy } from 'appium-base-driver';
import { retryInterval } from 'asyncbox';
import logger from './logger';
import { UI2_SERVER_APK_PATH, UI2_TEST_APK_PATH } from 'appium-uiautomator2-driver';
import Promise from 'bluebird';

const REQD_PARAMS = ['adb', 'appPackage', 'appActivity', 'tmpDir', 'apk',
  'host', 'systemPort', 'devicePort'];

var adbkit = require('adbkit');
var client = adbkit.createClient();

class UiAutomator2Server {
  constructor(opts = {}) {
    for (let req of REQD_PARAMS) {
      if (!opts || !opts[req]) {
        throw new Error(`Option '${req}' is required!`);
      }
      this[req] = opts[req];
    }
    this.jwproxy = new JWProxy({host: this.host, port: this.systemPort});
    this.proxyReqRes = this.jwproxy.proxyReqRes.bind(this.jwproxy);
  }

  async installServerApk() {
    // Installs the apks on to the device or emulator
    let apkPackage = await this.getPackageName(UI2_SERVER_APK_PATH);
    // appending .test to apkPackage name to get test apk package name
    let testApkPackage = apkPackage + '.test';
    let isApkInstalled = await this.adb.isAppInstalled(apkPackage);
    let isTestApkInstalled = await this.adb.isAppInstalled(testApkPackage);
    if (!isApkInstalled) {
      await this.signAndInstall(UI2_SERVER_APK_PATH, apkPackage);
	  logger.info(`Installed Server apk `+`${apkPackage}`);
    }
    if (!isTestApkInstalled) {
      await this.signAndInstall(UI2_TEST_APK_PATH, testApkPackage);
	  logger.info(`Installed Test apk `+`${testApkPackage}`);
    }
  }

  async signAndInstall(apk, apkPackage) {
    await this.checkAndSignCert(apk, apkPackage);
    await this.adb.install(apk);
    logger.info("Installed UiAutomator2 server apk");
  }

  async getPackageName(apk) {
    let args = ['dump', 'badging', apk];
    await this.adb.initAapt();
    let {stdout} = await exec(this.adb.binaries.aapt, args);
    let apkPackage = new RegExp(/package: name='([^']+)'/g).exec(stdout);
    if (apkPackage && apkPackage.length >= 2) {
      apkPackage = apkPackage[1];
    }
    else {
      apkPackage = null;
    }
    return apkPackage;
  }

  async checkAndSignCert(apk, apkPackage) {
    let signed = await this.adb.checkApkCert(apk, apkPackage);
    if (!signed) {
      await this.adb.sign(apk);
    }
    return !signed;
  }

  async startSession(caps) {
    let cmd = ['am', 'instrument', '-w',
      'io.appium.uiautomator2.server.test/android.support.test.runner.AndroidJUnitRunner'];
    logger.info(`Starting uiautomator2 server with cmd: ` +
        `${cmd}`);
    //this.adb.shell(cmd);
    //using 3rd party module called 'adbKit' for time being as using 'appium-adb'
    //facing IllegalStateException: UiAutomation not connected exception
    //https://github.com/appium/appium-uiautomator2-driver/issues/19
    this.startSessionUsingAdbkit();
    logger.info('Waiting for UiAutomator2 to be online...');
    // wait 20s for UiAutomator2 to be online
    await retryInterval(20, 1000, async () => {
      await this.jwproxy.command('/status', 'GET');
    });
    await this.jwproxy.command('/session', 'POST', {desiredCapabilities: caps});
  }

  async startSessionUsingAdbkit() {
    client.listDevices()
        .then(function (devices) {
          Promise.map(devices, function (device) {
            logger.info("running command...\n adb shell am instrument -w io.appium.uiautomator2.server.test/android.support.test.runner.AndroidJUnitRunner... ");
            client.shell(device.id, "am instrument -w io.appium.uiautomator2.server.test/android.support.test.runner.AndroidJUnitRunner");
          });
        })
        .catch(function (err) {
          logger.error('Something went wrong while executing instrument test:', err.stack);
        });
  }

  async deleteSession() {
    logger.debug('Deleting UiAutomator2 server session');
    // rely on jwproxy's intelligence to know what we're talking about and
    // delete the current session
    try {
      await this.jwproxy.command('/', 'DELETE');
    } catch (err) {
      logger.warn(`Did not get confirmation UiAutomator2 deleteSession worked; ` +
          `Error was: ${err}`);
    }
  }
}

export default UiAutomator2Server;
