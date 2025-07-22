import React from 'react';
import { Button, Modal, Message, openModal, openLoading, closeLoading } from 'components';
import _ from 'lodash';
import { GridLayout, CircularLayout, DagreLayout } from '@antv/layout';
import {
    COMPONENT,
    DIAGRAM,
    DISABLE,
    ENTITY, LOADING,
    NORMAL,
    PROFILE,
    PROJECT,
    WS,
} from '../../../../lib/constant';
import {checkFrom, filterRepeatKey, pasteFilterKey, sendData} from '../../../../lib/utils';
import {Paste} from '../../../../lib/event';
import {getIdAsyn} from '../../../../lib/idpool';
import {notify} from '../../../../lib/subscribe';
import ChangeCategory from './ChangeCategory';
import ModelTransformation from './ModelTransformation';
import TransformationType from './TransformationType';
import {
    buildModifiedEntityCommand,
    entityExistsKey,
    MODAL_ID,
    myArray2tree,
    sendWsRequest,
} from './tool';
import {
    checkPermission,
    conceptNsKey,
    flowNsKey,
    logicNsKey,
    mermaidNsKey,
    mindNsKey,
    physicNsKey,
} from '../../../../lib/permission';
import {tree2array} from '../../../../lib/tree';
import {
    calcNodeSize, getEdgeDefaultAttrs, getEdgeDefaultTools,
    getEntityNodeTools,
    getNodeDefaultAttrs,
    getNodeDefaultPorts,
    getNodePortAttrs,
} from '../relation/util/celltools';
import BatchAdjustment from './BatchAdjustment';
import {getCache, setCache} from '../../../../lib/cache';
import {virtualNode} from './filterTree';
import {getCanvasDefaultSetting} from '../../../../lib/json';
import BatchGenEr from './BatchGenEr';
import MarkChange from '../entity/physicalentity/MarkChange';


const dealWithParentId = (parentId) => {
    if(!parentId) {
        return parentId;
    }
    if(parentId.startsWith('base_flat') || parentId.startsWith('_UNCATE')) {
        return null;
    }
    return parentId;
};


export const getSelectNode = (entityId, arrTree) => {
    const tempTree = [...(arrTree || [])];
    let current = tempTree.find(it => it.id === entityId);
    if(!current) {
        return  {
            current,
        };
    }
    current = {
        ...current,
        parentId: dealWithParentId(current?.parentId),
    };
    if(current.peerOrder !== undefined && current.peerOrder !== null) {
        // eslint-disable-next-line max-len
        const before = tempTree.find(it => it.parentId === current.parentId && it.peerOrder === current.peerOrder - 1);
        // eslint-disable-next-line max-len
        const after = tempTree.find(it => it.parentId === current.parentId && it.peerOrder === current.peerOrder + 1);
        return {
            before: {
                ...before,
                parentId: dealWithParentId(before?.parentId),
            },
            current,
            after: {
                ...after,
                parentId: dealWithParentId(after?.parentId),
            },
        };
    } else {
        const curPeer = tempTree.filter(it =>  it.parentId === current.parentId) || [];
        const curIndex = curPeer.findIndex(it => it.id === current.id);
        let before, after;
        if(curIndex - 1 >= 0) {
            before = {
                ...curPeer[curIndex - 1],
                parentId: dealWithParentId(curPeer[curIndex - 1]?.parentId),
            };
        }
        if(curIndex + 1 < curPeer.length) {
            after = {
                ...curPeer[curIndex + 1],
                parentId: dealWithParentId(curPeer[curIndex + 1]?.parentId),
            };
        }
        return {
            before,
            current,
            after,
        };
    }

};

export const filterSelectNodes = (targetArray, treeData) => {
    // eslint-disable-next-line max-len
    const arrTree = (tree2array(treeData) || []).filter(it => it.nodeType !== PROJECT.CATEGORY && !virtualNode.includes(it.nodeType));
    return  targetArray.map((id) => {
        return {...getSelectNode(id, arrTree)};
    });
    // return selectNodes;
};

export const filterCategoriesCheckFrom = (targetValue, categories) => {
    let selectNode = {
        before: undefined,
        after: undefined,
        current: {..._.omit(targetValue, ['parents'])},
    }, tempTree;
    if(!targetValue || targetValue.parents.length === 0) {
        tempTree = [...(categories || [])];
    } else {
        tempTree = [...(targetValue.parents[0].children || [])]
            .filter(e => e.nodeType === PROJECT.CATEGORY);
    }
    const currentIndex = tempTree.indexOf(e => e.id === targetValue.id);
    if(currentIndex - 1 >= 0) {
        selectNode.before = tempTree[currentIndex - 1];
    }
    if(currentIndex + 1 < tempTree.length) {
        selectNode.after = tempTree[currentIndex + 1];
    }
    return selectNode;
};

const containSubdirectory = (dir) => {
    return (dir.children || []).filter(it => it.nodeType === PROJECT.CATEGORY) <= 0;
};

export const rightDelModClick = (targetValueArray, treeData, categories,
                                 selectNode, modelingNavDisplay, callback) => {
    const arrayTree = tree2array(treeData);
    const filterArrayTree = arrayTree
        .filter(d =>  targetValueArray.includes(d.id)).reverse()
        .filter(d => (containSubdirectory(d) &&
            d.diagramRefs.length === 0 &&
            d.entityRefs.length === 0));
    const sendDataArray = filterArrayTree.map((d) => {
        return {
            event: WS.CATEGORY.MOP_CATEGORY_DELETE,
            payload: [{
                ...checkFrom(filterCategoriesCheckFrom(d)),
                data: _.omit(d, ['children', 'entityRefs', 'diagramRefs', 'parents']),
            }],
        };
    });
    Modal.confirm({
        title: '删除',
        message: `是否删除选中的${targetValueArray.length}个目录(只会删除空目录)?`,
        onOk: () => {
            if(sendDataArray.length === 0) {
                Message.warring({title: '该目录下存在数据无法删除！'});
                return;
            }
            callback();
            let currentSendData = sendDataArray.shift();
            const sendDataCallBack = () => {
                if(sendDataArray.length > 0) {
                    currentSendData  = sendDataArray.shift();
                    sendData(currentSendData, null, sendDataCallBack);
                }
            };
            sendData(currentSendData, null, sendDataCallBack);

        },
        okText: '确认',
        cancelText: '取消',
    });

};

