import React, {
    forwardRef, useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {Form, Input, SVGPicker,Select,Textarea} from 'components';
import { getPrefix} from '../../../lib/classes';
import {openFileOrDirPath} from '../../../lib/file';
import {defaultDBSvg} from '../type/languagetype/DatabaseType';
import defaultProfile from '../../../lib/default_profile';
import {getHomePath} from '../../../lib/app_tool';
import {getCache, setCache} from '../../../lib/cache';

export default React.memo(forwardRef(({defaultData}, ref) => {
    const currentPrefix = getPrefix('container-homeModel-addOrEditProject');
    const FormItem = Form.FormItem;

    const projectObjRef = useRef({});

    const [projectObj, setProjectObj] = useState(defaultData || {
        avatar: '<svg t="1745274474022" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9471" width="200" height="200"><path d="M98.3 540.2l2.3 2.1 345.3 189.1c17.6 14.7 40.5 22.8 64.6 22.8 24.1 0 47-8.1 64.6-22.8l344.8-188.8 0.5-0.3 2.3-2.1c34.8-31.3 39-82 9.8-118-1.7-2.1-4.9-2.5-7-0.7l-33.7 27.4c-2.1 1.7-2.5 4.9-0.7 7 10.6 13 9.7 30.5-2.1 42.7L544.7 687.1l-0.5 0.3-2.3 2.1c-17 15.3-45.8 15.3-62.8 0l-2.3-2.1-344.7-188.8c-11.8-12.2-12.7-29.7-2.1-42.7 1.7-2.1 1.4-5.3-0.7-7l-33.7-27.4c-2.1-1.7-5.3-1.4-7 0.7-29.4 35.9-25.1 86.7 9.7 118z" fill="#424242" p-id="9472"></path><path d="M925.5 608.3l-33.7 27.4c-2.1 1.7-2.5 4.9-0.7 7 10.6 13 9.7 30.5-2.1 42.7L544.7 873.9l-0.5 0.3-2.3 2.1c-17 15.3-45.8 15.3-62.8 0l-2.3-2.1-344.7-188.8c-11.8-12.2-12.7-29.7-2.1-42.7 1.7-2.1 1.4-5.3-0.7-7l-33.7-27.4c-2.1-1.7-5.3-1.4-7 0.7-29.2 35.9-25 86.7 9.8 118l2.3 2.1L446 918.2c17.6 14.7 40.5 22.8 64.6 22.8 24.1 0 47-8.1 64.6-22.8L920 729.4l0.5-0.3 2.3-2.1c34.8-31.3 39-82 9.8-118-1.8-2.1-4.9-2.5-7.1-0.7zM116.1 372.6l54.5 29.8 290.6 159.1c27.2 24.5 71.4 24.5 98.6 0l290.6-159.1 54.5-29.8c2.6-2.3 4.9-4.8 7-7.4 19.9-24.5 17.7-59.1-7-81.3L559.8 99.3c-27.2-24.5-71.4-24.5-98.6 0L116.1 283.9c-24.6 22.2-26.9 56.7-7 81.3 2.2 2.6 4.4 5.1 7 7.4z" fill="#424242" p-id="9473"></path></svg>',
        color: '',
        name: '',
        dbDialectKey: 'MySQL',
        intro: '',
        path: getCache('path') || getHomePath(),
    });
    const [dbDialectDict, setDbDialectDict] = useState([]);

    projectObjRef.current = {...(projectObj || {})};

    const _onInputChange = (e, key) => {
        const value = e.target ? e.target.value : e;
        if(key === 'path') {
            setCache('path', value);
        }
        setProjectObj(pre => ({
            ...pre,
            [key]: value,
        }));
    };

    const selectFile = () => {
        openFileOrDirPath([], ['openDirectory']).then((res) => {
            setCache('path', res);
            setProjectObj(pre => ({
                ...pre,
                path: res,
            }));
        });
    };

    useEffect(() => {
        setDbDialectDict([...(defaultProfile.global.dbDialects || [])]
            .filter(it => it.isEnabled === 1));
    }, []);

    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return projectObjRef.current;
            },
        };
    }, []);

    return <div className={`${currentPrefix}`}>
      <Form>
        <FormItem label="项目图标" cols={4}>
          <span className={`${currentPrefix}-svg`}><SVGPicker width="100" height="100" value={projectObj.avatar} onChange={e => _onInputChange(e, 'avatar')} /></span>
        </FormItem>
        {/*<FormItem label="图标色" cols={2}>*/}
        {/*  <Tooltip*/}
        {/*    force*/}
        {/*    placement='right'*/}
        {/*    trigger='click'*/}
        {/*        // eslint-disable-next-line max-len*/}
        {/* eslint-disable-next-line max-len */}
        {/*    title={<PresetColorPicker autoClose hasOpacity={false} onChange={handleColorChange} />}>*/}
        {/* eslint-disable-next-line max-len */}
        {/*    <span className={`${currentPrefix}-colorPicker`} style={{backgroundColor: projectObj.color || 'gray'}} />*/}
        {/*  </Tooltip>*/}
        {/*</FormItem>*/}
        <FormItem label="项目名称" require cols={4}>
          <Input
            value={projectObj.name}
            onChange={e => _onInputChange(e, 'name')}
          />
        </FormItem>
        <FormItem label="保存位置" require>
          <div className={`${currentPrefix}-line`}>
            <Input
              value={projectObj.path}
              onChange={e => _onInputChange(e, 'path')}
                  />
            <span onClick={selectFile}>...</span>
          </div>
        </FormItem>
        <FormItem label="数据库类型" require cols={4}>
          <Select
            notAllowEmpty
            value={projectObj.dbDialectKey}
            allowClear={false}
            onChange={e => _onInputChange(e, 'dbDialectKey')}>
            {
              (dbDialectDict || []).map((it) => {
                return <Select.Option key={it.id} value={it.defKey}>
                  <div className={`${currentPrefix}-selectOption`}>
                    {/* eslint-disable-next-line max-len */}
                    <span><SVGPicker width={20} height={20} readOnly value={it.icon || defaultDBSvg}/></span>
                    <span>{it.defKey}</span>
                  </div>
                </Select.Option>;
              })
            }
          </Select>
        </FormItem>
        <FormItem label="项目说明" cols={4}>
          <Textarea value={projectObj.intro} onChange={e => _onInputChange(e, 'intro')} />
        </FormItem>
      </Form>
    </div>;
}));
