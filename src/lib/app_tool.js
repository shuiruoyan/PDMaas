import {ipcRenderer, shell} from "electron";
import os from 'os';
const app = require('@electron/remote').app;
import path from "path";

import { getUserHomePath} from "./file";

export const getHomePath = () => {
    return path.join(getUserHomePath(), './pdmaas');
}

export const addAppQuitListener = (callback) => {
    app.on('will-quit', () => {
        // 在这里执行清理工作
        callback && callback();
    });
}

export const openLink = (link) => {
    return shell.openExternal(link);
}

// 获取当前电脑用户名
export const getSysUser = () => {
    return os.userInfo()
}