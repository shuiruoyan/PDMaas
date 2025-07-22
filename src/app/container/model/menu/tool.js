import {Button, Message, Modal, openModal, openLoading, closeLoading} from 'components';
import React from 'react';
import _ from 'lodash';
import LogicEntityEdit from '../entity/logicentity/LogicEntityEdit';
import RelationEdit from '../relation/RelationEdit';
import {checkFrom, sendData} from '../../../../lib/utils';
import {
    COMPONENT,
    DIAGRAM,
    ENTITY,
    LOADING,
    NORMAL,
    WS,
    PROJECT, PROFILE,
} from '../../../../lib/constant';
import {array2tree, tree2array} from '../../../../lib/tree';
import {getIdAsyn} from '../../../../lib/idpool';
import ConceptualEntityEdit from '../entity/conceptualentity/ConceptualEntityEdit';
import PhysicalEntityEdit from '../entity/physicalentity/PhysicalEntityEdit';
import CategoryWrapper from '../category/CategoryWrapper';
import schemaExpand from '../style/schema_expand.svg';
import schemaSelected from '../style/schema_selected.svg';
import schema from '../style/schema.svg';

export const MODAL_ID = '1111';

const OPERATION = {
    OK: 'OK',
    CANCEL: 'CANCEL',
    OKANDCON: 'OKANDCON',
};

const getPositionType = (type) => {
    if(type === ENTITY.TYPE.P || type === ENTITY.TYPE.C || type === ENTITY.TYPE.L
    || type === DIAGRAM.TYPE.F || type === DIAGRAM.TYPE.M || type === DIAGRAM.TYPE.MER) {
        return COMPONENT.TREE.SUB;
    }
    return type;
};
const omitData = (d) => {
    if(d.type === ENTITY.TYPE.P || d.type === ENTITY.TYPE.C || d.type === ENTITY.TYPE.L
        || d.type === DIAGRAM.TYPE.F || d.type === DIAGRAM.TYPE.M || d.type === DIAGRAM.TYPE.MER) {
        let tempData = _.omit(d, ['to']);
        if(d.type === ENTITY.TYPE.C
            || d.type === DIAGRAM.TYPE.F || d.type === DIAGRAM.TYPE.M) {
            tempData = _.omit(tempData, ['entityRelationRank']);
        }
        return tempData;
    }
    return _.omit(d, ['to', 'type']);
};

const onConfirm = (modal, operation, modelingNavDisplay, btn, event,
                    formData, onSuccess, getCurrentDataSource) => {
    if(OPERATION.CANCEL === operation) {
        onSuccess && onSuccess();
        modal.close();
        return;
    }
    const validate = formData.current.validate;
    if(validate && !validate()) {
        return;
    }
    const data = {...(formData.current.getData() || {})};
    if(data.defKey.trim() === '') {
        Message.warring({title: '代码不能为空！'});
        return;
    }
    if(event === WS.DIAGRAM.MOP_DIAGRAM_CREATE) {
        modal.focus(2);
    } else {
        modal.focus(1); // 第二个输入框获取焦点
    }
    const categories = tree2array(getCurrentDataSource().project.categories);

    switch (event) {
        case WS.CATEGORY.MOP_CATEGORY_CREATE:
            if(categories.find(it => it.defKey === data.defKey)) {
                Modal.error({
                    title: '错误',
                    message: '分类代码重复!',
                });
                return;
            }
            break;
        case WS.DIAGRAM.MOP_DIAGRAM_CREATE:
            if(getCurrentDataSource().project.diagrams.find(it => it.defKey === data.defKey)) {
                Modal.error({
                    title: '错误',
                    message: '关系图代码重复!',
                });
                return;
            }
            break;
        case WS.ENTITY.MOP_ENTITY_CREATE:
            if(getCurrentDataSource().project.entities.find(it => it.defKey === data.defKey)) {
                Modal.error({
                    title: '错误',
                    message: '模型代码重复!',
                });
                return;
            }
            break;
        default:
            break;
    }

    const currentParent = categories.find(d => d.id === data.to);
    if(currentParent) {
        if(data.type === COMPONENT.TREE.SUB && currentParent.parents.length >= 3) {
            Modal.error({
                title: '错误',
                message: '目录最多允许4层深度。',
            });
            return;
        } else if(data.type === COMPONENT.TREE.PEER && currentParent.parents.length >= 4) {
            Modal.error({
                title: '错误',
                message: '目录最多允许4层深度。',
            });
            return;
        }
    }

    btn.updateStatus(LOADING);
    const id = Math.uuid();
    const positionType = getPositionType(data.type);
    let currentSchema = {};
    if(event === WS.ENTITY.MOP_ENTITY_CREATE) {
        currentSchema = {
            schemaName: currentParent?.bindSchema === 1 ? currentParent.defKey : null,
        };
    }

    const sendDataCallback = (message) => {
        btn.updateStatus(NORMAL);
        if(OPERATION.OK === operation) {
            modal.close();
            onSuccess && onSuccess(null, message.payload?.[0]?.data?.[0]);
        } else if(event === WS.CATEGORY.MOP_CATEGORY_CREATE) {
            const categoryId = message?.payload[0]?.data?.id;
            formData.current.restData(message.payload[0].data.bindSchema ? null : categoryId);
            onSuccess && onSuccess(categoryId, message.payload?.[0]?.data?.[0]);
        } else {
            formData.current.restData();
        }
    };
    getIdAsyn(1).then((ids) => {
        sendData({
            event: event,
            payload: [{
                type: positionType,
                to: data.to || null,
                position: (data.to && positionType === COMPONENT.TREE.PEER)
                    ? COMPONENT.TREE.AFTER : null,
                data: event === WS.CATEGORY.MOP_CATEGORY_CREATE ?
                    {
                        id: ids[0],
                        ...omitData(data),
                    } :
                    [{
                        id: ids[0],
                        ...currentSchema,
                        ...omitData(data),
                    }],
                hierarchyType: modelingNavDisplay.hierarchyType,
            }],
        }, id, sendDataCallback);
    });
};

