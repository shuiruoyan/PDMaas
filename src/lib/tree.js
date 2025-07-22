import {ACTION, COMPONENT, ENTITY, PROFILE, WS} from './constant';

// 更新树的某个节点
export const updateTreeNode = (tree, treeNode, keyName = 'id', replace) => {
    const getId = (node) => {
      return keyName.split('.').reduce((a,b) => {
          return a[b]
      }, node)
    }
    return tree.map(t => {
        const nodeData = typeof treeNode === "function" ? treeNode(t) : treeNode;
        if(getId(t) === getId(nodeData)) {
            const newNodeData = {
                ...t,
                ...nodeData,
            };
            if(replace) {
                return replace(newNodeData);
            }
            return newNodeData;
        } else if(t.children && t.children.length > 0) {
            return {
                ...t,
                children: updateTreeNode(t.children, treeNode, keyName, replace)
            }
        }
        return t;
    })
}



// 搜索
export const searchTreeNode = (tree, filter) => {
    let node = null;
    for (let i = 0; i < tree.length; i++) {
        const t = tree[i]
        if(filter(t)) {
            node = t;
            break;
        } else if(t.children) {
            const child = searchTreeNode(t.children, filter);
            if(child){
                node = child;
                break;
            }
        }
    }
    return node;
}

// 扁平树
export const tree2array = (tree, parents = [], keyAttribute = 'children', uniqueKey = 'id') => {
    // 树转扁平数组 同时计算好每一条数据的父子关系
    return tree
        .reduce((pre, next) => {
            const children = tree2array(next[keyAttribute] || [], parents.concat(next));
            return pre.concat({
                ...next,
                parents,
                parentId: parents.slice(-1)[0]?.[uniqueKey],
                children: next[keyAttribute] ? children : null,
            }).concat(children);
        }, []);
};

// 构建树
export const array2treeSimple = (data, uniqueKey = 'id', keyAttribute = 'parentId') => {
    const allData = [...data];
    const calcChildren = (children) => {
        children.forEach((d) => {
            calcChildren(allData.filter((c) => c[keyAttribute] === d[uniqueKey]), uniqueKey, keyAttribute);
            const currentChildren = allData.filter((c) => c[keyAttribute] === d[uniqueKey]);
            // 移除所有的子节点
            currentChildren.forEach(c => {
                const index = allData.findIndex(a => a[uniqueKey] === c[uniqueKey])
                allData.splice(index, 1)
            })
            // 更新有子节点的数据
            if(currentChildren.length > 0) {
                const currentIndex = allData.findIndex(a => a[uniqueKey] === d[uniqueKey]);
                if(currentIndex > -1) {
                    allData[currentIndex] = {
                        ...d,
                        children: currentChildren,
                    }
                }
            }
        });
    };
    calcChildren(allData);
    return allData
};

// 构建树
export const array2tree = (data, uniqueKey = 'id', keyAttribute = 'parentId') => {
    const allData = [...data];
    const calcChildren = (children) => {
        return children.map((d) => {
            const tempChildren = calcChildren(
                allData.filter((c) => c[keyAttribute] === d[uniqueKey]), uniqueKey, keyAttribute);
            return {
                ...d,
                children: tempChildren.length > 0 ? tempChildren : null,
            };
        });
    };
    return calcChildren(data).filter((d) => !d[keyAttribute]);
};

// 新增节点
export const addTreeNode = (tree, node, to, type = COMPONENT.TREE.PEER,
                            position = COMPONENT.TREE.AFTER, uniqueKey = 'id') => {
    const tempTree = [...tree];
    if(to) {
        const calcChildren = (data) => {
            for (let i= 0; i < data.length; i += 1) {
                const children = data[i]?.children || [];
                const tempChildren = addTreeNode(children, node, to, type, position);
                data[i] = {
                    ...data[i],
                    children: tempChildren
                }
                if(children.length !== tempChildren.length) {
                    return data
                }
            }
            return data;
        }
        if(type === COMPONENT.TREE.PEER) {
            const toIndex = tempTree.findIndex(t => t[uniqueKey] === to);
            if(toIndex > -1) {
                tempTree.splice(position === COMPONENT.TREE.BEFORE ? toIndex : toIndex + 1, 0, node);
                return tempTree;
            } else {
                return calcChildren(tempTree);
            }
        } else {
            const toIndex = tempTree.findIndex(t => t[uniqueKey] === to);
            if(toIndex > -1) {
                const tempChildren = tempTree[toIndex].children || [];
                tempTree[toIndex] = {
                    ...tempTree[toIndex],
                    children: position === COMPONENT.TREE.AFTER ? tempChildren.concat(node)
                        : [node].concat(tempChildren)
                };
                return tempTree;
            } else {
                return calcChildren(tempTree);
            }
        }
    }
    return tempTree.concat(node);
}