export const rightDelClick = (selectedNodes, treeData, event, callback) => {
    const filterData = filterSelectNodes(selectedNodes, treeData).filter((node) => {
      return node.current;
    });
    const payload = [];
    let needLocalUpdate = false;
    for (let i = 0; i < filterData.length; i += 1) {
        const delConfig = checkFrom(filterData[i]);
        const data = {
            ...delConfig,
            from: delConfig.from === '_UNCATE' ? null : delConfig.from,
            data: _.pick(filterData[i].current, ['id','defKey', 'defName']),
        };
        if (filterData[i].current.nodeType === PROJECT.DIAGRAM
            && event === WS.DIAGRAM.MOP_DIAGRAM_DELETE) {
            payload.push(data);
        }
        if(event === WS.ENTITY.MOP_ENTITY_DELETE &&
            (filterData[i].current.nodeType === PROJECT.LOGIC_ENTITY
                || filterData[i].current.nodeType === PROJECT.ENTITY
                || filterData[i].current.nodeType === PROJECT.CONCEPT_ENTITY)) {
            needLocalUpdate = true;
            payload.push(data);
        }
    }
    Modal.confirm({
        title: '删除',
        message: `是否删除选中的${payload.length}个对象?`,
        onOk: () => {
            openLoading('删除中...');
            callback();
            const data = {
                event,
                payload: payload.slice(0, 200),
            };
            sendData(data, null, () => {
                needLocalUpdate && notify(WS.TAB_LOCAL_UPDATE, data);
                closeLoading();
                Message.success({title:`成功删除了${payload.length}个对象`});
            });
        },
        okText: '确认',
        cancelText: '取消',
    });
};

