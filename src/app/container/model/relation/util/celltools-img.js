// 一次性将节点数据计算好 无需节点单独分步计算
import {
    calcNodeSize, getMaxFieldSize,
    getNodePortAttrs,
    getNodePrimaryAndNormal, isConceptEntity,
    isEntityNode, isJumpOverEdge,
} from './celltools';

const getFieldsCount = (nodeSize, nodeFields) => {
    // 留给字段的高度 = 节点高度 - 表头高度 - 主键边框高度 - 节点边框高度
    const fieldsHeight = nodeSize.height - 39 - 1 - 2;
    const fieldCount = Math.floor(fieldsHeight / 26);
    if(nodeFields.length > fieldCount) {
        // 节点大小无法完全显示所有字段时 需要预留13px操作图标空间
        return Math.floor((fieldsHeight - 21) / 26);
    } else {
        return fieldCount;
    }
};
const sliceFields = (sortFields, showFieldCount) => {
    const [primaryFields, normalFields, foreignFields] = sortFields;
    const allFields = primaryFields.map((f, i) => {
        return {
            ...f,
            __type: 'primary',
            __isEnd: primaryFields.length - 1 === i,
        };
    }).concat(foreignFields.map((f) => {
        return {
            ...f,
            __type: 'foreign',
        };
    })).concat(normalFields.map((f) => {
        return {
            ...f,
            __type: 'normal',
        };
    }));
    return [allFields.slice(0, showFieldCount),  allFields.slice(showFieldCount),
        primaryFields, normalFields, foreignFields];
};
const getPortType = (port) => {
    const portArray = port.split('_');
    return portArray.slice(-1)[0] || '';
};

const getTempPort = (group, size) => {
    return {
        group,
        id: `more_${group}`,
        args: {
            x: group === 'out' ? '100%' : 0, y: size.height - 14,
        },
        attrs: {
            circle: {
                magnet: false,
                style: {
                    pointerEvents: 'none',
                    // 隐藏锚点
                    opacity: 1,
                },
            },
        },
    };
};
const getFieldItems = (field, index, isHidden) => {
    const attrs = isHidden ? {
        magnet: false,
        style: {
            // 隐藏锚点
            opacity: 0,
        },
    } : {
        magnet: true,
        style: {
            opacity: 1,
        },
    };
    return [{
        args: { x: 0, y: 40 + (index + 1) * 26 - 13 },
        id: `${field.id}_in`,
        group: 'in',
        attrs,
    }, {
        args: { x: '100%', y: 40 + (index + 1) * 26 - 13 },
        id: `${field.id}_out`,
        group: 'out',
        attrs,
    }];
};

export const getHindFieldsPort = (c, normalFields, hiddenFields) => {
    return ((c.shape.startsWith('logic-entity-node') && !c.isExpand) ?
        normalFields : hiddenFields).reduce((p, n) => {
        return p.concat([`${n.id}_in`, `${n.id}_out`]);
    }, []);
};

const calcPortsSimple = (size, showFields, hiddenFields) => {
    return {
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
      items: showFields
          .reduce((p, n, i) => {
              return p.concat(getFieldItems(n, i, false));
          }, [])
          .concat(hiddenFields.reduce((p, n, i) => {
              return p.concat(getFieldItems(n, i, true));
          }, []))
          .concat(getTempPort('out', size), getTempPort('in', size)),
  };
};

const calcPorts = (size, showFields, hiddenFields, nodeId, edges, c, normalFields) => {
    const hindFieldsPort = getHindFieldsPort(c, normalFields, hiddenFields);
    return [{
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
        items: showFields
            .reduce((p, n, i) => {
                return p.concat(getFieldItems(n, i, false));
            }, [])
            .concat(hiddenFields.reduce((p, n, i) => {
                return p.concat(getFieldItems(n, i, true));
            }, []))
            .concat(getTempPort('out', size), getTempPort('in', size)),
    }, edges.map((e) => {
        if(e.target?.cell === nodeId) {
            const targetPort = e.target?.port;
            if(hindFieldsPort.includes(targetPort)) {
                const type = getPortType(targetPort);
                return {
                    ...e,
                    target: {
                        ...e.target,
                        originPort: targetPort,
                        port: `more_${type}`,
                    },
                };
            }
            return e;
        } else if(e.source?.cell === nodeId) {
            const sourcePort = e.source?.port;
            if(hindFieldsPort.includes(sourcePort)) {
                const type = getPortType(sourcePort);
                return {
                    ...e,
                    source: {
                        ...e.source,
                        originPort: sourcePort,
                        port: `more_${type}`,
                    },
                };
            }
            return e;
        }
        return e;
    })];
};