export const batchUpdateSchemaName = (temp, payload) => {
    const categoryId = payload.next.id;
    const [categories, entities] = temp;
    const updateCategory = tree2array(categories).find(it => it.id === categoryId)
    if(updateCategory && updateCategory.bindSchema === 1 && payload.next.data.defKey !== payload.pre.data.defKey) {
        const entitiesKey = updateCategory.entityRefs.map(it => it.refObjectId) || []
        return entities.map(e => {
            if(entitiesKey.includes(e.id)) {
                return {
                    ...e,
                    schemaName: payload.next.data.defKey
                }
            }
            return e;
        })
    }
    return entities;
}

// 删除节点
export const deleteTreeNode = (tree, node, uniqueKey = 'id') => {
    let isDelete, childrenData = []
    const deleteNode = (data) => {
        const tempDeleteData = data.find(t => t[uniqueKey] === node[uniqueKey]);
        if(tempDeleteData) {
            childrenData = [...tempDeleteData.children || []]
        }
        const tempTree = data.filter(t => t[uniqueKey] !== node[uniqueKey]);
        if(tempTree.length === data.length) {
            for (let i = 0; i < tempTree.length; i += 1) {
                if(isDelete) {
                    return tempTree
                }
                const children = tempTree[i].children || [];
                const tempChildren = deleteNode(children || [], node, uniqueKey);
                tempTree[i] = {
                    ...tempTree[i],
                    children: tempChildren
                }
                if(children.length !== tempChildren.length) {
                    isDelete = true;
                    return tempTree;
                }
            }
            return tempTree
        }
        return tempTree;
    }
    return [
        ...deleteNode(tree),
        ...childrenData.map(item => ({
            ...item,
            parentId: null
        }))
    ];
}

// 删除节点
export const deleteEntityNode = (tree, node, uniqueKey = 'entityRefs') => {
    let isDelete;
    const deleteNode = (data) => {
        if(isDelete) {
            return data;
        }
        const tempTree = [...data]
        for (let i = 0; i < tempTree.length; i += 1) {
            const refs = (tempTree[i][uniqueKey] || []).filter(t => t.refObjectId !== node.id);

            const children = tempTree[i].children || [];
            const tempChildren = deleteNode(children || [], node, uniqueKey);
            tempTree[i] = {
                ...tempTree[i],
                children: tempChildren
            }
            if(refs.length !== tempTree[i][uniqueKey].length) {
                tempTree[i][uniqueKey] = refs;
                isDelete = true;
                return tempTree;
            }
        }

        return tempTree;
    }
    return deleteNode(tree);
}


// 移动节点
export const moveTreeNode = (tree, {from, to, type, position}, uniqueKey = 'id') => {
    const tempTree = [...tree];
    if(from === to) {
        return tempTree;
    }
    let fromNode, toNode, moveSuccess;
    const move = (data) => {
        for (let i = 0; i < data.length; i += 1) {
            if(moveSuccess) {
                // 如果移动成功 直接中断所有循环
                return data;
            }
            if(from === data[i][uniqueKey]) {
                fromNode = {
                    index: i,
                    current: data[i],
                    parent: data
                };
            }
            if(to === data[i][uniqueKey]) {
                toNode = {
                    current: data[i],
                    parent: data
                };
            }
            if(toNode && fromNode) {
                moveSuccess = true;
                const fromParent = fromNode.parent;
                const fromIndex = fromNode.index;
                const toCurrent = toNode.current;
                const fromCurrent = {
                    ...fromNode.current,
                    parentId: type === COMPONENT.TREE.SUB ? toCurrent.id : toCurrent.parentId
                };
                const toParent = toNode.parent;
                // 删除from节点
                fromParent.splice(fromIndex, 1);
                // 获取to节点的索引
                const toIndex = toParent.findIndex(p => p[uniqueKey] === toCurrent[uniqueKey]);
                if(type === COMPONENT.TREE.SUB) {
                    toParent[toIndex] = {
                        ...toCurrent,
                        children: position === COMPONENT.TREE.BEFORE ?
                            [fromCurrent].concat(toCurrent.children || []) :
                            (toCurrent.children || []).concat(fromCurrent)
                    }
                } else {
                    if(position === COMPONENT.TREE.AFTER) {
                        toParent.splice(toIndex + 1, 0, fromCurrent);
                    } else {
                        toParent.splice(toIndex, 0, fromCurrent);
                    }
                }
                // 提前结束
                return data;
            }
            // 继续往下寻找
            const children = data[i].children;
            if(children) {
                data[i].children = move(children);
            }
        }
        return data;
    }
    return move(tempTree);
}

