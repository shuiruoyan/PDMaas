import React, {useEffect, useMemo, useRef, useState} from 'react';
import { Tooltip } from 'components';
import {
    calcNodeSize,
    checkPortAndField,
    getBaseTypeIcon,
    getMaxFieldSize, getNodePortAttrs,
    getNodePrimaryAndNormal,
} from '../../util/celltools';
import {opacity} from '../../../../../../lib/color';
import {dasharrayMap} from '../../config/canvasData';
import {isChild} from '../../../../../../lib/dom';
import pk from '../../style/pk.png';
import fk from '../../style/fk.png';
import pf from '../../style/pf.png';
import note from '../../style/note.png';

export default ({ node, graph }) => {
    const [fieldHighlight, setFieldHighlight] = useState(null);
    const nodeAttrs = node.attr();
    const bodyRef = useRef(null);
    const headRef = useRef(null);
    const allFieldSizeRef = useRef(null);
    const entityRelationRank = node.prop('entityRelationRank');
    const count = node.prop('count');
    const link = node.prop('link');
    const originData = node.prop('originData');
    const maxFieldSize = node.prop('maxFieldSize');
    const [maxFieldSizeDefaultState, setMaxFieldSizeDefaultState] = useState(maxFieldSize || {});
    const [maxFieldSizeState, setMaxFieldSizeState] = useState(maxFieldSize || {});
    const originDataRef = useRef({});
    originDataRef.current = originData;
    const sizePre = useRef(null);
    const indexPre = useRef(null);
    const getNodeSortFields = () => {
        const edges = graph?.getEdges() || [];
        return getNodePrimaryAndNormal(node, originDataRef.current.fields, edges);
    };
    const [[primaryFields, normalFields, foreignFields], resetFields] =
        useState([[], [], []]);
    const [showFieldCount, setShowFieldCount] = useState(0);
    const [showFields, hiddenFields] = useMemo(() => {
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
        return [allFields.slice(0, showFieldCount),  allFields.slice(showFieldCount)];
    }, [primaryFields, foreignFields, normalFields, showFieldCount]);
    // 重置字段顺序和锚点顺序
    const resetFieldsAndPorts = () => {
        // 重新计算节点字段排序
        const tempFields = getNodeSortFields();
        resetFields(tempFields);
        // 重新计算节点锚点 只有连线进度到字段一级才需要处理
        if(entityRelationRank === 'F') {
            graph?.batchUpdate(() => {
                let items = [...node.prop('ports/items')];
                const updateItem = (portId, position) => {
                    items = items.map((p) => {
                        if(p.id === portId) {
                            return {
                                ...p,
                                args: {
                                    ...p.args,
                                    ...position,
                                },
                            };
                        }
                        return p;
                    });
                };
                const currentPorts = ['more_in', 'more_out'];
                tempFields[0].concat(tempFields[2])
                    .concat(tempFields[1]).forEach((f, index) => {
                    const portInId = `${f.id}_in`;
                    const portOutId = `${f.id}_out`;
                    const [portIn, portOut] = [node.getPort(portInId), node.getPort(portOutId)];
                    currentPorts.push(portInId, portOutId);
                    // 新插入的锚点需要显示
                    const attrs = {
                        circle: {
                            style: {
                                visibility: 'visible',
                            },
                        },
                    };
                    if(!portIn) {
                        // 插入
                        items.push({
                            group: 'in',
                            id: portInId,
                            args: {
                                x: 0, y: 40 + (index + 1) * 26 - 13,
                            },
                            attrs,
                        });
                    } else {
                        //修改
                        updateItem(portInId, {x: 0, y: 40 + (index + 1) * 26 - 13});
                    }
                    if(!portOut) {
                        // 插入
                        items.push({
                            group: 'out',
                            id: portOutId,
                            args: {
                                x: '100%', y: 40 + (index + 1) * 26 - 13,
                            },
                            attrs,
                        });
                    } else {
                        // 修改
                        updateItem(portOutId, {x: '100%', y: 40 + (index + 1) * 26 - 13});
                    }
                });
                // 删除锚点
                const prePorts = node.getPorts();
                let needClearHistory = false;
                prePorts.forEach((p) => {
                    if(!currentPorts.includes(p.id)) {
                        items = items.filter(i => i.id !== p.id);
                        needClearHistory = true;
                    }
                });
                node.prop('ports', {
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
                    items,
                }, {ignore: true});
                // node.addPorts(addPorts, {ignore: true});
                // node.removePorts(removePorts, {ignore: true});
                // 有画布数据删除 需要重置历史
                needClearHistory && graph.cleanHistory();
            });
        }
    };
    // 重置字段隐藏
    const resetFieldsCount = () => {
       const size = node.size();
       // 留给字段的高度 = 节点高度 - 表头高度 - 主键边框高度 - 节点边框高度
       const fieldsHeight = size.height - 39 - 1 - 2;
       const fieldCount = Math.floor(fieldsHeight / 26);
       if(originDataRef.current.fields.length > fieldCount) {
           // 节点大小无法完全显示所有字段时 需要预留13px操作图标空间
           setShowFieldCount(Math.floor((fieldsHeight - 21) / 26));
       } else {
           setShowFieldCount(fieldCount);
       }
    };
    // 自动增加锚点
    const addPorts = (edge) => {
        if(entityRelationRank === 'E') {
           graph.batchUpdate(() => {
                const edges = graph.getEdges();
                const ports = node.getPorts();
                console.log(ports);
                const checkPortSize = (port) => {
                    const portData = ports.find(p => p.id === port);
                    // 当前分组下所有锚点
                    const groupPorts = ports.filter(p => p.group === portData.group);
                    // 当前分组下已经被使用的锚点
                    const usePorts = groupPorts
                        .filter(p => edges
                            .some(e => e.getTargetPortId() === p.id
                                || e.getSourcePortId() === p.id));
                    if(usePorts.length === groupPorts.length) {
                        // 需要创建锚点
                        node.addPort({
                            id: Math.uuid(),
                            group: portData.group,
                        });
                    }
                };
                const source = edge.getSourceCell();
                const target = edge.getTargetCell();
                if(source && source.id === node.id) {
                    checkPortSize(edge.getSourcePortId());
                }
                if(target && target.id === node.id) {
                    checkPortSize(edge.getTargetPortId());
                }
           });
        }
    };
    const entityDisplay = node.prop('entityDisplay');
    const entitySetting = node.prop('entitySetting');
    const entityDisplayRef = useRef({});
    entityDisplayRef.current = entityDisplay;
    const { body } = nodeAttrs;
    const { titleText, titleStyle, primaryKeyStyle,
        foreignKeyStyle, fieldStyle, borderStyle, divideLineStyle} = entitySetting;
    const typeRefStyle = {
        primary : primaryKeyStyle,
        foreign: foreignKeyStyle,
        normal: fieldStyle,
    };
    useEffect(() => {
        // 首次加载计算节点大小
        const autoSize = node.prop('autoSize');
        const size = calcNodeSize(originData, entityDisplay.showFields);
        if(autoSize) {
            const {nodeSize} = {...size };
            node.size(nodeSize.width, nodeSize.height, {ignore: true});
        }
        allFieldSizeRef.current = size.allFieldSize;
        setMaxFieldSizeDefaultState(size.maxFieldSize);
        // 初始化
        resetFieldsCount();
        resetFieldsAndPorts();
    }, [originData, entityDisplay.showFields]);
    useEffect(() => {
        setMaxFieldSizeState(getMaxFieldSize(showFields, allFieldSizeRef.current));
    }, [showFields]);
    useEffect(() => {
        const handler = {
            connected: ({type, edge, currentCell, previousCell}) => {
                if(type === 'target' && (currentCell?.id === node.id || previousCell?.id === node.id)) {
                    // 更新字段排序和锚点位置
                    resetFieldsAndPorts();
                }
                if(currentCell?.id === node.id) {
                    // 如果连接精度是到数据表级别 连接成功后需要判断 起点和终点的锚点是否足够 如果不够则需要增加
                    addPorts(edge);
                }
                if(!currentCell && previousCell?.id === node.id) {
                    // 从当前节点移走 取消高亮
                    setFieldHighlight(null);
                }
            },
            removed: ({cell}) => {
                if(cell.target.cell === node.id || cell.source.cell === node.id) {
                    //连线删除 取消高亮字段
                    resetFieldsAndPorts();
                    setFieldHighlight(null);
                }
            },
            target: ({current, previous, options}) => {
                if((current.cell === node.id || previous.cell === node.id) &&
                    (options.type === 'undo' || options.type === 'redo' || options.isWs || options.relation)) {
                    // 更新字段排序和锚点位置（主要是撤销重做用户协作）
                    resetFieldsAndPorts();
                    // x6BUG 如果锚点修改在连线变更target之前，撤销的命令会导致连线不更新
                    if(entityRelationRank === 'E' && current.port) {
                        node.setPortProp(current.port, 'args', {}, {ignore: true});
                    }
                }
            },
            source: ({current, options, edge}) => {
                if(entityRelationRank === 'F'){
                    if(current.cell === node.id && (options.relation || options.type === 'redo' || options.type === 'redo'
                        || options.isWs || options.relation)) {
                        const port = node.getPort(current.port);
                        if(port) {
                            const portOpacity = port.attrs?.circle?.style?.opacity;
                            if(portOpacity === 0) {
                                const portType = current.port.split('_')[1];
                                edge.prop('source/originPort', current.port, {ignore: true});
                                edge.prop('source/port', `more_${portType}`, {ignore: true});
                            } else {
                                edge.prop('source/originPort','', {ignore: true});
                            }
                        }
                    }
                }
            },
            mouseenter: ({edge}) => {
                //鼠标悬浮 高亮字段
                if(edge.target.cell === node.id) {
                    setFieldHighlight(edge.target.port);
                } else if(edge.source.cell === node.id) {
                    setFieldHighlight(edge.source.port);
                }
            },
            mouseleave: ({edge}) => {
                //鼠标离开 取消高亮字段
                if(edge.target.cell === node.id || edge.source.cell === node.id) {
                    setFieldHighlight(null);
                }
            },
            size: () => {
                // 撤销不会触发resized事件 所以在此处监听
                //if(options?.type === 'undo' || options?.type === 'redo'){
                    resetFieldsCount();
                //}
            },
            resized: (args) => {
                if(args.node.id === node.id) {
                    resetFieldsCount();
                    node.prop('autoSize', false);
                }
            },
            autoSize: () => {
                if(node.prop('autoSize')){
                    const size = calcNodeSize(originDataRef.current,
                        entityDisplayRef.current.showFields);
                    node.size(size.nodeSize.width, size.nodeSize.height); // 自适应需要重新计算大小
                    resetFieldsCount();
                }
            },
            expandHeight: () => {
                if(node.prop('expandHeight')) {
                    if(!node.prop('autoSize')) {
                        sizePre.current = node.size();
                        indexPre.current = node.prop('zIndex');
                        const size = calcNodeSize(originDataRef.current,
                            entityDisplayRef.current.showFields);
                        if(sizePre.current.height <= size.nodeSize.height) {
                            node.size(node.size().width, size.nodeSize.height, {ignore: true});
                        }
                        node.toFront({ignore: true});
                    }
                } else {
                   node.size(node.size().width,
                       sizePre.current ? sizePre.current.height : node.size().height,
                       {ignore: true});
                   node.prop('zIndex',  indexPre.current, {ignore: true});
                }
            },
        };
        graph?.on('edge:connected', handler.connected);
        graph?.on('edge:removed', handler.removed);
        graph?.on('edge:change:source', handler.source);
        graph?.on('edge:change:target', handler.target);
        graph?.on('edge:mouseenter', handler.mouseenter);
        graph?.on('edge:mouseleave', handler.mouseleave);
        node.on('change:size', handler.size);
        node.on('change:autoSize', handler.autoSize);
        node.on('change:expandHeight', handler.expandHeight);
        graph?.on('node:resized', handler.resized);
        return () => {
            node.off();
            if(graph){
                graph.off(null, handler.connected);
                graph.off(null, handler.removed);
                graph.off(null, handler.target);
                graph.off(null, handler.mouseenter);
                graph.off(null, handler.mouseleave);
                graph.off(null, handler.resized);
            }
        };
    }, []);
    useEffect(() => {
        // 隐藏锚点和连接线 只有连线进度到字段一级才需要处理
        if(entityRelationRank === 'F'){
            let items = [...node.prop('ports/items')];
            const updateItem = (portId, position = {}, attrs = {}) => {
                items = items.map((p) => {
                    if(p.id === portId) {
                        return {
                            ...p,
                            args: {
                                ...p.args,
                                ...position,
                            },
                            attrs: {
                                ...p.attrs,
                                circle: {
                                    ...p.attrs?.circle,
                                    magnet: attrs.magnet === undefined
                                        ? p.attrs?.circle?.magnet : attrs.magnet,
                                    style: {
                                        ...p.attrs?.circle?.style,
                                        ...(attrs.style || {}),
                                    },
                                },
                            },
                        };
                    }
                    return p;
                });
            };
            const size = node.size();
            const hindFieldsPort = hiddenFields.reduce((p, n) => {
                return p.concat([`${n.id}_in`, `${n.id}_out`]);
            }, []);
            const getTempPort = (group) => {
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
                                opacity: 0,
                            },
                        },
                    },
                };
            };
            // 插入临时锚点
            if(!items.find(p => p.id === 'more_out')) {
                items.push(getTempPort('out'), getTempPort('in'));
            } else {
                updateItem('more_out', {x: '100%', y: size.height - 14});
                updateItem('more_in', {x: 0, y: size.height - 14});
            }
            // 隐藏锚点
            items.forEach((p) => {
                if(hindFieldsPort.includes(p.id) || p.id === 'more_out' || p.id === 'more_in') {
                    updateItem(p.id, {}, {
                        magnet: false,
                        style: {
                            // 隐藏锚点
                            opacity: 0,
                        },
                    });
                } else {
                    updateItem(p.id, {}, {
                        magnet: true,
                        style: {
                            // 隐藏锚点
                            opacity: 1,
                        },
                    });
                }
            });
            // 调整连线至临时锚点
            const edges = graph?.getEdges?.() || [];
            // 获取到与当前节点连接的连线
            const getPortType = (port) => {
                const portArray = port.split('_');
                return portArray.slice(-1)[0] || 's';
            };
            node.prop('ports', {
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
                items,
            }, {ignore: true});
            edges.forEach((edge) => {
                // 需要将隐藏的连接线链接到临时锚点
                if(edge.target.cell === node.id) {
                    const targetPort = edge.prop('target/originPort') || edge.prop('target/port');
                    if(hindFieldsPort.includes(targetPort)) {
                        const type = getPortType(targetPort);
                        edge.prop('target/originPort', targetPort, { ignore: true});
                        edge.prop('target/port', `more_${type}`, { ignore: true});
                    } else {
                        edge.prop('target/port', targetPort, { ignore: true});
                        edge.prop('target/originPort', '', { ignore: true});
                    }
                } else if(edge.source.cell === node.id) {
                    const sourcePort = edge.prop('source/originPort') || edge.prop('source/port');
                    if(hindFieldsPort.includes(sourcePort)) {
                        const type = getPortType(sourcePort);
                        edge.prop('source/originPort', sourcePort, { ignore: true});
                        edge.prop('source/port', `more_${type}`, { ignore: true});
                    } else {
                        edge.prop('source/port', sourcePort, { ignore: true});
                        edge.prop('source/originPort', '', { ignore: true});
                    }
                }
            });
        }

    }, [hiddenFields]);
    const conversionSimpleValue = (f, s, type) => {
        if(s === 'primaryKey') {
            if(type === 'primary') {
                return {
                    title: '主键',
                    force: true,
                };
            } else if (type === 'foreign') {
                return {
                    title: '外键',
                    force: true,
                };
            }
            return {
                title: '',
            };
        } else if(s === 'baseDataType') {
            return {
                title: f[s],
                force: true,
            };
        } else if(s === 'dataLen' || s === 'numScale') {
            return {
                title: f[s] || '',
            };
        }
        return {
            title: f[s],
        };
    };
    const conversionValue = (f, s, type) => {
        if(s === 'primaryKey') {
            if(type === 'primary') {
                return <img style={{width: 18, marginTop: 4}} src={f.isForeign ? pf : pk} alt=''/>;
            } else if (type === 'foreign') {
                return <img style={{width: 18, marginTop: 4}} src={fk} alt=''/>;
            }
            return '';
        } else if(s === 'baseDataType') {
            const svg = graph ? getBaseTypeIcon(graph, f[s]) : null;
            if(svg) {
                return <img style={{width: 18, marginTop: 4}} src={`data:image/svg+xml;charset=utf-8;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`} alt=''/>;
            }
            return f[s]?.split('')[0];
        } else if(s === 'dataLen' || s === 'numScale') {
            return f[s] || '';
        }
        return f[s];
    };
    useEffect(() => {
        bodyRef.current.onmousedown = (e) => {
            // 编辑模式下
            if(graph?.isEdit !== false) {
                const target = e.target;
                if(target === headRef.current || isChild(headRef.current, target)) {
                    console.log('mousedown');
                } else {
                    e.stopPropagation();
                }
            }
        };
        return () => {
            bodyRef.current.onmousedown = null;
        };
    }, []);
    const renderFieldRow = (f, type, isHidden) => {
        console.log((opacity(typeRefStyle[type].body.fill, typeRefStyle[type].body['fill-opacity'])));
        let fieldMark = {};
        try {
            fieldMark = f.mark ? JSON.parse(f.mark) : {};
        } catch (e) {
            console.log(e);
        }
        const fieldSize = isHidden ? maxFieldSizeDefaultState : maxFieldSizeState;
        return <div
          style={{
                //backgroundColor: checkPortAndField(f, fieldHighlight) ? '#DFE3EB' : 'transparent',
                backgroundColor: checkPortAndField(f, fieldHighlight) ? '#DFE3EB' : (fieldMark.bgColor || opacity(typeRefStyle[type].body.fill, typeRefStyle[type].body['fill-opacity'])),
                transition: 'background-color 0.3s',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'row',
                padding: '0 3px',
                height: '26px',
                lineHeight: '26px',
            }}
          key={f.id}
        >
          {
              ['primaryKey'].concat(entityDisplay.showFields).map((s, i) => {
                    return <Tooltip
                      placement='top'
                      {...conversionSimpleValue(f, s, type)}
                    >
                      <span
                        key={s}
                        className='physical-entity-node-text'
                        style={{
                                color: fieldMark.fontColor || typeRefStyle[type].text.fill,
                                fontStyle: typeRefStyle[type].text['font-style'],
                                // fontWeight: typeRefStyle[type].text['font-weight'],
                                textDecoration: typeRefStyle[type].text['text-decoration'],
                                flexGrow: s === 'primaryKey' ? '0' : '1',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                width: fieldSize[s],
                                marginLeft: i === 0 ? 0 : 5,
                                display: 'inline-block',
                            }}
                        >{conversionValue(f, s, type)}</span>
                    </Tooltip>;
                })
          }
        </div>;
    };
    const TooltipTitle = () => {
        return <div style={{maxHeight: 400, overflowY: 'auto', width: node.size().width}}>
          {hiddenFields.map((f) => {
                return <div key={f.id}>
                  {renderFieldRow(f, f.__type, true)}
                  {f.__isEnd && <div style={{height: 1, background: '#DFE3EB'}}/>}
                </div>;
            })}
        </div>;
    };
    const onMouseMove = () => {
        if (graph && graph.isEdit && entityRelationRank === 'F' && !graph.isSelected(node)) {
            const view = graph.findView(node);
            const ports = view.container.querySelectorAll(
                '.x6-port-body',
            );
            if (ports[0].style.visibility !== 'visible' && ports[0].style.opacity !== '') {
                for (let i = 0, len = ports.length; i < len; i += 1) {
                    if (ports[i].style.opacity !== '') {
                        // eslint-disable-next-line no-param-reassign
                        ports[i].style.visibility = 'visible';
                    }
                }
            }
        }
    };
    const onDragOver = (e) => {
        e.preventDefault();
    };
    const onDrop = (e) => {
        graph.emit('node:drop', {e, node});
    };
    return (
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMouseMove={onMouseMove}
        ref={bodyRef}
        style={{
                cursor: 'default',
                border: borderStyle.body.stroke === 'none' ? 'none' : `${1}px 
                ${dasharrayMap[borderStyle.body['stroke-dasharray']]} 
                ${opacity(borderStyle.body.stroke, borderStyle.body['stroke-opacity'])}`,
                borderRadius: body.rx,
                height: '100%',
                // backgroundOpacity: borderStyle.body['fill-opacity'],
                backgroundOpacity: borderStyle.body['fill-opacity'],
                background: borderStyle.body.fill,
                display: 'flex',
                flexDirection: 'column',
            }}>
        <div
          ref={headRef}
          className='physical-entity-node-text'
          style={{
                    cursor: 'move',
                    background: opacity(titleStyle.body.fill, titleStyle.body['fill-opacity']),
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    height: '39px',
                    lineHeight: '39px',
                    color: titleStyle.text.fill,
                    fontStyle: titleStyle.text['font-style'],
                    // fontWeight: titleStyle.text['font-weight'],
                    textDecoration: titleStyle.text['text-decoration'],
                }}
            >
          <a
            style={{
                    cursor: link?.value ? 'pointer' : 'auto',
                    color: link?.value ? '#386aff' : titleStyle.text.fill,
                    textDecoration: link?.value ? 'underline' : titleStyle.text['text-decoration'],
                }}
            >{titleText.customValue
                .replace(/\{defKey\}/g, originData.defKey)
                .replace(/\{defName\}/g, originData.defName)}{count > 1 ? `:${count}` : ''}</a>
        </div>
        {originData.intro && <Tooltip title={originData.intro} force>
          <img src={note} alt='' style={{height: 20, position: 'absolute', left: 5, top: 10}}/>
          </Tooltip>}
        <div>
          {
                  showFields.map((f) => {
                      return <div key={f.id}>
                        {renderFieldRow(f, f.__type)}
                        {f.__isEnd && <div style={{
                                borderBottom: `${divideLineStyle.body['stroke-width']}px 
                                    ${dasharrayMap[divideLineStyle.body['stroke-dasharray']]} 
                                    ${opacity(divideLineStyle.body.stroke, divideLineStyle.body['stroke-opacity'])}`,
                            }}/>}
                      </div>;
                    })
                }
        </div>
        {originDataRef.current.fields.length > showFieldCount && <div style={{
                backgroundColor: (fieldHighlight === 'more_in' || fieldHighlight === 'more_out') ? '#DFE3EB' : (opacity(typeRefStyle.normal.body.fill, typeRefStyle.normal.body['fill-opacity'])),
                textAlign: 'center',
                flexGrow: 1,
                width: '100%',
                fontSize: 12,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(179, 179, 179, 0.79)',
            }}>
          <Tooltip
            mouseEnterDelay={100}
            mouseLeaveDelay={100}
            force
            title={<TooltipTitle/>}>
            <span
            >-还有{hiddenFields.length}个/共有{originDataRef.current.fields.length}个-</span>
          </Tooltip>
        </div>}
      </div>
    );
};