export const dropClick = (m,selectedNode, dataSource, treeData,
     formData, modelingNavDisplay, onSuccess, getCurrentDataSource, tree,
                          user) => {
    let model, Com, nodeType, width, entityShow, event, type;
    let parentId;
    if(m.key !== 'category-P' && m.key !== 'category-C'
        && selectedNode === null && treeData.length > 0) {
        parentId = treeData[0]?.bindSchema === 1 && m.key !==  'entity-P' ? null : treeData[0].id;
    }
    switch (m.key) {
        case 'category-P':
            Com = CategoryWrapper;
            nodeType = COMPONENT.TREE.PEER;
            width = 700;
            event = WS.CATEGORY.MOP_CATEGORY_CREATE;
            break;
        case 'category-C':
            Com = CategoryWrapper;
            nodeType = COMPONENT.TREE.SUB;
            width = 700;
            event = WS.CATEGORY.MOP_CATEGORY_CREATE;
            break;
        case 'category-S':
            Com = CategoryWrapper;
            nodeType = COMPONENT.TREE.SCHEMA;
            width = 700;
            event = WS.CATEGORY.MOP_CATEGORY_CREATE;
            break;
        case 'entity-P':
            Com = PhysicalEntityEdit;
            width = 700;
            entityShow = false;
            event = WS.ENTITY.MOP_ENTITY_CREATE;
            type = ENTITY.TYPE.P;
            break;
        case 'entity-L':
            Com = LogicEntityEdit;
            width = 1200;
            entityShow = false;
            event = WS.ENTITY.MOP_ENTITY_CREATE;
            type = ENTITY.TYPE.L;
            break;
        case 'entity-C':
            Com = ConceptualEntityEdit;
            width = 700;
            entityShow = true;
            event = WS.ENTITY.MOP_ENTITY_CREATE;
            type = ENTITY.TYPE.C;
            break;
        case 'diagram-P':
            Com = RelationEdit;
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            type = DIAGRAM.TYPE.P;
            width = 700;
            break;
        case 'diagram-L':
            Com = RelationEdit;
            type = DIAGRAM.TYPE.L;
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            width = 700;
            break;
        case 'diagram-C':
            Com = RelationEdit;
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            type = DIAGRAM.TYPE.C;
            width = 700;
            break;
        case 'diagram-S':
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            Com = RelationEdit;
            type = DIAGRAM.TYPE.F;
            width = 700;
            break;
        case 'diagram-M':
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            Com = RelationEdit;
            type = DIAGRAM.TYPE.M;
            width = 700 ;
            break;
        case 'diagram-MER':
            event = WS.DIAGRAM.MOP_DIAGRAM_CREATE;
            Com = RelationEdit;
            type = DIAGRAM.TYPE.MER;
            width = 700 ;
            break;
        default: break;
    }
    const selectedNodeData = selectedNode ? (selectedNode?.current || {}) : {parentId};
    model = openModal(<Com
      user={user}
      getCurrentDataSource={getCurrentDataSource}
      dataSource={dataSource}
      treeData={treeData}
      selectedNode={selectedNodeData}
      fullTree={tree}
      nodeType={nodeType}
      entityShow={entityShow}
      modelingNavDisplay={modelingNavDisplay}
      type={type}
      ref={formData}/>, {
        id: MODAL_ID,
        title: m.key === 'category-P' || m.key === 'category-C' ?
            '新建分类' : `新建${  m.name}`,
        bodyStyle: {
            width,
        },
        closeable: false,
        buttons: [
          <Button
            onClick={(e, btn) => onConfirm(model, OPERATION.CANCEL,
                    modelingNavDisplay, btn, event, formData, onSuccess, getCurrentDataSource)}
            key='onCancel'>
                取消
          </Button>,
          <Button
            onClick={(e, btn) => onConfirm(model, OPERATION.OKANDCON,
                modelingNavDisplay, btn, event, formData, onSuccess, getCurrentDataSource)}
            key='onOKAndCon'
            type='primary' >
                保存并继续新建
          </Button>,
          <Button
            onClick={(e, btn) => onConfirm(model, OPERATION.OK,
                modelingNavDisplay, btn, event, formData, onSuccess, getCurrentDataSource)}
            key='onOK'
            type='primary'>
                确认
          </Button>],
    });
};