export const moveEntityNodeFlat = (tree, {from, to, type, position, parentId, data}, hierarchyType, uniqueKey = 'entityRefs') => {
    const tempTree = [...tree];
    if(from === to || hierarchyType === PROFILE.USER.TREE) {
        return tempTree;
    }
    let fromNode, toNode;
    for(let i = 0; i < tempTree.length; i++) {
        if(from === tempTree[i]['refObjectId']) {
            fromNode = {
                index: i,
                current: tempTree[i]
            };
        }
        if(to === tempTree[i]['refObjectId']) {
            toNode = {
                index: i,
                current: tempTree[i]
            };
        }

        if(fromNode && toNode) {
            break;
        }
    }
    tempTree.splice(fromNode.index, 1)
    const toIndex = tempTree.findIndex(p => p['refObjectId'] === toNode.current['refObjectId']);
    if(position === COMPONENT.TREE.AFTER) {
        tempTree.splice(toIndex + 1, 0, fromNode.current);
    } else {
        tempTree.splice(toIndex, 0, fromNode.current);
    }
    return tempTree;
}

export const processEntityBatchAdjustFlat = (flatData, payload) => {
    const {next, hierarchyType} = payload;
    if(hierarchyType === PROFILE.USER.TREE) {
        return [...(flatData || [])]
    }

    const currentFlatData = [...(flatData || [])]
        .filter(it => ![...(next || [])].find(e => e.id === it.refObjectId))

    return [
        ...[...(currentFlatData || [])],
        ...[...(next || [])].map((it, index) => ({
            refObjectId: it.id,
            refObjectType: 'E',
            orderValue: index + 1
        }))
    ]
}

export const processDiagramBatchAdjustFlat = (flatData, payload) => {
    const {next, hierarchyType} = payload;
    if(hierarchyType === PROFILE.USER.TREE) {
        return [...(flatData || [])]
    }

    return [...(next || [])].map((it, index) => ({
        refObjectId: it.id,
        refObjectType: 'D',
        orderValue: index + 1
    }))
}

const compareArrays = (pre, next) =>  {
    return pre.reduce((result, preItem) => {
        const nextItem = _.find(next, { id: preItem.id });
        if (nextItem) {
            if (preItem.parentId !== nextItem.parentId) {
                result.push({ pre: preItem, next: nextItem });
            }
        }
        return result;
    }, []);
}

