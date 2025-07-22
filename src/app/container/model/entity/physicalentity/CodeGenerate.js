import {Button, CodeEditor, Icon, openModal, Tooltip, Tree, Message, Modal} from 'components';
import _ from 'lodash';
import React, {forwardRef, useCallback, useImperativeHandle, useEffect, useRef, useState, useContext} from 'react';
import {filterEntityHelpField} from 'dataSource_utils';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import ImmersiveEdit from './ImmersiveEdit';
import {getCache, getSimpleUserCache, setCache} from '../../../../../lib/cache';
import {getProjectTableLangCode, transformEntityLangDataType} from '../../../../../lib/utils';
import {LOADING, NORMAL} from '../../../../../lib/constant';
import {checkPermission, codegenNsKey, dbTypeNsKey} from '../../../../../lib/permission';
import {ViewContent} from '../../../../../lib/context';
import {updateProgram} from '../../../../../lib/profile_data_handling';

export default React.memo(forwardRef(({ dataSource, entityData,
                                          getCurrentDataSource, profile, updateUser,
                                          activeState },ref) => {
    const activeStateRef = useRef(null);
    activeStateRef.current = activeState;
    const isView = useContext(ViewContent);
    const currentPrefix = getPrefix('container-model-entity-physical-content-codegenerate');
    const selectNodeRef = useRef({});
    const immersiveEditRef = useRef();
    const entityDataRef = useRef(null);
    entityDataRef.current = entityData;
    const [selectedNode, setSelectedNode] = useState({});
    selectNodeRef.current = selectedNode;
    const [active, setActive] = useState({});
    const activeRef = useRef(null);
    activeRef.current = active;
    const getOptionsData = () => {
        return _.map(profile.global.programLangs, (langItem) => {
            return {
                id: langItem.id,
                defKey: langItem.defKey,
                parent: null,
                defName: langItem.defKey,
                icon: langItem.icon,
                color: langItem.color,
                isEnabled: langItem.isEnabled,
                children: _.map(langItem.codegens, (codegen) => {
                    return {
                        parent: {...langItem},
                        id: `${langItem.id}_${codegen.genKey}`,
                        defKey: codegen.genKey,
                        defName: codegen.genKey,
                        genIntro: codegen.genIntro,
                        genItems: codegen.genItems,
                        icon: 'icon-model-physic',
                    };
                }),
            };
        });
    };
    const [options, setOptions] = useState(getOptionsData());
    const [currentLang, setCurrentLang] = useState(null);
    const currentLangRef = useRef(null);
    currentLangRef.current = currentLang;
    const needUpdateRef = useRef(true);
    const [codeValue, setCodeValue] = useState('');
    const [editId, setEditId] = useState(Math.uuid());
    const getCodeValue = () => {
      return getProjectTableLangCode(getCurrentDataSource(),
          transformEntityLangDataType(
              getCurrentDataSource(),
              entityDataRef.current,
              currentLangRef.current?.id), currentLangRef.current?.id,
          selectNodeRef.current?.defKey, activeRef.current?.itemKey, getSimpleUserCache());
    };
    useEffect(() => {
        if(activeStateRef.current === '4' && needUpdateRef.current) {
            setCodeValue(getCodeValue());
            setEditId(Math.uuid());
            needUpdateRef.current = false;
        }
    }, [activeState]);
    useEffect(() => {
        if(activeStateRef.current === '4') {
            setCodeValue(getCodeValue());
            setEditId(Math.uuid());
        } else {
            needUpdateRef.current = true;
        }
    }, [entityData, currentLang, selectedNode, active]);
    useEffect(() => {
        setOptions(getOptionsData());
    }, [profile]);
    useEffect(() => {
        if(options && options.length > 0) {
            const codeGenerate = {...(getCache('codeGenerate', true) || {})};
            let isSet = false;
            if(codeGenerate) {
                const cacheNode = codeGenerate[`${dataSource.id}_${entityDataRef.current.id}`];
                if(cacheNode) {
                    options.map((item) => {
                        item.children.map((c) => {
                            if(c.id === cacheNode) {
                                isSet = true;
                                setCurrentLang(item);
                                setSelectedNode(c);
                                if(c.genItems && c.genItems.length > 0) {
                                    const cacheActive = codeGenerate[`${dataSource.id}_${entityDataRef.current.id}_active`];
                                    cacheActive && c.genItems.map((g) => {
                                        if (g.itemKey === cacheActive) {
                                            setActive(g);
                                        }
                                        return g;
                                    });
                                } else {
                                    setActive({});
                                }
                            }
                            return c;
                        });
                        return item;
                    });
                }
            }
            if(!isSet && options[0].children.length > 0) {
                const children = options[0].children[0];
                setCurrentLang(options[0]);
                setSelectedNode(children);
                selectNodeRef.current = children;
                setActive(children.genItems[0]);
            }
        }
    }, [options]);

    useImperativeHandle(ref, () => {
        return {
        };
    },[]);
    const openImmersiveEdit = () => {
        if(!active.itemKey) {
            Modal.error({
                title: '错误',
                message: '当前无选中模板',
            });
            return;
        }
        if(!checkPermission(codegenNsKey.V)) {
            return;
        }
        let modal;
        const oncancel = () => {
            modal.close();
        };
        const onOK = (type,btn) => {
            btn.updateStatus(LOADING);
            const itemTemplate = immersiveEditRef.current.templateData;
            setActive(pre => ({
                ...pre,
                itemTemplate,
            }));
            const programLang =  {...selectedNode.parent};
            updateUser(updateProgram(getCurrentDataSource,  {
                programLang: {
                    ...programLang,
                    codegens: [...(programLang.codegens || [])].map((c) => {
                        if(`${programLang.id}_${c.genKey}` === selectedNode.id) {
                            return {
                                ...c,
                                genItems: c.genItems.map((g) => {
                                    if(g.itemKey === active.itemKey) {
                                        return {
                                            ...g,
                                            itemTemplate: itemTemplate,
                                        };
                                    }
                                    return g;
                                }),
                            };
                        }
                        return c;
                    }),
                },
                dataTypes: [...profile.global.dataTypes],
            })).then(() => {
                setOptions(getOptionsData());
                btn.updateStatus(NORMAL);
                type === 'ok' ? modal.close() : immersiveEditRef.current.onSuccess();
            }).catch(() => {
                Message.error({title: '保存失败，请稍后重试！'});
                btn.updateStatus(NORMAL);
            });
        };
        modal = openModal(<ImmersiveEdit
          langCode
          template={active.itemTemplate || ''}
          previewModel={selectedNode.parent?.defKey}
          entityData={filterEntityHelpField(entityDataRef.current)}
          ref={immersiveEditRef}
          currentLang={currentLangRef.current?.id}
          getCurrentDataSource={getCurrentDataSource}
        />, {
            title: '模板调整',
            closeable: false,
            fullScreen: true,
            buttons: [
              <Button
                onClick={oncancel}
                key='oncancel'>
                    取消
              </Button>,
              <Button
                nsKey={codegenNsKey.U}
                onClick={(e, btn) => onOK('ok', btn)}
                key='onOK'
                type='primary'>
                    确认
              </Button>,
              <Button
                nsKey={codegenNsKey.U}
                key="onOk"
                type="primary"
                style={{float: 'right',marginRight: '1%'}}
                onClick={(e, btn) => onOK('save', btn)}
                >
                    保存
              </Button>],
        });
    };

    const onNodeClick = (node) => {
        if(node.parent) {
            setSelectedNode(node);
            setCurrentLang(node.parent);
            if(node.genItems && node.genItems.length > 0) {
                setActive(node.genItems[0]);
                setCache('codeGenerate', {
                    ...(getCache('codeGenerate', true) || {}),
                    [`${dataSource.id}_${entityDataRef.current.id}`]: `${node.id}`,
                    [`${dataSource.id}_${entityDataRef.current.id}_active`]: `${node.genItems[0].itemKey}`,
                });
            } else {
                setActive({});
                setCache('codeGenerate', {
                    ...(getCache('codeGenerate', true) || {}),
                    [`${dataSource.id}_${entityDataRef.current.id}`]: `${node.id}`,
                    [`${dataSource.id}_${entityDataRef.current.id}_active`]: '',
                });
            }
        }
    };

    const openModelData = useCallback(() => {
        let modal;
        const oncancel = () => {
            modal.close();
        };
        modal = openModal(<CodeEditor
          style={{
                margin: 10,
            }}
          value={JSON.stringify(transformEntityLangDataType(
              getCurrentDataSource(),
              filterEntityHelpField(entityDataRef.current),
              currentLangRef.current?.id),null, 2)}
          width='100%'
        />, {
            title: '模型数据',
            borderStyle: {
                margin: 10,
            },
            buttons: [
              <Button
                onClick={oncancel}
                key='oncancel'>
                    取消
              </Button>,
              <Button
                key='onOK'
                type='primary'>
                    确认
              </Button>],
        });
    },[]);
    const onActive = useCallback((item) => {
        setActive({
            ...item,
            itemTemplate: item.itemTemplate || null,
            itemKey: item.itemKey || null,
            itemIntro: item.itemIntro || null,
        });
        setCache('codeGenerate', {
            ...(getCache('codeGenerate', true) || {}),
            [`${dataSource.id}_${entityDataRef.current.id}_active`]: `${item.itemKey}`,
        });
    }, []);
    //console.log(active.itemTemplate);
    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-top`}>
        <div className={`${currentPrefix}-top-left`}>
          <span>{selectedNode?.parent?.defKey}_{selectedNode.defName}</span>
          <Tooltip
            force
            trigger='click'
            title={<SelectTemplateChange
              onNodeClick={onNodeClick}
              close
              data={options}
            />}>
            <Icon type='icon-exchange'/>
          </Tooltip>
        </div>
        <div className={`${currentPrefix}-top-right`}>
          {checkPermission(dbTypeNsKey.V) && !isView && <span
            className={classesMerge({
                    [`${currentPrefix}-top-right-disable`]: !checkPermission(codegenNsKey.V),
                })}
            onClick={openImmersiveEdit}>模板调整</span>}
        </div>
      </div>
      <div className={`${currentPrefix}-body`}>
        <div>
          <div>
            <span>生成内容</span>
            {
                selectedNode?.genItems?.map((item, i) => {
                    return <span
                      key={i}
                      className={classesMerge({
                            [`${currentPrefix}-body-active`]: active.itemKey === item.itemKey,
                      })}
                      onClick={() => onActive(item)}
                    >
                      {item.itemKey}
                    </span>;
                })
            }
          </div>
          <div>
            <span onClick={openModelData}>模型数据</span>
          </div>
        </div>
        <CodeEditor
          key={editId}
          value={codeValue}
          // value={active.itemTemplate}
          mode={selectedNode.parent?.defKey || 'java'}
          readOnly
          width="100%"
          height="100%"
          />
      </div>
    </div>;
}));


const SelectTemplateChange = React.memo(({close, onNodeClick, data}) => {
    const _onNodeClick = (node) => {
        onNodeClick && onNodeClick(node);
        if(node.parent) {
            close();
        }
    };
    return <div style={{
        width: 225,
        height: 200,
    }}>
      <Tree
        countable
        data={data}
        onNodeClick={_onNodeClick}
        />
    </div>;
});