const entityDel = (selectedNode, event) => {
    const payload = {
        ...checkFrom(selectedNode),
        data: selectedNode.current,
    };
    sendData({
        event,
        payload: [payload],
    });
};

export const delClick = (selectedNode, modelingNavDisplay, callback) => {
    Modal.confirm({
        title: '删除',
        message: `是否要删除${  selectedNode.current.defName || selectedNode.current.defKey }?`,
        onOk: () => {
            switch(selectedNode.current.nodeType) {
                case PROJECT.ENTITY:
                case PROJECT.LOGIC_ENTITY:
                case PROJECT.CONCEPT_ENTITY:
                    callback();
                    entityDel(selectedNode, WS.ENTITY.MOP_ENTITY_DELETE, modelingNavDisplay);
                break;
                case PROJECT.DIAGRAM:
                    callback();
                    entityDel(selectedNode, WS.DIAGRAM.MOP_DIAGRAM_DELETE, modelingNavDisplay);
                    break;
                default:
                    callback();
                    sendData({
                        event: WS.CATEGORY.MOP_CATEGORY_DELETE,
                        payload: [{
                            ...checkFrom(selectedNode),
                            data: _.omit(selectedNode.current, ['children', 'entityRefs', 'diagramRefs']),
                        }],
                    });
                break;
            }

        },
        okText: '确认',
        cancelText: '取消',
    });
};

export const buildModifiedEntityCommand = (defaultData, updateData, updateKeys) => {
    return {
        hierarchyType: PROFILE.USER.FLAT,
        next: {
            data: {
                ...(updateData || {}),
                parentId:  updateData?.parentId === '_UNCATE' ? 'base_flat' : (updateData?.parentId || null),
            },
            from: defaultData.id,
            id: defaultData.id,
            to: defaultData?.parentId === '_UNCATE' ? 'base_flat' : (defaultData?.parentId || null),
            // to: defaultData?.parentId || null,
            position: COMPONENT.TREE.AFTER,
            type: COMPONENT.TREE.SUB,
        },
        pre: {
            data: {
                ...(defaultData || {}),
                parentId:  defaultData?.parentId === '_UNCATE' ? 'base_flat' : (defaultData?.parentId || null),
            },
            from: defaultData.id,
            id: defaultData.id,
            to: defaultData?.parentId === '_UNCATE' ? 'base_flat' : (defaultData?.parentId || null),
            // to: defaultData?.parentId || null,
            type: COMPONENT.TREE.SUB,
        },
        updateKeys: [...(updateKeys || [])].join(','),
    };
};