export const processDiagramCategory = (categories, payload) => {
    const {pre, next, categoryId, hierarchyType} = payload;
    if(hierarchyType === PROFILE.USER.TREE) {
        let dictionary = _.groupBy([...(payload.next || [])], it => it.parentId);
        const categoryIds = Object.keys(dictionary).filter(it => it)
        return array2tree(tree2array(categories || []).map(category => {
            if (category.id === categoryId) {
                const currentData = dictionary[category.id]
                return {
                    ...category,
                    diagramRefs: [
                        ...[...(currentData || [])].map((it, i) => ({
                            refObjectId: it.id,
                            refObjectType: "D",
                            orderValue: i + 1
                        }))
                    ]
                }
            } else if (categoryIds.includes(category.id)) {
                const currentData = dictionary[category.id]
                const count = (category?.diagramRefs || []).length;
                return {
                    ...category,
                    diagramRefs: [
                        ...(category?.diagramRefs || []),
                        ...currentData.map((it, i) => ({
                            refObjectId: it.id,
                            refObjectType: "D",
                            orderValue: count + i + 1

                        }))

                    ]
                }
            }
            return category;
        }))
    }
    const updateCategoryData = compareArrays(pre, next);
    const preData = _.map(updateCategoryData, it => it.pre)
    const nextData = _.map(updateCategoryData, it => it.next)
    const currentArrayTree = tree2array(categories || []).map(category => {
        let currentCategory = {...category};
        const preArray = preData.filter(it => it.parentId === category.id)
        const nextArray = nextData.filter(it => it.parentId === category.id)
        if(preArray.length > 0) {
            const { diagramRefs } = currentCategory;
            currentCategory = {
                ...currentCategory,
                diagramRefs: [
                    ...(diagramRefs || [])
                        .filter(it => !preArray.find(p => p.id === it.refObjectId))
                        .map((it, index) => ({
                            refObjectId: it.refObjectId,
                            refObjectType: "D",
                            orderValue: index + 1
                        }))
                ]
            }
        }
        if(nextArray.length > 0) {
            const { diagramRefs } = currentCategory;
            const count = (diagramRefs || []).length;
            currentCategory = {
                ...currentCategory,
                diagramRefs: [
                    ...diagramRefs,
                    ...[...(nextArray || [])].map((it, index) => ({
                        refObjectId: it.id,
                        refObjectType: "E",
                        orderValue: count + index + 1
                    }))
                ]
            }
        }
        return currentCategory;
    });
    return array2tree(currentArrayTree);
}
export const processEntityCategory = (categories, payload, entities) => {
    const {pre, next, categoryId, hierarchyType} = payload;
    const entityType = next[0]?.type;
    if(hierarchyType === PROFILE.USER.TREE) {
        let dictionary = _.groupBy([...(payload.next || [])], it => it.parentId);
        const categoryIds = Object.keys(dictionary).filter(it => it)
        return array2tree(tree2array(categories || []).map(category => {
            if (category.id === categoryId) {
                const tempEntityRefs = [...(category.entityRefs || [])].map(it => {
                    const currentEntity = entities.find(entity => entity.id === it.refObjectId)
                    return {
                        ...it,
                        type: currentEntity.type
                    }
                }).filter(it => it.type !== entityType);

                const currentData = dictionary[category.id]
                return {
                    ...category,
                    entityRefs: [
                        ...tempEntityRefs,
                        ...[...(currentData || [])].map((it, i) => ({
                            refObjectId: it.id,
                            refObjectType: "E",
                            orderValue: i + 1

                        }))

                    ]
                }
            } else if (categoryIds.includes(category.id)) {
                const tempEntityRefs = [...(category.entityRefs || [])].map(it => {
                    const currentEntity = entities.find(entity => entity.id === it.refObjectId)
                    return {
                        ...it,
                        type: currentEntity.type
                    }
                });
                const count = tempEntityRefs.filter(it => it.type === entityType)?.length || 0;
                const currentData = dictionary[category.id]
                return {
                    ...category,
                    entityRefs: [
                        ...tempEntityRefs,
                        ...currentData.map((it, i) => ({
                            refObjectId: it.id,
                            refObjectType: "E",
                            orderValue: count + i + 1

                        }))

                    ]
                }
            }
            return category;
        }))
    }
    const updateCategoryData = compareArrays(pre, next);
    const preData = _.map(updateCategoryData, it => it.pre)
    const nextData = _.map(updateCategoryData, it => it.next)
    const currentArrayTree = tree2array(categories || []).map(category => {
        let currentCategory = {...category};
        const preArray = preData.filter(it => it.parentId === category.id)
        const nextArray = nextData.filter(it => it.parentId === category.id)
        if(preArray.length > 0) {
            const { entityRefs } = currentCategory;
            const currentEntityRefs = [...(entityRefs || [])].map(it => {
                const currentEntity = entities.find(e => e.id === it.refObjectId)
                return {
                    ...it,
                    type: currentEntity?.type
                }
            })
            const currentTypeEntityRefs = currentEntityRefs.filter(it => it.type === entityType);
            currentCategory = {
                ...currentCategory,
                entityRefs: [
                    ...currentEntityRefs.filter(it => it.type !== entityType),
                    ...currentTypeEntityRefs
                        .filter(it => !preArray.find(p => p.id === it.refObjectId))
                        .map((it, index) => ({
                            refObjectId: it.refObjectId,
                            refObjectType: "E",
                            orderValue: index + 1
                        }))
                ]
            }
        }
        if(nextArray.length > 0) {
            const { entityRefs } = currentCategory;
            const currentEntityRefs = [...(entityRefs || [])].map(it => {
                const currentEntity = entities.find(e => e.id === it.refObjectId)
                return {
                    ...it,
                    type: currentEntity?.type
                }
            })
            const count = currentEntityRefs.filter(it => it.type === entityType).length;
            currentCategory = {
                ...currentCategory,
                entityRefs: [
                    ...currentEntityRefs.filter(it => it.type !== entityType),
                    ...[...(nextArray || [])].map((it, index) => ({
                        refObjectId: it.id,
                        refObjectType: "E",
                        orderValue: count + index + 1
                    }))
                ]
            }
        }
        return currentCategory;
    });
    return array2tree(currentArrayTree);
}