export const simpleImgCmds = (cmds) => {
    return cmds.map((c) => {
        // 命令中无需包含originData的原始数据
        if(c.data && c.data.props && isEntityNode(c.data.props)) {
            if(c.event === 'cell:removed') {
                return {
                    ...c,
                    data: {
                        id: c.data.id,
                    },
                };
            } else if(c.event === 'cell:added') {
                return {
                    ...c,
                    data: {
                        ...c.data,
                        props: {
                            ...c.data.props,
                            originData: {
                                id: c.data.props.originData.id,
                            },
                            fieldsData: {},
                            shape: c.data.props.shape.split('-img')[0],
                        },
                    },
                };
            }
        } else if(c.event === 'cell:change:labels') {
            return {
                ...c,
                data: {
                    ...c.data,
                    prev: {
                        ...c.data.prev,
                        labels: c.data.prev.labels || [],
                    },
                    next: {
                        ...c.data.next,
                        labels: c.data.next.labels || [],
                    },
                },
            };
        }
        return c;
    });
};

export const transformEntityCellFieldsAndPorts2Img = (c, originData, edges) => {
    const fieldsData = c.prop('fieldsData');
    const finalSize = c.prop('size');
    // 1.计算是否需要隐藏字段
    const showFieldCount = getFieldsCount(finalSize, originData.fields || []);
    // 2.计算字段分类排序
    const sortFields =
        getNodePrimaryAndNormal(c, originData.fields || [], edges);
    // 3.根据排序计算需要隐藏和显示的字段
    const [showFields, hiddenFields, primaryFields,
        normalFields, foreignFields] = sliceFields(sortFields, showFieldCount);
    // 5.根据字段的隐藏和显示计算锚点位置
    const ports = calcPortsSimple(finalSize, showFields, hiddenFields);
    return {
        ports: {
            ...ports,
            // 去除隐藏的锚点
            items: ports.items.filter((item) => {
                if(item.attrs?.circle) {
                    return item.attrs.circle.style?.opacity !== 0;
                }
                return item.attrs?.style?.opacity !== 0;
            }),
        },
        fieldsData: {
            ...fieldsData,
            showFields,
            hiddenFields,
            primaryFields,
            normalFields,
            foreignFields,
        },
    };
};

export const transformEntityCell2Img = (c, originData, defaultData) => {
    const { entityRelationRank, props } = defaultData;
    const { entityDisplay, entitySetting } = props;
    const count = defaultData.cellsData
        .filter(cell => cell.originData?.id === originData.id).length + 1;
    if(isConceptEntity(c)) {
        return {
            ...c,
            originData,
            count,
            entitySetting: {
                ...c.entitySetting,
                titleText: entitySetting.titleText,
            },
        };
    }
    // 1.计算节点大小数据
    const autoSize = c.autoSize;
    const { nodeSize, maxFieldSize}
        = calcNodeSize(originData, entityDisplay.showFields);
    const finalSize = autoSize ? nodeSize : c.size;
    // 2.计算是否需要隐藏字段
    const showFieldCount = getFieldsCount(finalSize, originData.fields || []);
    // 3.计算字段分类排序
    const sortFields =
        getNodePrimaryAndNormal(c, originData.fields || [], []);
    // 4.根据排序计算需要隐藏和显示的字段
    const [showFields, hiddenFields, primaryFields,
        normalFields, foreignFields] = sliceFields(sortFields, showFieldCount);
    // 5.根据字段的隐藏和显示计算锚点位置
    let newPorts = c.ports;
    if(entityRelationRank === 'F') {
        const [ports] = calcPorts(finalSize,
            showFields, hiddenFields,
            c.id, [], c, normalFields);
        newPorts = ports;
    }
    return {
        ...c,
        shape: `${c.shape}-img`,
        count,
        entityDisplay,
        entitySetting: {
            ...c.entitySetting,
            titleText: entitySetting.titleText,
        },
        entityRelationRank,
        ports: {
            ...newPorts,
            // 去除隐藏的锚点
            items: newPorts.items.filter((item) => {
                if(item.attrs?.circle) {
                    return item.attrs.circle.style?.opacity !== 0;
                }
                return item.attrs?.style?.opacity !== 0;
            }),
        },
        originData,
        fieldsData: {
            maxFieldSize,
            showFields,
            hiddenFields,
            primaryFields,
            normalFields,
            foreignFields,
        },
        size: finalSize,
    };
};

