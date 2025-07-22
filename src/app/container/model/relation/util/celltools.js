import _ from 'lodash';
import {firstUp} from '../../../../../lib/string';
import {getTextSize} from '../../../../../lib/utils';
import {DIAGRAM, WS} from '../../../../../lib/constant';

export const getNodeDefaultAttrs = (type, props) => {
    if(!type || !props[type]) {
        return {
            body: {
                stroke: '#8f8f8f',
                strokeWidth: 1,
                'stroke-opacity': 1,
                fill: '#fff',
                'fill-opacity': 1,
            },
            text: {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                fill: '#000000',
                fontSize: 14,
                'font-weight': 'normal',
                'font-style': 'normal',
                'text-decoration': 'none',
            },
        };
    }
    switch (type) {
        case DIAGRAM.TYPE.P:
        case DIAGRAM.TYPE.C:
        case DIAGRAM.TYPE.L:
            return {
                entityDisplay: {
                    ...props.entityDisplay,
                },
                entitySetting: {
                    ...props.entitySetting,
                },
            };
        case 'shapeGeneral':
        case 'linkLine':
        case 'textbox':
        case 'entityDisplay':
            return props[type];
        default:
            return {
                body: {
                    stroke: '#8f8f8f',
                    strokeWidth: 1,
                    'stroke-opacity': 1,
                    fill: '#fff',
                    'fill-opacity': 1,
                },
                text: {
                    textAnchor: 'middle',
                    textVerticalAnchor: 'middle',
                    fill: '#000000',
                    fontSize: 14,
                    'font-weight': 'normal',
                    'font-style': 'normal',
                    'text-decoration': 'none',
                },
            };
    }

};

export const getNodeDefaultTools = () => {
    return ['edit-node', 'node-size', 'highlight-node', 'link-node'];
};

export const getEntityNodeTools = () => {
    return getNodeDefaultTools().filter(t => t !== 'edit-node');
};

export const getNodePortAttrs = () => {
    return  {
        circle: {
            r: 4,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff',
            style: {
                visibility: 'hidden',
            },
        },
    };
};

export const getCirclePorts = () => {
    const attrs = getNodePortAttrs();
    // 10个锚点
    return {
        groups: {
            ellipseSpread: {
                position: 'ellipseSpread',
                attrs,
            },
        },
        items: [
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
            {
                group: 'ellipseSpread',
            },
        ],
    };
};

export const getParallelogramPorts = () => {
    const attrs = getNodePortAttrs();
    return {
        groups: {
            top: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '25%', y: 0 },
                        end: { x: '100%', y: 0 },
                    },
                },
                attrs,
            },
            right: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '100%', y: 0 },
                        end: { x: '75%', y: '100%' },
                    },
                },
                attrs,
            },
            bottom: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: 0, y: '100%' },
                        end: { x: '75%', y: '100%' },
                    },
                },
                attrs,
            },
            left: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '25%', y: 0 },
                        end: { x: 0, y: '100%' },
                    },
                },
                attrs,
            },
        },
        items: [
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
        ],
    };
};

export const getDiamondPorts = () => {
    const attrs = getNodePortAttrs();
    return {
        groups: {
            top: {
                position: 'top',
                attrs,
            },
            left: {
                position: 'left',
                attrs,
            },
            bottom: {
                position: 'bottom',
                attrs,
            },
            right: {
                position: 'right',
                attrs,
            },
            rightTop: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '50%', y: 0 },
                        end: { x: '100%', y: '50%' },
                        strict: true,
                    },
                },
                attrs,
            },
            rightBottom: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '100%', y: '50%' },
                        end: { x: '50%', y: '100%' },
                        strict: true,
                    },
                },
                attrs,
            },
            leftTop: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: '50%', y: 0 },
                        end: { x: 0, y: '50%' },
                        strict: true,
                    },
                },
                attrs,
            },
            leftBottom: {
                position: {
                    name: 'line',
                    args: {
                        start: { x: 0, y: '50%' },
                        end: { x: '50%', y: '100%' },
                        strict: true,
                    },
                },
                attrs,
            },
        },
        items: [
            {
                group: 'top',
            },
            {
                group: 'rightTop',
            },
            {
                group: 'rightTop',
            },
            {
                group: 'rightTop',
            },
            {
                group: 'rightBottom',
            },
            {
                group: 'rightBottom',
            },
            {
                group: 'rightBottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'leftTop',
            },
            {
                group: 'leftTop',
            },
            {
                group: 'leftTop',
            },
            {
                group: 'leftBottom',
            },
            {
                group: 'leftBottom',
            },
            {
                group: 'leftBottom',
            },
            {
                group: 'left',
            },
            {
                group: 'right',
            },
        ],
    };
};