const updateCategory = (treeData, formData, callback, selectedNode, tree, getCurrentDatasource) => {
    let model;
    const onOk = () => {
        const data = {...(formData.current.getData() || {})};

        if(tree2array(treeData)
            .find(it => it.defKey === data.defKey && it.id !== selectedNode.current.id)) {
            Modal.error({
                title: '错误',
                message: '分类代码重复!',
            });
            return;
        }

        const computeNext = () => {
            if(selectedNode.current.bindSchema === 1 &&
            (data.to || '') === (selectedNode.current.parentId || '')) {
                if(selectedNode.before &&
                    selectedNode.before.nodeType === PROJECT.CATEGORY) {
                    return {
                        to: selectedNode?.before?.id,
                        type: COMPONENT.TREE.PEER,
                    };
                } else if(selectedNode.after &&
                    selectedNode.before.nodeType === PROJECT.CATEGORY)  {
                    return {
                        to: selectedNode?.after?.id,
                        type: COMPONENT.TREE.PEER,
                    };
                } else {
                    return {
                        to: data.to,
                        type: data.type,
                    };
                }
            }
            if(!data.to) {
                const categories = getCurrentDatasource().project.categories;
                return {
                    to: categories[categories.length - 1]?.id,
                    type: 'peer',
                    position: 'after',
                };
            }
            return {
                to: data.to,
                type: data.type,
            };
        };
        sendData({
            event: WS.CATEGORY.MOP_CATEGORY_UPDATE,
            payload: [{
                pre: {
                    id: selectedNode.current.id,
                    ...checkFrom(selectedNode),
                    // eslint-disable-next-line max-len
                    position: (!selectedNode.before || selectedNode.before.nodeType !== PROJECT.CATEGORY)
                        ? COMPONENT.TREE.BEFORE : COMPONENT.TREE.AFTER,
                    data: _.omit(selectedNode.current,
                        ['to', 'type','diagramRefs','children','entityRefs']),
                },
                next: {
                    id: selectedNode.current.id,
                    from: selectedNode.current.id,
                    ...computeNext(),
                    // eslint-disable-next-line max-len
                    position: (!selectedNode.before || selectedNode.before.nodeType !== PROJECT.CATEGORY)
                        ? COMPONENT.TREE.BEFORE : COMPONENT.TREE.AFTER,
                    data: {
                        ..._.omit(data, ['to', 'type']),
                        parentId: selectedNode?.current?.parentId || null,
                    },
                },
            }],
        }, null, null, true);
        if(selectedNode?.current?.bindSchema === 1 &&
            selectedNode.current?.defKey !== data?.defKey) {
            const arrayTree = tree2array([...(tree || [])]);
            const updatePayload = [...(
                arrayTree.find(it => it.id === selectedNode?.current?.id)?.children || [])]
                .filter(it => it.type === ENTITY.TYPE.P)
                .map((it) => {
                    return buildModifiedEntityCommand(it,
                        {schemaName: data.defKey}, ['schemaName']);
                });
            const execBatchChangeSchema = async () => {
                if(updatePayload.length > 0) {
                    openLoading('正在批量更新实体schemaName');
                    // eslint-disable-next-line no-use-before-define
                    await  sendWsRequest({
                        event: WS.ENTITY.MOP_ENTITY_UPDATE,
                        payload: [...(updatePayload || [])],
                    }).finally(() => {
                        closeLoading();
                    });
                }
            };
            execBatchChangeSchema();
        }
        callback();
        model.close();

    };
    const onCancel = () => {
        model.close();
    };

    const filterSelectCurrent = () => {
        const arrayTree = tree2array([...(treeData || [])]);

        return array2tree(arrayTree.filter((it) => {
            // eslint-disable-next-line max-len
            return it.id !== selectedNode.current.id && ![...(it.parents || [])].find(item => item.id === selectedNode.current.id);
        }));
    };
    model = openModal(<CategoryWrapper
      dataSource={getCurrentDatasource()}
      fullTree={tree}
      treeData={filterSelectCurrent()}
      selectedNode={selectedNode}
      nodeType={selectedNode.current.bindSchema === 1 ? COMPONENT.TREE.SCHEMA : COMPONENT.TREE.PEER}
      update
      ref={formData}
        />, {
        id: MODAL_ID,
        title: '修改分类',
        bodyStyle: {
            width: 700,
        },
        closeable: false,
        buttons: [
          <Button onClick={onCancel} key='onOK'>
                取消
          </Button>,
          <Button onClick={onOk} key='onCancel' type='primary'>
                确认
          </Button>],
    });
};



