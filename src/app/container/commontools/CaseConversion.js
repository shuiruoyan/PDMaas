import React, {forwardRef, useEffect, useRef} from 'react';
import { Button, Radio, Message } from 'components';
import _ from 'lodash';
import {filterSelectNodes} from '../model/menu/rightMenu';
import {checkFrom } from '../../../lib/utils';
import {COMPONENT, ENTITY, PROFILE, WS} from '../../../lib/constant';
import CommonToolTree from './CommonToolTree';


const CaseConversion = React.memo(forwardRef(({ baseClass,
                                                  labelRender, treeData, setIsFlat,
                                                  isFlat, progress,
                                                  _sendData, flatTreeData}) => {
    const filterDataRef = useRef([]);
    const commonToolTreeRef = useRef();
    const treeDataRef = useRef([...flatTreeData]);

    treeDataRef.current = [...(flatTreeData || [])];

    const RadioGroup = Radio.RadioGroup;
    const rightDataRef = useRef({
        entityCode : {
            title: '实体/表-代码',
            buttons: [
                {title: '全部大写', key: 'upper'},
                {title: '全部小写', key: 'lower'},
            ],
            currentActive: 'upper',
        },
        fieldCode :{
            title: '属性/字段-代码',
            buttons: [
                {title: '全部大写', key: 'upper'},
                {title: '全部小写', key: 'lower'},
            ],
            currentActive: 'upper',
        },
        indexCode:{
            title: '索引-代码',
            buttons: [
                {title: '全部大写', key: 'upper'},
                {title: '全部小写', key: 'lower'},
            ],
            currentActive: 'upper',
        },
    });

    useEffect(() => {

    }, []);

    const _buttonClick = (e, btn, key) => {
        const status = rightDataRef.current[key].currentActive;
        filterDataRef.current = filterSelectNodes(
            commonToolTreeRef.current?.getCheckValue(), treeDataRef.current)
            .filter(c => c.current !== undefined);
        if(filterDataRef.current.length === 0) {
            Message.error({title: '当前无选中实体！'});
            return;
        }
        let sendDataArray;
        switch (key) {
            case 'entityCode':
                sendDataArray = filterDataRef.current.map((f) => {
                    return {
                        event: WS.ENTITY.MOP_ENTITY_UPDATE,
                        defKey: f.current.defKey,
                        payload: [{
                            hierarchyType: PROFILE.USER.FLAT,
                            updateKeys: 'defKey',
                            pre: {
                                id: f.current.id,
                                ..._.omit(checkFrom(f), ['parentId']),
                                data: {
                                    defKey: f?.current?.defKey,
                                    defName: f?.current?.defName,
                                    id: f?.current?.id,
                                    parentId: 'base_flat',
                                },
                            },
                            next: {
                                id: f.current.id,
                                from: f.current.id,
                                to: f.current.parentId === '_UNCATE' ?
                                    null : 'base_flat',
                                type: COMPONENT.TREE.SUB,
                                data: {
                                    defKey: status === 'upper' ?
                                        f.current.defKey?.toUpperCase() || '' :
                                        f.current.defKey?.toLowerCase() || '',
                                },
                            },
                        }],
                    };
                });
                _sendData(sendDataArray.filter((f) => {
                    return f.payload[0].next.data.defKey !== f.payload[0].pre.data.defKey;
                }), key,sendDataArray.filter((f) => {
                    return f.payload[0].next.data.defKey === f.payload[0].pre.data.defKey;
                }).length);
                break;
            case 'fieldCode':
                sendDataArray = filterDataRef.current.filter((f) => {
                    return f.current.type !== ENTITY.TYPE.C && f.current.fields.length > 0;
                }).map((f) => {
                    return {
                        event: WS.FIELD.MOP_FIELD_UPDATE,
                        defKey: f.current.defKey,
                        payload: [{
                            data: f.current.fields.map((field) => {
                                return {
                                    id: field.id,
                                    defKey: field.defKey,
                                    defName: field.defName,
                                    updateKeys: 'defKey',
                                    pre: { defKey: field.defKey},
                                    next: {
                                        defKey: status === 'upper' ?
                                            field.defKey?.toUpperCase() || '' :
                                            field.defKey?.toLowerCase() || '',
                                    },
                                };
                            }).filter((fl) => {
                                return fl.next.defKey !== fl.pre.defKey;
                            }),
                            defKey: f.current.defKey,
                            defName: f.current.defName,
                            entityId: f.current.id,
                            entityType: f.current.type,
                        }],
                    };
                }).filter((f) => {
                    return f.payload[0].data.length > 0;
                });
                _sendData(sendDataArray, key, filterDataRef.current.length - sendDataArray.length);
                break;
            case 'indexCode':
                sendDataArray = filterDataRef.current.filter((f) => {
                    return f.current.type === ENTITY.TYPE.P && f.current.indexes.length > 0;
                }).map((f) => {
                    return {
                        event: WS.INDEX.MOP_INDEX_UPDATE,
                        defKey: f.current.defKey,
                        payload: [{
                            data: f.current.indexes.map((index) => {
                                return {
                                    id: index.id,
                                    defKey: index.defKey,
                                    defName: index.defName,
                                    updateKeys: 'defKey',
                                    pre: { defKey: index.defKey},
                                    next: {
                                        defKey: status === 'upper' ?
                                            index.defKey?.toUpperCase() || '' :
                                            index.defKey?.toLowerCase() || '',
                                    },
                                };
                            }).filter((fl) => {
                                return fl.next.defKey !== fl.pre.defKey;
                            }),
                            defKey: f.current.defKey,
                            defName: f.current.defName,
                            entityId: f.current.id,
                            entityType: f.current.type,
                        }],
                    };
                }).filter((f) => {
                    return f.payload[0].data.length > 0;
                });
                _sendData(sendDataArray, key, filterDataRef.current.length - sendDataArray.length);
                break;
            default:
                break;
        }
    };
    const buttonStyle = {
        height: '45px',
        width: '125px',
        lineHeight: '33px',
        fontSize: '16px',
    };
    const _buttonGroupClick = (e, itemKey) => {
        rightDataRef.current = {
            ...rightDataRef.current,
            [itemKey]: {
                ...rightDataRef.current[itemKey],
                currentActive: e.target.value,
            },
        };
    };
    const currentMenu = [
        {key: ENTITY.TYPE.L, name: '逻辑模型'},
        {key: ENTITY.TYPE.C, name: '概念模型'},
    ];
    return <div className={`${baseClass}-case-conversion`}>
      <div className={`${baseClass}-case-conversion-left`}>
        <CommonToolTree
          ref={commonToolTreeRef}
          baseClass={baseClass}
          treeData={treeData}
          setIsFlat={setIsFlat}
          isFlat={isFlat}
          labelRender={labelRender}
          currentMenu={currentMenu}
        />
      </div>
      <div className={`${baseClass}-case-conversion-right`}>
        {
                Object.keys(rightDataRef.current).map((key) => {
                    const item = rightDataRef.current[key];
                    return <div
                      key={key}
                      className={`${baseClass}-case-conversion-right-item`}
                      style={{
                        height: `${100 / Object.keys(rightDataRef.current).length}%`,
                    }}
                  >
                      <div className={`${baseClass}-case-conversion-right-item-title`}>
                        <span>{item.title}</span>
                        {
                            key === progress.key &&
                            <span>
                              <span>总数：{progress.totalNumber}</span>
                              <span>
                                {
                                      progress.currentDataKey !== ''
                                      && `当前正在执行：${progress.currentDataKey}`
                                  }
                              </span>
                              <span>已完成：{progress.completedNumber}</span>
                            </span>
                        }
                      </div>
                      <div className={`${baseClass}-case-conversion-right-item-body`}>
                        <RadioGroup
                          defaultValue={item.currentActive}
                          onChange={(e) => {
                              _buttonGroupClick(e, key);
                          }}
                          >
                          {
                              item.buttons.map((btn) => {
                                  return <Radio
                                    disable={progress.disable}
                                    style={buttonStyle}
                                    value={btn.key}
                                    key={btn.key}>
                                    {btn.title}</Radio>;
                                  })
                              }
                        </RadioGroup>
                        {/*<ButtonGroup*/}
                        {/*  defaultActive={item.currentActive}*/}
                        {/*  onClick={(e, btn) => {*/}
                        {/*      _buttonGroupClick(e, btn, key);*/}
                        {/*  }}*/}
                        {/*>*/}
                        {/*  {*/}
                        {/*    item.buttons.map((btn) => {*/}
                        {/*        return <Button*/}
                        {/*          disable={progress.disable}*/}
                        {/*          style={buttonStyle}*/}
                        {/*          key={btn.key}>*/}
                        {/*          {btn.title}</Button>;*/}
                        {/*    })*/}
                        {/*  }*/}
                        {/*</ButtonGroup>*/}
                        <Button
                          style={{
                            ...buttonStyle,
                          }}
                          type="primary"
                          disable={progress.disable}
                          onClick={(e, btn) => _buttonClick(e, btn, key)}
                        >开始转换</Button>
                      </div>
                    </div>;
              })
          }
      </div>
    </div>;
}));

CaseConversion.orderValue = 1;

export default CaseConversion;