export const getRectPorts = () => {
    const attrs = getNodePortAttrs();
    return {
        groups: {
            leftTop: {
                position: {
                    name: 'absolute',
                    args: {
                        x: 0,
                        y: 0,
                    },
                },
                attrs,
            },
            rightTop: {
                position: {
                    name: 'absolute',
                    args: {
                        x: '100%',
                        y: 0,
                    },
                },
                attrs,
            },
            leftBottom: {
                position: {
                    name: 'absolute',
                    args: {
                        x: 0,
                        y: '100%',
                    },
                },
                attrs,
            },
            rightBottom: {
                position: {
                    name: 'absolute',
                    args: {
                        x: '100%',
                        y: '100%',
                    },
                },
                attrs,
            },
            top: {
                position: {
                    name: 'top',
                    args: {
                        strict: true,
                    },
                },
                attrs,
            },
            right: {
                position: {
                    name: 'right',
                    args: {
                        strict: true,
                    },
                },
                attrs,
            },
            bottom: {
                position: {
                    name: 'bottom',
                    args: {
                        strict: true,
                    },
                },
                attrs,
            },
            left: {
                position: {
                    name: 'left',
                    args: {
                        strict: true,
                    },
                },
                attrs,
            },
        },
        items: [
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'rightTop',
            },
            {
                group: 'leftTop',
            },
            {
                group: 'leftBottom',
            },
            {
                group: 'rightBottom',
            },
        ],
    };
};

export const getNodeDefaultPorts = () => {
    const attrs = getNodePortAttrs();
    return {
        groups: {
            top: {
                position: 'top',
                attrs,
            },
            right: {
                position: 'right',
                attrs: {
                    circle: {
                        r: 4,
                        magnet: true,
                        stroke: '#5F95FF',
                        strokeWidth: 1,
                        fill: '#fff',
                        style: {
                            visibility: 'hidden',
                        },
                    },
                },
            },
            bottom: {
                position: 'bottom',
                attrs,
            },
            left: {
                position: 'left',
                attrs,
            },
        },
        items: [
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'top',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'right',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'bottom',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
            {
                group: 'left',
            },
        ],
    };
};

export const getEdgeDefaultAttrs = (props) => {
    return {
        line: {
            ..._.omit((props.body || {}), ['fill']),
            sourceMarker: {
                name: null,
                strokeWidth: props.body?.['stroke-width'] || 1,
            },
            targetMarker: {
                name: 'classic',
                strokeWidth: props.body?.['stroke-width'] || 1,
            },
        },
        text: {
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fill: '#000000',
            fontSize: 14,
            'font-weight': 'normal',
            'font-style': 'normal',
            'text-decoration': 'none',
        },
    };
};

export const getEdgeDefaultTools = () => {
    return [];
};

export const resetCellsData = (graph, cmd) => {
    cmd.payload.forEach((payload) => {
        const updateKeys = payload.updateKeys?.split(',') || [];
        if(updateKeys.includes('cellsData') && ['P', 'C', 'L'].includes(payload.next.data.type)) {
            graph.fromJSON(payload.next.data.cellsData);
        }
    });
};

