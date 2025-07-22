import React, {forwardRef, useCallback, useImperativeHandle, useState} from 'react';
import {CodeEditor, Input, Message} from 'components';
import {get} from '../../../../lib/rest';

export default React.memo(forwardRef(({ baseClass, row = {} }, ref) => {
    const [urlStr, setUrlStr] = useState(row.optionsFetcher);
    const [inputHeight, setInputHeight] = useState(0);
    const [datasourceValue, setDatasourceValue] = useState(() => {
        let tmpObj = '';
        try {
            if(!row.optionsData) {
                return null;
            }
            tmpObj = JSON.parse(row.optionsData);
        } catch (err) {
            if (row.optionsData && row.optionsData.length > 0) {
                return 'json 解析失败';
            }
            return '';
        }
        return JSON.stringify(tmpObj, null, 2);
    });
    const onUrlChange = (e) => {
        e.persist();
        const inputValue = e.target?.value;
        setUrlStr(inputValue);
    };
    const getDemoJsonFromUrl = useCallback(() => {
        get(urlStr).then((res) => {
            setDatasourceValue(JSON.stringify(res, null, 2));
        });
    }, [urlStr]);
    const datasourceChange = useCallback((e) => {
        setDatasourceValue(e.target.value);
    }, [datasourceValue]);
    useImperativeHandle(ref, () => ({
        getDatasource: () => {
            // let tmpObj = JSON.parse(datasourceValue);
            // return JSON.stringify(tmpObj);
            let tmpObj = null;
            try {
                tmpObj = JSON.parse(datasourceValue);
            } catch (err) {
                // if (row.optionsData && row.optionsData.length > 0) {
                //     return 'json 解析失败';
                // }
                Message.warring({title: 'json 解析失败'});
                return '';
            }
            return JSON.stringify(tmpObj);
        },
        changeShowInputDiv: () => setInputHeight(prevState => (prevState === 0 ? 36 : 0)),
        getUrlStr: () => urlStr,
        setDatasourceValue,
    }), [datasourceValue, urlStr]);
    return <div className={baseClass}>
      <CodeEditor value={datasourceValue} width="100%" height={`${600 - inputHeight}px`} onChange={datasourceChange} />
      <div style={{ height: `${inputHeight}px` }}>
        <Input style={{marginBottom: '10px'}} defaultValue={urlStr} onChange={onUrlChange} onKeyDown={getDemoJsonFromUrl} placeholder="http://www.pdmaner.com/demo.json" />
      </div>
    </div>;
}));
