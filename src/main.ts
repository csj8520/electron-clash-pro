import { app, BrowserWindow, Menu } from 'electron';

import { platform } from './utils/os';
import { clashRun } from './utils/clash';
import { clearProxy } from './utils/proxy';
import { autoSetProxy, fs } from './utils';
import { copyDefaultConfig, initConfig } from './utils/config';
import { clashConfigDir, clashDir, tempDir } from './utils/const';
import { createWindow } from './main/window';
import { setTray } from './main/tray';
import { fixJsMime } from './main/fix-js-mime';

let clashProcess: AsyncReturn<typeof clashRun> | null = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  Menu.setApplicationMenu(null);
  setTray();

  platform === 'win32' && fixJsMime();

  !(await fs.pathExists(tempDir)) && (await fs.mkdir(tempDir));
  !(await fs.pathExists(clashDir)) && (await fs.mkdir(clashDir));
  !(await fs.pathExists(clashConfigDir)) && (await fs.mkdirs(clashConfigDir));

  await copyDefaultConfig();
  const config = await initConfig();

  clashProcess = await clashRun(config.selected);

  config.autoSetProxy && (await autoSetProxy());

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('will-quit', async () => {
  clearProxy();
  clashProcess?.kill('SIGKILL');
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
