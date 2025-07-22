// @ts-nocheck
import CryptoJS from "crypto-js";

// 这两个必须是16位前后端一致
const key = CryptoJS.enc.Utf8.parse('Yonsum20250425@!');

const iv = CryptoJS.enc.Utf8.parse('iviviviviviviviv');

const checkNull = (pass) => {
    if(pass == null || pass === undefined) {
        return ''
    }
    return pass
}

// 加密
const encrypt = (pass) => {
    const password = CryptoJS.enc.Utf8.parse(checkNull(pass));
    return CryptoJS.AES.encrypt(password, key, {
        iv,
        mode: CryptoJS.mode.CBC, // CBC 模式必须添加偏移量 IV
        padding: CryptoJS.pad.Pkcs7
    }).toString();
};
// 解密
const decrypt = (pass) => {
    const decrypt = CryptoJS.AES.decrypt(checkNull(pass), key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
};

// 解密 兼容ee 2.1.5之前版本的加密key
const decryptEE = (pass) => {
    const decrypt = CryptoJS.AES.decrypt(checkNull(pass), CryptoJS.enc.Utf8.parse('Yonsum20240422!@'), {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
};

// 匹配单机版加密解密
const encryptCE = (pass) => {
    const password = CryptoJS.enc.Utf8.parse(checkNull(pass));
    return CryptoJS.AES.encrypt(password, CryptoJS.enc.Utf8.parse('Yonsum20250425@!'), {
        iv,
        mode: CryptoJS.mode.CBC, // CBC 模式必须添加偏移量 IV
        padding: CryptoJS.pad.Pkcs7
    }).toString();
};

// 签名验证
const genSignature = (message) => {
    return CryptoJS.MD5(message).toString();
}

export {
    encrypt, decrypt, encryptCE, decryptEE, genSignature
}