export const moveChangeCategory = (tree, {from, to, type, position, id, objType}, uniqueKey = 'entityRefs') => {
    const tempTree = [...tree];
    if(from === to) {
        return tempTree;
    }
    let fromNode, toNode;
    const move = (data) => {
        for (let i = 0; i < data.length; i += 1) {
            if(fromNode && toNode) {
                return data;
            }
            if(!fromNode) {
                for(let j = 0; j < data[i][uniqueKey].length; j ++) {
                    if(id === data[i][uniqueKey][j]['refObjectId']) {
                        fromNode = {
                            index: j,
                            current: data[i][uniqueKey][j],
                            parent: data[i]
                        };
                    }
                }
            }
            if(to && !toNode && to === data[i].id) {
                toNode = {
                    current: data[i],
                }
            }
            const children = data[i].children;
            if(children) {
                data[i].children = move(children);
            }
        }
        return data;
    }
    const temp = move(tempTree);
    if(fromNode) {
        const fromParent = fromNode.parent;
        const fromIndex = fromNode.index;
        fromParent[uniqueKey].splice(fromIndex, 1);
    }
    if(toNode) {
        let fromCurrent = {};
        const toParent = toNode.current;
        if(fromNode) {
            fromCurrent = fromNode.current;
        }
        else {
            fromCurrent = {
                refObjectId: id,
                refObjectType: objType,
                orderValue: (toParent[uniqueKey] || []).length + 1
            }
        }
        toParent[uniqueKey] = (toParent[uniqueKey] || []).concat(fromCurrent)
    }
    return temp;

}

export const moveEntityNode = (tree, {from, to, type, position, parentId, data}, hierarchyType, uniqueKey = 'entityRefs') => {
    const tempTree = [...tree];
    if(parentId === to /*|| hierarchyType === PROFILE.USER.FLAT*/) {
        return tempTree;
    }
    let fromNode, toNode, moveSuccess;
    const move = (data) => {
        for (let i = 0; i < data.length; i += 1) {
            if(moveSuccess) {
                // 如果移动成功 直接中断所有循环
                return data;
            }
            if(!fromNode) {
                for(let j = 0; j < data[i][uniqueKey].length; j ++) {
                    if(from === data[i][uniqueKey][j]['refObjectId']) {
                        fromNode = {
                            index: j,
                            current: data[i][uniqueKey][j],
                            parent: data[i]
                        };
                    }
                }
            }
            if(!toNode) {
                if(to === data[i].id) {
                    toNode = {
                        current: data[i],
                        parent: data[i],
                        refType: 'dir'
                    };
                } else if(type !== COMPONENT.TREE.SUB){
                    for(let j = 0; j < data[i][uniqueKey].length; j ++) {
                        if(to === data[i][uniqueKey][j]['refObjectId']) {
                            toNode = {
                                index: j,
                                current: data[i][uniqueKey][j],
                                parent: data[i],
                                refType: 'entity'
                            };
                            break;
                        }
                    }
                }

            }

            if(toNode && fromNode) {
                moveSuccess = true;
                const fromCurrent = fromNode.current;
                const fromParent = fromNode.parent;
                const fromIndex = fromNode.index;
                const toCurrent = toNode.current;
                const toParent = toNode.parent;
                const refType = toNode.refType;
                if(!toCurrent.refObjectType && type === COMPONENT.TREE.PEER) {
                    return data;
                }
                // 删除from节点
                fromParent[uniqueKey].splice(fromIndex, 1);
                if(refType === 'dir') {
                    toParent[uniqueKey] = (toParent[uniqueKey] || []).concat(fromCurrent)
                } else {
                    const toIndex = toParent[uniqueKey].findIndex(p => p['refObjectId'] === toCurrent['refObjectId']);
                    if(position === COMPONENT.TREE.AFTER) {
                        toParent[uniqueKey].splice(toIndex + 1, 0, fromCurrent);
                    } else {
                        toParent[uniqueKey].splice(toIndex, 0, fromCurrent);
                    }
                }
                return data;
            }
            // 继续往下寻找
            const children = data[i].children;
            if(children) {
                data[i].children = move(children);
            }
        }
        return data;
    }
    let temp = move(tempTree);
    if(!fromNode && toNode) {
        const toCurrent = toNode.current;
        const toParent = toNode.parent;
        const refType = toNode.refType;
        toParent[uniqueKey] = (toParent[uniqueKey] || []).concat({
            refObjectId: from,
            type: data.type
        })
    }
    if((to === undefined || to === null || to === '') && fromNode) {
        const fromParent = fromNode.parent;
        const fromIndex = fromNode.index;
        fromParent[uniqueKey].splice(fromIndex, 1);
    }
    return temp;
}

