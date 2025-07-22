// 用来执行主线程传递过来的方法
import * as utils from './utils';

const allFuc = {
    utils
}

onmessage = (e) => {
    const { fuc, params, isExe, isMessage } = e.data;
    if(isExe) {
        const getRealFuc = () => {
          return fuc.split('.')
              .reduce((p, n) => {
              return p[n];
          }, allFuc);
        }
        if(isMessage) {
            getRealFuc()(...params, (message) => {
                postMessage(message)
            })
        } else {
            const result = getRealFuc()(...params);
            if(result.then) {
                result.then((res) => {
                    postMessage(res);
                })
            } else {
                postMessage(result);
            }
        }
    } else {
        const result = eval(fuc)(params);
        postMessage(result);
    }
}
