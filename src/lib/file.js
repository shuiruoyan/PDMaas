import fs from "fs";
const readline = require('readline');
const { dialog, app,shell  } = require('@electron/remote');
import {postWorkerFuc} from "./event";
import path from "path";

export const parseJson = (data, closeSpace = false) => {
    return new Promise((resolve, reject) => {
        if(typeof data === 'string') {
            resolve(data);
        } else {
            postWorkerFuc('utils.json2string', true, [data, closeSpace]).then((d) => {
                resolve(d);
            }).catch((err) => {
                reject(err);
            })
        }
    });
}

export const isReadonly = (path) => {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                reject(err)
            } else {
                // 检查文件是否只读
                if (stats.mode & fs.constants.S_IWUSR) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        });
    })
}

export const saveNormalFile = (file, dataBuffer) => {
    // 通用的文件保方法
    return new Promise((res, rej) => {
        // fs.writeFile(file, dataBuffer, (err) => {
        //   if(err){
        //     rej(err);
        //   }else{
        //     res(dataBuffer);
        //   }
        // });
        const writer = fs.createWriteStream(file);
        writer.on('error', (err) => {
            rej(err);
        });
        writer.on('close', () => {
            res(dataBuffer);
        })
        writer.write(dataBuffer);
        writer.end();
    });
};

export const readNormalFile = (filePath) => {
    // 通用的文件读取方法
    return new Promise((res, rej) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                rej(err);
            } else {
                res(data);
            }
        });
    })
};

export const saveJsonPromise = (filePath, data, closeSpace = false, closeSuffix = false) => {
    return new Promise((res, rej) => {
        parseJson(data, closeSpace).then((tempData) => {
            const tempFilePath = closeSuffix ? filePath : (filePath.endsWith('.json') ? filePath : `${filePath}.json`);
            if (!tempData) {
                rej(new Error('error'));
            } else {
                saveNormalFile(tempFilePath, tempData).then((data) => {
                    res(data);
                }).catch((err) => {
                    rej(err);
                });
            }
        })
    });
};

export const readJsonPromise = (filePath, closeSuffix = false) => {
    return new Promise((res, rej) => {
        const tempFilePath = closeSuffix ? filePath : (filePath.endsWith('.json') ? filePath : `${filePath}.json`);
        readNormalFile(tempFilePath).then((data) => {
            postWorkerFuc('utils.string2json', true, [data.toString()]).then((d) => {
                res(d);
            }).catch((err) => {
                rej(err);
            })
        }).catch((err) => {
            rej(err);
        });
    });
};

// 获取用户目录
export const getUserPath = () => {
    const base_path = 'userData';
    const basePath = app.getPath(base_path);
    return basePath + path.sep;
}

// 获取用户目录
export const getUserHomePath = () => {
    const base_path = 'home';
    const basePath = app.getPath(base_path);
    return basePath + path.sep;
}

// 获取用户配置文件
export const getUserConfigPath = () => {
    const user_config = 'user_config.json';
    const base_path = 'userData';
    const basePath = app.getPath(base_path);
    return basePath + path.sep + user_config;
}

// 文件名和路径拼接
export const dirSplicing = (dir, fileName) => {
    return path.join(dir, fileName);
};
// 获取文件所在的目录
export const dirname = (file) => {
    return path.dirname(file);
};

// 获取软件安装目录
export const getAppPath = () => {
    return app.getAppPath();
}

// 判断当前目录是否软件安装目录
export const checkIsAppPath = (appPath) => {
    if(!fileExists(appPath)) {
        return path.resolve(dirname(appPath)) === dirname(app.getPath("exe"));
    }
    const stat = getStat(appPath);
    if(stat.isDirectory()) {
        return path.resolve(appPath) === dirname(app.getPath("exe"));
    }
    return path.resolve(dirname(appPath)) === dirname(app.getPath("exe"));
}

