import React from "react";
import { Message, openModal, Textarea, Button } from 'components';
import {addBodyEvent, removeBodyEvent} from "./listener";
import ProWorker from './worker';

export const antiShake = (fuc, time = 300) => {
    let timer = null;
    return (...args) => {
        if(timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(() => {
            fuc(...args);
        }, time)
    }
}

// 复制方法
export const Copy = (data, successMessage) => {
    const value = typeof data !== 'string' ? JSON.stringify(data) : data;
    const id = Math.uuid();
    addBodyEvent('oncopy', id, (e) => {
        e.clipboardData.setData('text', value);
        e.preventDefault();
        e.stopPropagation();
        removeBodyEvent('oncopy', id);
    });
    // 兼容苹果浏览器创建一个临时dom
    const input = document.createElement('input');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.setAttribute('value', '1');
    input.select();
    input.setSelectionRange(0, 1);
    if (document.execCommand('copy')) {
        Message.success({title: successMessage});
    }
    input.parentElement.removeChild(input);
};

// 手动粘贴数据进入
const openPaste = (cb) => {
    let model;
    let currentValue = null;
    const onChange = (e) => {
        currentValue = e.target.value;
    }
    const onOk = () => {
        cb && cb(currentValue);
        model.close();
    };
    const onCancel = () => {
        model && model.close();
    };
    model = openModal(<div>
        <Textarea onChange={onChange} rows={10} placeholder='请将内容粘贴到次处'/>
    </div>, {
        bodyStyle: { width: '70%' },
        title: <span>粘贴失败
      <a target='_blank' href='https://jingyan.baidu.com/article/a378c960c27006f22928307c.html'></a>
    </span>,
        buttons: [
            <Button type='primary' key='ok' onClick={onOk}>确定</Button>,
            <Button key='cancel' onClick={onCancel}>取消</Button>]
    });
}


// 粘贴方法
export const Paste = (cb) => {
    if (navigator.clipboard){
        navigator.clipboard.readText().then(text => {
            cb && cb(text);
        }).catch(() => {
            openPaste(cb);
        });
    } else {
        openPaste(cb);
    }

};

const getWorker = () => {
    if(window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        const blob = new Blob(['importScripts("http://localhost:3005/worker.worker.js")'], {"type": 'application/javascript'});
        const blobUrl = window.URL.createObjectURL(blob);
        return  new Worker(blobUrl)
    }
    return new ProWorker();
}

// 创建worker线程
const workerFuc = (params, callback, onMessage) => {
    return new Promise((resolve, reject) => {
        const worker = getWorker();
        callback && callback(worker);
        worker.postMessage(params);
        worker.onmessage = ({data}) => {
            if(onMessage) {
                onMessage(data);
                if(data.type === 'end') {
                    resolve(data);
                    worker.terminate();
                }
            } else {
                resolve(data);
                worker.terminate();
            }
        };
        worker.onerror = (err) => {
            reject(err)
            worker.terminate();
        };
    });
}

// 执行worker
export const postWorkerFuc = (fuc, isExe = false, params = {}, callback) => {
    return workerFuc({
        fuc: isExe ? fuc : `(${fuc.toString()})`,
        params,
        isExe,
    }, callback)
}

// 持续执行worker
export const postWorkerFucMessage = (fuc, params = {}, onMessage, callback) => {
    return workerFuc({
        fuc,
        params,
        isExe: true,
        isMessage: true
    }, callback, onMessage)
}
