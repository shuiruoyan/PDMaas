import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {
    Button,
    CodeEditor,
    Form,
    IconTitle,
    Input,
    Message,
    Modal,
    openModal,
    SimpleTab,
    SVGPicker,
    Textarea,
} from 'components';
import {checkPermission} from '../../../../lib/permission';
import {classesMerge} from '../../../../lib/classes';
import {getFullStandTable} from '../../../../lib/json2code';

const FormItem = Form.FormItem;

// eslint-disable-next-line max-len
export default React.memo(forwardRef(({baseClass, programObj,
                                          nsKey, showHeader = true, ...restProps}, ref) => {
    const programCodeRef = useRef();
    const {dataTypes, defaultSvg, doImmersiveEdit, validateForm, codegen, readonly} = restProps;
    const [dataTypeArray, setDataTypeArray] = useState([]);
    const [programLangObj, setProgramLangObj] = useState(programObj || {});
    const setEmptyDom = (title, btnTitle, callback) => {
        return <div className={`${baseClass}-body-main-empty`}>
          <div>
            <div>{title}</div>
            <Button nsKey={nsKey} type="primary" onClick={() => callback()}>{btnTitle}</Button>
          </div>
        </div>;
    };
    // 通用 programLangObj 对象变更方法
    const _onProgramLangChange = useCallback((e, name) => {
        const targetValue = e.target ? e.target.value : e;
        setProgramLangObj(prevState => ({ ...prevState, [name]: targetValue }));
    }, []);
    // 处理数据类型变化
    const handleDataTypeChange = useCallback((e, typeItem) => {
        const tmpDefKey = e.target.value;
        setProgramLangObj(prevState => ({
            ...prevState,
            dataType: {
                ...prevState.dataType,
                [typeItem.id]: tmpDefKey,
            },
        }));
        setDataTypeArray(prevState => prevState.map((it) => {
            if (it.id === typeItem.id) {
                return {
                    ...it,
                    langDataType: { ...it.langDataType, [programLangObj.defKey]: tmpDefKey },
                };
            }
            return it;
        }));
    }, [programLangObj]);
    // 代码生成器状态变更
    const resetCodegen = useCallback((callback) => {
        setProgramLangObj(prevState => ({
            ...prevState,
            codegens: callback(prevState),
        }));
    });
    // 代码生成项状态变更
    // eslint-disable-next-line no-shadow
    const resetCodegenItem = useCallback((codegen, callback) => {
        setProgramLangObj(prevState => ({
            ...prevState,
            codegens: prevState.codegens.map((it) => {
                if (it.genKey === codegen.genKey) {
                    const genItems = it.genItems;
                    return {
                        ...it,
                        // eslint-disable-next-line max-len
                        genItems: callback(genItems),
                    };
                }
                return it;
            }),
        }));
    }, []);
    // 通用的模板变化变更代码生成项状态
    // eslint-disable-next-line no-shadow
    const resetGenItemTemplate = useCallback((codegen, itemTemplate, callback) => {
        resetCodegenItem(codegen, genItems => (typeof callback === 'function' ? callback(genItems, itemTemplate)
            // eslint-disable-next-line max-len
            : (() => genItems.map(it => (it.itemKey === callback.itemKey ? { ...it, itemTemplate } : it)))()));
    }, []);
    // 添加代码生成器
    const addOrEditCodeGen = useCallback(() => {
        const formData = [
            { key: 'genKey', label: '生成器代码', require: true, component: Input },
            { key: 'genIntro', label: '生成器说明', component: Textarea },
        ];
        // eslint-disable-next-line no-use-before-define
        commonAddOrEditCode(formData, ({ closeModal }) => {
            const originalArray = programLangObj.codegens || [];
            const prevObj = programCodeRef.current.getPrevObj();
            const codeDataObj = programCodeRef.current.getCodeDataObj();
            const validateArray = [{ key: 'genKey', label: '生成器代码'}];
            // eslint-disable-next-line max-len
            validateForm(codeDataObj, prevObj, { notNullArr: validateArray, notRepeatArr: validateArray, originalArray }).then(() => {
                resetCodegen((prevState) => {
                    const array = (prevState.codegens || []);
                    array.push(codeDataObj);
                    return array;
                });
                closeModal();
            }).catch((error) => {
                let displayTitle = '';
                validateArray.forEach((it) => {
                    error[it.key]?.forEach((p) => {
                        displayTitle += ` ${p.message}\n`;
                    });
                });
                Modal.error({
                    title: '错误',
                    message: displayTitle,
                });
            });
        });
    }, [programLangObj]);
    // 添加代码生成项
    // eslint-disable-next-line no-shadow
    const addOrEditCodeGenItem = useCallback((codegen) => {
        const formData = [
            { key: 'itemKey', label: '生成项代码', require: true, component: Input },
            { key: 'itemIntro', label: '生成项说明', component: Textarea },
        ];
        // eslint-disable-next-line no-use-before-define
        commonAddOrEditCode(formData, ({ closeModal }) => {
            const originalArray = codegen.genItems || [];
            const prevObj = programCodeRef.current.getPrevObj();
            const codeDataObj = programCodeRef.current.getCodeDataObj();
            const validateArray = [{ key: 'itemKey', label: '生成项代码'}];
            // eslint-disable-next-line max-len
            validateForm(codeDataObj, prevObj, { notNullArr: validateArray, notRepeatArr: validateArray, originalArray }).then(() => {
                resetCodegenItem(codegen, (genItems) => {
                    const array = (genItems || []);
                    array.push(codeDataObj);
                    return array;
                });
                closeModal();
            }).catch((error) => {
                let displayTitle = '';
                validateArray.forEach((it) => {
                    error[it.key]?.forEach((p) => {
                        displayTitle += ` ${p.message}\n`;
                    });
                });
                Modal.error({
                    title: '错误',
                    message: displayTitle,
                });
            });
        });
    }, [programLangObj]);
    const parentSimpleRef = useRef();
    // 移除代码生成器
    // eslint-disable-next-line no-shadow
    const removeCodeGen = (codegen) => {
        Modal.confirm({
            title: '提示',
            message: `确定删除当前 [${codegen.genKey}] 代码生成器吗`,
            okText: '确定',
            cancelText: '取消',
            onOk: () => {
                const genItems = codegen.genItems;
                if (genItems && genItems.length > 0) {
                    Message.error({ title: '请删除下方所有生成项，再移除代码生成器'});
                } else {
                    resetCodegen((prevState) => {
                        const codegens = prevState.codegens;
                        return codegens.filter(it => it.genKey !== codegen.genKey);
                    });
                    // eslint-disable-next-line no-use-before-define
                    parentSimpleRef.current?.setActiveState(tabOptions[0].key || '');
                }
            },
        });
    };
    // 移除代码生成项
    // eslint-disable-next-line no-shadow
    const removeCodeGenItem = (codegen, codegenItem, childrenRef) => {
        Modal.confirm({
            title: '提示',
            message: `确定删除当前 [${codegenItem.itemKey}] 代码生成单项吗`,
            okText: '确定',
            cancelText: '取消',
            // eslint-disable-next-line max-len
            onOk: () => {
                resetCodegenItem(codegen,
                    () => codegen.genItems.filter(o => o.itemKey !== codegenItem.itemKey));
                childrenRef.current?.setActiveState(codegen.genItems[0].itemKey || '');
            },
        });
    };
    // 处理代码生成项变化
    // eslint-disable-next-line no-shadow
    const handleCodegenItemChange = useCallback((e, codegen, genItem) => {
        const itemTemplate = e.target.value;
        resetGenItemTemplate(codegen, itemTemplate, genItem);
    }, []);
    // 沉浸式编辑操作
    // eslint-disable-next-line no-shadow
    const toImmersiveEdit = useCallback((codegen, codegenItem) => {
        if(!checkPermission(nsKey)) {
            return;
        }
        doImmersiveEdit({
            key: codegenItem.itemKey,
            dataObj: codegenItem,
            exampleData: getFullStandTable(),
            // eslint-disable-next-line max-len
            _onConfirmViewData: templateStr => resetGenItemTemplate(codegen, templateStr, codegenItem),
        });
    }, []);
    const commonAddOrEditCode = useCallback((formData, confirmCode) => {
        let modal = null;
        const closeModal = () => modal.close();
        const doConfirmCode = () => {
            confirmCode && confirmCode({ closeModal });
        };
        modal = openModal(<AddOrEditCode ref={programCodeRef} formData={formData} />, {
            title: '新增代码生成器',
            bodyStyle: {
                width: '40%',
            },
            buttons: [
              <Button onClick={closeModal}>取消</Button>,
              <Button type="primary" onClick={doConfirmCode}>确定</Button>,
            ],
        });
    }, []);
    const tabOptions = useMemo(() => {
        const childrenSimpleTabRef = useRef();
        // eslint-disable-next-line max-len
        return !(programLangObj.codegens && Array.isArray(programLangObj.codegens) && programLangObj.codegens.length > 0) ? [{}] : programLangObj.codegens?.map(it => it && ({
            key: it.genKey,
            title: it.genKey,
            extra: readonly ? <></> : <div className={`${baseClass}-body-main-tab`}>
              <IconTitle nsKey={nsKey} onClick={() => addOrEditCodeGen()} icon="icon-oper-plus"/>
              <IconTitle nsKey={nsKey} onClick={() => removeCodeGen(it)} icon="icon-oper-delete"/>
            </div>,
            // eslint-disable-next-line max-len
            content: (it.genItems && Array.isArray(it.genItems) && it.genItems.length > 0) ? <SimpleTab
              ref={childrenSimpleTabRef}
              defaultActive={it.genItems[0].itemKey || ''}
              options={it.genItems.map(o => o && ({
                    key: o.itemKey,
                    title: o.itemKey,
                    extra: readonly ? <></> : <div className={`${baseClass}-body-main-tab`}>
                      <span
                        className={classesMerge({
                            [`${baseClass}-body-main-tab-extra`]: true,
                            [`${baseClass}-body-main-tab-extra-disable`]: !checkPermission(nsKey),
                        })}
                        onClick={() => toImmersiveEdit(it, o)}>沉浸式编辑</span>
                      <IconTitle nsKey={nsKey} onClick={() => addOrEditCodeGenItem(it)} icon="icon-oper-plus"/>
                      <IconTitle nsKey={nsKey} onClick={() => removeCodeGenItem(it, o, childrenSimpleTabRef)} icon="icon-oper-delete"/>
                    </div>,
                    content: <CodeEditor
                      readOnly={readonly}
                      nsKey={nsKey}
                      value={o.itemTemplate}
                      onChange={e => handleCodegenItemChange(e, it, o)}
                      width="100%"
                      height="100%"/>,
                }))}/> : setEmptyDom('当前暂无生成器，点击下方按钮进行创建', '新建代码生成器', () => addOrEditCodeGenItem(it)),
        }));
    }, [programLangObj]);
    useEffect(() => setDataTypeArray(dataTypes), [dataTypes]);
    useEffect(() => {
        const dataType = {};
        dataTypeArray.forEach((it) => {
            const langDataType = it.langDataType;
            const defKey = programLangObj.defKey;
            dataType[it.id] = langDataType[defKey] || '';
        });
        setProgramLangObj(prevState => ({...prevState, dataType}));
    }, [dataTypeArray]);
    useImperativeHandle(ref, () => ({
        getProgramLangObj: () => ({ ...programLangObj, dataTypes: dataTypeArray }),
        getPrevObj: () => programObj,
        getCalculatedDataTypes: () => dataTypeArray,
    }), [programLangObj, dataTypeArray, programObj]);
    return <div className={baseClass}>
      {showHeader ? <div className={`${baseClass}-header`}>
        <div className={`${baseClass}-header-svg`}>
          <SVGPicker
            width="100"
            height="100"
            defaultValue={programLangObj?.icon || defaultSvg}
            onChange={e => _onProgramLangChange(e, 'icon')}/>
        </div>
        <div className={`${baseClass}-header-form`}>
          <Form nsKey={nsKey} readonly={readonly}>
            <FormItem label="编程语言" cols={2} require>
              <Input
                value={programLangObj.defKey}
                onChange={e => _onProgramLangChange(e, 'defKey')}/>
            </FormItem>
          </Form>
        </div>
      </div> : null}
      <div className={`${baseClass}-body`}>
        <div className={`${baseClass}-body-template`}>
          <h3>配置代码生成器</h3>
          <div className={`${baseClass}-body-main`}>
            {!(programLangObj.codegens && Array.isArray(programLangObj.codegens) && programLangObj.codegens.length > 0) ? setEmptyDom('暂无代码生成器，点击下方按钮进行创建', '新建代码生成器', addOrEditCodeGen)
                        // eslint-disable-next-line max-len
                        : (() => {
                            let genkey = programLangObj.codegens[0].genKey || '';
                            if (programLangObj && codegen) {
                                genkey = codegen.genKey;
                            }
                            return <SimpleTab
                              ref={parentSimpleRef}
                              defaultActive={genkey}
                              options={tabOptions}/>;
                        })()}
          </div>
        </div>
        <div className={`${baseClass}-body-form`}>
          <h3>基本数据类型</h3>
          <div className={`${baseClass}-body-main`}>
            {
                        dataTypeArray.map(it => <div className={`${baseClass}-body-form-item`}>
                          <span>{it.defKey}-{it.defName}</span>
                          <Input
                            readOnly={readonly}
                            nsKey={nsKey}
                            value={programLangObj.dataType?.[it.id] || ''}
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

const AddOrEditCode = React.memo(forwardRef(({
                                                 dataObj,
                                                 formData,
                                             }, ref) => {
    // eslint-disable-next-line max-len
    const [codeDataObj, setCodeDataObj] = useState(dataObj || {});
    // eslint-disable-next-line max-len
    useImperativeHandle(ref, () => ({ getCodeDataObj: () => codeDataObj, getPrevObj: () => dataObj }), [codeDataObj, dataObj]);
    const commonChange = useCallback((e, name) => {
        const targetValue = e.target.value;
        setCodeDataObj(prevState => ({...prevState, [name]: targetValue }));
    }, []);
    return <div style={{width: '100%', height: '140px'}}>
      <Form>
        {
              // eslint-disable-next-line max-len
              formData.map((it, index) => <FormItem key={index} label={it.label} require={it.require || false}>
                {(() => {
                      const Com = it.component;
                      // eslint-disable-next-line max-len
                      return <Com value={codeDataObj[it.key]} onChange={e => commonChange(e, it.key)} />;
                  })()}
              </FormItem>)
          }
      </Form>
    </div>;
}));
