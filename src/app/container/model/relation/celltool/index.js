import React, {useState, useEffect} from 'react';
import {Icon, Tooltip} from 'components';
import ReactDom from 'react-dom';
import './style/index.less';
import CellFill from './CellFill';
import CellStroke from './CellStroke';
import FontFill from './FontFill';
import FontStyle from './FontStyle';
import FontSize from './FontSize';
import FontAlign from './FontAlign';
import NodeAlign from './NodeAlign';
import NodeIndex from './NodeIndex';
import NodeLayout from './NodeLayout';
import NodeLink from './NodeLink';
import NodeShape from './NodeShape';
import EdgeRouter from './EdgeRouter';
import NodeSIze from './NodeSIze';
import EdgeMarker from './EdgeMarker';
import ModelTool from './modeltool';
import EdgeLabel from './EdgeLabel';

// x6自定义工具
import './customertool/HighlightNode';
import './customertool/NodeShowSize';
import './customertool/EditNode';
import './customertool/NodeLink';
import {highLineCells, isEntityNode} from '../util/celltools';
import Basictool from './basictool';
import JumpOver from './JumpOver';


// 节点设置组件
const CellConfigTool = ({opt, cell, edge = cell, updatePosition, hiddeTool,
                            getCurrentDataSource, defaultData}) => {
    const [isLock, setIsLock] = useState(() => cell.prop('lock') || false);
    useEffect(() => {
        const graph = cell.model.graph;
        const handler = {
            scale: () => {
                updatePosition();
            },
            translate: () => {
                updatePosition();
            },
            moved: () => {
                updatePosition();
            },
            position: ({options}) => {
                if(options && (options.type === 'undo' || options.type === 'redo')) {
                    // 只有在撤销重做时需要处理 其他状态已经在moved事件中更新
                    updatePosition();
                }
            },
            size: () => {
                updatePosition();
            },
            move: () => {
                hiddeTool();
            },
            targetAndSource: ({options}) => {
                if(options?.type === 'redo' || options?.type === 'undo') {
                    updatePosition();
                }
            },
            lock: () => {
                graph.clearTransformWidgets();
                setIsLock(cell.prop('lock'));
            },
            start: ({name}) => {
                if(name === 'move-vertex' || name === 'move-arrowhead') {
                    hiddeTool();
                }
            },
            stop: ({name}) => {
                if(name === 'move-vertex' || name === 'move-arrowhead') {
                    updatePosition();
                }
            },
        };
        // 节点和边共享属性
        cell.on('change:lock', handler.lock);
        // 节点位置变化
        graph?.on?.('node:moved', handler.moved);
        graph?.on?.('node:move', handler.move);
        graph?.on?.('edge:moved', handler.moved);
        graph?.on?.('edge:move', handler.move);
       // graph?.on?.('edge:moved', handler.moved);
       // graph?.on?.('edge:move', handler.move);
        cell.on?.('change:position', handler.position);
        cell.on?.('change:size', handler.size);
        edge?.on?.('batch:start', handler.start);
        edge?.on?.('batch:stop', handler.stop);
        // 连线位置发生变化
        edge?.on?.('change:target', handler.targetAndSource);
        edge?.on?.('change:source', handler.targetAndSource);
        // 监听画布缩放和移动
        graph.on('scale', handler.scale);
        graph.on('translate', handler.translate);
        return () => {
            // 移除监听
            cell.off(null, handler.position);
            cell.off(null, handler.lock);
            cell.off(null, handler.size);
            edge?.off?.(null, handler.start);
            edge?.off?.(null, handler.stop);
            //edge?.off?.(null, handler.position);
            //edge?.off?.(null, handler.targetAndSource);
            graph.off?.(null, handler.move);
            graph.off?.(null, handler.moved);
            graph.off(null, handler.scale);
            graph.off(null, handler.translate);
        };
    }, []);
    const setLock = () => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                c.prop('lock', !isLock);
            });
        });
    };
    const onDelete = () => {
        const graph = cell.model.graph;
        const cells = graph.getSelectedCells();
        if (cells.length) {
            cells.filter(c => c.isEdge()).forEach((c) => {
                c.removeTools();
            });
            highLineCells(cells, false, graph);
            graph.removeCells(cells);
        }
    };
    const exchangeMarker = () => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.filter(c => c.isEdge()).forEach((c) => {
                const sourceMarker = c.attr('line/sourceMarker/name');
                const targetMarker = c.attr('line/targetMarker/name');
                c.attr('line/sourceMarker/name', targetMarker);
                c.attr('line/targetMarker/name', sourceMarker);
            });
        });
    };
    const renderDetail = (optType, styleName, cells = [cell]) => {
        switch (optType) {
            case 'fill': return <CellFill cell={cells[0]} styleName={styleName}/>;
            case 'stroke': return <CellStroke
              getCurrentDataSource={getCurrentDataSource}
              defaultData={defaultData}
              cell={cells[0]}
              styleName={styleName}
              hasWidth={!styleName}/>;
            case 'color': return <FontFill cell={cells[0]} styleName={styleName} />;
            case 'bold': return <FontStyle cell={cells[0]} styleName={styleName}/>;
            case 'size': return <FontSize cell={cells[0]} styleName={styleName}/>;
            case 'font-align': return <FontAlign cell={cells[0]} styleName={styleName}/>;
            case 'node-align': return <NodeAlign cell={cells[0]} styleName={styleName}/>;
            case 'index': return <NodeIndex cell={cells[0]} styleName={styleName}/>;
            case 'layout': return <NodeLayout cell={cells[0]} styleName={styleName}/>;
            case 'label': return <EdgeLabel cell={cells[1]} styleName={styleName}/>;
            case 'link': return <NodeLink cell={cells[0]} styleName={styleName} getCurrentDataSource={getCurrentDataSource}/>;
            case 'shape': return <NodeShape cell={cells[0]} styleName={styleName}/>;
            case 'line': return <EdgeRouter cell={cells[1]} styleName={styleName}/>;
            case 'node-size': return <NodeSIze cell={cells[2] || cells[0]}/>;
            case 'targetMarker':
            case 'sourceMarker': return <EdgeMarker type={optType} cell={cells[1]}/>;
            case 'jumpover': return <JumpOver type={optType} cell={cells[1]}/>;
            case 'change': return <Icon onClick={exchangeMarker} type='icon-exchange'/>;
            case 'del': return <Icon onClick={onDelete} type='icon-oper-delete'/>;
            case 'info': return <Tooltip
              style={{background: '#FEF3A4', padding: 10}}
              placement='top'
              title={<div>按住ctrl/command后，点击可增加锚点</div>}
              force><Icon type='icon-warning-circle'
            /></Tooltip>;
            case 'lock': return <Icon onClick={setLock} type={`${isLock ? 'icon-lock-close' : 'icon-lock-open'}`}/>;
            default:  return null;
        }
    };
    useEffect(() => {
        updatePosition();
    }, [isLock]);
    return <>{
          isEntityNode(cell) ?
            <ModelTool
              opt={opt}
              cell={cell}
              renderDetail={renderDetail}
              lock={isLock}
            /> :
            <Basictool
              opt={opt}
              cell={cell}
              lock={isLock}
              renderDetail={renderDetail}
            />
      }</>;
};
const renderConfig = (cell, toolContainer, getCurrentDataSource, defaultData) => {
    //let opt = [];
    //let toolWidth = 0;
    const graph = cell.model.graph;
    const selectedCells = graph.getSelectedCells();
    const nodes = selectedCells.filter(c => c.isNode());
    const edges = selectedCells.filter(c => c.isEdge());
    const multipleCellTools = nodes.length > 1
        ? ['node-align', 'index', 'layout'] : ['index'];
    const getTool = (cellType) => {
        let opt = [];
        switch (cellType) {
            case 'group':
                opt = [['fill', 'stroke'], ['color', 'bold', 'size', 'font'], ['index'], ['node-size'], ['lock', 'del']];
                break;
            case 'physical-entity-node':
            case 'concept-entity-node':
                opt = [[], [], multipleCellTools, ['node-size', 'shape'], ['lock', 'link', 'del']];
                break;
            case 'logic-entity-node':
                opt = [[], [], multipleCellTools, ['node-size'], ['lock', 'link', 'del']];
                break;
            case 'rect':
            case 'round':
            case 'circle':
            case 'ellipse':
            case 'parallelogram':
            case 'diamond':
            case 'notes':
            case 'arrow_top':
            case 'arrow_right':
            case 'arrow_bottom':
            case 'arrow_left':
                opt = [['fill', 'stroke'], ['color', 'bold', 'size', 'font-align'], multipleCellTools, ['node-size'], ['lock', 'link','del']];
                break;
            case 'concept-entity-node-circle':
            case 'concept-entity-node-diamond':
                opt = [[], [], multipleCellTools, ['node-size', 'shape'], ['lock', 'link','del']];
                break;
            case 'text':
                opt = [[], ['color', 'bold', 'size', 'font-align'], multipleCellTools,['node-size'], ['lock', 'link','del']];
                break;
            case 'edge':
                opt = [['fill', 'stroke'], ['color', 'bold', 'size', 'font-align'], [], ['label', 'line', 'sourceMarker', 'change', 'targetMarker', 'jumpover'], ['lock', 'del', 'info']];
                break;
            case 'markdown-node':
                opt = [['fill', 'stroke'], [], [], ['node-size'], ['lock', 'del']];
                break;
            default: break;
        }
        return opt;
    };
    const allTools = selectedCells.map((c) => {
        return getTool(c.prop('cellType'));
    });
    //console.log(allTools);
    const mergeTools = (tools) => {
        return tools.reduce((p, n) => {
            return p.map((c, i) => {
                return [...new Set(c.concat(n[i] || []))];
            });
        }, [[], [], [], [], []]);
    };
    const finalTools = mergeTools(allTools);
    const updatePosition = () => {
        // eslint-disable-next-line no-param-reassign
        toolContainer.style.opacity = 1;
        let pos;
        let size;
        if(cell.isNode()) {
            pos = graph.localToPage(cell.position());
            size = cell.size();
        } else {
            const box = cell.getBBox();
            pos = graph.localToPage({
                x: box.x,
                y: box.y,
            });
            size = {
                width: box.width,
                height: box.height,
            };
        }
        const zoom = graph.zoom();
        const cellRect = {
            ...pos,
            width: size.width * zoom,
            height: size.height * zoom,
        };
        //this.graph.localToGraph(position)
        const graphRect = graph.container.getBoundingClientRect();
        const toolContainerRect = toolContainer.getBoundingClientRect();
        const left = cellRect.x - graphRect.x + cellRect.width / 2 - toolContainerRect.width / 2;
        const modelHeight = isEntityNode(cell) && !cell.prop().lock ? 52 : 0;
        if(cell.isEdge()) {
            const react = graph.findView(cell).container.getBoundingClientRect();
            if(react.width === 0 && react.height === 0) {
                // eslint-disable-next-line no-param-reassign
                toolContainer.style.top = `${cellRect.y - graphRect.y - 53 - modelHeight}px`;
            } else {
                // eslint-disable-next-line no-param-reassign
                toolContainer.style.top = `${react.y - graphRect.y - 53 - modelHeight}px`;
            }
        } else {
            // eslint-disable-next-line no-param-reassign
            toolContainer.style.top = `${cellRect.y - graphRect.y - 53 - modelHeight}px`;
        }
        // eslint-disable-next-line no-param-reassign
        toolContainer.style.left = `${left}px`;
    };
    const hiddeTool = () => {
        // eslint-disable-next-line no-param-reassign
        toolContainer.style.opacity = 0;
    };
    if(finalTools.reduce((p, n) => p.concat(n), []).length > 0) {
        let tempContainer = toolContainer.children[0];
        if(!tempContainer) {
            tempContainer = document.createElement('div');
            toolContainer.appendChild(tempContainer);
        }
        ReactDom.render(<CellConfigTool
          defaultData={defaultData}
          getCurrentDataSource={getCurrentDataSource}
          opt={finalTools}
          node={nodes[0]}
          edge={edges[0]}
          cell={cell}
          hiddeTool={hiddeTool}
          updatePosition={updatePosition}
        />, tempContainer);
    }
};

const addCellConfig = (cell, toolContainer, getCurrentDataSource, defaultData) => {
    const graph = cell.model.graph;
    // 判断是否需要渲染
    const selectedCells = graph.getSelectedCells();
    if(selectedCells.length >= 1) {
        const modelCell = selectedCells.find(c => isEntityNode(c));
        renderConfig(modelCell || cell, toolContainer, getCurrentDataSource, defaultData);
    }
};

const removeCellConfig = (toolContainer) => {
    if (toolContainer) {
        Array.from(toolContainer.children).forEach((c) => {
           ReactDom.unmountComponentAtNode(c);
           toolContainer.removeChild(c);
        });
    }
};

export {
    addCellConfig,
    removeCellConfig,
};