const updateEntity = (treeData, formData, callback, selectedNode,
    event, title, modelingNavDisplay, Com, dataSource, user) => {
    let model;

    const onOk = () => {
        const validate = formData.current.validate;
        if(validate && !validate()) {
            return;
        }
        const data = {...(formData.current.getData() || {})};
        const tempSelectedNode = {...selectedNode.current};

        if(data.defKey === tempSelectedNode.defKey &&
            data.defName === tempSelectedNode.defName &&
            data.intro === tempSelectedNode.intro &&
            data.to === tempSelectedNode.parentId) {
            model.close();
            return;
        }

        switch (event) {
            case WS.DIAGRAM.MOP_DIAGRAM_UPDATE:
                if(dataSource.project.diagrams
                    .find(it => it.defKey === data.defKey && it.id !== selectedNode.current.id)) {
                    Modal.error({
                        title: '错误',
                        message: '关系图代码重复!',
                    });
                    return;
                }
                break;
            case WS.ENTITY.MOP_ENTITY_UPDATE:
                if(dataSource.project.entities
                    .find(it => it.defKey === data.defKey && it.id !== selectedNode.current.id)) {
                    Modal.error({
                        title: '错误',
                        message: '模型代码重复!',
                    });
                    return;
                }
                break;
            default:
                break;
        }

        let updateKeys;
        if(event === WS.ENTITY.MOP_ENTITY_UPDATE) {
            updateKeys = {
                updateKeys: 'defKey,defName,intro',
            };
        } else {
            updateKeys = {
                updateKeys: 'defKey,defName',
            };
        }
        sendData({
            event,
            payload: [{
                hierarchyType: modelingNavDisplay.hierarchyType,
                ...updateKeys,
                pre: {
                    id: selectedNode.current.id,
                    ..._.omit(checkFrom(selectedNode), ['parentId']),
                    data: _.omit(selectedNode.current, ['to']),
                    position: COMPONENT.TREE.AFTER,
                },
                next: {
                    id: selectedNode.current.id,
                    from: selectedNode.current.id,
                    to: data.to,
                    type: COMPONENT.TREE.SUB,
                    data: {
                        ..._.pick(data, ['defKey', 'defName', 'intro']),
                        schemaName: selectedNode.current?.schemaName,
                        type: selectedNode.current.type,
                    },
                },
            }]}, null, null, true);
        callback();
        model.close();
    };

    const onCancel = () => {
        model.close();
    };

    model = openModal(<Com
      user={user}
      treeData={treeData}
      selectedNode={selectedNode.current}
      modelingNavDisplay={modelingNavDisplay}
      update
      dataSource={dataSource}
      ref={formData}
        />, {
        id: MODAL_ID,
        title: `修改${  title}`,
        bodyStyle: {
            width: LogicEntityEdit === Com ? 1200 : 700,
        },
        closeable: false,
        buttons: [
          <Button onClick={onCancel} key='onOK'>
                取消
          </Button>,
          <Button onClick={onOk} key='onCancel' type='primary'>
                确认
          </Button>],
    });
};

// eslint-disable-next-line max-len
export const updateClick = (selectedNode, treeData, formData, modelingNavDisplay, getCurrentDataSource, callback, tree, user) => {
    const titleRefs = {
        [PROJECT.ENTITY + ENTITY.TYPE.P]: '物理模型',
        [PROJECT.CONCEPT_ENTITY + ENTITY.TYPE.C]: '概念模型',
        [PROJECT.LOGIC_ENTITY + ENTITY.TYPE.L]: '逻辑模型',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.P]: '物理模型图',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.C]: '概念模型图',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.L]: '逻辑模型图',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.F]: '流程图',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.M]: '思维导图',
        [PROJECT.DIAGRAM + DIAGRAM.TYPE.MER]: 'Mermaid图',
    };

    let title = titleRefs[selectedNode.current.nodeType + selectedNode.current.type];
    switch(selectedNode.current.nodeType) {
        case  PROJECT.ENTITY:
            updateEntity(treeData, formData, callback,
                selectedNode, WS.ENTITY.MOP_ENTITY_UPDATE,
                title, modelingNavDisplay, PhysicalEntityEdit, getCurrentDataSource(), user);
            break;
        case  PROJECT.LOGIC_ENTITY:
            updateEntity(treeData, formData, callback,
                selectedNode, WS.ENTITY.MOP_ENTITY_UPDATE,
                title, modelingNavDisplay, LogicEntityEdit,
                getCurrentDataSource(), user);
            break;
        case  PROJECT.CONCEPT_ENTITY:
            updateEntity(treeData, formData, callback,
                selectedNode, WS.ENTITY.MOP_ENTITY_UPDATE,
                title, modelingNavDisplay, ConceptualEntityEdit, getCurrentDataSource(), user);
            break;
        case  PROJECT.DIAGRAM:
            updateEntity(treeData, formData, callback,
                selectedNode, WS.DIAGRAM.MOP_DIAGRAM_UPDATE,
                title, modelingNavDisplay, RelationEdit, getCurrentDataSource(), user);
            break;
        default:
            updateCategory(treeData, formData, callback, selectedNode, tree, getCurrentDataSource);
    }
};

export const myArray2tree = (data, uniqueKey = 'id', keyAttribute = 'parentId') => {
    const allData = [...data];
    const calcChildren = (children) => {
        return children.map((d) => {
            const tempChildren = calcChildren(
                allData.filter(c => c[keyAttribute] === d[uniqueKey]), uniqueKey, keyAttribute);
            return {
                ...d,
                children: tempChildren.length > 0 ? tempChildren : [],
            };
        });
    };
    return calcChildren(data).filter(d => !d[keyAttribute]);
};

