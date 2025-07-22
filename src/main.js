/* eslint-disable */
const {app, BrowserWindow, Menu, nativeImage, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
require('@electron/remote/main').initialize();

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let win;

function createWindow() {
  // 创建浏览器窗口。
  win = new BrowserWindow({
    width: 1220,
    height: 600,
    minWidth: 300,
    minHeight: 100,
    frame: false,
    resizable: false,
    show: false,
    //titleBarStyle: 'customButtonsOnHover',
    backgroundColor: 'transparent',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  require("@electron/remote/main").enable(win.webContents);


  // 然后加载应用的 index.html。
  if (process.env.PDMAAS_NODE_ENV === 'development') {
    var profile = require('../profile');
    win.loadURL(`http://${profile.host}:${profile.port}/index.html`);
    // 打开开发者工具。
    win.setIcon(
        nativeImage.createFromPath(
            path.join(__dirname, "../public/256x256.png")
        )
    );
    win.webContents.openDevTools();
  } else {
    //win.webContents.openDevTools();
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }));
    win.setIcon(
        nativeImage.createFromPath(
            path.join(__dirname, "256x256.png")
        )
    );
    //win.webContents.openDevTools();
  }
  win.on('ready-to-show', function () {
    win.show();
  });
  // 监听进程崩溃 或者网页无响应时
  win.webContents.on('render-process-gone', (event, details ) => {

  });
  win.webContents.on('unresponsive', () => {

  });

  // 当 window 被关闭，这个事件会被触发。
  win.on('closed', () => {
    // 取消引用 window 对象，如果你的应用支持多窗口的话，
    // 通常会把多个 window 对象存放在一个数组里面，
    // 与此同时，你应该删除相应的元素。
    win = null;
  });
  ipcMain.on("basePath", (event) => {
    let jarPath = '';
    if (process.env.PDMAAS_NODE_ENV === 'development') {
      jarPath = path.join(__dirname);
    } else {
      jarPath = path.join(__dirname, '../../../')
    }
    event.returnValue = jarPath;
  });
  let menu;
  // 设置菜单
  if (process.platform === 'darwin') {
    const template = [
      {
        role: 'appMenu',
        submenu: [
          {role: 'about'},
          {type: 'separator'},
          {type: 'separator'},
          {role: 'hide'},
          {role: 'hideothers'},
          {role: 'unhide'},
          {type: 'separator'},
          {role: 'quit'}
        ]
      },
      {
        role: 'editMenu',
        submenu: [
          {role: 'undo'},
          {role: 'redo'},
          {type: 'separator'},
          {role: 'cut'},
          {role: 'copy'},
          {role: 'paste'},
          {role: 'pasteandmatchstyle'},
          {role: 'delete'},
          {role: 'selectall'},
          {type: 'separator'},
        ]
      },
      {
        role: 'windowMenu',
        submenu: [
          {role: 'minimize'},
          {role: 'close'},
          {role: 'zoom'},
          {role: 'front'}
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click () { require('electron').shell.openExternal('https://gitee.com/robergroup/chiner') }
          }
        ]
      }
    ]
    menu = Menu.buildFromTemplate(template);
  } else {
    menu = null;
  }
  Menu.setApplicationMenu(menu);
}

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', createWindow);

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
  app.quit();
}
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (win === null) {
  createWindow();
}
});