// 增量更新画布
export const updateCells = (graph, cmd) => {
    graph.batchUpdate(() => {
        cmd.payload.map((payload) => {
            const cmds = payload.data || [];
            cmds.forEach((c) => {
                const key = c.data.key;
                const cell = graph.getCellById(c.data.id);
                switch (c.event) {
                    case 'cell:added':
                        if(c.data.node) {
                            graph.addNode(graph.createNode(c.data.props), {isWs: true});
                        } else {
                            graph.addEdge(graph.createEdge(c.data.props), {isWs: true});
                        }
                        break;
                    case 'cell:removed':
                        graph.removeCell(c.data.id, {isWs: true});
                        break;
                    case 'cell:change:target':
                    case 'cell:change:source':
                    case 'cell:change:position':
                    case 'cell:change:attrs':
                    case 'cell:change:labels':
                    case 'cell:change:connector':
                    case 'cell:change:router':
                    case 'cell:change:size':
                    case 'cell:change:parent':
                    case 'cell:change:children':
                    case 'cell:change:vertices':
                    case 'cell:change:zIndex':
                        cell?.[`set${firstUp(key)}`]?.(c.data.next[key],{isWs: true}, {isWs: true});
                        break;
                    case 'cell:change:ports':
                    case 'cell:change:isExpand':
                    case 'cell:change:autoSize':
                    case 'cell:change:lock':
                    case 'cell:change:link':
                    case 'cell:change:entitySetting':
                    case 'cell:change:relation':
                    case 'cell:change:angle':
                        cell?.prop(key, c.data.next[key], {isWs: true});
                        break;
                    default: break;
                }
            });
            return payload;
        });
    }, { isWs: true });
};

export const isNode = (cell) => {
    return ['group', 'rect', 'round', 'circle', 'parallelogram', 'diamond', 'notes', 'text', 'arrow_top',
        'arrow_right', 'arrow_bottom', 'arrow_left', 'ellipse',
        'physical-entity-node', 'markdown-node', 'logic-entity-node', 'concept-entity-node',
        'concept-entity-node-circle', 'concept-entity-node-diamond']
        .includes(cell.cellType || cell.prop?.('cellType'));
};

export const isEntityNode = (cell) => {
    return ['physical-entity-node', 'logic-entity-node', 'concept-entity-node',
        'concept-entity-node-circle', 'concept-entity-node-diamond'].includes(cell.cellType || cell.prop?.('cellType'));
};

export const isConceptEntitySimple = (cell) => {
    return ['concept-entity-node-circle', 'concept-entity-node-diamond'].includes(cell.cellType || cell.prop?.('cellType'));
};

export const isConceptEntity = (cell) => {
    return ['concept-entity-node', 'concept-entity-node-circle', 'concept-entity-node-diamond'].includes(cell.cellType || cell.prop?.('cellType'));
};

export const isEdge = (cell) => {
    return ['edge'].includes(cell.cellType || cell.prop?.('cellType'));
};

export const checkPortAndField = (field, port) => {
    return port === `${field.id}_in` || port === `${field.id}_out`;
};

// 重新对字段排序
export const getNodePrimaryAndNormal = (c, fields = [], edges = []) => {
    const tempPrimary = [];
    const tempNormal = [];
    const tempForeign = [];
    const isForeign = (f) => {
        return edges.some(e => e.target.cell === c.id && checkPortAndField(f, e.target.port));
    };
    fields.forEach((f) => {
        if(f.primaryKey) {
            tempPrimary.push({
                ...f,
                isForeign: isForeign(f),
            });
        } else if(isForeign(f)) {
            tempForeign.push(f);
        } else {
            tempNormal.push(f);
        }
    });
    return [tempPrimary, tempNormal, tempForeign];
};

// 计算节点锚点
export const calcNodePorts = (c, nodeOriginData, edges) => {
    const [primaryFields, normalFields,
        foreignFields] = getNodePrimaryAndNormal(c, nodeOriginData.fields, edges);
    const getFieldItems = (field, index) => {
        return [{
            args: { x: 0, y: 40 + (index + 1) * 26 - 13 },
            id: `${field.id}_in`,
            group: 'in',
        }, {
            args: { x: '100%', y: 40 + (index + 1) * 26 - 13 },
            id: `${field.id}_out`,
            group: 'out',
        }];
    };
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
        items: primaryFields.concat(foreignFields).concat(normalFields)
            .reduce((p, n, i) => {
                return p.concat(getFieldItems(n, i));
            }, []),
    };
};

