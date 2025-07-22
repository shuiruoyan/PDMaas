import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from 'react';
import {Button, CodeEditor, DotGrammar, openModal} from 'components';
// eslint-disable-next-line import/named
import {getTemplate2String, getDemoUpdate } from '../../../../lib/json2code';
import {getSimpleUserCache} from '../../../../lib/cache';

export default React.memo(forwardRef(({ baseClass, viewObj, readonly }, ref) => {
    const { key, dataObj, exampleData } = viewObj;
    const [viewData, setViewData] = useState('');
    const toExampleData = exampleData || getDemoUpdate(key, null, getSimpleUserCache());
    const [refData, setRefData] = useState(typeof toExampleData === 'string' ? JSON.parse(toExampleData) : toExampleData);
    useEffect(() => {
        setViewData(dataObj.itemTemplate || dataObj[key] || '');
    }, [viewObj]);
    useImperativeHandle(ref, () => ({ getViewData: () => viewData }), [viewData]);
    const handleViewDataChange = useCallback((e) => {
        const targetValue = e.target.value;
        setViewData(targetValue);
    }, []);
    const openDotIntroduce = useCallback(() => {
        let modal;
        const onClose = () => {
            modal.close();
        };
        modal = openModal(<DotGrammar />, {
            title: 'dot.js语法介绍',
            bodyStyle: {
                width: '60%',
            },
            buttons: [<Button onClick={onClose} key="onClose">关闭</Button>],
        });
    }, []);
    const entityChange = (e) => {
        try {
            setRefData(JSON.parse(e.target.value));
        } catch (error) {
            setRefData(e.target.value);
        }
    };
    return <div className={`${baseClass}-immersive`}>
      <div className={`${baseClass}-immersive-json`}>
        <span className={`${baseClass}-immersive-title`}>参考数据</span>
        <CodeEditor
          width="100%"
          height="100%"
          readOnly={readonly}
          value={typeof refData === 'object' ?
            JSON.stringify(refData, null, 2) :
            refData
          }
          onChange={e => entityChange(e)}
          mode="json" />
      </div>
      <div>
        <div className={`${baseClass}-immersive-dot`}>
          <span className={`${baseClass}-immersive-title`}>模板编辑 <span onClick={openDotIntroduce}>(dot.js语法介绍)</span></span>
          <CodeEditor readOnly={readonly} width="100%" height="100%" value={viewData} onChange={handleViewDataChange} />
        </div>
        <div className={`${baseClass}-immersive-display`}>
          <span className={`${baseClass}-immersive-title`}>预览结果</span>
          {/* eslint-disable-next-line max-len */}
          <CodeEditor readOnly={readonly} width="100%" height="100%" value={getTemplate2String(viewData, refData, getSimpleUserCache())} />
        </div>
      </div>
    </div>;
}));
