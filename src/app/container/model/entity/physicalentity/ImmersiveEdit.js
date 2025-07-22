import {Button, DotGrammar, openModal, CodeEditor} from 'components';
import React, {forwardRef, useImperativeHandle, useRef, useState, useCallback} from 'react';
import {getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import {getTemplate2String} from '../../../../../lib/json2code';
import {transformEntityDbDataType, transformEntityLangDataType} from '../../../../../lib/utils';
import {getSimpleUserCache} from '../../../../../lib/cache';

export default React.memo(forwardRef(({ entityData, template,
                                          currentLang, langCode,
                                          previewModel = 'sql', getCurrentDataSource },ref) => {
    const currentPrefix = getPrefix('container-model-entity-physical-content-immersiveedit');
    const successRef = useRef();
    const [templateData, setTemplateData] = useState(template);
    const [refData, setRefData] = useState({
        ...(langCode ? transformEntityLangDataType(getCurrentDataSource(),
            entityData, currentLang) :
            transformEntityDbDataType(getCurrentDataSource(),
            entityData, currentLang)),
        user: getSimpleUserCache(),
    });
    useImperativeHandle(ref, () => {
        return {
            templateData,
            onSuccess: () => {
                successRef.current.style.display = 'block';
                setTimeout(() => {
                    successRef.current.style.display = 'none';
                }, 5000);
            },
        };
    },[templateData]);
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
            buttons: [
              <Button
                onClick={onClose}
                key="onClose"
                >
                    关闭
              </Button>,
            ],
        });
    }, []);
    const templateChange = (e) => {
        console.log(e);
        setTemplateData(e.target.value);
    };
    const entityChange = (e) => {
        try {
            setRefData(JSON.parse(e.target.value));
        } catch (error) {
            setRefData(e.target.value);
        }
    };
    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-left`}>
        <div>
            参考数据
        </div>
        <CodeEditor
          height='100%'
          width='100%'
          mode="json"
          value={typeof refData === 'object' ?
              JSON.stringify(refData, null, 2) :
              refData
          }
          onChange={e => entityChange(e)}
        />
      </div>
      <div className={`${currentPrefix}-right`}>
        <div>
          <div>模板编辑<span onClick={openDotIntroduce}>(dot.js语法介绍)</span></div>
          <CodeEditor
            mode="javascript"
            height="100%"
            width="100%"
            value={templateData}
            onChange={e => templateChange(e)}
          />
        </div>
        <div>
          <div>预览结果</div>
          <CodeEditor
            mode={previewModel}
            height="100%"
            width="100%"
            value={getTemplate2String(templateData, refData, getSimpleUserCache())}
          />
        </div>
      </div>
      <div ref={successRef} className={`${currentPrefix}-bottom`}>保存成功</div>
    </div>;
}));
