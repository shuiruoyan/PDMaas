import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Form, Input, Textarea, TreeSelect, Message} from 'components';
import _ from 'lodash';
import {getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import Content from './Content';
import {getId} from '../../../../../lib/idpool';
import {getEmptyField} from '../../../../../lib/utils';
import {_myLabelRender, _myValueRender, computeTo, myArray2tree} from '../../menu/tool';
import {tree2array} from '../../../../../lib/tree';

// eslint-disable-next-line max-len
export default React.memo(forwardRef(({ treeData, dataSource, selectedNode, type,
                                          update = false, getCurrentStandard,
                                          getCurrentDataSource, user}, ref) => {
    const reserveWord = user.reserveWord || [];
    const FormItem = Form.FormItem;
    // const RadioGroup = Radio.RadioGroup;
    const [tree, setTree] = useState(
        myArray2tree(tree2array(treeData).filter(d => !d.bindSchema)) || [],
    );
    const treeRef = useRef([]);
    treeRef.current = [...(tree || [])];
    const fieldsRef = useRef(null);
    const [quickInputVal, setQuickInputVal] = useState('');
    const [logicEntityObj, setLogicEntityObj] = useState({
        // to: selectedNode?.parentId || selectedNode?.id?.split('_')[0],
        to: computeTo(selectedNode, treeRef.current),
        fields: update ? selectedNode?.fields : [],

    });
    const preDefKeyRef = useRef('');
    useEffect(() => {
        if(update) {
            setLogicEntityObj(pre => ({
                ...pre,
                defKey: selectedNode?.defKey || '',
                defName: selectedNode?.defName || '',
                intro: selectedNode?.intro || '',
            }));
        }
    }, []);
    // const defaultData = dataSource.
    const prefix = getPrefix('container-model-entity-logic-edit');
    const handleChange = useCallback((e, name) => {
        const targetValue = e.target.value;
        setLogicEntityObj(prevState => ({...prevState, [name]: targetValue}));
    }, []);
    const handleQuickInputChange = useCallback((e) => {
        const targetValue = e.target.value;
        setQuickInputVal(targetValue);
    }, []);
    // 解析快速录入的值
    const analyzeStrToEntity = useCallback((quickEntity) => {
        const result = quickEntity.replace(/\s/g, '')
            .replace(/[；;]/g, ',')
            .replaceAll('，', ',')
            .replaceAll('）', ')')
            .replaceAll('（', '(');
        if (result.match(/(?<=\().*(?=\))/)) {
            let tmpDefNames = _.compact(_.uniq(result.match(/(?<=\().*(?=\))/)[0]?.split(',') || []));
            if(tmpDefNames.length !== 0) {
                let ids = getId(tmpDefNames.length);
                if (ids.length === 0) {
                    Message.warring({title: '操作太快了'});
                } else {
                    const tmpFieldsArr = tmpDefNames.map((t, index) => ({
                        ...getEmptyField(),
                        id: ids[index],
                        defName: t,
                    }));
                    setLogicEntityObj(pre => ({
                        ...pre,
                        fields: tmpFieldsArr,
                        defName: result.split('(')[0],
                    }));
                    fieldsRef.current.setFields([...tmpFieldsArr]);

                }
            }
            // }
            // const tmpFieldsArr =
            // (result.match(/(?<=\().*(?=\))/)[0]?.split(',') || []).map(it => ({
            //     id: Math.uuid(),
            //     defName: it,
            //     defKey: '',
            // }));
            // eslint-disable-next-line no-param-reassign
            // fieldsRef.current.setFields({ fields: tmpFieldsArr });
        }
    }, [quickInputVal]);
    // 处理字段变化
    const handleFieldsChange = useCallback(() => {
        setLogicEntityObj(prevState => ({...prevState, fields: fieldsRef.current.getFields()}));
    }, []);
    useImperativeHandle(ref, () => {
        return {
            validate: () => {
                const keyWord = reserveWord
                    .find(r => r.keyWord?.toLocaleLowerCase() ===
                        logicEntityObj?.defKey?.toLocaleLowerCase() ||
                        r.keyWord?.toLocaleLowerCase()
                        === logicEntityObj?.defName?.toLocaleLowerCase());
                const keyWordFields = reserveWord.map((r) => {
                    let sameType;
                    const field = fieldsRef.current?.getFields()?.find((f) => {
                        if(r.keyWord?.toLocaleLowerCase()
                            === f.defName?.toLocaleLowerCase()) {
                            sameType = 'defName';
                            return true;
                        } else if(r.keyWord?.toLocaleLowerCase()
                            === f.defKey?.toLocaleLowerCase()) {
                            sameType = 'defKey';
                            return true;
                        }
                        return false;
                    });
                    if(field) {
                        return {
                            keyWord: r,
                            field,
                            type: sameType,
                        };
                    }
                    return null;
                }).filter(d => !!d);
                if(keyWord) {
                    const name = keyWord.keyWord?.toLocaleLowerCase() === logicEntityObj?.defKey?.toLocaleLowerCase() ? 'defKey' : 'defName';
                    Message.error({title: `${name === 'defName' ? '显示名称' : '代码'}[${name === 'defName' ? logicEntityObj?.defName : logicEntityObj?.defKey}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
                    return false;
                }
                if(keyWordFields.length > 0) {
                    Message.error({title: `字段代码/名称[${[...new Set(keyWordFields.map(f => f.field[f.type]))].join('/')}]与数据库关键字:${[...new Set(keyWordFields.map(f => f.keyWord.keyWord))].join('/')}(${[...new Set(keyWordFields.map(f => f.keyWord.intro))].join('/')})冲突，请重新命名`});
                    return false;
                }
                return true;
            },
            getData: () => {
                return {
                    ...logicEntityObj,
                    type,
                    to: logicEntityObj.to === '_UNCATE' ? null : logicEntityObj.to,
                    fields: fieldsRef.current?.getFields(),
                };
            },
            resetTree: (newTree) => {
                setTree(myArray2tree(tree2array(newTree).filter(d => !d.bindSchema)) || []);
            },
            restData: () => {
                setLogicEntityObj({});
            },
        };
    }, [logicEntityObj]);
    useEffect(() => {
        analyzeStrToEntity(quickInputVal);
    }, [quickInputVal]);
    const _onFocus = () => {
        preDefKeyRef.current = logicEntityObj.defKey;
    };
    const _onBlur = (e) => {
        const targetValue = e.target.value;
        const tempValue = targetValue.replace(/[-—]/g, '_');
        if(tempValue === '' ||  /^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#.\u4e00-\u9fff]*$/.test(tempValue)) {
            setLogicEntityObj(prevState => ({...prevState, defKey: tempValue}));
        } else {
            setLogicEntityObj(prevState => ({...prevState, defKey: preDefKeyRef.current}));
            Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文,.'});
        }
    };
    const _labelRender = useCallback((node) => {
        return _myLabelRender(node);
    }, []);

    const _valueRender = useCallback((node) => {
        return _myValueRender(node);
    }, []);

    return <div className={`${prefix}`}>
      <div className={`${prefix}-header`}>
        <Form>
          {
            update || <>
              <FormItem label="快速录入">
                <Textarea
                  style={{
                    resize: 'none',
                  }}
                  value={quickInputVal}
                  onChange={handleQuickInputChange}
                  placeholder="例如：学生(姓名，性别，年龄，身高，体重)" />
              </FormItem>
              <hr className={`${prefix}-hr`} />
              <FormItem label="归属分类" >
                {/* eslint-disable-next-line max-len */}
                <TreeSelect
                  countable
                  labelRender={_labelRender}
                  valueRender={_valueRender}
                  countParent
                  value={logicEntityObj.to}
                  options={tree}
                  onChange={e => handleChange(e, 'to')} />
              </FormItem>
            </>
          }
          {/*<FormItem label="属性排列方式" cols={2}>*/}
          {/*  <RadioGroup*/}
          {/*    value={logicEntityObj.fieldShowWay}*/}
          {/*    name="attrPermWay"*/}
          {/*    onChange={e => handleChange(e, 'fieldShowWay')}>*/}
          {/*    <Radio value="L">列表</Radio>*/}
          {/*    <Radio value="C">紧凑</Radio>*/}
          {/*    <span className={`${prefix}-tips`}>(列表：每个属性显示为独立行; 紧凑：属性不换行紧凑排列)</span>*/}
          {/*  </RadioGroup>*/}
          {/*</FormItem>*/}
          <FormItem label="代码" cols={2} require>
            {/* eslint-disable-next-line max-len */}
            <Input autoFocus value={logicEntityObj.defKey} maxLength={64} toggleCase onChange={e => handleChange(e, 'defKey')} onBlur={_onBlur} onFocus={_onFocus} />
          </FormItem>
          <FormItem label="显示名称" cols={2}>
            {/* eslint-disable-next-line max-len */}
            <Input value={logicEntityObj.defName} maxLength={64} onChange={e => handleChange(e, 'defName')} />
          </FormItem>
          <FormItem label="备注说明" cols={4}>
            {/* eslint-disable-next-line max-len */}
            <Textarea value={logicEntityObj.intro} maxLength={500} style={{ resize: 'none' }} onChange={e => handleChange(e, 'intro')} />
          </FormItem>
        </Form>
      </div>
      <hr className={`${prefix}-hr`} />
      {
        update ||
        <div className={`${prefix}-footer`}>
          <Content
            user={user}
            getCurrentDataSource={getCurrentDataSource}
            defaultDataSource={dataSource}
            getCurrentStandard={getCurrentStandard}
            ref={fieldsRef}
            profile={dataSource.profile}
            onChange={handleFieldsChange}
            defaultData={logicEntityObj}/>
        </div>
      }
    </div>;
}));