// 计算节点大小
export const calcNodeSize = (nodeOriginData, useFields) => {
    // 计算标题区
    const titleHeight = 39;
    const titleSize = getTextSize(`${nodeOriginData.defKey}[${nodeOriginData.defName}]`);
    const titleWidth = titleSize.width;

    const fieldsHeight = nodeOriginData.fields.length * 26;
    // 计算字段区
    const maxFieldSize = {};
    const allFieldSize = {};
    // 计算模型节点字段的宽高
    // const useFields = ['primaryKey', 'defKey', 'defName', 'baseDataType', 'len'];
    nodeOriginData.fields.forEach((f) => {
        allFieldSize[f.id] = {};
        ['primaryKey'].concat(useFields).forEach((use) => {
            // 主键和基本数据类型都采用图标替换 固定宽度20px
            const width = (use === 'primaryKey' || use === 'baseDataType') ? 20 : getTextSize(f[use]).width;
            allFieldSize[f.id][use] = width;
            if(!maxFieldSize[use] || maxFieldSize[use] < width) {
                maxFieldSize[use] = width;
            }
        });
    });
    // 计算最大的宽度 字段宽度 + 边框宽度 + 间距
    const maxWidth = Math.max(titleWidth, Object.keys(maxFieldSize)
        .reduce((p, n) => {
            return p + maxFieldSize[n] + 5;
        }, -5)) + 2 + 6 + (nodeOriginData.type === 'L' ? 60 : 0);
    // 计算最大高度 标题高度 + 字段高度 + 分割线高度 + 边框高度
    const maxHeight = titleHeight + fieldsHeight + 1 + 2;
    return {
        nodeSize: {width: maxWidth, height: maxHeight},
        maxFieldSize,
        allFieldSize,
    };
};

export const getMaxFieldSize = (showFields, allFieldSize) => {
    const maxFieldSize = {};
    showFields.forEach((f) => {
        const size = allFieldSize[f.id];
        Object.keys(size).forEach((s) => {
            if(!maxFieldSize[s] || maxFieldSize[s] < size[s]) {
                maxFieldSize[s] = size[s];
            }
        });
    });
    return maxFieldSize;
};


export const isJumpOverEdge = (edge) => {
    return (edge.connector?.name || edge.connector) === 'jumpover';
};


// 首次获取节点源数据以及计算节点锚点信息以及count
export const transformCells = (defaultData, dataSource) => {
    const { cellsData, entityRelationRank, props } = defaultData;
    const { entityDisplay, entitySetting } = props;
    const countMap = {};
    const edges = cellsData.filter(cell => cell.shape === 'edge');
    return cellsData.map((c) => {
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
                return {
                    ...c,
                    entityDisplay,
                    entitySetting: {
                        ...c.entitySetting,
                        titleText: entitySetting.titleText,
                    },
                    entityRelationRank,
                    ports: entityRelationRank === 'F' ? calcNodePorts(c, originData, edges) : c.ports,
                    count: countMap[originId],
                    originData,
                };
            }
            return null;
        } if(c.cellType === 'text') {
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
    }).filter(c => !!c);
};

// 重算count
export const resetNodeCount = (currentData, cell, graph) => {
    // 获取所有相同数据源的节点且更新
    const sameOriginNodes = graph.getNodes()
        .filter(n => n.prop('originData') && (n.prop('originData').id === currentData.id));
    sameOriginNodes.forEach((n, i) => {
        n.prop('count', i + 1, {ignore: true});
    });
};

// 重置节点源数据
export const resetNodeOrigin = (cell, dataSource) => {
    const graph = cell.model.graph;
    graph.batchUpdate(() => {
        // 重新获取源数据
        const currentData = cell.prop('originData');
        let originData = dataSource.project.entities.find(e => e.id === currentData.id);
        cell.prop('originData', originData, {ignore: true});
        // 获取所有相同数据源的节点且更新
        resetNodeCount(currentData, cell, graph);
    });
};