// 判断文件是否已经存在
export const fileExists = (filePath) => {
    return fs.existsSync(filePath);
};
// 删除文件
export const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// 删除整个目录 包括目下的所有文件
const deleteDirectoryFile = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach((file) => {
            const curPath = `${dirPath}${path.sep}${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteDirectoryFile(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(dirPath);
    }
};

// 获取目录下的文件
export const getDir = (dirPath, type = 'F') => {
    if (fs.existsSync(dirPath)) {
        return fs.readdirSync(dirPath).map(file => dirSplicing(dirPath, file)).filter((file) => {
            if(type === 'F') {
                return !fs.lstatSync(file).isDirectory();
            }
            return fs.lstatSync(file).isDirectory();
        });
    }
    return [];
}

// 判断目录是否存在 如果不存在则创建
export const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        const parentDir = path.dirname(dirPath);
        ensureDirectoryExistence(parentDir);
        fs.mkdirSync(dirPath);
    }
};

// 获取文件名
export const getBaseName = (file) => {
    return path.basename(file);
}

// 获取文件信息
export const getStat = (file) => {
    return fs.statSync(file)
}

export const openDir = (dir) => {
    shell.openPath(dir);
}

export const openPath = (path) => {
    shell.openPath(dirname(path));
}


// 保存文件
export const showSaveDialog = (filters, properties, options) => {
    return new Promise((res, rej) => {
        dialog.showSaveDialog({
            filters: filters || [],
            properties: properties, // 默认是打开文件
            ...options,
        }).then(({filePath }) => {
            if(filePath ) {
                res(filePath)
            } else {
                rej();
            }
        }).catch((err) => {
            rej(err);
        })
    });
}

// 选择文件/目录 // openDirectory
export const openFileOrDirPath = (filters, properties, options) => {
    return new Promise((res, rej) => {
        dialog.showOpenDialog({
            filters: filters || [],
            properties: properties || ['openFile'], // 默认是打开文件
            ...options,
        }).then(({filePaths}) => {
            if(filePaths.length > 0) {
                if((properties || []).includes('multiSelections')) {
                    res(filePaths);
                } else {
                    res(filePaths[0]);
                }
            } else {
                rej();
            }
        }).catch((err) => {
            rej(err);
        })
    });
};

// 打开文件
export const openFile = (filters, properties, options) => {
    return new Promise((res, rej) => {
        openFileOrDirPath(filters, properties, options).then((filePath) => {
            readNormalFile(filePath).then((data) => {
                res(data);
            }).catch((err) => {
                rej(err);
            });
        }).catch((err) => {
            rej(err);
        })
    });
};

// 保存文件
export const saveFile = (data, filters, options) => {
    // 将调用系统的目录弹出框
    return new Promise((res, rej) => {
        dialog.showSaveDialog({
            filters: filters || [],
            ...options,
        }).then(({filePath}) => {
            if (filePath) {
                if(checkIsAppPath(filePath)) {
                    rej(new Error("项目文件不能保存在软件的安装或运行目录"));
                } else {
                    saveNormalFile(filePath, data).then((data) => {
                        res({
                            data,
                            filePath: filePath,
                        });
                    }).catch((err) => {
                        rej(err);
                    })
                }
            } else {
                rej(new Error());
            }
        }).catch((err) => {
            rej(err);
        })
    });
};

// 获取文件写入流 (文件流单例)
const writeStream = {}
export const getFileWriteStream = (file) => {
    if(!writeStream[file]) {
        const writer = fs.createWriteStream(file, {flags: 'a'});
        writeStream[file] = writer;
        writer.on('error', () => {
            writer.end();
        });
        writer.on('close', () => {
            delete writeStream[file]
        });
        let timer = null;
        const initTimer = () => {
            // 文件开启后1分钟内没有修改 将自动关闭 释放内存和文件
            if(timer) {
                clearInterval(timer);
            }
            timer = setInterval(() => {
                clearInterval(timer);
                writer.end();
            }, 1000 * 60)
        }
        writer.on('open', () => {
            initTimer();
        });
        writer.append = (data) => {
            initTimer();
            writer.write(data)
        }
    }
    return writeStream[file];
}

// 获取文件写入流
export const getFileReadStream = (file) => {
    const read = fs.createReadStream(file, {
        highWaterMark: 3 * 1024
    });
    let preLeftData = '';
    let currentLines = [];
    let isEnd = false;
    let res = null;
    let currentSize = 0;
    read.on('data', (data) => {
        read.pause();
        const lines = data.toString().split(/\n|\r\n|\r/g);
        lines[0] = preLeftData + lines[0];
        preLeftData = lines.pop() || '';
        currentLines.push(...lines);
        if(res) {
            if(currentLines.length >= currentSize) {
                res(currentLines.splice(0, currentSize));
            } else {
                read.resume();
            }
        }
    })
    read.on('end', () => {
        if(preLeftData) {
            currentLines.push(preLeftData);
        }
        isEnd = true;
        if(res) {
            res(currentLines.splice(0, currentSize));
        }
    });
    read.on('error', (err) => {
        read.close();
    });
    return {
        next: (size) => {
            return new Promise((resolve, reject) => {
                if((currentLines.length >= size) || isEnd) {
                    resolve(currentLines.splice(0, size));
                } else {
                    currentSize = size
                    res = resolve;
                    read.resume();
                }
            })
        },
        close: () => {
            read.close();
        }
    };
}

export const getFileReadStreamAll = (file) => {
    return new Promise((resolve, reject) => {
        const read = fs.createReadStream(file);
        let data = '';
        read.on('error', (err) => {
            reject(err);
        });
        read.on('end', () => {
            resolve(data)
        });
        read.on('data', (str) => {
            data += str.toString();
        })
    })
}

export const saveJsonPromiseAs = (data, options) => {
    const tempData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return new Promise((res, rej) => {
        saveFile(tempData, [{ name: 'PDMaas', extensions: ['pdma']}], options).then(({filePath}) => res(filePath)).catch(err => rej(err));
    });
};

export const sep = path.sep