export const isEmptyNode = (node) => {
    const filterEmpty = (data) => {
        const children = (data.children || []);
        if(children.length === 0){
            return true
        } else {
            return children.filter(c => !filterEmpty(c)).length === 0
        }
    }
    return filterEmpty(node);
}

export const injectTreeChildren = (tree, data, keyName, callback, filterEmpty) => {
    return (tree || []).map((t) => {
        return {
            ...t,
            children: (() => {
                let tmpArray = (t.children || []);
                if (tmpArray.length > 0) {
                    tmpArray = injectTreeChildren(tmpArray, data, keyName, callback, filterEmpty);
                }
                const currentData = data.filter(d => d[keyName] === t[keyName]);
                tmpArray = tmpArray.concat(currentData.map(c => ({
                    ...c,
                    ...callback(c)
                })));
                return tmpArray;
            })(),
        };
    }).filter(t => {
        if(filterEmpty) {
            if(t.children) {
                return t.children.length > 0;
            }
            return true;
        }
        return true;
    });
}

// 去除空节点
export const filterEmptyTree = (tree) => {
    return tree.map(t => {
        return {
            ...t,
            children: t.children ? filterEmptyTree(t.children) : t.children,
        }
    }).filter(t => t.children ? t.children.length > 0 : tree);
};

export const batchUpdate = (entities, payload) => {
    if(!payload) {
        return entities;
    }
    const {type} = payload;
    if(type === WS.BATCH.ENTITY_P_BASE_DATATYPE_UPDATE) {
        const {preDBDataType, nextBaseDataType, nextDBDataType} = payload
        return [...entities].map(entity => {
            if(entity.type !== ENTITY.TYPE.P) {
                return entity;
            }
            return {
                ...entity,
                fields: (entity.fields || []).map(field => {
                    if(field.dbDataType === preDBDataType) {
                        return  {
                            ...field,
                            bizDomainType: null,
                            dbDataType: nextDBDataType,
                            baseDataType: nextBaseDataType
                        }
                    }
                    return field;
                })
            }
        })
    }

    if(type === WS.BATCH.ENTITY_L_BASE_DATATYPE_UPDATE) {
        const {preBaseDataType, nextBaseDataType} = payload;
        return [...entities].map(entity => {
            if(entity.type !== ENTITY.TYPE.L) {
                return entity;
            }
            return {
                ...entity,
                fields: (entity.fields || []).map(field => {
                    if(field.baseDataType === preBaseDataType) {
                        return  {
                            ...field,
                            baseDataType: nextBaseDataType
                        }
                    }
                    return field;
                })
            }
        })
    }

    if(type === WS.BATCH.DOMAIN_BATCH_UPDATE) {
        const { bizDomainObj } = payload
        return entities.map(entity => {
            if(entity.type !== ENTITY.TYPE.P) {
                return entity;
            }
            return {
                ...entity,
                fields: (entity.fields || []).map(field => {
                    if(field.bizDomainType === bizDomainObj.defKey) {
                        return  {
                            ...field,
                            bizDomainType: bizDomainObj.defKey,
                            ..._.omit(bizDomainObj, ['defKey', 'defName', 'id', 'teamId', 'orderValue'])
                        }
                    }
                    return field;
                })
            }
        })
    }
}


