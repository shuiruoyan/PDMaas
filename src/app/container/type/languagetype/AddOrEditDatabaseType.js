import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useState} from 'react';
import {CodeEditor, Form, Input, SimpleTab, SVGPicker} from 'components';
import _ from 'lodash';

export default React.memo(forwardRef(({baseClass, databaseObj,
                                          nsKey, ...restProps}, ref) => {
    const FormItem = Form.FormItem;
    const [dataTypeArray, setDataTypeArray] = useState([]);
    const {dataTypes, defaultSvg, doImmersiveEdit, readonly} = restProps;
    const defaultDbDataTypes = [...(dataTypes || [])].reduce((previousValue, currentValue) => {
        return {
            ...previousValue,
            [currentValue.defKey]: currentValue.dbDataType[databaseObj?.defKey],
        };
    }, {});
    const [dbDialectObj, setDbDialectObj] = useState(databaseObj || {});
    const dbCodeOptions = [
        {
            tabKey: 'codeTemplate',
            tabName: '代码模板',
            tabChildren: [
                {label: '表-新建', value: 'tableCreate'},
                {label: '表-修改', value: 'tableUpdate'},
                {label: '表-删除', value: 'tableDelete'},
                {label: '字段-添加', value: 'columnCreate'},
                {label: '字段-修改', value: 'columnUpdate'},
                {label: '字段-删除', value: 'columnDelete'},
                {label: '索引-添加', value: 'indexCreate'},
                {label: '索引-修改', value: 'indexUpdate'},
                {label: '索引-删除', value: 'indexDelete'},
            ],
        },
    ];
    const _onDbDialectChange = useCallback((e, name) => {
        const targetValue = e.target ? e.target.value : e;
        setDbDialectObj(prevState => ({ ...prevState, [name]: targetValue }));
    }, []);
    const handleDataTypeChange = useCallback((e, dialectItem) => {
        const tmpDefKey = e.target.value;
        setDbDialectObj(prevState => ({
            ...prevState,
            dataType: {
                ...prevState.dataType,
                [dialectItem.id]: tmpDefKey,
            },
        }));
    }, [dbDialectObj]);
    const toImmersiveEdit = useCallback((optionItem) => {
        doImmersiveEdit({
            key: optionItem.value,
            dataObj: dbDialectObj,
            _onConfirmViewData: (templateStr) => {
                setDbDialectObj(prevState => ({ ...prevState, [optionItem.value]: templateStr }));
            },
        });
    }, [dbDialectObj]);
    useEffect(() => setDataTypeArray(dataTypes), [dataTypes]);
    useEffect(() => {
        const dataType = {};
        dataTypeArray.forEach((it) => {
            const dbDataType = it.dbDataType;
            const defKey = dbDialectObj.defKey;
            dataType[it.id] = dbDataType[defKey] || '';
        });
        setDbDialectObj(prevState => ({...prevState, dataType}));
    }, [dataTypeArray]);
    useImperativeHandle(ref, () => ({
        getDbDialectObj: () => ({ ...dbDialectObj, dataTypes: dataTypeArray }),
        getPrevObj: () => databaseObj,
        getCalculatedDataTypes: () => dataTypeArray,
        getUpdateDataTypeKeys: () => {
            const currentDbDataTypes = [...(dataTypeArray || [])]
                .reduce((previousValue, currentValue) => {
                    return {
                        ...previousValue,
                        [currentValue.defKey]: currentValue.dbDataType[databaseObj?.defKey],
                    };
                }, {});
            return _.filter(_.keys(currentDbDataTypes),
                key => !_.isEqual(currentDbDataTypes[key], defaultDbDataTypes[key]));
        },
        updateDbDialect: (data) => {
            const importDataType = data.dataTypes || [];
            setDbDialectObj((prevState) => {
                return {
                    ...prevState,
                    ...data.dbDialect,
                    dataType: dataTypes.reduce((p, n) => {
                        const currentType = importDataType
                            .find(d => d.defKey?.toLocaleLowerCase?.()
                                === n.defKey?.toLocaleLowerCase?.());
                        if(currentType) {
                            return {
                                ...p,
                                [n.id]: currentType.dbDataType,
                            };
                        }
                        return p;
                    }, prevState.dataType),
                };
            });
            setDataTypeArray(prevState => prevState.map((it) => {
                const currentType = importDataType
                    .find(d => d.defKey?.toLocaleLowerCase?.()
                        === it.defKey?.toLocaleLowerCase?.());
                if (currentType) {
                    return {
                        ...it,
                        dbDataType: {
                            ...it.dbDataType,
                            [data.dbDialect.defKey]: currentType.dbDataType,
                        },
                    };
                }
                return it;
            }));
        },
    }), [dbDialectObj, dataTypeArray, databaseObj]);
    return <div className={baseClass}>
      <div className={`${baseClass}-header`}>
        {/* eslint-disable-next-line react/no-danger */}
        <div className={`${baseClass}-header-svg`}>
          <SVGPicker width="100" height="100" value={dbDialectObj?.icon || defaultSvg} onChange={e => _onDbDialectChange(e, 'icon')} />
        </div>
        <div className={`${baseClass}-header-form`}>
          <Form nsKey={nsKey} labelWidth={130} readonly={readonly}>
            <FormItem label="数据库品牌代码" cols={2} require>
              <Input value={dbDialectObj.defKey} maxLength={16} onChange={e => _onDbDialectChange(e, 'defKey')}/>
            </FormItem>
          </Form>
        </div>
      </div>
      <div className={`${baseClass}-body`}>
        <div className={`${baseClass}-body-template`}>
          <h3>定义代码模板</h3>
          <div className={`${baseClass}-body-main`}>
            <SimpleTab options={dbCodeOptions.map(it => ({
                key: it.tabKey,
                title: it.tabName,
                content: <SimpleTab options={it.tabChildren.map(child => ({
                    key: child.value,
                    title: child.label,
                    extra: <span
                      className={`${baseClass}-body-main-tab-extra`}
                      onClick={() => toImmersiveEdit(child)}>沉浸式编辑</span>,
                    content: <CodeEditor
                      readOnly={readonly}
                      nsKey={nsKey}
                      key={child.value}
                      value={dbDialectObj[child.value] || ''}
                      width="100%"
                      height="100%"
                      onChange={e => _onDbDialectChange(e, child.value)}/>,
                }))}/>,
            }))}/>
          </div>
        </div>
        <div className={`${baseClass}-body-form`}>
          <h3>基本数据类型</h3>
          <div className={`${baseClass}-body-main`}>
            {
                      dataTypeArray.map(it => <div className={`${baseClass}-body-form-item`}>
                        <span>{it.defKey}-{it.defName}</span>
                        <Input
                          nsKey={nsKey}
                          readOnly={readonly}
                          value={dbDialectObj.dataType?.[it.id] || ''}
                          onChange={e => handleDataTypeChange(e, it)}/>
                      </div>)
            }
          </div>
        </div>
      </div>
      <div className={`${baseClass}-bottom`}>
        <div>对已在标签页中打开的表，重新打开后可生效。</div>
        <div>对线上其他用户，需要刷新整个项目后生效。</div>
      </div>
    </div>;
}));
