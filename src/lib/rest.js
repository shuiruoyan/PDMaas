import axios from 'axios';

// 添加响应拦截器
axios.defaults.transformResponse = (data) => {
    let jsonData;
    try {
        jsonData = JSON.parse(data.replace(/"\w+":\s*\d{16,}\.*\d*/g, (longVal) => {
            let split = longVal.split(':');
            return `${split[0]}:"${split[1].trim()}"`;
        }));
    } catch (error) {
        jsonData = data;
    }
    return jsonData;
};

// get
export const get = (url, params) => {
    return new Promise((res, rej) => {
        axios({
            url,
            method: 'get',
            params,
        })
            .then((response) => {
                res(response.data);
            })
            .catch((err) => rej(err));
    });
};

// upload
export const upload = (accept, onChange, validate, needParse = true) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', accept);
    input.onchange = (e) => {
        const { files = [] } = e.target;
        if (files[0] && validate(files[0])) {
            if (needParse) {
                const reader = new FileReader();
                reader.readAsText(files[0]);
                reader.onload = (event) => {
                    const result = event.target.result;
                    onChange && onChange(result, files[0]);
                };
            } else {
                onChange && onChange(files[0]);
            }
        }
    };
    input.click();
};


// downloadBlob
export const downloadBlob = (data, name) => {
    const a = document.createElement('a');
    const url = URL.createObjectURL(data);
    a.download = name;
    a.href = url;
    a.click();
};

// downloadString
export const downloadString = (data, type, name) => {
    const blob = new Blob([data], {type});
    downloadBlob(blob, name);
};