export const myTree2array = (tree, parents = [], keyAttribute = 'children', uniqueKey = 'id') => {
    // 树转扁平数组 同时计算好每一条数据的父子关系
    return tree
        .reduce((pre, next) => {
            const children = myTree2array(next[keyAttribute] || [],
                parents.concat(next), keyAttribute, uniqueKey);
            return pre.concat({
                ...next,
                parents,
                parentId: parents.slice(-1)[0]?.[uniqueKey],
                children: next[keyAttribute] ? children : null,
            }).concat(children);
        }, []);
};

export const computeSchemaTree = (treeData) => {
    return myArray2tree([...tree2array((treeData || []))].map(d => ({
        ...d,
        renderExpandIcon: d.bindSchema === 1 ?  (isOpen, isSelected) => {
            if(isOpen) {
                return <img
                  alt=''
                  src={schemaExpand}
                  style={{   width: 20,
                        height: 12,
                    }}/>;
            } else if(isSelected) {
                return <img
                  alt=''
                  src={schemaSelected}
                  style={{   width: 20,
                        height: 12,
                    }}/>;
            }
            return <img
              alt=''
              src={schema}
              style={{   width: 20,
                    height: 12,
                }}/>;
        } : null,
    })));
};


export const _myLabelRender = (node) => {
    return node?.defKey;
};

export const _myValueRender = (node) => {
    return node?.defKey;
};


export const computeTo = (selectedNode, treeData, isPhysical = false) => {
    if(!selectedNode) {
        return null;
    }
    if(selectedNode.nodeType === PROJECT.CATEGORY && isPhysical) {
        return selectedNode?.id;
    }
    const currentParent = tree2array([...(treeData || [])]).find(it => it.id === selectedNode?.parentId?.split('_')[0]);
    if(currentParent) {
        if(isPhysical) {
            return currentParent?.id;
        }
        return currentParent.bindSchema === 1 ? null : currentParent.id;
    }
    return null;
};

export const entityExistsKey = (entity) => {
    if(!entity) {
        return null;
    }
    const {schemaName, defKey} = entity;
    if(!schemaName) {
        return defKey;
    }
    return `${schemaName}.${defKey}`;
};

export const renderValue = (node, key = 'defKey', name = 'defName') => {
    if(node) {
        return node.parents.concat(node).map(n => n[name] || n[key]).join('/');
    }
    return '';
};

export const countable = (node, children) => {
    return `(${children.reduce((p, n) => {
        return p + n.entityRefs.length + n.diagramRefs.length;
    }, node.entityRefs.length + node.diagramRefs.length)})`;
};

