import React, {useEffect, useRef, forwardRef, useImperativeHandle, useContext} from 'react';
import { Graph, Shape } from '@antv/x6';
import { Selection } from '@antv/x6-plugin-selection';
import { MiniMap } from '@antv/x6-plugin-minimap';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Transform } from '@antv/x6-plugin-transform';
import { Snapline } from '@antv/x6-plugin-snapline';

import {Icon, Button, openDrawer, Message, openModal} from 'components';
import { Copy, Paste } from '../../../../lib/event';
import './components';
import {getPrefix} from '../../../../lib/classes';
import ComTool from './comtool';
import RelationTool from './relationtool';
import QuickTool from './quicktool';
import { addCellConfig, removeCellConfig } from './celltool';
import './style/index.less';
import { sendData} from '../../../../lib/utils';
import {WS, LOADING, NORMAL, PROJECT, DIAGRAM, PROFILE, COMPONENT} from '../../../../lib/constant';
import {
    getEdgeDefaultAttrs,
    getEdgeDefaultTools,
    isEdge,
    isNode, updateCellsOrigin,
    transformCells,
    resetNodeOrigin,
    removeDiagramCells, resetNodeCount,
    isEntityNode, simpleCmds, updateCellsId,
    updateCellsSettings, updateEdgeRelation, getEdgeRelationEdges,
    autoScroll, antoExpand, highLineCells, getNodePortAttrs, getNodeDefaultPorts, resetCellsData,
    clearHighLineCells,
} from './util/celltools';
import {subscribeEvent, unSubscribeEvent} from '../../../../lib/subscribe';
import CanvasConfig from './config';
import {cell2html, html2svg, svg2png} from './util/img';
import {downloadString, upload} from '../../../../lib/rest';
import {getCanvasDefaultSetting} from '../../../../lib/json';
import {baseConceptNsKey, baseLogicNsKey, basePhysicNsKey, checkDataPermission} from '../../../../lib/permission';
import EdgeRelation from './celltool/EdgeRelation';
import SimpleNodeView from './components/simplenodeview';
import {ViewContent} from '../../../../lib/context';