// 根据命令变更画布数据
export const updateCellsSettings = (graph, cmd) => {
    const cells = graph.getCells();
    const { entityDisplay, entitySetting } = cmd.payload.data;
    graph.batchUpdate(() => {
        cells.forEach((c) => {
            if(isEntityNode(c)) {
                if(isConceptEntitySimple(c)) {
                    const allProp = c.prop();
                    c.prop({
                        ...allProp,
                        entitySetting: {
                            ...allProp.entitySetting,
                            titleText: entitySetting.titleText,
                        },
                    }, { ignore: true });
                } else {
                    c.prop('entityDisplay', entityDisplay, { ignore: true });
                    c.prop('entitySetting/titleText', entitySetting.titleText, { ignore: true });
                }
            }
        });
    });
};

// 根据命令变更节点源数据
export const updateCellsOrigin = (graph, cmd, dataSource) => {
    const cells = graph.getCells();
    graph.batchUpdate(() => {
        let needClearHistory = false;
        cells.filter(c => c.isNode()).forEach((c) => {
            const originData = c.prop('originData');
            if(isEntityNode(c)) {
                // cmd.payload.forEach((payload) => {
                //     if(originData.id === payload.entityId) {
                //         if(cmd.event === WS.ENTITY.MOP_ENTITY_DELETE) {
                //             c.remove({ignore: true, overwrite: true});
                //             needClearHistory = true;
                //         } else {
                //             c.prop('originData', dataSource.project
                //                 .entities.find(e => e.id === originData.id), {ignore: true});
                //         }
                //     }
                // });
                cmd.payload.forEach((payload) => {
                    if(originData?.id === payload?.data?.id
                        || originData?.id === payload?.entityId
                        || originData?.id === payload?.next?.id) {
                        if(cmd.event === WS.ENTITY.MOP_ENTITY_DELETE) {
                            c.remove({ignore: true, overwrite: true});
                            needClearHistory = true;
                        } else if(isConceptEntitySimple(c)) {
                                c.prop({
                                    ...c.prop(),
                                    originData: dataSource.project
                                        .entities.find(e => e.id === originData.id),
                                }, {ignore: true});
                            } else {
                                c.prop('originData', dataSource.project
                                    .entities.find(e => e.id === originData.id), {ignore: true});
                            }
                    }
                });
                // if(cmd.event === WS.ENTITY.MOP_ENTITY_DELETE) {
                //     c.remove({ignore: true, overwrite: true});
                //     needClearHistory = true;
                // } else {
                //     c.prop('originData', dataSource.project
                //         .entities.find(e => e.id === originData.id), {ignore: true});
                // }
            }
        });
        needClearHistory && graph.cleanHistory();
    });
};

export const removeDiagramNodes = (cells, entities = []) => {
    return cells.filter((c) => {
        if(isNode(c)) {
            if(c.originData?.id) {
                return !!entities.find(e => e.id === c.originData.id);
            }
            return true;
        }
        return true;
    });
};

// 过滤无效的连线
export const removeDiagramCells = (cells) => {
    const nodes = cells.filter(c => isNode(c));
    const ports = nodes.reduce((p, n) => {
        return p.concat((n.ports?.items || []).map(i => i.id));
    }, []);
    return cells
        .filter((cell) => {
            if(isEdge(cell)) {
                return (!cell.target.port || (cell.target.port && ports.includes(cell.target.port)))
                && (!cell.source.port || (cell.source.port && ports.includes(cell.source.port)));
            }
            return true;
        });
};