// 生成图片时将数据都算好 无需在节点渲染时计算 同时把跳线放最后
export const transformCells2Img = (defaultData, dataSource) => {
    const { cellsData, entityRelationRank, props } = defaultData;
    const { entityDisplay, entitySetting } = props;
    const countMap = {};
    let edges = cellsData.filter(cell => cell.shape === 'edge');
    const normalEdges = edges.filter(e => !isJumpOverEdge(e));
    const jumpoverEdges = edges.filter(e => isJumpOverEdge(e));
    edges = normalEdges.concat(jumpoverEdges);
    return cellsData.filter(c => c.shape !== 'edge').map((c) => {
        if(isEntityNode(c)) {
            const originId = c.originData.id;
            const originData = (dataSource.project?.entities || [])
                .find(e => e.id === originId);
            if(!countMap[originId]) {
                countMap[originId] = 1;
            } else {
                countMap[originId] += 1;
            }
            if(originData) {
                if(isConceptEntity(c)) {
                    return {
                        ...c,
                        count: countMap[originId],
                        originData,
                        entitySetting: {
                            ...c.entitySetting,
                            titleText: entitySetting.titleText,
                        },
                    };
                }
                // 1.计算节点大小数据
                const autoSize = c.autoSize;
                const { nodeSize, maxFieldSize, allFieldSize}
                    = calcNodeSize(originData, entityDisplay.showFields);
                const finalSize = autoSize ? nodeSize : c.size;
                // 2.计算是否需要隐藏字段
                const showFieldCount = getFieldsCount(finalSize, originData.fields || []);
                // 3.计算字段分类排序
                const sortFields =
                    getNodePrimaryAndNormal(c, originData.fields || [], edges);
                // 4.根据排序计算需要隐藏和显示的字段
                const [showFields, hiddenFields, primaryFields,
                    normalFields, foreignFields] = sliceFields(sortFields, showFieldCount);
                // 5.根据字段的隐藏和显示计算锚点位置
                let newPorts = c.ports;
                if(entityRelationRank === 'F') {
                    const [ports, newEdges] = calcPorts(finalSize,
                        showFields, hiddenFields,
                        c.id, edges, c, normalFields);
                    newPorts = ports;
                    edges = newEdges;
                }
                return {
                    ...c,
                    shape: `${c.shape}-img`,
                    entityDisplay,
                    entitySetting: {
                        ...c.entitySetting,
                        titleText: entitySetting.titleText,
                    },
                    entityRelationRank,
                    ports: {
                        ...newPorts,
                        // 去除隐藏的锚点
                        items: newPorts.items.filter((item) => {
                            if(item.attrs?.circle) {
                                return item.attrs.circle.style?.opacity !== 0;
                            }
                            return item.attrs?.style?.opacity !== 0;
                        }),
                    },
                    count: countMap[originId],
                    originData,
                    fieldsData: {
                        maxFieldSize: autoSize ? maxFieldSize :
                            getMaxFieldSize(showFields, allFieldSize),
                        showFields,
                        hiddenFields,
                        primaryFields,
                        normalFields,
                        foreignFields,
                    },
                    size: finalSize,
                };
            }
            return null;
        } else if(c.cellType === 'text') {
            return {
                ...c,
                shape: 'text',
            };
        } if(c.cellType === 'notes') {
            return {
                ...c,
                shape: 'notes',
            };
        }
        return c;
    }).filter(c => !!c).concat(edges);
};
