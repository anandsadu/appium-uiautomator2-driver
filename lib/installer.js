import logger from './logger';
import path from 'path';
import { fs } from 'appium-support';
import request from 'request-promise';

const UI2_VER = "0.0.1";
const UI2_SERVER_DOWNLOAD = `https://github.com/appium/appium-uiautomator2-server/releases/` +
                    `download/${UI2_VER}/appium-uiautomator2-server-${UI2_VER}.apk`;
const UI2_SERVER_TEST_DOWNLOAD = `https://github.com/appium/appium-uiautomator2-server/releases/` +
                    `download/${UI2_VER}/appium-uiautomator2-server-test-${UI2_VER}.apk`;
const UI2_DIR = path.resolve(__dirname, "..", "..", "uiautomator2");
const UI2_DOWNLOAD_DIR = path.resolve(UI2_DIR, "download");
const UI2_SERVER_APK_PATH = path.resolve(UI2_DIR, "appium-uiautomator2-server-${UI2_VER}");
const UI2_TEST_APK_PATH = path.resolve(UI2_DIR, "appium-uiautomator2-server-test-${UI2_VER}");

async function downloadUiAutomator2ServerApk () {

  log.info(`Ensuring ${UI2_DOWNLOAD_DIR} exists`);
  
  await fs.mkdir(UI2_DIR);
  await fs.mkdir(UI2_DOWNLOAD_DIR);
  
  log.info(`Downloading UiAutomator2 apk ${UI2_VER} from ` +
           `${UI2_SERVER_DOWNLOAD} --> ${UI2_APK_PATH}`);
		   
  let body = await request.get({url: UI2_SERVER_DOWNLOAD, encoding: 'binary'});
  let body = await request.get({url: UI2_SERVER_TEST_DOWNLOAD, encoding: 'binary'});
  
  log.info(`Writing binary content to ${UI2_APK_PATH}`);
  
  await fs.writeFile(UI2_SERVER_APK_PATH, body, {encoding: 'binary'});
  await fs.writeFile(UI2_TEST_APK_PATH, body, {encoding: 'binary'});
  
}
export { UI2_SERVER_APK_PATH , UI2_TEST_APK_PATH };