// 简化命令发送的数据
export const simpleCmds = (cmds) => {
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

export const getNodeIcon = (node) => {
    const nodeIconMap = {
        'physical-entity-node': 'icon-model-physic',
        'logic-entity-node': 'icon-model-logic',
        'markdown-node': 'icon-editor-markdown',
        'concept-entity-node': 'icon-model-concept',
        text: 'icon-textbox',
        notes: 'icon-editor-note',
    };
    return nodeIconMap[node?.cellType] || 'icon-shape-general';
};

export const relationMarkerMap = () => {
    return {
        'er-1': 'exactly-one',
        'er-n': 'zero-or-more',
        'er-1n': 'one-or-more',
        'er-01': 'zero-or-one',
    };
};

// 获取与某根连线有关的节点上的边
export const getEdgeRelationEdges = (graph, edge) => {
    const allEdges = graph.getEdges().map(e => e.toJSON());
    const getSourceAndTarget = (e) => {
        return [e.getSourceCellId(), e.getTargetCellId()].filter(c => !!c);
    };
    const latelyNodes =  getSourceAndTarget(edge);
    return allEdges.filter(e => (e.id !== edge.id) &&
        (latelyNodes.includes(e.target.cell) ||
            latelyNodes.includes(e.source.cell))).map((e) => {
                const position = {x: 0, y: 0};
                const target = latelyNodes.includes(e.target.cell) ? e.target : position;
                const source = latelyNodes.includes(e.source.cell) ? e.source : position;
                return {
                    ...e,
                    visible: false,
                    target,
                    source,
                };
    });
};

// 更新连线的数据
export const updateEdgeRelation = (graph, edge, relationData) => {
    const currentRelation = edge.prop('relation') || {};
    graph.batchUpdate(() => {
        Object.keys(relationData).forEach((key) => {
            if(relationData[key] !== currentRelation[key]) {
                const value = relationData[key];
                // 属性变更 修改连线
                if(key === 'defName') {
                    const currentLabel = edge.getLabels()[0]?.attrs;
                    edge.setLabelAt(0,{
                        attrs: {
                            ...currentLabel,
                            label: {
                                ...currentLabel?.label,
                                text: value,
                            },
                        },
                    });
                } else if(key === 'startLabel' || key === 'endLabel') {
                    const index = key === 'startLabel' ? 1 : 2;
                    while (edge.getLabels().length < 3) {
                        edge.appendLabel({
                            attrs: {
                                text: {
                                    text: '',
                                },
                            },
                            position: {
                                distance: 0.9,
                            },
                        });
                    }
                    edge.setLabelAt(index, {
                        attrs: {
                            text: {
                                text: value,
                            },
                        },
                        position: {
                            distance: key === 'startLabel' ? 0.1 : 0.9,
                        },
                    });
                } else if(key === 'startBase' || key === 'endBase') {
                    const type = key === 'startBase' ? 'sourceMarker' : 'targetMarker';
                    const relationMap = relationMarkerMap();
                    const markerName = Object.keys(relationMap)
                        .find(r => relationMap[r] === value);
                    edge.attr(`line/${type}/name`, markerName);
                } else if(key === 'parentFieldId' || key === 'childFieldId') {
                    const type = key === 'parentFieldId' ? 'source' : 'target';
                    const port = edge.prop(`${type}/port`);
                    if(port) {
                        const currentPortType = port.split('_')[1];
                        if(currentPortType) {
                            const newPortId = `${value}_${currentPortType}`;
                            edge.prop(`${type}/port`, newPortId, {relation: true});
                        }
                    }
                } else if(key === 'type') {
                    edge.attr('line/stroke-dasharray', value === 'Identifying' ? '0' : '2');
                }
            }
        });
        edge.prop('relation', relationData);
    });
};

export const getEdgeAllMarkerIcon = () => {
    return [
        {
            name: 'icon-line-real',
            value: null,
        },
        {
            name: 'icon-line-point-lha',
            value: 'empty-block',
        },
        {
            name: 'icon-line-point-lsa1',
            value: 'block',
        },
        {
            name: 'icon-line-point-la',
            value: 'open-block',
        },
        {
            name: 'icon-line-point-lsa',
            value: 'classic',
        },
        {
            name: 'icon-er-exactly-one',
            value: 'er-1',
        },
        {
            name: 'icon-er-zero-or-more',
            value: 'er-n',
        },
        {
            name: 'icon-er-one-or-more',
            value: 'er-1n',
        },
        {
            name: 'icon-er-zero-or-one',
            value: 'er-01',
        },
    ];
};

export const getEdgeMarkerIcon = (marker) => {
    return getEdgeAllMarkerIcon().find(m => m.value === (marker?.name || marker))?.name;
};

export const updateCellsId = (cells) => {
    // 1.节点ID重置时需要替换掉 与之对应的连线的target和source
    let tempNodes = cells.filter(c => isNode(c));
    let edges = cells.filter(c => isEdge(c));
    const replaceTargetAndSource = [];
    tempNodes = tempNodes.map((n) => {
        const newId = Math.uuid();
        replaceTargetAndSource.push({
            oldId: n.id,
            newId,
        });
        return {
            ...n,
            id: newId,
        };
    });
    edges = edges.map((e) => {
        const newId = Math.uuid();
        const targetCell = replaceTargetAndSource.find(r => r.oldId === e.target.cell);
        const sourceCell = replaceTargetAndSource.find(r => r.oldId === e.source.cell);
        return {
            ...e,
            id: newId,
            target: targetCell ? {
                ...e.target,
                cell: targetCell.newId,
            } : e.target,
            source: sourceCell ? {
                ...e.source,
                cell: sourceCell.newId,
            } : e.source,
        };
    });
    return tempNodes.concat(edges);
};

export const getBaseTypeIcon = (graph, baseDataType) => {
    const dataSource = graph.getCurrentDataSource();
    const dataTypes = dataSource.profile?.global.dataTypes || [];
    const currentBaseType = dataTypes.find(d => d.defKey === baseDataType);
    if(currentBaseType) {
        const safe = (currentBaseType.icon || '')
            .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
            .replace(/\r|\n|\r\n/g, '');
        if(/^<svg(.*)<\/svg>$/.test(safe)) {
            return safe;
        }
        return null;
    }
    return null;
};

// 自动滚动
export const autoScroll = (edge, position) => {
    // 判断是否超出可视窗口 如果超出需要将画布平移
    const graph = edge.model.graph;
    const graphOptions = graph.options;
    const { x, y } = graph.localToGraph(position.x, position.y);
    let xOffset = 0;
    let yOffset = 0;
    if(x <= 70) {
        xOffset = 8;
    } else if(graphOptions.width - x <= 70) {
        xOffset = -8;
    }
    if(y <= 70) {
        yOffset = 8;
    } else if(graphOptions.height - y <= 70) {
        yOffset = -8;
    }
    if(yOffset !== 0  || xOffset !== 0) {
        const translate = graph.translate();
        graph.translate(xOffset + translate.tx, yOffset + translate.ty);
    }
};

// 自动展开
export const antoExpand = (edge, current, previous) => {
    const graph = edge.model.graph;
    if(current) {
        if(!current.cell && previous.cell) {
            const node = graph.getCellById(previous.cell);
            if(node.prop('entityRelationRank') !== 'E' && node.prop('expandHeight')) {
                node.prop('expandHeight', false, {ignore: true});
            }
        } else if((!previous.cell && current.cell) || (current?.port !== previous?.port)) {
            const node = graph.getCellById(current.cell);
            if(node.prop('entityRelationRank') !== 'E' && !node.prop('expandHeight')) {
                node.prop('expandHeight', true, {ignore: true});
            }
        }
    } else {
        if(edge.target.cell) {
            const targetNode = graph.getCellById(edge.target.cell);
            if(targetNode.prop('expandHeight')) {
                targetNode.prop('expandHeight', false, {ignore: true});
            }
        }
        if(edge.source.cell) {
            const sourceNode = graph.getCellById(edge.source.cell);
            if(sourceNode.prop('expandHeight')) {
                sourceNode.prop('expandHeight', false, {ignore: true});
            }
        }
    }
};

// 清除高亮连线和节点
export const clearHighLineCells = (cells) => {
    // 主要是处理 直接复制节点时以及存量样式异常的问题 样式异常的问题
    return cells.map((cell) => {
        if(isNode(cell)) {
            if(isEntityNode(cell) || cell.shape === 'markdown-node') {
                if(cell.attrs?.body?.style?.['box-shadow'] === '0 0 10px 4px #FEF3A4') {
                    return {
                        ...cell,
                        attrs: {
                            ...cell.attrs,
                            body: {
                                ...cell.attrs.body,
                                style: {
                                    ...cell.attrs.style,
                                    'box-shadow': '0 0 0 0 #FEF3A4',
                                },
                            },
                        },
                    };
                }
                return cell;
            } else {
                if(cell.attrs?.body?.filter) {
                    return {
                        ...cell,
                        attrs: {
                            ...cell.attrs,
                            body: {
                                ...cell.attrs.body,
                                filter: null,
                            },
                        },
                    };
                }
                return cell;
            }
        } else if(cell.attrs?.line?.style?.animation) {
            return {
                ...cell,
                attrs: {
                    ...cell.attrs,
                    line: {
                        ...cell.attrs.line,
                        strokeDasharray: cell.attrs.line.strokeDasharrayPre,
                        style: {
                            ...cell.attrs.line.style,
                            animation: '',
                        },
                    },
                },
            };
        }
        return cell;
    });
};

// 高亮所有的有关的连线和节点
export const highLineCells = (nodes, status, graph) => {
    graph.batchUpdate(() => {
        [].concat(nodes).filter(n => n.isNode()).forEach((node) => {
            const edges = graph.getConnectedEdges(node);
            edges.forEach((edge) => {
                if(status) {
                    if(!edge.attr('line/style/animation')) {
                        edge.attr('line/strokeDasharrayPre', edge.attr('line/strokeDasharray'), {ignore: true});
                        edge.attr('line/strokeDasharray', 5, {ignore: true});
                        edge.attr('line/style/animation', 'running-line 30s infinite linear', {ignore: true});
                    }
                    const target = edge.getTargetCell();
                    const source = edge.getSourceCell();
                    if(target && (target.id !== node.id)) {
                        if(isEntityNode(target) || target.shape === 'markdown-node') {
                            target.attr('body/style/box-shadow', '0 0 10px 4px #FEF3A4', {ignore: true});
                        } else {
                            target.attr('body/filter', {
                                name: 'dropShadow',
                                args: {
                                    dx: 0,
                                    dy: 0,
                                    blur: 10,
                                    opacity: 4,
                                    color: '#FEF3A4',
                                },
                            }, {ignore: true});
                        }
                    }
                    if(source && (source.id !== node.id)) {
                        if(isEntityNode(source) || source.shape === 'markdown-node') {
                            source.attr('body/style/box-shadow', '0 0 10px 4px #FEF3A4', {ignore: true});
                        } else {
                            source.attr('body/filter', {
                                name: 'dropShadow',
                                args: {
                                    dx: 0,
                                    dy: 0,
                                    blur: 10,
                                    opacity: 4,
                                    color: '#FEF3A4',
                                },
                            }, {ignore: true});
                        }
                    }
                } else {
                    if(edge.attr('line/style/animation')) {
                        edge.attr('line/strokeDasharray', edge.attr('line/strokeDasharrayPre'), {ignore: true});
                        edge.attr('line/style/animation', '', {ignore: true});
                    }
                    const target = edge.getTargetCell();
                    const source = edge.getSourceCell();
                    if(target && (target.id !== node.id)) {
                        if(isEntityNode(target) || target.shape === 'markdown-node') {
                            target.attr('body/style/box-shadow', '0 0 0 0 #FEF3A4', {ignore: true});
                        } else {
                            target.attr('body/filter', null, {ignore: true});
                        }
                    }
                    if(source && (source.id !== node.id)) {
                        if(isEntityNode(source) || source.shape === 'markdown-node') {
                            source.attr('body/style/box-shadow', '0 0 0 0 #FEF3A4', {ignore: true});
                        } else {
                            source.attr('body/filter', null, {ignore: true});
                        }
                    }
                }
            });
        });
    });
};

export const entityAttr2Simple = (entitySetting) => {
    return {
        body: {
            ...entitySetting.borderStyle?.body || {},
            ...entitySetting.titleStyle?.body || {},
        },
        text: {
            ...entitySetting.titleStyle?.text || {},
            'font-weight': 'normal',
        },
    };
};
