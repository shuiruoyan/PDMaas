import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from 'react';
import {Checkbox, Form, Input, NumberInput, Select, Textarea} from 'components';
import {bizdatatyeNskey} from '../../../../lib/permission';
import {groupDataTypes} from '../../model/menu/tool';

export default React.memo(forwardRef(({ baseClass, ...restProps }, ref) => {
    const FormItem = Form.FormItem;
    const { dataSource, domainObj, readonly } = restProps;
    const [dbDataType, setDbDataType] = useState('');
    const [dataTypes, setDataTypes] = useState([]);
    const checkboxValueFormat = {
        checked: 1,
        unchecked: 0,
    };
    const [bizDomainObj, setBizDDomainObj] = useState(domainObj || {
        primaryKey: 0,
        notNull: 0,
        autoIncrement: 0,
        numScale: '',
        dataLen: '',
    });
    const handleCommonChange = useCallback((e, name) => {
        const targetValue = e.target.value || e.target.checked;
        return setBizDDomainObj(prevState => ({ ...prevState, [name]: targetValue }));
    }, []);
    // 当前语言的表单校验
    // eslint-disable-next-line max-len
    useEffect(() => {
        const baseDataType = bizDomainObj.baseDataType;
        // eslint-disable-next-line no-shadow
        const dataTypeItem = dataTypes.find(it => it.defKey === baseDataType);
        if (dataTypeItem) {
            const dbDataTypeObj = dataTypeItem.dbDataType;
            if(dbDataTypeObj) {
                const dbDialect = dataSource.profile.project.dbDialect;
                setDbDataType(dbDialect ? dbDataTypeObj[dbDialect] : '');
            }
        }
    }, [bizDomainObj.baseDataType, dataTypes]);
    useEffect(() => {
        const tempDataTypes = dataSource.profile.global.dataTypes || [];
        setDataTypes(groupDataTypes(tempDataTypes));
    }, [dataSource.profile.global.dataTypes]);
    useImperativeHandle(ref, () => ({
        getBizDomainObj: () => {
            const dataTypeItem =  (dataSource.profile?.global?.dataTypes || [])
                .find(it => it.defKey === bizDomainObj.baseDataType);
            const tempBizDomainObj = { ...bizDomainObj };
            if(!dataTypeItem?.requireLen || !tempBizDomainObj.dataLen) {
                delete tempBizDomainObj.dataLen;
            }
            if(!dataTypeItem?.requireScale || !tempBizDomainObj.numScale) {
                delete tempBizDomainObj.numScale;
            }
            return tempBizDomainObj;
        },
        getPrevObj: () => domainObj,
        resetBizDomainObj :() => {
            setBizDDomainObj({
                primaryKey: 0,
                notNull: 0,
                autoIncrement: 0,
                numScale: '',
                dataLen: '',
            });
        },
    }), [bizDomainObj]);
    return <div className={`${baseClass}-drawer`}>
      <Form labelWidth={170} nsKey={bizdatatyeNskey.U} readonly={readonly}>
        <FormItem label="业务数据域类型代码" require>
          {/* eslint-disable-next-line max-len */}
          <Input value={bizDomainObj.defKey} onChange={e => handleCommonChange(e, 'defKey')} />
        </FormItem>
        <FormItem label="业务数据域类型名称" require>
          {/* eslint-disable-next-line max-len */}
          <Input value={bizDomainObj.defName} onChange={e => handleCommonChange(e, 'defName')} />
        </FormItem>
        <FormItem label="基本数据类型" require>
          {/* eslint-disable-next-line max-len */}
          <Select
            notAllowEmpty
            value={bizDomainObj.baseDataType}
            allowClear={false}
            onChange={e => handleCommonChange(e, 'baseDataType')}>
            {
                dataTypes.map((it) => {
                    return <Select.Option value={it.defKey} disable={it.disable} style={it.style}>
                      {/*{`${it.defKey}-${it.defName}`}*/}
                      {it.label}
                    </Select.Option>;
                })
            }
          </Select>
        </FormItem>
        <FormItem label={`${dataSource.profile.project.dbDialect || 'MySQL'}数据类型`}>
          <Input value={dbDataType} disable />
        </FormItem>
        {(() => {
                const dataTypeItem = dataTypes.find(it => it.defKey === bizDomainObj.baseDataType);
                return <React.Fragment>
                  {(!dataTypeItem || dataTypeItem.requireLen) ? <FormItem label="长度">
                    <NumberInput value={bizDomainObj.dataLen} onChange={e => handleCommonChange(e, 'dataLen')} />
                  </FormItem> : null}
                  {(!dataTypeItem || dataTypeItem.requireScale) ? <FormItem label="小数点">
                    <NumberInput value={bizDomainObj.numScale} onChange={e => handleCommonChange(e, 'numScale')} />
                  </FormItem> : null}
                </React.Fragment>;
            })()}
        <FormItem label="主键">
          {/* eslint-disable-next-line max-len */}
          <Checkbox valueFormat={checkboxValueFormat} checked={bizDomainObj.primaryKey} onChange={e => handleCommonChange(e, 'primaryKey')} />
        </FormItem>
        <FormItem label="不为空">
          {/* eslint-disable-next-line max-len */}
          <Checkbox valueFormat={checkboxValueFormat} checked={bizDomainObj.notNull} onChange={e => handleCommonChange(e, 'notNull')} />
        </FormItem>
        <FormItem label="自增">
          {/* eslint-disable-next-line max-len */}
          <Checkbox valueFormat={checkboxValueFormat} checked={bizDomainObj.autoIncrement} onChange={e => handleCommonChange(e, 'autoIncrement')} />
        </FormItem>
        <FormItem label="备注说明">
          {/* eslint-disable-next-line max-len */}
          <Textarea value={bizDomainObj.intro} onChange={e => handleCommonChange(e, 'intro')} />
        </FormItem>
      </Form>
    </div>;
}));
