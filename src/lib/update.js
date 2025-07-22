import versionData from './version.json';

const packageData = require('../../package.json');
const _http= require('https');
const os= require('os');
const si = require('systeminformation');

const defaultUrl = `https://www.yonsum.com/opss/launcher/client/${packageData?.version}/${os?.platform()}`;

export const compareVersion = (v1 = '', v2) => {
  // 版本规范为 => x.x.x 主版本号.次版本号.小版本号
  const formatArrayStr = (data) => {
    return data.map(v => {
      const number = parseInt(v.replace(/\D/g, ''));
      return isNaN(number) ? 0 : number;
    })
  }
  const newVersions = formatArrayStr(v1.split('.'))
  const oldVersions = formatArrayStr(v2 || packageData.version.split('.'));
  const maxLength = Math.max(newVersions.length, oldVersions.length);
  let needUpdate = false;
  for (let i = 0; i < maxLength; i++) {
    if ((newVersions[i] || 0) < (oldVersions[i] || 0)) {
      break;
    } else if((newVersions[i] || 0) > (oldVersions[i] || 0)){
      needUpdate = true;
    }
  }
  return needUpdate;
};

export const get = (url) => {
  return new Promise((res, rej) => {
    let id;
    const result = _http.get(url, (req) => {
      let result = '';
      req.on('data', (data) => {
        result += data;
      });
      req.on('end', () => {
        let json = {};
        try {
          json = JSON.parse(result) || {};
          res(json);
        } catch (e) {
          rej(e)
        } finally {
          clearTimeout(id);
        }
      });
      req.on('error', (error) => {
        clearTimeout(id);
        rej(error)
      });
    });
    result.on('error', (error) => {
      clearTimeout(id);
      rej(error);
    });
    id = setTimeout(() => {
      result.abort(); // 超时1.5s
    }, 5000);
  })
}

export const getVersion = () => {
  return new Promise((res, rej) => {
    si.system().then(data => {
      get(`${defaultUrl}/${data.uuid}`).then((data) => {
        res(data);
      }).catch(() => {
        res(versionData)
      })
    });
  })
};