export const renderLabel = (node, type, value = '{defKey}[{defName}]') => {
    const reg = /\{(\w+)\}/g;
    switch (type) {
        case PROFILE.USER.A: if(!node.defName) {
            return node.defKey || '';
        } else if(node.defName === node.defKey) {
            return node.defKey;
        }
        return '{defKey}[{defName}]'.replace(reg, (match, word) => {
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

export const sendWsRequest = async (data) => {
    return new Promise((resolve) => {
        const sendId = Math.uuid();
        sendData({
            ctId: sendId,
            ...data,
        }, Math.uuid(), () => {
            resolve('执行成功');
        }, null, null, true);
    });
};

export const formatTime = (t) => {
    const getTwoDigits = num => num.toString().padStart(2, '0');
    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = t % 60;
    return `${getTwoDigits(hours)}:${getTwoDigits(minutes)}:${getTwoDigits(seconds)}`;
};

export const groupDataTypes = (dataTypes) => {
    const tempDataTypes = dataTypes || [];
    const typeOftenData = {
        common: [],
        general: [],
        low: [],
    };
    const optionStyle = {
        paddingLeft: 20,
    };
    tempDataTypes.forEach((d) => {
        const temp = {
            ...d,
            label: `${d.defName}-${d.defKey}`,
            style: optionStyle,
        };
        if(!d.often) {
            typeOftenData.low.push(temp);
        } else if(d.often === '5') {
            typeOftenData.general.push(temp);
        } else if(d.often === '9') {
            typeOftenData.common.push(temp);
        } else {
            typeOftenData.low.push(temp);
        }
    });
    let temp = [];
    if(typeOftenData.common.length !== 0) {
        temp = [
            ...temp,
            {
                label: '常用',
                defKey: 'common',
                disable: true,
            },
            ...typeOftenData.common,
        ];
    }
    if(typeOftenData.general.length !== 0) {
        temp = [
            ...temp,
            {
                label: '一般',
                defKey: 'general',
                disable: true,
            },
            ...typeOftenData.general,
        ];
    }
    if(typeOftenData.general.low !== 0) {
        temp = [
            ...temp,
            {
                label: '低频',
                defKey: 'low',
                disable: true,
            },
            ...typeOftenData.low,
        ];
    }
    return [...(temp || [])];
};


export const filterBaseDataType = (dataSource) => {
    const dbDialect = dataSource.profile?.project?.dbDialect || '';
    const tempData = dataSource.profile.global.dataTypes || [];
    const typeOftenData = {
        common: [],
        general: [],
        low: [],
    };
    tempData.forEach((d) => {
        const defKey = d.dbDataType?.[dbDialect];
        if(!defKey) {
            return;
        }
        if(!d.often) {
            typeOftenData.low.push({
                defKey,
                defName: `${d.defName}-${defKey}`,
            });
        } else if(d.often === '5') {
            typeOftenData.general.push({
                defKey,
                defName: `${d.defName}-${defKey}`,
            });
        } else if(d.often === '9') {
            typeOftenData.common.push({
                defKey,
                defName: `${d.defName}-${defKey}`,
            });
        } else {
            typeOftenData.low.push({
                defKey,
                defName: `${d.defName}-${defKey}`,
            });
        }
    });
    const uniqueByDefKey = array => _.uniqBy(array, 'defKey');

    typeOftenData.common = uniqueByDefKey(typeOftenData.common);
    typeOftenData.general = uniqueByDefKey(typeOftenData.general);
    typeOftenData.low = uniqueByDefKey(typeOftenData.low);

    const removeDefKeys = (sourceArray, targetArray) => {
        const defKeys = sourceArray.map(item => item.defKey);
        return targetArray.filter(item => !defKeys.includes(item.defKey));
    };

    typeOftenData.general = removeDefKeys(typeOftenData.common, typeOftenData.general);
    typeOftenData.low = removeDefKeys(typeOftenData.common, typeOftenData.low);

    typeOftenData.low = removeDefKeys(typeOftenData.general, typeOftenData.low);

    return [
        ...typeOftenData.common,
        ...typeOftenData.general,
        ...typeOftenData.low,
    ];
};

export const getDefaultSetting = (diagramType) => {
    const diagramSettingMap = {
        C: {
            entityDisplay: {
                showFields: [
                    'defKey',
                    'defName',
                    'dbDataType',
                    'dataLen',
                    'numScale',
                ],
                logicModelCompactShow: 'N',
                logicModelCompactDelimiter: ',',
            },
            entitySetting: {
                titleText: {
                    customValue: '{defKey}[{defName}]',
                    optionValue: 'A',
                },
                titleStyle: {
                    body: {
                        fill: 'rgb(159, 193, 255)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: 'rgb(0, 0, 0)',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                contentStyle: {
                    body: {
                        fill: '#ffffff',
                        'fill-opacity': 0.9,
                    },
                    text: {
                        fill: 'rgb(87, 87, 87)',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                primaryKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': 'underline',
                        textVerticalAnchor: 'middle',
                    },
                },
                foreignKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': null,
                        textVerticalAnchor: 'middle',
                    },
                },
                fieldStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                defaultSize: {
                    width: 100,
                    height: 100,
                    optionValue: 'A',
                },
                borderStyle: {
                    body: {
                        stroke: 'rgb(214, 214, 214)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': '0',
                        fill: 'rgba(0, 0, 0, 0)',
                        'fill-opacity': 1,
                    },
                },
                divideLineStyle: {
                    body: {
                        stroke: 'rgb(143, 143, 143)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': 0,
                    },
                },
            },
            shapeGeneral: {
                body: {
                    fill: 'rgb(196, 217, 253)',
                    stroke: 'rgb(179, 179, 179)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': '0',
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
            linkLine: {
                body: {
                    fill: 'rgb(183，185，189)',
                    stroke: 'rgb(15, 99, 255)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': 0,
                },
                text: {
                    fill: null,
                    fontSize: '12',
                    'font-style': 'italic',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': 'bold',
                    'text-decoration': 'underline',
                    textVerticalAnchor: 'middle',
                },
            },
            textbox: {
                body: {
                    fill: 'rgb(183，185，189)',
                    'fill-opacity': 1,
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: 'Arial',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
        },
        L: {
            entityDisplay: {
                showFields: [
                    'defKey',
                    'defName',
                    'baseDataType',
                    'dataLen',
                    'numScale',
                ],
                logicModelCompactShow: 'N',
                logicModelCompactDelimiter: ',',
            },
            entitySetting: {
                titleText: {
                    customValue: '{defKey}[{defName}]',
                    optionValue: 'A',
                },
                titleStyle: {
                    body: {
                        fill: 'rgb(159, 193, 255)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: 'rgb(0, 0, 0)',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                contentStyle: {
                    body: {
                        fill: '#ffffff',
                        'fill-opacity': 0.9,
                    },
                    text: {
                        fill: 'rgb(87, 87, 87)',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                primaryKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': 'underline',
                        textVerticalAnchor: 'middle',
                    },
                },
                foreignKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': null,
                        textVerticalAnchor: 'middle',
                    },
                },
                fieldStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                defaultSize: {
                    width: 400,
                    height: 248,
                    optionValue: 'C',
                },
                borderStyle: {
                    body: {
                        stroke: 'rgb(179, 179, 179)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': '0',
                    },
                },
                divideLineStyle: {
                    body: {
                        stroke: 'rgb(214, 214, 214)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': '0',
                    },
                },
            },
            shapeGeneral: {
                body: {
                    fill: 'rgb(159, 193, 255)',
                    stroke: 'rgb(179, 179, 179)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': '0',
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
            linkLine: {
                body: {
                    fill: 'rgb(183，185，189)',
                    stroke: 'rgb(0, 129, 210)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': '0',
                },
                text: {
                    fill: null,
                    fontSize: '12',
                    'font-style': 'italic',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': 'bold',
                    'text-decoration': 'underline',
                    textVerticalAnchor: 'middle',
                },
            },
            textbox: {
                body: {
                    fill: 'rgb(183，185，189)',
                    'fill-opacity': 1,
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: 'Arial',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
        },
        M: {
            themeConfig: {},
            layout: '',
            theme: 'classic7',
        },
        P: {
            entityDisplay: {
                showFields: [
                    'defKey',
                    'defName',
                    'dbDataType',
                    'dataLen',
                    'numScale',
                ],
                logicModelCompactShow: 'N',
                logicModelCompactDelimiter: ',',
            },
            entitySetting: {
                titleText: {
                    customValue: '{defKey}[{defName}]',
                    optionValue: 'A',
                },
                titleStyle: {
                    body: {
                        fill: 'rgb(159, 193, 255)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: 'rgb(0, 0, 0)',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                contentStyle: {
                    body: {
                        fill: '#ffffff',
                        'fill-opacity': 0.9,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                primaryKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': 'underline',
                        textVerticalAnchor: 'middle',
                    },
                },
                foreignKeyStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': 'italic',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': null,
                        textVerticalAnchor: 'middle',
                    },
                },
                fieldStyle: {
                    body: {
                        fill: 'rgb(183，185，189)',
                        'fill-opacity': 1,
                    },
                    text: {
                        fill: '',
                        fontSize: '12',
                        'font-style': '',
                        fontFamily: 'Arial',
                        textAnchor: 'middle',
                        'font-weight': 'bold',
                        'text-decoration': '',
                        textVerticalAnchor: 'middle',
                    },
                },
                defaultSize: {
                    width: 500,
                    height: 310,
                    optionValue: 'C',
                },
                borderStyle: {
                    body: {
                        stroke: 'rgb(179, 179, 179)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': '0',
                    },
                },
                divideLineStyle: {
                    body: {
                        stroke: 'rgb(214, 214, 214)',
                        'stroke-width': 1,
                        'stroke-opacity': 0.78695652173913,
                        'stroke-dasharray': '0',
                    },
                },
            },
            shapeGeneral: {
                body: {
                    fill: 'rgb(159, 193, 255)',
                    stroke: 'rgb(179, 179, 179)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': '0',
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
            linkLine: {
                body: {
                    fill: 'rgb(183，185，189)',
                    stroke: 'rgb(122, 167, 250)',
                    'fill-opacity': 1,
                    'stroke-width': 1,
                    'stroke-opacity': 0.78695652173913,
                    'stroke-dasharray': '0',
                },
                text: {
                    fill: null,
                    fontSize: '12',
                    'font-style': 'italic',
                    fontFamily: '思源黑体,',
                    textAnchor: 'middle',
                    'font-weight': 'bold',
                    'text-decoration': 'underline',
                    textVerticalAnchor: 'middle',
                },
            },
            textbox: {
                body: {
                    fill: 'rgb(183，185，189)',
                    'fill-opacity': 1,
                },
                text: {
                    fill: '',
                    fontSize: '12',
                    'font-style': '',
                    fontFamily: 'Arial',
                    textAnchor: 'middle',
                    'font-weight': '',
                    'text-decoration': '',
                    textVerticalAnchor: 'middle',
                },
            },
        },
    };
    return diagramSettingMap[diagramType] || {};
};

export const checkStringsInObject = (obj, keys) =>  {
    return _.every(keys, (key) => {
        return !_.isEmpty(_.trim(obj[key]));
    });
};