export default React.memo(forwardRef(({expandHome, defaultData,
                                          defaultDataSource,getCurrentDataSource, open}, ref) => {
    const getNsKey = () => {
      if(defaultData.type === DIAGRAM.TYPE.L) {
          return baseLogicNsKey;
      } else if(defaultData.type === DIAGRAM.TYPE.P) {
          return basePhysicNsKey;
      }
      return baseConceptNsKey;
    };
    const readonly = checkDataPermission(getNsKey()) < 2 || useContext(ViewContent);
    const isActive = useRef(true);
    const edgeRelationRef = useRef(null);
    const updateCache = useRef([]);
    const currentPrefix = getPrefix('container-model-relation');
    const containerRef = useRef(null);
    const graphRef = useRef(null);
    const interactRef = useRef(!readonly);
    const minimapRef = useRef(null);
    const minimapInstanceRef = useRef(null);
    const cellToolRef = useRef(null);
    const relationToolRef = useRef(null);
    const comToolRef = useRef(null);
    const quickToolRef = useRef(null);
    const isShift = useRef(false);
    const allowSelectedGroup = useRef(false);
    const moveOffsetRef = useRef(null);
    const showPorts = (cell, view) => {
        const ports = view.container.querySelectorAll(
            '.x6-port-body',
        );
        if(cell.prop('cellType').startsWith('concept-entity-node')
            || ports[0]?.style?.opacity !== ''
            || !isEntityNode(cell)
            || cell.prop('entityRelationRank') !== 'F'
        ) {
            for (let i = 0, len = ports.length; i < len; i += 1) {
                // eslint-disable-next-line no-param-reassign
                ports[i].style.visibility = 'visible';
            }
        }
    };
    const hiddenPorts = (view) => {
        const ports = view.container.querySelectorAll(
            '.x6-port-body',
        );
        for (let i = 0, len = ports.length; i < len; i += 1) {
            // eslint-disable-next-line no-param-reassign
            ports[i].style.visibility = 'hidden';
        }
    };
    const relationRef = useRef(null);
    const initListener = (graph) => {
        graph.on('batch:start', ({name}) => {
            if(name === 'move-arrowhead' || name === 'add-edge') {
                // 开始拖动 取消所有节点选中
                graph.clearTransformWidgets();
                graph.resetSelection(graph.getSelectedCells().filter(c => c.isEdge()));
            }
        });
        graph.on('cell:selected', ({ cell }) => {
            if(interactRef.current) {
                addCellConfig(cell, cellToolRef.current,getCurrentDataSource, defaultData);
            }
        });
        graph.on('cell:unselected', () => {
            removeCellConfig(cellToolRef.current);
        });
        graph.on('node:jump', (link) => {
            const { project: { entities, diagrams }} = getCurrentDataSource();
            const originEntity = entities.find(e => e.id === link.value);
            if(originEntity) {
                const typeMap = {
                    P: PROJECT.ENTITY,
                    L: PROJECT.LOGIC_ENTITY,
                    C: PROJECT.CONCEPT_ENTITY,
                };
                open && open({
                    nodeType: typeMap[originEntity.type],
                    ...originEntity,
                });
            } else {
                const originDiagram = diagrams.find(d => d.id === link.value);
                if(originDiagram) {
                    open && open({
                        nodeType: PROJECT.DIAGRAM,
                        ...originDiagram,
                    });
                } else {
                    Message.error({title: '无效的链接'});
                }
            }
        });
        graph.on('node:edit', ({entity, originData}) => {
            const data = {
                event: WS.ENTITY.MOP_ENTITY_UPDATE,
                payload: [{
                    hierarchyType: originData.parentId === '_UNCATE'
                        ? PROFILE.USER.FLAT
                        : defaultDataSource.profile.user.modelingNavDisplay.hierarchyType,
                    updateKeys: 'defKey,defName,intro',
                    pre: {
                        id: originData.id,
                        from: originData.id,
                        to: originData.parentId === '_UNCATE' ? null : originData.parentId,
                        type: COMPONENT.TREE.SUB,
                        data:{
                            ...originData,
                            parentId: originData.parentId === '_UNCATE' ? 'base_flat' : originData.parentId,
                        },
                    },
                    next: {
                        id: originData.id,
                        from: originData.id,
                        to: originData.parentId === '_UNCATE' ? null : originData.parentId,
                        position: COMPONENT.TREE.AFTER,
                        type: COMPONENT.TREE.SUB,
                        data: {
                            ...originData,
                            ...entity,
                            type: originData.type,
                        },
                    },
                }],
            };
            sendData(data, null, null, true);
        });
        graph.on('node:mouseenter', ({cell, view}) => {
            if(interactRef.current && !cell.prop('lock') && !graph.isSelected(cell)) {
                showPorts(cell, view);
            }
        });
        graph.on('node:mouseleave', ({ view }) => {
            hiddenPorts(view);
        });
        graph.on('node:selected', ({ cell }) => {
           // graph.createTransformWidget(cell);
            const view = graph.findViewByCell(cell);
            hiddenPorts(view);
            highLineCells(cell, true, graph);
        });
        graph.on('node:unselected', ({ cell }) => {
            highLineCells(cell, false, graph);
        });
        graph.on('cell:added', ({ cell, options }) => {
            if(!options?.isWs) {
                graph.select(cell);
            }
        });
        graph.on('node:added', ({cell }) => {
           if(isEntityNode(cell)) {
               resetNodeOrigin(cell, getCurrentDataSource());
           }
           if(cell.prop('cellType') === 'group') {
               cell.toBack();
           }
        });
        graph.on('node:removed', ({cell}) => {
            if(isEntityNode(cell)) {
                resetNodeCount(cell.prop('originData'), cell, graph);
            }
        });
        graph.on('node:dblclick', ({cell}) => {
            if((!cell.prop?.('cellType')?.startsWith('concept-entity-node')) && isEntityNode(cell)) {
                const originData = cell.prop('originData');
                const typeMap = {
                    P: 'entity',
                    L: 'logic_entity',
                    C: 'concept_entity',
                };
                open && open({
                    nodeType: typeMap[originData.type],
                    ...originData,
                });
            }
        });
        graph.on('node:mouseup', ({cell}) => {
            if(cell.shape === 'group') {
                allowSelectedGroup.current = false;
            }
        });
        graph.on('node:mousedown', ({cell}) => {
            if(cell.shape === 'group') {
                allowSelectedGroup.current = true;
            }
        });
        const resetEdgeRelation = ({edge, ...args}) => {
            if(edge.prop('relation')){
                edge.prop('relation', null);
            }
            if(args.currentCell) {
                const cell = args.currentCell;
               if(cell.prop('expandHeight')){
                   cell.prop('expandHeight', false, {ignore: true});
               }
            }
        };
        graph.on('edge:connected', resetEdgeRelation);
        graph.on('edge:mousemove', ({edge, x, y}) => {
            autoScroll(edge, {x, y});
        });
        graph.on('edge:change:source', ({cell, current, previous, options}) => {
            if(options.ui) {
                antoExpand(cell, current, previous);
            }
        });
        graph.on('edge:change:target', ({cell, current, previous, options}) => {
            if(options.ui) {
                antoExpand(cell, current, previous);
            }
        });
        graph.on('edge:mouseup', ({edge}) => {
            antoExpand(edge, false);
        });
        graph.on('edge:selected', ({ cell }) => {
            const arrowheadAttrs = {
                d: 'M 0, -5 a 5,5,0,1,1,0,10 a 5,5,0,1,1,0,-10',
                fill: '#1890FF',
            };
            const connector = cell.getConnector()?.name || cell.getConnector();
            cell.addTools(
                [
                    {
                        name: 'target-arrowhead',
                        args: {
                            attrs: arrowheadAttrs,
                        },
                    },
                    {
                        name: 'vertices',
                        args: {
                            attrs: arrowheadAttrs,
                            modifiers: ['ctrl', 'meta'],
                        },
                    },
                    {
                        name: 'source-arrowhead',
                        args: {
                            attrs: arrowheadAttrs,
                        },
                    },
                ].filter((t) => {
                    if(connector === 'smooth') {
                        return t.name !== 'vertices';
                    }
                    return t;
                }),
            );
        });
        graph.on('edge:unselected', ({ cell }) => {
            cell.removeTools();
        });
        graph.on('edge:dblclick', ({ cell }) => {
            const targetCellId = cell.target.cell;
            const sourceCellId = cell.source.cell;
            const cells = [cell.toJSON()];
            if(sourceCellId) {
                cells.push(graph.getCellById(sourceCellId).toJSON());
            }
            if(targetCellId) {
                cells.push(graph.getCellById(targetCellId).toJSON());
            }
            let modal;
            const onOk = () => {
                const relationData = edgeRelationRef.current.getRelationData();
                if(relationData) {
                    updateEdgeRelation(graph, cell, relationData);
                    modal.close();
                }
            };
            modal = openModal(<EdgeRelation
              ref={edgeRelationRef}
              defaultData={defaultData}
              getCurrentDataSource={getCurrentDataSource}
              readonly={readonly}
              otherEdges={getEdgeRelationEdges(graph, cell)}
              cells={cells}
            />, {
                title: 'ER关系',
                bodyStyle: {
                    width: '50%',
                },
                buttons: [
                  <Button onClick={() => modal.close()}>取消</Button>,
                  <Button type="primary" onClick={onOk}>确定</Button>,
                ],
            });
        });
        graph.on('scale', (scale) => {
            relationToolRef.current.scaleChange(scale.sx);
        });
        graph.on('history:change', ({cmds, options}) => {
            if(cmds && !options.isWs && !options.data?.isWs) {
                const tempCmds = [...cmds];
                // 发送命令
                sendData({
                    event: WS.DIAGRAM.MOP_DIAGRAM_ER_UPDATE,
                    payload: [{
                        diagramId: defaultData.id,
                        defName: defaultData.defName,
                        defKey: defaultData.defKey,
                        type: defaultData.type,
                        data: simpleCmds(options.type === 'undo' ? tempCmds.reverse().map((cmd) => {
                            if(cmd.event === 'cell:added') {
                                // 新增调整为删除
                                return {
                                    ...cmd,
                                    event: 'cell:removed',
                                };
                            } else if(cmd.event === 'cell:removed') {
                                // 删除调整为删除
                                return {
                                    ...cmd,
                                    event: 'cell:added',
                                };
                            }
                            // 交换前后数据
                            return {
                                ...cmd,
                                data: {
                                    ...cmd.data,
                                    prev: cmd.data.next,
                                    next: cmd.data.prev,
                                },
                            };
                        }) : tempCmds),
                    }],
                });
            }
            relationToolRef.current.setHistory({
                canRedo: graph.canRedo(),
                canUndo: graph.canUndo(),
            });
        });
        graph.bindKey(['up','down', 'left', 'right', 'shift+up','shift+down', 'shift+left', 'shift+right'],(e) => {
            const selectedCells = graph.getSelectedCells()
                .filter(c => c.shape !== 'edge');
            if (selectedCells.length > 0) {
                if(!moveOffsetRef.current) {
                    moveOffsetRef.current = selectedCells.map((c) => {
                        return {
                            id: c.id,
                            position: c.position(),
                        };
                    });
                }
                e.preventDefault();
                const moveCells = (cells, offset) => {
                    if (cells) {
                        cells.forEach((c) => {
                            const { x, y } = c.getProp('position');
                            c.setProp('position', {
                                x: x + offset.x,
                                y: y + offset.y,
                            }, { ignore: true });
                        });
                    }
                };
                graph.batchUpdate(() => {
                    let offset = null;
                    switch (e.keyCode) {
                        case 38: offset = {x: 0, y: e.shiftKey ? -10 : -1};break;
                        case 39: offset = {x: e.shiftKey ? 10 : 1, y: 0};break;
                        case 40: offset = {x: 0, y: e.shiftKey ? 10 : 1};break;
                        case 37: offset = {x: e.shiftKey ? -10 : -1, y: 0};break;
                        default: offset = {x: 0, y: 0};break;
                    }
                    moveCells(selectedCells, offset);
                });
            }
        }, 'keydown');
        graph.bindKey(['up','down', 'left', 'right', 'shift+up','shift+down', 'shift+left', 'shift+right'],(e) => {
            const selectedCells = graph.getSelectedCells()
                .filter(c => c.shape !== 'edge');
            if (selectedCells.length > 0 && moveOffsetRef.current) {
                e.preventDefault();
                graph.batchUpdate(() => {
                    selectedCells.forEach((c) => {
                        const prePosition = moveOffsetRef.current
                            .find(p => p.id === c.id)?.position;
                        const currentPosition = c.position();
                        if(prePosition) {
                            c.setProp('position', prePosition, {silent: true, ignore: true});
                        }
                        c.setProp('position', currentPosition);
                    });
                });
                moveOffsetRef.current = null;
            }
        }, 'keyup');
        graph.bindKey('shift', () => {
            isShift.current = true;
        }, 'keydown');
        graph.bindKey('shift', () => {
            isShift.current = false;
        }, 'keyup');
        graph.bindKey(['backspace', 'delete'], () => {
            const cells = graph.getSelectedCells();
            if (cells.length) {
                cells.filter(c => c.isEdge()).forEach((cell) => {
                    cell.removeTools();
                });
                highLineCells(cells, false, graph);
                graph.removeCells(cells);
            }
        });
        graph.bindKey(['ctrl+z','command+z'], () => {
            graph.undo({type: 'undo'});
        });
        graph.bindKey(['ctrl+shift+z','command+shift+z'], () => {
            graph.redo({type: 'redo'});
        });
        graph.bindKey(['ctrl+c','command+c'], () => {
            const cells = graph.getSelectedCells();
            Copy(cells.map(c => c.toJSON()), '复制成功');
        });
        graph.bindKey(['ctrl+v','command+v'], () => {
            if(readonly) {
                return;
            }
            Paste((data) => {
                try {
                    let cells = updateCellsId(clearHighLineCells(JSON.parse(data)));
                    graphRef.current.batchUpdate(() => {
                        cells.forEach((cell) => {
                            if(isEdge(cell)) {
                                graph.addEdge({
                                    ...cell,
                                    target: cell.target.cell ?  cell.target : {
                                        x: cell.target.x + 20,
                                        y: cell.target.y + 20,
                                    },
                                    source: cell.source.cell ?  cell.source : {
                                        x: cell.source.x + 20,
                                        y: cell.source.y + 20,
                                    },
                                });
                            } else if(isNode(cell)) {
                                if(isEntityNode(cell)) {
                                    const cellMaps = {
                                        'physical-entity-node': 'P',
                                        'logic-entity-node': 'L',
                                        'concept-entity-node': 'C',
                                        'concept-entity-node-circle': 'C',
                                        'concept-entity-node-diamond': 'C',
                                    };
                                    const nameMap = {
                                        P: '物理模型',
                                        L: '逻辑模型',
                                        C: '概念模型',
                                    };
                                    if(cellMaps[cell.shape] !== defaultData.type) {
                                        Message.error({ title: `当前画布只接收${nameMap[defaultData.type]}!`});
                                    } else {
                                        const entityRelationRank = defaultData.entityRelationRank || 'E';
                                        const updatePorts = () => {
                                            const cellEntityRelationRank = cell.entityRelationRank || 'E';
                                            // 如果是物理模型或者逻辑模型 才需要重算锚点
                                            // eslint-disable-next-line max-len
                                            if(entityRelationRank !== cellEntityRelationRank) {
                                                if(cell.shape === 'physical-entity-node' || cell.shape === 'logic-entity-node') {
                                                    // 如果锚点需要重算，则连接到实体上的连线需要删除
                                                    cells = cells.filter(c =>
                                                        (c.target?.cell !== cell.id)
                                                        && (c.source?.cell !== cell.id));
                                                    return entityRelationRank === 'F' ? {
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
                                                    } : getNodeDefaultPorts(4);
                                                }
                                                return cell.ports;
                                            }
                                            return cell.ports;
                                        };
                                        graph.addNode({
                                            ...cell,
                                            entityRelationRank,
                                            ports: updatePorts(),
                                            position : {
                                                x: cell.position.x + 20,
                                                y: cell.position.y + 20,
                                            },
                                        });
                                    }
                                } else {
                                    graph.addNode({
                                        ...cell,
                                        children: cell.children ? null : cell.children,
                                        position: {
                                            x: cell.position.x + 20,
                                            y: cell.position.y + 20,
                                        },
                                    });
                                }
                            }
                        });
                    });
                    if(cells.length > 0) {
                        Message.success({title: '粘贴成功'});
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        });
        graph.bindKey(['ctrl+a','command+a'], (e) => {
            e.preventDefault();
            const cells = graph.getCells();
            // 分组需要特殊处理
            allowSelectedGroup.current = true;
            graph.resetSelection(cells);
            allowSelectedGroup.current = false;
            // graph.undo({type: 'undo'});
        });
    };
    const initPlugin = (graph) => {
        // 框选
        graph.use(
            new Selection({
                enabled: true,
                multiple: true,
                rubberband: true,
                rubberEdge: true,
                movable: true,
                filter: (cell) => {
                    if(cell.shape === 'group') {
                        return allowSelectedGroup.current;
                    }
                    return true;
                },
                //modifiers: ['ctrl', 'meta'],
                //showNodeSelectionBox: true,
                //showEdgeSelectionBox: true,
            }),
        );
        // 撤销 重做
        graph.use(
            new History({
                enabled: true,
                beforeAddCommand: (event, args) => {
                    // 节点工具相关 源数据相关 无需加入撤销重做
                    return args.key !== 'tools' && args.options?.ignore !== true;
                },
            }),
        );
        // 键盘事件
        graph.use(
            new Keyboard({
                enabled: true,
            }),
        );
        // 调整大小
        graph.use(
            new Transform({
                resizing: {
                    enabled: (cell) => {
                        return interactRef.current && !cell.prop('lock');
                    },
                    preserveAspectRatio: () => {
                        return isShift.current;
                    },
                },
            }));
        graph.use(
            new Snapline({
                enabled: true,
            }));
    };
    const center = () => {
        const allCells = graphRef.current.getCells().filter((c) => {
            // 容器节点不参与计算
            return c.prop('cellType') !== 'group';
        });
        if(allCells.length > 0) {
            const rect = graphRef.current.getCellsBBox(allCells);
            const centerRect = rect.getCenter();
            graphRef.current.centerPoint(centerRect.x, centerRect.y);
        } else {
            graphRef.current.centerContent();
        }
    };
    useEffect(() => {
        const transformCellsData = clearHighLineCells(removeDiagramCells(transformCells(defaultData,
            defaultDataSource)));
        const data = {
            nodes: transformCellsData.filter(c => isNode(c)),
            edges: transformCellsData.filter(c => isEdge(c)),
        };
        const graph = new Graph({
            virtual: true,
            container: containerRef.current,
            autoResize: true,
            panning: {
                eventTypes: ['leftMouseDown', 'mouseWheel'],
                modifiers: ['ctrl', 'meta'],
                enabled: true,
            },
            mousewheel: {
                enabled: true,
                modifiers: ['ctrl', 'meta'],
            },
            scaling: {
                min: 0.1,
                max: 2,
            },
            connecting: {
                snap: true,
                anchor: 'center',
                connectionPoint: 'anchor',
                createEdge({sourceCell}) {
                    const edgeId = Math.uuid();
                    const defaultAttrs = getEdgeDefaultAttrs(
                        getCurrentDataSource().project.diagrams
                            .find(d => d.id === defaultData.id).props.linkLine,
                    );
                    const getConnector = () => {
                        return {
                            name: 'rounded',
                        };
                    };
                    return new Shape.Edge({
                        attrs: {
                            ...defaultAttrs,
                            line: isEntityNode(sourceCell) ? {
                                ...defaultAttrs.line,
                                sourceMarker: {
                                    name: 'er-1',
                                    strokeWidth: defaultAttrs.line?.['stroke-width'] || 1,
                                },
                                targetMarker: {
                                    name: 'er-n',
                                    strokeWidth: defaultAttrs.line?.['stroke-width'] || 1,
                                },
                            } : defaultAttrs.line,
                        },
                        connector: getConnector(),
                        router: {
                            name: 'manhattan',
                            padding: 30,
                        },
                        cellType: 'edge',
                        tools: getEdgeDefaultTools(),
                        zIndex: 0,
                        id: edgeId,
                    });
                },
                validateConnection: () => {
                    return true;
                },
                validateEdge: () => {
                    return true;
                },
            },
            highlighting: {
                magnetAdsorbed: {
                    name: 'highlightAll',
                },
            },
            interacting: ({cell}) => {
                return interactRef.current && !cell.prop('lock') && cell.isVisible();
            },
            embedding: {
                enabled: true,
                validate: ({parent}) => {
                    return parent.prop('cellType') === 'group';
                },
                findParent:({node}) => {
                    const nodes = graphRef.current.getSelectedCells().filter(c => isNode(c));
                    if(nodes.find(n => n === node)) {
                        // 如果当前节点被选中 则需要考虑多选
                        const bbox = node.getBBox();
                        // 需要过滤掉当前的选中节点 以及当前选中节点的子节点
                        const children = nodes.map(n => n.id).concat(nodes.reduce((a, b) => {
                            return a.concat(b.children || []);
                        }, []));
                        const parentNodes = graphRef.current.getNodes()
                            .filter(n => n.prop('cellType') === 'group'
                                && !children.includes(n.id))
                            .filter((cell) => {
                                const parentBbox = cell.getBBox();
                                return !!bbox.isIntersectWithRect(parentBbox);
                            });
                        graphRef.current.batchUpdate(() => {
                            if (parentNodes.length === 0) {
                                nodes.forEach((n) => {
                                    const parent = n.getParent();
                                    if (parent && !nodes.some(no => no === parent)) {
                                        // 如果选中节点包含父节点 则不需要清空选中节点的父节点
                                        n.prop('parent', '');
                                        // eslint-disable-next-line max-len
                                        parent.setChildren(parent.filterChild(child => child !== n));
                                    }
                                });
                            } else {
                                parentNodes.forEach((cell) => {
                                    nodes.forEach((n) => {
                                        const parent = n.getParent();
                                        if(!nodes.some(no => no === parent)) {
                                            // 如果选中节点包含父节点 则不需要给选中节点更新父节点
                                            cell.addChild(n);
                                            n.prop('parent', cell.id);
                                        }
                                    });
                                });
                            }
                        });
                        return parentNodes;
                    } else {
                        // 默认实现
                        const bbox = node.getBBox();
                        return graphRef.current.getNodes().filter((n) => {
                            if (n.prop('cellType') === 'group') {
                                const targetBBox = n.getBBox();
                                return !!bbox.isIntersectWithRect(targetBBox);
                            }
                            return false;
                        });
                    }
                },
            },
            background: {
                color: '#ffffff',
            },
        });
        // 给关系图对象增加一个获取项目数据据的方法
        graph.getCurrentDataSource = getCurrentDataSource;
        graphRef.current = graph;

        graph.fromJSON(data); // 渲染元素
        center(); // 居中显示

        initPlugin(graph);

        initListener(graph);

        return () => {
            graph.clearKeys();
            graph.off();
        };

    }, []);
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(WS.TAB_LOCAL_UPDATE, (message) => {
            // 本地数据表数据变更 包含基本数据和字段数据
            if(isActive.current) {
                updateCellsOrigin(graphRef.current, message);
            } else {
                updateCache.current.push({
                    fuc: updateCellsOrigin,
                    message,
                });
            }
        }, eventId);
        subscribeEvent(WS.TAB_UPDATE, (message, data) => {
            if (message.event === WS.DIAGRAM.MOP_DIAGRAM_SETTING
                && defaultData.id === message.payload.id) {
                // 画布设置更新
                if(isActive.current) {
                    updateCellsSettings(graphRef.current, message);
                } else {
                    updateCache.current.push({
                        fuc: updateCellsSettings,
                        message,
                    });
                }
                return;
            }
            message.payload.map((payload) => {
                if(message.event === WS.DIAGRAM.MOP_DIAGRAM_ER_UPDATE
                    && defaultData.id === payload.diagramId) {
                    // 节点数据变更
                    if(isActive.current) {
                        updateCells(graphRef.current, message);
                    } else {
                        updateCache.current.push({
                            fuc: updateCells,
                            message,
                        });
                    }
                } else if(message.event === WS.ENTITY.MOP_ENTITY_UPDATE
                    || message.event === WS.ENTITY.MOP_ENTITY_DELETE
                    || message.event === WS.FIELD.MOP_FIELD_UPDATE
                    || message.event === WS.FIELD.MOP_FIELD_CREATE
                    || message.event === WS.FIELD.MOP_FIELD_DELETE
                    || message.event === WS.FIELD.MOP_FIELD_DRAG
                ) {
                    // 数据表数据变更 包含基本数据和字段数据
                    if(isActive.current) {
                        updateCellsOrigin(graphRef.current, message, data);
                    } else {
                        updateCache.current.push({
                            fuc: updateCellsOrigin,
                            message,
                            data,
                        });
                    }
                } else if(message.event === WS.DIAGRAM.MOP_DIAGRAM_UPDATE) {
                    if(isActive.current) {
                        resetCellsData(graphRef.current, message);
                    } else {
                        updateCache.current.push({
                            fuc: resetCellsData,
                            message,
                        });
                    }
                }
                return payload;
            });
        }, eventId);
        subscribeEvent(WS.TAB_ACTIVE_CHANGE, (active) => {
            if(active === defaultData.id) {
                while (updateCache.current.length > 0) {
                    const c =  updateCache.current.shift();
                    c.fuc(graphRef.current, c.message, c.data || getCurrentDataSource());
                }
            }
            isActive.current = active === defaultData.id;
        }, eventId);
        return () => {
            unSubscribeEvent(WS.TAB_ACTIVE_CHANGE, eventId);
            unSubscribeEvent(WS.TAB_LOCAL_UPDATE, eventId);
        };
    }, []);
    useEffect(() => {
        const eventId = Math.uuid();
        subscribeEvent(PROJECT.REFRESH, ([pre, next]) => {
            if((defaultData.type === DIAGRAM.TYPE.P) && (pre.profile?.project?.dbDialect
                !== next?.profile?.project?.dbDialect)) {
                // 数据库切换了 需要刷新字段
                graphRef.current.batchUpdate(() => {
                    const nodes = graphRef.current.getNodes().filter(n => n.shape === 'physical-entity-node');
                    nodes.forEach((node) => {
                        const originData = node.prop('originData');
                        // eslint-disable-next-line max-len
                        const current = next?.project?.entities?.find(e => e.id === originData.id);
                        if(current) {
                            node.prop('originData', current, {ignore: true});
                        }
                    });
                });
            }
        }, eventId);
        return () => {
            unSubscribeEvent(PROJECT.REFRESH, eventId);
        };
    }, []);
    const createTempMultipleEntityDom = (e, shape, selectedData) => {
        const dataSource = getCurrentDataSource();
        const entities = (dataSource.project.entities || [])
            .filter(entity => selectedData.includes(entity.id));
        const dom = document.createElement('div');
        dom.setAttribute('class', `${currentPrefix}-temp-multiple-entity`);
        dom.style.left = `${e.clientX - 100}px`;
        dom.style.top = `${e.clientY - 100}px`;
        dom.innerHTML = `<div>
            <div>已选中</div>
            ${entities.slice(0, 7).map(entity => `<div>${entity.defKey}</div>`).join('\n')}
            <div>${entities.length > 7 ? '等' : ''}[${entities.length}]个模型</div>
            </div>`;
        document.body.append(dom);
        e.preventDefault();
        const onMouseMove = (event) => {
            dom.style.left = `${event.clientX - 100}px`;
            dom.style.top = `${event.clientY - 100}px`;
        };
        const onMouseUp = (event) => {
            const relationRect = relationRef.current.getBoundingClientRect();
            if(event.clientX > relationRect.left && event.clientY > relationRect.top
                && event.clientX < relationRect.right && event.clientY < relationRect.bottom) {
                comToolRef.current.createNodes(shape, entities, {
                    x: event.clientX,
                    y: event.clientY,
                });
            }
            document.body.removeChild(dom);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.body.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
   const dragCreateNode = (e, data, selectedData) => {
       if(interactRef.current) {
           const shapeMap = {
               P: 'physical-entity-node',
               L: 'logic-entity-node',
               C: 'concept-entity-node',
           };
           const nameMap = {
               P: '物理模型',
               L: '逻辑模型',
               C: '概念模型',
           };
           if(defaultData.type === data.type) {
               if(!selectedData.includes(data.id)){
                   comToolRef.current.startDrag(e, shapeMap[data.type], data);
               } else if(selectedData.length > 0) {
                   // 一次性拖动多张图
                   createTempMultipleEntityDom(e, shapeMap[data.type], selectedData);
               }
           } else {
               Message.error({ title: `当前画布只接收${nameMap[defaultData.type]}!`});
               e.preventDefault();
           }
       }
    };
    useImperativeHandle(ref, () => {
        return {
            dragCreateNode,
        };
    }, []);
    const getGraph = () => {
        return graphRef.current;
    };
    const interactChange = (isEdit) => {
        //console.log(graphRef.current);
        graphRef.current.toggleRubberband();
        interactRef.current = isEdit;
        graphRef.current.isEdit = isEdit;
        if(!isEdit) {
            comToolRef.current.hidden();
             graphRef.current.panning.options.panning.modifiers = [];
            // // 清除所有节点的工具
             removeCellConfig(cellToolRef.current);
             // 节点工具会影响可视区域的渲染 先禁用
            // const cells = graphRef.current.getCells();
            // cells.forEach((cell) => {
            //    // cell.removeTools();
            // });
            graphRef.current.clearTransformWidgets();
            graphRef.current.cleanSelection();
            containerRef.current.style.cursor = 'grab';
        } else {
            comToolRef.current.show();
            graphRef.current.panning.options.panning.modifiers = ['ctrl', 'meta'];
            containerRef.current.style.cursor = 'default';
            // 节点工具会影响可视区域的渲染 先禁用
            // const nodes = graphRef.current.getNodes();
            // nodes.forEach((node) => {
            //     if(isEntityNode(node)) {
            //        // node.addTools(getEntityNodeTools());
            //     } else {
            //       //  node.addTools(getNodeDefaultTools());
            //     }
            // });
        }
    };
    const minMapChange = (openMinMap) => {
        if(openMinMap) {
            minimapInstanceRef.current = new MiniMap({
                container: minimapRef.current,
                minScale: 0.1,
                maxScale: 2,
                graphOptions: {
                    async: true,
                    // eslint-disable-next-line consistent-return
                    createCellView:(cell) => {
                        // 在小地图中不渲染边
                        if (cell.isEdge()) {
                            return null;
                        }
                        if(cell.isNode()) {
                            return SimpleNodeView;
                        }
                    },
                },
            });
            graphRef.current.use(minimapInstanceRef.current);
            //minimapRef.current.style.display = 'block';
        } else {
            minimapInstanceRef.current.dispose();
            //minimapRef.current.style.display = 'none';
        }
    };
    const undo = () => {
        graphRef.current.undo({type: 'undo'});
    };
    const redo = () => {
        graphRef.current.redo({type: 'redo'});
    };
    const onFullScreen = (isFullScreen) => {
        comToolRef.current.setExpand(!isFullScreen);
        expandHome(!isFullScreen);
        quickToolRef.current.setExpand(!isFullScreen);
    };
    const canvasConfigRef = useRef(null);
    const openConfig = () => {
        const tempDefaultData = getCurrentDataSource().project.diagrams
            .find(d => d.id === defaultData.id);
        let drawer;
        const oncancel = () => {
            drawer.close();
        };
        const onOk = (e, btn) => {
            btn.updateStatus(LOADING);
            const id = Math.uuid();
            const cmd = {
                event: WS.DIAGRAM.MOP_DIAGRAM_SETTING,
                payload: {
                    data: canvasConfigRef.current?.getDataRef(),
                    id: defaultData.id,
                    defKey: defaultData.defKey,
                    defName: defaultData.defName,
                    type: defaultData.type,
                },
            };
            sendData(cmd, id, () => {
                updateCellsSettings(graphRef.current, cmd);
                // 更新分类ID
                btn.updateStatus(NORMAL);
                drawer.close();
            });
        };
        const importSetup = () => {
            upload('application/json', (canvasConfig) => {
                try {
                    const config = JSON.parse(canvasConfig);
                    canvasConfigRef.current?.importConfig(config);
                    Message.success({title: '导入成功'});
                } catch (e) {
                    Message.error({title: '格式错误'});
                }
            }, () => true, true);
        };
        const exportSetup = () => {
            downloadString(JSON.stringify(canvasConfigRef.current?.getDataRef(), null, 2), 'application/json', 'canvasConfig');
            Message.success({title: '导出成功'});
        };
        const restoreDefault = () => {
            getCanvasDefaultSetting(defaultData.type).then((res) => {
                try {
                    canvasConfigRef.current?.importConfig(res);
                    Message.success({title: '恢复默认成功'});
                } catch (e) {
                    Message.error({title: '数据异常'});
                }
            });
        };
        drawer = openDrawer(<CanvasConfig
          ref={canvasConfigRef}
          defaultData={{...tempDefaultData}} />, {
            title: '画布设置',
            placement: 'right',
            width: '75%',
            buttons: [
              <span
                onClick={importSetup}
                key='importSetup'
                style={{float: 'left',marginLeft: '1%', cursor: 'pointer', lineHeight: '24px'}}>
                <Icon type="icon-inout-import"/> 导入设置</span>,
              <span
                key='exportSetup'
                onClick={exportSetup}
                style={{float: 'left',marginLeft: '1%', cursor: 'pointer', lineHeight: '24px'}}>
                <Icon type="icon-inout-export"/> 导出设置</span>,
              <span
                key='restoreDefault'
                onClick={restoreDefault}
                // onClick={() => { exportSetup(); }}
                style={{float: 'left',marginLeft: '1%', cursor: 'pointer', lineHeight: '24px'}}>
                  恢复默认</span>,
              <Button
                key="onOk"
                type="primary"
                style={{float: 'right',marginRight: '1%'}}
                onClick={(e, btn) => onOk(e, btn)}
                >
                  确认
              </Button>,
              <Button
                key='onCancel'
                style={{float: 'right', marginRight: '1%'}}
                onClick={oncancel}>
                  取消
              </Button>,
            ],
        });
    };
    const exportSVG = () => {
        const currentDataSource = getCurrentDataSource();
        const diagram = currentDataSource.project.diagrams.find(d => d.id === defaultData.id);
        cell2html(diagram, currentDataSource).then(({cells, container}) => {
            const svg = html2svg(cells, container);
            document.body.removeChild(container);
            downloadString(svg, 'image/svg+xml', `${defaultData.defName || defaultData.defKey}.svg`);
        });
    };
    const exportPNG = (type) => {
        const currentDataSource = getCurrentDataSource();
        const diagram = currentDataSource.project.diagrams.find(d => d.id === defaultData.id);
        cell2html(diagram, currentDataSource).then(({cells, container}) => {
            const svg = html2svg(cells, container);
            svg2png(svg, type).then((res) => {
                document.body.removeChild(container);
                downloadString(res, `image/${type}`, `${defaultData.defName || defaultData.defKey}.${type}`);
            });
        });
    };
    const onDragOver = (e) => {
        e.preventDefault();
    };
    const createEdge = (e, connector, router, isEr) => {
        const graph = graphRef.current;
        const edgeTools = getEdgeDefaultTools();
        graph.cleanSelection();
        graph.clearTransformWidgets();
        const edgeAttrs = getEdgeDefaultAttrs(
            getCurrentDataSource().project.diagrams.find(d => d.id === defaultData.id)
                .props.linkLine || {});
        const getConnector = () => {
            return {
                name: connector,
            };
        };
        const pointer = graph.clientToLocal(e.clientX, e.clientY);
        graph.addEdge({
            zIndex: 0,
            source: [pointer.x - 50, pointer.y - 50],
            target: [pointer.x + 50, pointer.y + 50],
            connector: getConnector(),
            router,
            cellType: 'edge',
            attrs: isEr ? {
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
            } : edgeAttrs,
            tools: edgeTools,
        });
    };
    const onDrop = (e) => {
       try {
           const edgeData = JSON.parse(e.dataTransfer.getData('edge'));
           createEdge(e, edgeData.connector, edgeData.router, edgeData.isEr);
       } catch (err) {
           console.error(err);
       }
    };
    return <div onDrop={onDrop} onDragOver={onDragOver} className={currentPrefix} ref={relationRef}>
      {!readonly && <ComTool
        type={defaultData.type}
        ref={comToolRef}
        getGraph={getGraph}
        entityRelationRank={defaultData.entityRelationRank}
        defaultData={defaultData}
        getCurrentDataSource={getCurrentDataSource}
        />}
      <div ref={minimapRef} className={`${currentPrefix}-minimap`} />
      <div ref={cellToolRef} className={`${currentPrefix}-celltool-container`}/>
      {!readonly && <div onClick={openConfig} className={`${currentPrefix}-config`}>
        <Icon type='icon-adjust'/>
        </div>}
      <RelationTool
        readonly={readonly}
        undo={undo}
        redo={redo}
        center={center}
        ref={relationToolRef}
        getGraph={getGraph}
        interactChange={interactChange}
        minMapChange={minMapChange}
        onFullScreen={onFullScreen}
      />
      <QuickTool
        getGraph={getGraph}
        exportSVG={exportSVG}
        exportPNG={exportPNG}
        ref={quickToolRef}/>
      <div className={`${currentPrefix}-svg`} ref={containerRef} />
    </div>;
}));
