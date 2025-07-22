import React from 'react';
import {Message, Icon} from 'components';
import { read, utils } from 'xlsx';
import xmind from 'simple-mind-map-pdmaas/src/parse/xmind';
import markdown from 'simple-mind-map-pdmaas/src/parse/markdown';

import {upload} from '../../../../../../lib/rest';

export default React.memo(({onImportData, readonly}) => {
    const fileToBuffer = (file) => {
        return new Promise((r) => {
            const reader = new FileReader();
            reader.onload = () => {
                r(reader.result);
            };
            reader.readAsArrayBuffer(file);
        });
    };
    const handleSmm = (file) => {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = (evt) => {
            try {
                let data = JSON.parse(evt.target.result);
                if (typeof data !== 'object') {
                    Message.error({title: '无效的文件内容'});
                }
                onImportData(data);
                Message.success({title: '导入成功'});
            } catch (error) {
                Message.error({title: '文件解析失败'});
            }
        };
    };
    const handleXmind = async (file) => {
        try {
            const data = await xmind.parseXmindFile(file);
            onImportData(data);
            Message.success({title: '导入成功'});
        } catch (error) {
            console.log(error);
            Message.error({title: '文件解析失败'});
        }
    };
    const handleExcel = async (file) => {
        try {
            const wb = read(await fileToBuffer(file));
            const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                header: 1,
            });
            if (data.length <= 0) {
                return;
            }
            let max = 0;
            data.forEach((arr) => {
                if (arr.length > max) {
                    max = arr.length;
                }
            });
            let layers = [];
            let walk = (layer) => {
                if (!layers[layer]) {
                    layers[layer] = [];
                }
                for (let i = 0; i < data.length; i += 1) {
                    if (data[i][layer]) {
                        let node = {
                            data: {
                                text: data[i][layer],
                            },
                            children: [],
                            _row: i,
                        };
                        layers[layer].push(node);
                    }
                }
                if (layer < max - 1) {
                    walk(layer + 1);
                }
            };
            walk(0);
            // eslint-disable-next-line consistent-return
            let getParent = (arr, row) => {
                for (let i = arr.length - 1; i >= 0; i -= 1) {
                    if (row >= arr[i]._row) {
                        return arr[i];
                    }
                }
            };
            for (let i = 1; i < layers.length; i += 1) {
                let arr = layers[i];
                for (let j = 0; j < arr.length; j += 1) {
                    let item = arr[j];
                    let parent = getParent(layers[i - 1], item._row);
                    if (parent) {
                        parent.children.push(item);
                    }
                }
            }
            onImportData(data);
            Message.success({title: '导入成功'});
        } catch (error) {
            Message.error({title: '文件解析失败'});
        }
    };
    const handleMd = (file) => {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = async (evt) => {
            try {
                let data = await markdown.transformMarkdownTo(evt.target.result);
                onImportData(data);
                Message.success({title: '导入成功'});
            } catch (error) {
                Message.error({title: '文件解析失败'});
            }
        };
    };
    const onImport = () => {
        if(!readonly) {
            upload('.smm,.json,.xmind,.xlsx,.md', (file) => {
                if (/\.(smm|json)$/.test(file.name)) {
                    handleSmm(file);
                } else if (/\.xmind$/.test(file.name)) {
                    handleXmind(file);
                } else if (/\.xlsx$/.test(file.name)) {
                    handleExcel(file);
                } else if (/\.md$/.test(file.name)) {
                    handleMd(file);
                }
            }, (file) => {
                let reg = /\.(smm|xmind|json|xlsx|md)$/;
                if (!reg.test(file.name)) {
                    Message.error({title: '文件格式错误'});
                    return false;
                } else {
                    return true;
                }
            }, false);
        }
    };
    return <span onClick={onImport}>
      <Icon type='icon-inout-import' />
      <span>导入</span>
    </span>;
});