export const rightPasteClick = (targetValue, dataArray, hierarchyType, event,
                                getCurrentDataSource) => {
    const modelMap = {
        C: conceptNsKey.C,
        L: logicNsKey.C,
        P: physicNsKey.C,
    };
    const diagramMap = {
        C: conceptNsKey.C,
        L: logicNsKey.C,
        P: physicNsKey.C,
        M: mindNsKey.C,
        MER: mermaidNsKey.C,
        F: flowNsKey.C,
    };
    Paste(async (text) => {
        try {
            const textJson = (JSON.parse(text) || []).filter((t) => {
                if(event === WS.DIAGRAM.MOP_DIAGRAM_CREATE) {
                    return t.cellsData;
                }
                return !t.cellsData;
            }).filter((t) => {
                const flag =  /^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#\u4e00-\u9fff]*$/.test(t.defKey);
                if(!flag) {
                    Message.error({title: `${t.defKey}数据格式错误！`});
                }
                return  flag;
            }).filter((t) => {
                // 权限过滤方法
                if(event === WS.DIAGRAM.MOP_DIAGRAM_CREATE) {
                    return checkPermission(diagramMap[t.type]);
                }
                return checkPermission(modelMap[t.type]);
            });
            if(textJson.length <= 0) {
                Message.warring({title: '数据为空，粘贴失败！'});
                return;
            }
            const tempDataArray = [...dataArray];
            const payload = [];
            const arrayTree = tree2array(getCurrentDataSource().project.categories);
            const currentCategory = arrayTree.find(it => it.id === targetValue?.parentId?.split('_')[0]);
            for (let i = 0; i < textJson.length; i += 1) {
                let tempData = {
                    ...textJson[i],
                    schemaName: null,
                };
                if(currentCategory &&
                    currentCategory.bindSchema === 1) {
                    if(tempData.type === ENTITY.TYPE.P) {
                        tempData = {
                            ...tempData,
                            schemaName: currentCategory.defKey,
                        };
                    } else {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                }
                let indexesFieldsCount = 0;
                [...(tempData.indexes || [])].forEach((f) => {
                    indexesFieldsCount += f?.fields?.length;
                });
                // eslint-disable-next-line no-await-in-loop
                const ids = await getIdAsyn((tempData.fields || []).length
                    + (tempData.indexes || []).length + indexesFieldsCount + 1);
                if (ids && ids.length > 0) {
                    const indexesFieldsIds = ids.splice(0, indexesFieldsCount);
                    let indexesFieldsIdsIndex = 0;
                    tempData = pasteFilterKey(tempDataArray, tempData, ids[ids.length - 1]);
                    tempDataArray.push(tempData);
                    const tempFields = [...(tempData.fields || [])].map((f, index) => {
                        return {
                            ...f,
                            id: ids[index],
                        };
                    });
                    payload.push({
                        data: [{
                            ...tempData,
                            fields: tempFields,
                            indexes: (tempData.indexes || []).map((f, index) => {
                                return {
                                    ...f,
                                    fields: (f.fields || []).map((field) => {
                                        return {
                                            ...field,
                                            fieldId: tempFields
                                                .find(t => t.defKey === field.fieldDefKey)?.id,
                                            // eslint-disable-next-line no-plusplus
                                            id: indexesFieldsIds[indexesFieldsIdsIndex++],
                                        };
                                    }),
                                    // fieldId: tempFields.find((f) => f.de === f.fieldId)
                                    id: ids[ids.length - 2 - index],
                                };
                            }),
                            id: ids[ids.length - 1],
                        }],
                        position: null,
                        // eslint-disable-next-line no-nested-ternary
                        to: targetValue.parentId.startsWith('_UNCATE') ? null :
                            (targetValue.parentId === 'base_flat' ? targetValue.parentId : targetValue.parentId.split('_')[0]),
                        type: 'sub',
                        hierarchyType: hierarchyType,
                    });
                }
            }
            if(payload.length > 0) {
                sendData({
                    event: event,
                    payload: payload,
                });
            }
            Message.success({title: `成功粘贴了${payload.length}个对象！`});
        } catch (err) {
            Message.warring({title: '粘贴失败，数据格式错误！'});
            console.log(err);
        }
    });
};

const renderLabel = (node, type, value = '{defKey}[{defName}]') => {
    const reg = /\{(\w+)\}/g;
    switch (type) {
        case PROFILE.USER.A: return '{defKey}[{defName}]'.replace(reg, (match, word) => {
            return node?.[word] || ''/*|| node?.defKey || ''*/;
        });
        case PROFILE.USER.N: return node.defName || '';
        case PROFILE.USER.K: return node.defKey || '';
        case PROFILE.USER.C: return value.replace(reg, (match, word) => {
            return node?.[word] || node?.defKey || '';
        });
        default: return '';
    }
};

const getUpdateData = (node, modelingNavDisplay) => {
    if(node.nodeType === PROJECT.DIAGRAM) {
        return renderLabel(node,
            modelingNavDisplay.diagramNode.optionValue,
            modelingNavDisplay.diagramNode.customValue,
        );
    } else {
        switch (node.nodeType) {
            case PROJECT.ENTITY: return renderLabel(node,
                modelingNavDisplay.physicEntityNode.optionValue,
                modelingNavDisplay.physicEntityNode.customValue);
            case PROJECT.LOGIC_ENTITY: return renderLabel(node,
                modelingNavDisplay.logicEntityNode.optionValue,
                modelingNavDisplay.logicEntityNode.customValue);
            case PROJECT.CONCEPT_ENTITY_SUB: return renderLabel(node,
                modelingNavDisplay.conceptEntityNode.optionValue,
                modelingNavDisplay.conceptEntityNode.customValue);
            default: return node.defName;
        }
    }
};


export const changeDir = (defaultTreeData, changeDirRef, targetArrayValue,
                          modelingNavDisplay, treeData, selectData, flatTreeData,
                          getCurrentDataSource) => {
    let modal;
    const dataSource = getCurrentDataSource();
    const categorySelected = getCache('categorySelected', true) || {};
    const cacheKey = `${dataSource.id}_${dataSource.project.branch}`;
    const updateKeys = [];
    const onCancel = () => {
        modal.close();
    };
    const entityNameSet = [...(dataSource.project.entities || [])]
        .map(it => entityExistsKey(it));
    const arrayTree = tree2array(treeData);
    const filterData = [...(arrayTree || [])].filter(d => targetArrayValue.includes(d.id));
    const payloadArray = [];

    for (let i = 0; i < filterData.length; i += 1) {
        updateKeys.push(getUpdateData(filterData[i], modelingNavDisplay));
    }
    const onOK = (e, btn) => {
        btn.updateStatus(LOADING);
        const to = changeDirRef.current?.getSelectValue();
        setCache('categorySelected', {
            ...categorySelected,
            [cacheKey]: to,
        });
        const currentSchemaName = changeDirRef.current?.getSelectSchemaName() || '';
        const filterDuplicateSchemaKeysInArray = [];
        for (let i = 0; i < filterData.length; i += 1) {
            let objType = {};
            const from = filterData[i].parentId.startsWith('_UNCATE')
                || filterData[i].parentId.startsWith('base_flat') ? null
                : filterData[i].parentId.split('_')[0];
            if(from === to) {
                // eslint-disable-next-line no-continue
                continue;
            }
            if (selectData.current.nodeType === PROJECT.DIAGRAM){
                objType = {
                    diagramType: filterData[i].type,
                };
            } else {
                objType = {
                    entityType: filterData[i].type,
                };
                const schemaNameKey = entityExistsKey({
                    defKey: filterData[i].defKey,
                    defName: filterData[i].defName,
                    schemaName: currentSchemaName || null,
                });
                if(filterData[i].type === ENTITY.TYPE.P &&
                    (filterData[i]?.schemaName || '') !== currentSchemaName &&
                    entityNameSet.find(it => it === schemaNameKey)) {
                    filterDuplicateSchemaKeysInArray.push(schemaNameKey);
                }
            }
            let payload = {
                hierarchyType: modelingNavDisplay.hierarchyType,
                pre: {
                    data: {
                        defKey: filterData[i].defKey,
                        defName: filterData[i].defName,
                    },
                    id: filterData[i].id,
                    from,
                    position: null,
                    type: COMPONENT.TREE.SUB,
                    ...objType,
                },
                next: {
                    data: {
                        defKey: filterData[i].defKey,
                        defName: filterData[i].defName,
                        schemaName: currentSchemaName || null,
                    },
                    id: filterData[i].id,
                    from,
                    to,
                    type: COMPONENT.TREE.SUB,
                    ...objType,

                },
            };
            payloadArray.push(payload);
        }
        if(payloadArray.length > 0) {
            if (selectData.current.nodeType === PROJECT.DIAGRAM) {
                sendData({
                    event: WS.DIAGRAM.MOP_DIAGRAM_CATEGORY_CHANGE,
                    payload: payloadArray,
                }, null, () => {
                    btn.updateStatus(NORMAL);
                    modal.close();
                });
            } else {
                if(filterDuplicateSchemaKeysInArray.length > 0) {
                    Message.error({title: <div
                      style={{
                         width: '300px',
                         wordWrap: 'break-word',
                      }}
                        >
                      {`实体代码重复:\n${filterDuplicateSchemaKeysInArray.join(',')}！`}
                    </div>});
                    btn.updateStatus(NORMAL);
                    return;
                }
                sendData({
                    event: WS.ENTITY.MOP_ENTITY_CATEGORY_CHANGE,
                    payload: payloadArray,
                }, null, () => {
                    btn.updateStatus(NORMAL);
                    modal.close();
                });
            }
        } else {
            Modal.info({
                title: '提示',
                message: '当前分类目录和目标分类目录一致！',
            });
            btn.updateStatus(NORMAL);
        }
    };
    modal = openModal(<ChangeCategory
      defaultValue={categorySelected[cacheKey]}
      getCurrentDataSource={getCurrentDataSource}
      ref={changeDirRef}
      updateData={updateKeys.join(',')}
      defaultTreeData={
        [...(filterData || [])].filter(f => f?.nodeType === PROJECT.ENTITY).length
            === [...(filterData || [])].length ?
            defaultTreeData :
            myArray2tree(tree2array(defaultTreeData).filter(d => !d.bindSchema)) || []
      }
    />, {
        id: MODAL_ID,
        title: '选择分类目录',
        bodyStyle: {
            width: '50%',
            //margin: '30px',
        },
        closeable: false,
        buttons: [
          <Button key='onCancel' onClick={onCancel}>取消</Button>,
          <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
        ],
    });
};

export const itemCheckAll = (targetValue, treeRef) => {
    if(targetValue.children && targetValue.children.length <= 200) {
        treeRef.current?.setNodeSelected(_.map(targetValue.children, 'id'));
    } else {
        Message.error({title: '最多只能选择200个对象！'});
    }
};

const computeParentId = (parentId, getCurrentDataSource) => {
    if(!parentId || parentId === '_UNCATE') {
        return parentId;
    }
    const currentCategory = tree2array(getCurrentDataSource()?.project?.categories)
        .find(it => it?.id === parentId);
    if(!currentCategory) {
        return parentId;
    }
    if(currentCategory?.bindSchema === 1) {
        return currentCategory?.parentId || null;
    }
    return parentId;
};

export const model2Diagram = (targetValue, targetEntities,
                              getCurrentDataSource, modelingNavDisplay, callback) => {
    const id = Math.uuid();
    openLoading('计算关联关系...', id);
    // 获取画布默认设置
    const entityNodeTools = getEntityNodeTools();
    const defaultPorts = getNodeDefaultPorts(4);
    const ports = {
        ...defaultPorts,
        items: defaultPorts.items.map((i) => {
            return {
                ...i,
                id: Math.uuid(),
            };
        }),
    };
    const edgeTools = getEdgeDefaultTools();
    getCanvasDefaultSetting(targetValue.type).then((props) => {
        const nodeIdsMap = {};
        const diagrams = getCurrentDataSource().project.diagrams || [];
        const defaultDefKey = `DIAGRAM_${targetValue.type}_AUTO`;
        const createNode = (shape, data, entityRelationRank) => {
            switch (shape) {
                case 'physical-entity-node':
                    // eslint-disable-next-line no-case-declarations
                    const size =  {...props.entitySetting.defaultSize || {}}.optionValue !== 'C' ? calcNodeSize(data,
                        getNodeDefaultAttrs('entityDisplay', props).showFields) : {
                        nodeSize: {
                            width: {...props.entitySetting.defaultSize || {}}.width ,
                            height: {...props.entitySetting.defaultSize || {}}.height ,
                        },
                    };
                    return {
                        shape: 'physical-entity-node',
                        size: size.nodeSize,
                        autoSize: {...props.entitySetting.defaultSize || {}}.optionValue !== 'C',
                        entityRelationRank,
                        ports: entityRelationRank === 'F' ? {
                            groups: {
                                in: {
                                    position: 'absolute',
                                    attrs: getNodePortAttrs(),
                                },
                                out: {
                                    position: 'absolute',
                                    attrs: getNodePortAttrs(),
                                },
                            },
                        } : ports,
                        tools: entityNodeTools,
                        entityDisplay: props.entityDisplay,
                        entitySetting: props.entitySetting,
                        attrs: {
                            body: {
                                rx: 5,
                            },
                        },
                    };
                case 'logic-entity-node':
                    // eslint-disable-next-line no-case-declarations
                    // const { nodeSize } = calcNodeSize(data,
                    //     props.entityDisplay.showFields);
                    // eslint-disable-next-line no-case-declarations
                    const {nodeSize} = {...props.entitySetting.defaultSize || {}}.optionValue !== 'C'
                        ? {...calcNodeSize(data, props.entityDisplay.showFields) } :
                        {
                            nodeSize: {
                                width: {...props.entitySetting.defaultSize || {}}.width ,
                                height: {...props.entitySetting.defaultSize || {}}.height ,
                            },
                        };
                    return {
                        shape: 'logic-entity-node',
                        size: nodeSize,
                        isExpand: true,
                        autoSize:  {...props.entitySetting.defaultSize || {}}.optionValue !== 'C',
                        entityRelationRank,
                        ports: entityRelationRank === 'F' ? {
                            groups: {
                                in: {
                                    position: 'absolute',
                                    attrs: getNodePortAttrs(),
                                },
                                out: {
                                    position: 'absolute',
                                    attrs: getNodePortAttrs(),
                                },
                            },
                        } : ports,
                        tools: entityNodeTools,
                        entityDisplay: props.entityDisplay,
                        entitySetting: props.entitySetting,
                        attrs: {
                            body: {
                                rx: 5,
                            },
                        },
                    };
                case 'concept-entity-node':
                    // eslint-disable-next-line no-case-declarations
                    const conceptEntityNodeSize = {...props.entitySetting.defaultSize || {}}.optionValue !== 'C' ?
                        {
                            width: 200,
                            height: 100,
                        } :
                        {
                            width: {...props.entitySetting.defaultSize || {}}.width ,
                            height: {...props.entitySetting.defaultSize || {}}.height ,
                        };
                    return {
                        shape: 'concept-entity-node',
                        size: conceptEntityNodeSize,
                        tools: entityNodeTools,
                        entityRelationRank: 'E',
                        ports,
                        entityDisplay: props.entityDisplay,
                        entitySetting: props.entitySetting,
                        attrs: {
                            body: {
                                rx: 5,
                            },
                        },
                    };
                default: return null;
            }
        };
        const getShape = (t) => {
            if(t === 'P') {
                return 'physical-entity-node';
            } else if(t === 'L') {
                return 'logic-entity-node';
            }
            return 'concept-entity-node';
        };
        // 每个实体创建一个节点
        let nodes = targetEntities.map((e) => {
            const shape = getShape(targetValue.type);
            const nodeId = Math.uuid();
            nodeIdsMap[e.id] = nodeId;
            return {
                id: nodeId,
                cellType: shape,
                originData: e,
            };
        });
        const edgeAttrs = getEdgeDefaultAttrs(props.linkLine || {});
        // 根据字段数据创建连线
        const createEdge = (source, target) => {
            return {
                id: Math.uuid(),
                zIndex: 0,
                source: source,
                target: target,
                connector: {
                    name: 'rounded',
                },
                shape: 'edge',
                cellType: 'edge',
                attrs: {
                    ...edgeAttrs,
                    line: {
                        ...edgeAttrs.line,
                        sourceMarker: {
                            name: 'er-1',
                        },
                        targetMarker: {
                            name: 'er-n',
                        },
                    },
                },
                router: {
                    name: 'manhattan',
                },
                tools: edgeTools,
            };
        };
        let edges = [];
        // 如果是概念模型 则暂时不需要连线 可在界面上手动添加连线
        if(targetValue.type !== 'C') {
            // 计算所有的连线
            const linesGroup = {};
            targetEntities.reduce((p, n) => {
                return p.concat((n.fields || []).map(e => ({...e, entityId: n.id})));
            }, []).forEach((field) => {
                if(!linesGroup[field.defKey]) {
                    linesGroup[field.defKey] = [];
                }
                linesGroup[field.defKey].push(field);
            });
            Object.keys(linesGroup).forEach((line) => {
                // 主键连向非主键 连线不重复
                const fields = linesGroup[line];
                // 判断重复字段里面是否有主键 如果没有主键 则不需要连线
                if(fields.some(f => f.primaryKey)){
                    const pkFields = fields.filter(field => field.primaryKey);
                    const fkFields = fields.filter(field => !field.primaryKey);
                    pkFields.forEach((field) => {
                        const source = {
                            cell: nodeIdsMap[field.entityId],
                            port: `${field.id}_out`,
                        };
                        fkFields.forEach((fField) => {
                            const target = {
                                cell: nodeIdsMap[fField.entityId],
                                port: `${fField.id}_in`,
                            };
                            // 判断连线是否已经存在 存在则不需要创建
                            if(!edges.find(e => e.target.cell === target.cell
                                && e.source.cell === source.cell)) {
                                edges.push({source, target});
                            }
                        });
                    });
                }
            });
        }
        getIdAsyn(1).then((ids) => {
            let modal = null;
            closeLoading(id);
            const batchGenErRef = React.createRef();
            const onOk = () => {
                const tableData = batchGenErRef.current.getData();
                const tableConfig = batchGenErRef.current.getConfig();
                // 根据配置信息调整节点锚点数据
                nodes = nodes.map((n) => {
                    return {
                        ...n,
                        originData: {
                            id: n.originData.id,
                        },
                        ...createNode(n.cellType, n.originData, tableConfig.entityRelationRank),
                    };
                });
                // 更新连线起点和终点（根据表格数据）
                const tempEdges = [];
                tableData.forEach((e) => {
                    const target = {};
                    const source = {};
                    if(tableConfig.entityRelationRank === 'F') {
                        target.cell = nodeIdsMap[e.childId];
                        target.port =  `${e.childFieldId}_in`;
                        source.cell = nodeIdsMap[e.parentId];
                        source.port = `${e.parentFieldId}_out`;
                    } else {
                        const targetNode = nodes.find(n => n.originData.id ===  e.childId);
                        const sourceNode = nodes.find(n => n.originData.id ===  e.parentId);
                        target.cell = nodeIdsMap[e.childId];
                        target.port =  targetNode.ports.items[15].id;
                        source.cell = nodeIdsMap[e.parentId];
                        source.port = sourceNode.ports.items[5].id;
                    }
                    // 判断连线是否重复
                    if(!tempEdges.find((t) => {
                        return t.target.cell === target.cell && t.target.port === target.port
                            && t.source.cell === source.cell && t.source.port === source.port;
                    })) {
                        tempEdges.push(createEdge(source, target));
                    }
                });
                edges = tempEdges;
                const newDefKey = filterRepeatKey(diagrams, tableConfig.defKey);
                const getLayout = () => {
                    if(tableConfig.layout === 'grid') {
                        return new GridLayout({
                            type: 'grid',
                        });
                    } else if(tableConfig.layout === 'circular') {
                        return new CircularLayout({
                            type: 'circular',
                        });
                    }
                    return new DagreLayout({
                        type: 'dagre',
                        rankdir: 'LR',
                    });
                };
                // 默认星型布局
                const gridCells = getLayout().layout({
                    nodes: nodes.map((n) => {
                        return {
                            id: n.id,
                            size: n.size,
                        };
                    }),
                    edges: edges.map((e) => {
                        return {
                            target: e.target.cell,
                            source: e.source.cell,
                        };
                    }),
                });
                nodes = nodes.map((n) => {
                    const tempNode = gridCells.nodes.find(t => t.id === n.id);
                    return {
                        ...n,
                        position: {
                            x: tempNode.x - tempNode.size.width / 2,
                            y: tempNode.y - tempNode.size.height / 2,
                        },
                    };
                });
                const tempData = {
                    defKey: newDefKey,
                    defName: '',
                    entityRelationRank: tableConfig.entityRelationRank,
                    cellsData: nodes.concat(edges),
                    id: ids[0],
                    comment: '',
                    props,
                    type: targetValue.type,
                };
                openLoading('自动生成关系图...', id);
                sendData({
                    event: WS.DIAGRAM.MOP_DIAGRAM_CREATE,
                    payload: [{
                        type: 'sub',
                        to: targetValue.parentId === '_UNCATE' ? null : targetValue.parentId,
                        position: '',
                        data: [tempData],
                        hierarchyType: modelingNavDisplay.hierarchyType,
                    }],
                }, null, () => {
                    modal && modal.close();
                    callback(tempData);
                    closeLoading(id);
            });
            };
            const oncancel = () => {
                modal && modal.close();
            };
            modal = openModal(<BatchGenEr
              defKey={defaultDefKey}
              ref={batchGenErRef}
              type={targetValue.type}
              entities={targetEntities}
              nodeIdsMap={nodeIdsMap}
              edges={edges}/>, {
                title: '生成ER关系图',
                bodyStyle: {
                    width: '80%',
                },
                buttons: [
                  <Button onClick={oncancel} key='oncancel'>取消</Button>,
                  <Button onClick={onOk} key='onOK' type='primary'>确定</Button>],
            });
        });
    });
};

export const modelTransformation = async (targetValue, selectNodes, menuTitle,
                                    modelTransformationRef,modelingNavDisplay,
                                    getCurrentDataSource) => {
    let modal, sourceTitle, targetTitle, targetType;
    const ids = await getIdAsyn(selectNodes.length);
    if(ids.length < 0) {
        Message.error({title: '操作太快了！'});
    }
    const tempData = [...(selectNodes || [])].map((it, i) => {
        return {
            ...it,
            id: ids[i],
        };
    });
    switch (targetValue.nodeType) {
        case PROJECT.ENTITY:
            sourceTitle = '物理模型';
            break;
        case PROJECT.LOGIC_ENTITY:
            sourceTitle = '逻辑模型';
            break;
        case PROJECT.CONCEPT_ENTITY:
            sourceTitle = '概念模型';
            break;
        default:
            sourceTitle = '';
    }
    switch (menuTitle) {
        case 'genLogicModel':
            targetTitle = '逻辑模型';
            targetType = ENTITY.TYPE.L;
            break;
        case 'genPhysicalModel':
            targetTitle = '物理模型';
            targetType = ENTITY.TYPE.P;
            break;
        case 'genConceptModel':
            targetTitle = '概念模型';
            targetType = ENTITY.TYPE.C;
            break;
        default:
            targetTitle = '';
    }
    const beginTransform = () => {
        modelTransformationRef.current?.beginTransform();
    };
    modal = openModal(<ModelTransformation
      getCurrentDataSource={getCurrentDataSource}
      sourceTitle={sourceTitle}
      targetType={targetType}
      targetTitle={targetTitle}
      targetValue={{
          ...targetValue,
          parentId: computeParentId(targetValue?.parentId, getCurrentDataSource),
      }}
      defaultData={[...(tempData || [])].map(it => ({
          ...it,
          parentId: computeParentId(targetValue?.parentId, getCurrentDataSource),
      }))}
      modelingNavDisplay={modelingNavDisplay}
      ref={modelTransformationRef}
    />, {
        id: MODAL_ID,
        title: `${sourceTitle} 转 ${targetTitle}`,
        bodyStyle: {
            width: '60%',
        },
        closeable: false,
        buttons: [
          <Button key="close" onClick={() => modal.close()}>关闭</Button>,
          <Button key="confirm" type="primary" onClick={beginTransform}>开始转换</Button>,
        ],
    });
};

export const diagramsTransformation = (targetValue, nodes, menuTitle,
                                       modelTransformationRef,modelingNavDisplay,
                                       getCurrentDataSource) => {
    const selectNodes = nodes.filter(node => node.type === targetValue.type);
    const dataSource = getCurrentDataSource();
    let typeModal = null;
    let type = 'create';
    const closeButtonRef = React.createRef();
    const typeChange = (e) => {
        type = e.target.value;
    };
    const diagrams = dataSource.project.diagrams || [];
    const idsMap = {};
    const transformDiagrams = async (createData, createDataFieldsId, config,
                                     targetType, allEntitiesDefKeys) => {
        const { wordSeparator, beginNum, prefix } = config;
        const allDefKeys = (getCurrentDataSource().project.diagrams || [])
            .filter(d => d.type === targetType);
        const createDiagram = (data, callback) => {
            const newDefKey = filterRepeatKey(allDefKeys, data.defKey);
            allDefKeys.push({defKey: newDefKey});
            const tempData = {
                ...data,
                defKey: newDefKey,
            };
            sendData({
                event: WS.DIAGRAM.MOP_DIAGRAM_CREATE,
                payload: [{
                    type: 'sub',
                    to: targetValue.parentId === '_UNCATE' ? null : targetValue.parentId,
                    position: '',
                    data: [tempData],
                    hierarchyType: modelingNavDisplay.hierarchyType,
                }],
            }, null, callback);
        };
        const send = (data) => {
            return new Promise((resolve) => {
                createDiagram(data, () => {
                    resolve();
                });
            });
        };
        const ids = await getIdAsyn(selectNodes.length);
        const targetShapeMap = {
            [DIAGRAM.TYPE.P]: 'physical-entity-node',
            [DIAGRAM.TYPE.L]: 'logic-entity-node',
            [DIAGRAM.TYPE.C]: 'concept-entity-node',
        };
        const fieldNewIds = Object.keys(createDataFieldsId);
        const successEntity = type === 'create' ? createData.filter(c => c.statusType === 'success')
            : createData.filter(c => c.statusType === 'success' || c.statusType === 'repeat').map((c) => {
                // 需要查找系统中已经存在的模型来覆盖 同时需要更新新的模型ID和字段ID
                if(c.statusType === 'repeat') {
                    const existDiagram = allEntitiesDefKeys.find(d => d.defKey === c.defKey);
                    if(existDiagram) {
                        const repeatOldId = Object.keys(idsMap).find(id => idsMap[id] === c.id);
                        // 更换模型ID
                        idsMap[repeatOldId] = existDiagram.id;
                        // 更换字段ID
                        const newFields = c.fields;
                        const existDiagramFields = existDiagram.fields || [];
                        newFields.forEach((field) => {
                            const fieldOldId = fieldNewIds
                                .find(id => createDataFieldsId[id] === field.id);
                            const existField = existDiagramFields
                                .find(eF => eF.defKey === field.defKey);
                            if(existField) {
                                // 更新
                                // eslint-disable-next-line no-param-reassign
                                createDataFieldsId[fieldOldId] = existField.id;
                            } else {
                                // 删除
                                // eslint-disable-next-line no-param-reassign
                                delete createDataFieldsId[fieldOldId];
                            }
                        });
                        return existDiagram;
                    }
                    return null;
                }
                return c;
            }).filter(c => !!c);
        const updateCellsData = (d, i) => {
            const replacePort = (p) => {
                const portArray = p.split('_');
                if(portArray.length !== 2) {
                    return p;
                } else if(createDataFieldsId[portArray[0]]) {
                    return `${createDataFieldsId[portArray[0]]}_${portArray[1]}`;
                }
                return p;
            };
            const cellsData = d.cellsData || [];
            const checkCellNode = (c) => {
                const newId = idsMap[c.originData.id];
                if(successEntity.find(e => e.id === newId)) {
                    // 实体模型创建成功
                    return {
                        ...c,
                        cellType: targetShapeMap[targetType],
                        shape: targetShapeMap[targetType],
                        originData: {
                            id: newId,
                        },
                    };
                }
                return null;
            };
            const checkCellEdge = (c) => {
                const sourceCell = cellsData.find(cell => cell.id === c.source.cell);
                const targetCell = cellsData.find(cell => cell.id === c.target.cell);
                return !((sourceCell?.originData?.id &&
                        !successEntity
                            .find(e => e.id === idsMap[sourceCell.originData?.id])) ||
                    (targetCell?.originData?.id &&
                        !successEntity
                            .find(e => e.id === idsMap[targetCell.originData?.id])));

            };
            if(targetValue.type === DIAGRAM.TYPE.P && targetType === DIAGRAM.TYPE.L ||
                targetType === DIAGRAM.TYPE.P && targetValue.type === DIAGRAM.TYPE.L) {
                // 物理转逻辑 逻辑转物理
                return {
                    ...d,
                    type: targetType,
                    id: ids[i],
                    cellsData: cellsData.map((c) => {
                        if(c.originData?.id) {
                            return checkCellNode(c);
                        } else if(c.shape === 'edge') {
                            if(checkCellEdge(c)) {
                                if(d.entityRelationRank === 'F') {
                                    // 只有关联到字段级别才需要修改
                                    return {
                                        ...c,
                                        target: c.target.port ? {
                                            ...c.target,
                                            port: replacePort(c.target.port),
                                        } : c.target,
                                        source: c.source.port ? {
                                            ...c.source,
                                            port: replacePort(c.source.port),
                                        } : c.source,
                                    };
                                }
                                return c;
                            }
                            return null;
                        }
                        return c;
                    }).filter(c => !!c),
                };
            } else if(targetType === DIAGRAM.TYPE.C) {
                // 转概念
                const newCellNodes = cellsData
                    .filter(c => c.originData?.id)
                    .map((c) => {
                        const cellNode = checkCellNode(c);
                        if(cellNode) {
                            const ports = getNodeDefaultPorts();
                            return {
                                ...cellNode,
                                size: {
                                    width: 200,
                                    height: 100,
                                },
                                ports: d.entityRelationRank === 'F' ? {
                                    ...ports,
                                    items: ports.items.map((item) => {
                                        return {
                                            ...item,
                                            id: Math.uuid(),
                                        };
                                    }),
                                } : cellNode.ports,
                            };
                        }
                        return null;
                }).filter(c => !!c);
                const newCellEdges = cellsData
                    .filter(c => c.shape === 'edge').map((c) => {
                        if(checkCellEdge(c)) {
                            if(d.entityRelationRank === 'F') {
                                const sourceCell = newCellNodes
                                    .find(cell => cell.id === c.source.cell);
                                const targetCell = newCellNodes
                                    .find(cell => cell.id === c.target.cell);
                                return {
                                    ...c,
                                    target: (targetCell && c.target.port) ? {
                                        ...c.target,
                                        port: targetCell.ports.items
                                            .slice(15, 20)[Math.floor(Math.random() * 3) + 1]?.id,
                                    } : c.target,
                                    source: (sourceCell && c.source.port) ? {
                                        ...c.source,
                                        port: sourceCell.ports.items
                                            .slice(4, 9)[Math.floor(Math.random() * 3) + 1]?.id,
                                    } : c.source,
                                };
                            }
                            return c;
                        }
                        return null;
                    }).filter(c => !!c);
                return {
                    ...d,
                    entityRelationRank: 'E',
                    type: targetType,
                    id: ids[i],
                    cellsData: cellsData.filter(c => !c.originData?.id && c.shape !== 'edge')
                        .concat(newCellNodes).concat(newCellEdges),
                };
            } else {
                // 概念转逻辑 概念转物理
                return {
                    ...d,
                    type: targetType,
                    id: ids[i],
                    entityRelationRank: 'E',
                    cellsData: cellsData.map((c) => {
                        if(c.originData?.id) {
                            return checkCellNode(c);
                        } else if(c.shape === 'edge') {
                            if(checkCellEdge(c)) {
                                return c;
                            }
                            return null;
                        }
                        return c;
                    }).filter(c => !!c),
                };
            }
        };
        const transformData = diagrams.filter((d) => {
            return selectNodes.find(s => s.id === d.id);
        }).map((d, i) => {
            if(wordSeparator.trim() === '') {
                return {
                    ...updateCellsData(d, i),
                    defKey: `${prefix}${d.defKey}`,
                };
            }
            const splitData = d.defKey.split(wordSeparator);
            let tempDefKey = d.defKey;
            if(prefix.trim() !== '') {
                if (beginNum === '' || beginNum === 0 || beginNum > splitData.length) {
                    tempDefKey = `${prefix}${d.defKey}`;
                } else {
                    splitData[beginNum - 1] = prefix;
                    tempDefKey = splitData.join(wordSeparator);
                }
            }
            return {
                ...updateCellsData(d, i),
                defKey: tempDefKey,
            };
        });
        for (let i = 0;i < transformData.length;i += 1){
            openLoading(`开始转换关系图...[${i + 1} / ${selectNodes.length}]`);
            // eslint-disable-next-line no-await-in-loop
            await send(transformData[i]);
            closeLoading();
        }
        Message.success({title: '关系图转换完成'});
    };
    const openTransform = async () => {
        typeModal.close();
        let modal, sourceTitle, targetTitle, targetType;
        switch (targetValue.type) {
            case DIAGRAM.TYPE.P:
                sourceTitle = '物理模型';
                break;
            case DIAGRAM.TYPE.L:
                sourceTitle = '逻辑模型';
                break;
            case DIAGRAM.TYPE.C:
                sourceTitle = '概念模型';
                break;
            default:
                sourceTitle = '';
        }
        switch (menuTitle) {
            case 'genLogicModel':
                targetTitle = '逻辑模型';
                targetType = ENTITY.TYPE.L;
                break;
            case 'genPhysicalModel':
                targetTitle = '物理模型';
                targetType = ENTITY.TYPE.P;
                break;
            case 'genConceptModel':
                targetTitle = '概念模型';
                targetType = ENTITY.TYPE.C;
                break;
            default:
                targetTitle = '';
        }
        // 获取所有关系图内的模型
        const entityIds = selectNodes.reduce((p, n) => {
            return p.concat(n.cellsData.map(c => c.originData?.id).filter(c => !!c));
        }, []);
        const allEntities = (dataSource.project.entities || []);
        const categoryArray = tree2array((dataSource.project.categories || []));
        const entities = allEntities.filter(e => entityIds.includes(e.id));
        const ids = await getIdAsyn(entities.length);
        if(ids.length < 0) {
            Message.error({title: '操作太快了！'});
        }
        const tempData = [...(entities || [])].map((it, i) => {
            idsMap[it.id] = ids[i];
            return {
                ...it,
                parentId: computeParentId(categoryArray.find(category => _.map((category?.entityRefs || []), 'refObjectId').includes(it?.id))?.id || null, getCurrentDataSource),
                id: ids[i],
            };
        });
        const allEntitiesDefKeys = allEntities.filter(e => e.type === targetType);
        const transformEnd = (createData, createDataFieldsId, config) => {
            // 转换完成
            modal.close();
            // 开始无界面转换关系图
            transformDiagrams(createData, createDataFieldsId, config,
                targetType, allEntitiesDefKeys);
        };
        const beginTransform = (e, btn) => {
            closeButtonRef.current.updateStatus(DISABLE);
            btn.updateStatus(LOADING);
            const currentConfig = modelTransformationRef.current.getConfig();
            if(!currentConfig?.prefix?.trim?.()) {
                Message.error({title: '前缀不能为空'});
                closeButtonRef.current.updateStatus(NORMAL);
                btn.updateStatus(NORMAL);
                return;
            }
            if(entityIds.length === 0) {
                transformEnd([], {}, currentConfig);
            } else {
                modelTransformationRef.current?.beginTransform().catch(() => {
                    closeButtonRef.current.updateStatus(NORMAL);
                    btn.updateStatus(NORMAL);
                });
            }
        };
        modal = openModal(<ModelTransformation
          transformEnd={transformEnd}
          allDefKeys={allEntitiesDefKeys}
          autoRename={type === 'create'}
          getCurrentDataSource={getCurrentDataSource}
          sourceTitle={sourceTitle}
          targetType={targetType}
          targetTitle={targetTitle}
          targetValue={targetValue}
          defaultData={tempData}
          modelingNavDisplay={modelingNavDisplay}
          ref={modelTransformationRef}
        />, {
            id: MODAL_ID,
            title: `关系图内【${sourceTitle} 转 ${targetTitle}】`,
            bodyStyle: {
                width: '60%',
            },
            closeable: false,
            buttons: [
              <Button ref={closeButtonRef} key="close" onClick={() => modal.close()}>关闭</Button>,
              <Button key="confirm" type="primary" onClick={beginTransform}>开始转换</Button>,
            ],
        });
    };
    typeModal = openModal(<TransformationType onChange={typeChange}/>, {
        title: '关系图内模型转换规则配置',
        buttons: [
          <Button key="close" onClick={() => typeModal.close()}>关闭</Button>,
          <Button key="confirm" type="primary" onClick={openTransform}>确定</Button>,
        ],
    });
};

export const unCateData = (treeData, selectData) => {
    let selectNode = {
            before: undefined,
            after: undefined,
            current: undefined,
        };
    treeData.map((it) => {
        if(it.nodeType === `${selectData.nodeType}_sub`) {
            it.children.map((i, index) => {
                if(i.id === selectData.id) {
                    selectNode.current = i;
                    if(index - 1 >= 0) {
                        selectNode.before = it.children[index - 1];
                    }
                    if(index + 1 < it.children.length) {
                        selectNode.after = it.children[index + 1];
                    }
                }
                return i;
            });
        }
        return it;
    });

    return selectNode;
};


const getDifferingKeys = (obj1, obj2, keys) => {
    const diffKeys = [];

    keys.forEach((key) => {
        // 检查 key 是否存在于两个对象中，并且它们的值是否不同
        if (!_.isEqual(_.get(obj1, key), _.get(obj2, key))) {
            diffKeys.push(key);
        }
    });

    return diffKeys;
};

const compareArrayPositions = (arr1, arr2, key) => {
    const differences = [];

    // 遍历第一个数组，比较每个元素的 key 是否与第二个数组中相同 key 的位置一致
    arr1.forEach((item, index) => {
        const indexInArray2 = _.findIndex(arr2, [key, item[key]]);
        if (indexInArray2 !== index) {
            differences.push({...item});
        }
    });

    return differences;
};

export const batchAdjustment = (defaultData, getCurrentDataSource, batchAdjustmentRef,
                                hierarchyType) => {
    let modal;
    const categories = getCurrentDataSource().project.categories;
    const arrayTree = tree2array(categories);
    const oncancel = () => {
        modal.close();
    };
    const currentChildren = [...(defaultData.children || [])].map((it) => {
        if(hierarchyType === PROFILE.USER.FLAT) {
            const currentCategory = arrayTree
                .find(item => [...(defaultData.nodeType === PROJECT.DIAGRAM_SUB
                    ? item.diagramRefs : item.entityRefs || [])]
                .find(e => e.refObjectId === it.id));
            return {
                ...it,
                parentId: currentCategory ? currentCategory.id : null,
            };
        }
        return {
            ...it,
            parentId: defaultData.parentId,
        };
    });
    const onOk = async (btn) => {
        btn.updateStatus(LOADING);
        const currentTreeData = batchAdjustmentRef.current?.getData();
        const updateCategoryIds = [];
        const updatePayload = [...(currentTreeData || [])].map((it) => {
            // eslint-disable-next-line max-len
            const defaultCurrentData = [...(currentChildren || [])].find(data => data?.id === it.id);
            const updateKeys = getDifferingKeys(it, defaultCurrentData, ['defKey', 'defName', 'intro']) || [];
            if(!defaultCurrentData || updateKeys.length === 0) {
                return {};
            }
            return buildModifiedEntityCommand(defaultCurrentData,
                {..._.pick({...it}, [...(updateKeys || [])])}, [updateKeys]);
        }).filter(it => it?.updateKeys);
        const updateCategory = [...(currentTreeData || [])].map((it) => {
            if(it.parentId === defaultData.parentId) {
                return {};
            }
            updateCategoryIds.push(it.id);
            return {
                hierarchyType,
                next: {
                    data: {
                        ..._.pick(it, ['defKey', 'defName', 'type']),
                    },
                    id: it.id,
                    from: defaultData.parentId === '_UNCATE' ? null : it.id,
                    position: null,
                    to: it.parentId === '_UNCATE' ? 'base_flat' : (it.parentId || null),
                    type: COMPONENT.TREE.SUB,
                },
                pre: {
                    position: COMPONENT.TREE.AFTER,
                },
            };
        }).filter(it => it?.hierarchyType);

        const changPositionArray = compareArrayPositions(
            currentTreeData.filter(it => !updateCategoryIds.includes(it.id)),
            currentChildren.filter(it => !updateCategoryIds.includes(it.id)), 'defKey');

        if(updatePayload.length > 0 ||
            changPositionArray.length > 0 ||
            updateCategory.length > 0) {
            const payload = {
                hierarchyType: hierarchyType,
                categoryId: defaultData.parentId === '_UNCATE' ? null : (defaultData.parentId || null),
                pre: [...(currentChildren || [])].map(it => ({
                    ..._.pick(it, ['parentId', 'id', 'defKey', 'defName', 'intro', 'type', 'schemaName']),
                })),
                next: [...(currentTreeData || [])].map((it) => {
                    const currentCategory = arrayTree.find(category => category.id === it.parentId);
                    let currentSchema;
                    if(currentCategory && currentCategory.bindSchema === 1) {
                        currentSchema = {
                            schemaName: currentCategory.defKey,
                        };
                    } else {
                        currentSchema = {
                            schemaName: null,
                        };
                    }
                    return {
                        ..._.pick(it, ['parentId', 'id', 'defKey', 'defName', 'intro', 'type', 'schemaName']),
                        ...currentSchema,
                    };
                }),
            };
            try {
                await sendWsRequest({
                    payload: [{...payload}],
                    event: defaultData.nodeType === PROJECT.DIAGRAM_SUB ?
                        WS.DIAGRAM.MOP_DIAGRAM_BATCH_ADJUST : WS.ENTITY.MOP_ENTITY_BATCH_ADJUST,
                });
            } finally {
                modal.close();
            }
        }
        modal.close();

    };
    modal = openModal(<BatchAdjustment
      treeData={categories}
      defaultData={currentChildren}
      nodeType={defaultData.nodeType}
      getCurrentDataSource={getCurrentDataSource}
      parentId={defaultData.parentId}
      ref={batchAdjustmentRef}
    />, {
        title: '批量调整',
        bodyStyle: {
            width: '60%',
        },
        buttons: [
          <Button onClick={oncancel} key='oncancel'>取消</Button>,
          <Button type='primary' onClick={(e, btn) => onOk(btn)} key='onOk'>确定</Button>,
        ],
    });
};

const sliceId = (id) => {
    if(!id) {
        return id;
    }
    if(id.startsWith('base_flat') ||
        id.startsWith('_UNCATE')) {
        return null;
    }
    if(id.split('_').length > 1) {
        return id.split('_')[0];
    }
    return id;
};

export const createShallowCopy = async (defaultData, getCurrentDataSource, hierarchyType,
                                        treeData) => {
    openLoading('创建副本中');
    const defaultDataIds = _.map(defaultData , 'id');
    const filterTreeData = tree2array(treeData)
        .filter(it => defaultDataIds.includes(it.id));
    const nodeType = filterTreeData[0].nodeType;
    if(filterTreeData.length > 0) {
        const createPayload = [], dragPayload = [];
        // eslint-disable-next-line no-restricted-syntax
        for(const it of filterTreeData) {
            let indexesFieldsCount = 0;
            [...(it.indexes || [])].forEach((f) => {
                indexesFieldsCount += f?.fields?.length;
            });
            // eslint-disable-next-line no-await-in-loop
            const ids = await getIdAsyn((it?.fields || []).length +
                (it?.indexes || []).length + indexesFieldsCount + 1);
            const indexesFieldsIds = ids.splice(0, indexesFieldsCount);
            let indexesFieldsIdsIndex = 0;
            const tempFields =  (it.fields || []).map((f, i) => {
                return {
                    ...f,
                    id: ids[i],
                };
            });
            createPayload.push({
                type: COMPONENT.TREE.SUB,
                to: sliceId(it.parentId),
                position: null,
                hierarchyType: hierarchyType,
                data: [{
                    ..._.omit(it, ['parents']),
                    // eslint-disable-next-line max-len
                    defKey: filterRepeatKey(nodeType === PROJECT.DIAGRAM ? [...(getCurrentDataSource()?.project?.diagrams || [])] : [...(getCurrentDataSource()?.project?.entities || [])],
                        `${it.defKey}_copy`),
                    fields: tempFields,
                    // eslint-disable-next-line max-len
                    indexes: (it.indexes || []).map((i, index) => {
                        return {
                            ...i,
                            fields: (i.fields || []).map((field) => {
                                return {
                                    ...field,
                                    // eslint-disable-next-line max-len
                                    fieldId: tempFields.find(t => t.defKey === field.fieldDefKey)?.id,
                                    // eslint-disable-next-line max-len
                                    // eslint-disable-next-line no-plusplus,max-len
                                    id: indexesFieldsIds[indexesFieldsIdsIndex++],
                                };
                            }),
                            id: ids[ids.length - 2 - index],
                        };
                    }),
                    id: ids[ids.length - 1],
                    type: it.type,
                }],
            });
            if(sliceId(it.parentId)) {
                dragPayload.push({
                    hierarchyType: hierarchyType,
                    pre: {},
                    next: {
                        data: {
                            ..._.pick(it, ['id', 'defKey', 'type', 'defName']),
                            id: ids[ids.length - 1],
                            schemaName: it.schemaName,
                        },
                        from: ids[ids.length - 1],
                        position: COMPONENT.TREE.AFTER,
                        to: it.id,
                        type: COMPONENT.TREE.PEER,
                    },
                });
            }
        }
        try {
            if(createPayload.length > 0) {
                await sendWsRequest({
                    event: nodeType === PROJECT.DIAGRAM ?
                        WS.DIAGRAM.MOP_DIAGRAM_CREATE  : WS.ENTITY.MOP_ENTITY_CREATE,
                    payload: [...(createPayload || [])],
                });
            }
            if(dragPayload.length > 0) {
                await sendWsRequest({
                    event: nodeType === PROJECT.DIAGRAM ?
                        WS.DIAGRAM.MOP_DIAGRAM_DRAG : WS.ENTITY.MOP_ENTITY_DRAG,
                    payload: [...(dragPayload || [])],
                });
            }
        } catch (e) {
            closeLoading();
        }
    }
    closeLoading();
};

export const changeMark = (targetValueArray, targetEntities, markChangeRef) => {
    console.log(targetEntities);

    let modal = null;

    const onOk = (btn) => {
        const mark = markChangeRef.current.getData();
        btn.updateStatus(LOADING);
        sendWsRequest({
            event: WS.ENTITY.MOP_ENTITY_UPDATE,
            payload: (targetEntities || []).map((entity) => {
                return {
                    hierarchyType: PROFILE.USER.TREE,
                    next: {
                        data: {mark: JSON.stringify(mark)},
                        id: entity.id,
                    },
                    pre: {
                        data: {mark: entity.mark},
                        id: entity.id,
                    },
                    updateKeys: 'mark',
                };
            }),
        }).then(() => {
            btn.updateStatus(NORMAL);
            modal.close();
        })
            .catch(() => btn.updateStatus(NORMAL));

    };

    modal = openModal(<div style={{margin: '9px 25px'}}>
      <MarkChange
        ref={markChangeRef}
        data={targetEntities}
        selected={targetValueArray}
        type='entity'
        />
    </div>, {
        title: '标记',
        bodyStyle: {
            width: 320,
        },
        buttons: [
          <Button key="oncancel" onClick={() => modal.close()}>关闭</Button>,
          <Button onClick={(e, btn) => onOk(btn)} key='onOk' type='primary'>确定</Button>,
        ],
    });

};
