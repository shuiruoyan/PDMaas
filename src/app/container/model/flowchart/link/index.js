import React, {useCallback, useImperativeHandle, useRef, useState, forwardRef} from 'react';
import {Form, Input, Radio,TreeSelect} from 'components';
import {getPrefix} from '../../../../../lib/classes';

import './style/index.less';
import {renderValue} from '../../menu/tool';
import {filterTreeData, labelRenderGlobal} from '../../menu/filterTree';

export default React.memo(forwardRef(({defaultData, getCurrentDataSource}, ref) => {
    const userProfile = getCurrentDataSource().profile?.user;
    const modelingNavDisplayRef = useRef({});
    modelingNavDisplayRef.current = userProfile.modelingNavDisplay;
    const {entities, diagrams } = getCurrentDataSource().project;

    const FormItem = Form.FormItem;
    const RadioGroup = Radio.RadioGroup;
    const currentPrefix = getPrefix('container-model-flow-link');
    const valueRef = useRef({...defaultData});
    const [link, setLink] = useState(() => {
        if(defaultData.hyperlink) {
            const splitData = defaultData.hyperlink.split(':');
            const position = splitData[0] === 'in' ? 'in' : 'out';
            const checkLinkValue = (value) => {
                if(value) {
                    if((entities || []).concat(diagrams || []).some(d => d.id === value)) {
                        return value;
                    }
                    return '';
                }
                return value;
            };
            return {
                inValue: '',
                outValue: '',
                type: position,
                [`${position}Value`]: position === 'in' ? checkLinkValue(splitData[1]) : defaultData.hyperlink,
            };
        }
        return {
            type: 'in',
            outValue: '',
            inValue: '',
        };
    });
    const linkRef = useRef({});
    linkRef.current = link;
    const _onChange = (e, name) => {
        const targetValue = e.target.value;
        setLink((pre) => {
            return {
                ...pre,
                [name]: targetValue,
            };
        });
    };
    useImperativeHandle(ref, () => {
        return {
            linkData : () => {
                return {
                    ...valueRef.current,
                    hyperlink: linkRef.current.type === 'in' ? `in:${linkRef.current.inValue}` : linkRef.current.outValue,
                };
            },
        };
    }, []);
    const onMouseLeave = (e) => {
        e.stopPropagation();
    };
    const labelRender = useCallback((node) => {
        const modelingNavDisplay = modelingNavDisplayRef.current;
        return labelRenderGlobal(node, {modelingNavDisplay});
    }, []);

    return <div className={currentPrefix}>
      <Form>
        <FormItem label="位置" >
          <RadioGroup
            value={link.type}
            onChange={e => _onChange(e, 'type')}
                >
            <Radio value='out' key="out">
                        外部
            </Radio>
            <Radio value='in' key="in">
                        内部
            </Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="链接地址">
          {
            link.type === 'out' ?
              <Input onMouseLeave={onMouseLeave} value={link.outValue} onChange={e => _onChange(e, 'outValue')} /> :
              <TreeSelect
                fieldNames={{
                                icon: 'icon',
                                defKey: 'id',
                                defName: 'defKey',
                            }}
                style={{zIndex: 1000}}
                nodeExpand
                leafSelected
                countable
                valueRender={renderValue}
                labelRender={labelRender}
                options={filterTreeData(getCurrentDataSource())}
                value={link.inValue}
                onChange={e => _onChange(e, 'inValue')}
              />
          }
        </FormItem>
      </Form>
    </div>;
}));
