import React, {useEffect, useRef} from 'react';
import { Graph, Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Icon, Tooltip } from 'components';
import {DagreLayout} from '@antv/layout';
import {getPrefix} from '../../../../../lib/classes';
import {PROJECT} from '../../../../../lib/constant';

export default React.memo(({refers, defaultData, open}) => {
    const containerRef = useRef(null);
    const currentPrefix = getPrefix('container-model-entity-physical-content-relation-map');
    const _onEntityClick = (data) => {
        open && open({
            nodeType: PROJECT.ENTITY,
            ...data.data,
        });
    };
    useEffect(() => {

        const AlgoNode = (props) => {
            const { node } = props;
            const data = node?.getData();
            const getLabel = (d, name) => {
                if(d[`${name}Name`] && (d[`${name}Key`] !== d[`${name}Name`])) {
                    return `${d[`${name}Key`]}[${d[`${name}Name`]}]`;
                }
                return d[`${name}Key`];
            };
            const getLabelCom = () => {
                if(data.defKey) {
                    return getLabel(data, 'def');
                }
                return <>
                  <Tooltip placement='top' title={getLabel(data, 'entity')}>
                    <span onClick={() => _onEntityClick(data)}>{getLabel(data, 'entity')}</span>
                  </Tooltip>
                  <Tooltip placement='top' title={getLabel(data, 'field')}>
                    <span>{getLabel(data, 'field')}</span>
                  </Tooltip>
                </>;
            };
            const getTag = () => {
                const isChild = node.prop('isChild');
                const isParent = node.prop('isParent');
                if(isChild) {
                    return <span className={`${currentPrefix}-node-tag-child`}>下</span>;
                } else if(isParent) {
                    return <span className={`${currentPrefix}-node-tag-parent`}>上</span>;
                }
                return <span className={`${currentPrefix}-node-tag-default`}>当前</span>;
            };
            return (
              <div className={`${currentPrefix}-node`}>
                <Icon type='icon-model-physic'/>
                <span className={`${currentPrefix}-node-label`}>{getLabelCom()}</span>
                <span className={`${currentPrefix}-node-tag`}>
                  {getTag()}
                </span>
              </div>
            );
        };

        register({
            shape: 'dag-node',
            component: AlgoNode,
            ports: {
                groups: {
                    top: {
                        position: 'top',
                        attrs: {
                            circle: {
                                style: {
                                    visibility: 'hidden',
                                },
                            },
                        },
                    },
                    bottom: {
                        position: 'bottom',
                        attrs: {
                            circle: {
                                style: {
                                    visibility: 'hidden',
                                },
                            },
                        },
                    },
                },
            },
        });

        Graph.registerEdge(
            'dag-edge',
            {
                inherit: 'edge',
                attrs: {
                    line: {
                        stroke: '#C2C8D5',
                        strokeWidth: 1,
                        targetMarker: null,
                    },
                },
            },
            true,
        );

        Graph.registerConnector(
            'algo-connector',
            (s, e) => {
                const offset = 4;
                const deltaY = Math.abs(e.y - s.y);
                const control = Math.floor((deltaY / 3) * 2);

                const v1 = { x: s.x, y: s.y + offset + control };
                const v2 = { x: e.x, y: e.y - offset - control };

                return Path.normalize(
                    `M ${s.x} ${s.y}
       L ${s.x} ${s.y + offset}
       C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${e.x} ${e.y - offset}
       L ${e.x} ${e.y}
      `,
                );
            },
            true,
        );
        const graph = new Graph({
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
                allowBlank: false,
                allowLoop: false,
                highlight: true,
                connector: 'algo-connector',
                connectionPoint: 'anchor',
                anchor: 'center',
            },
            interacting: false,
        highlighting: {
            magnetAdsorbed: {
                name: 'stroke',
                    args: {
                    attrs: {
                        fill: '#fff',
                            stroke: '#31d0c6',
                            strokeWidth: 4,
                    },
                },
            },
        },
        });

        // 初始化节点/边
        const init = (data) => {
            const cells = [];
            data.forEach((item) => {
                if (item.shape === 'dag-node') {
                    cells.push(graph.createNode(item));
                } else {
                    const edge = graph.createEdge(item);
                    edge.attr('line/strokeDasharray', 5);
                    edge.attr('line/style/animation', 'running-line 30s infinite linear');
                    cells.push(edge);
                }
            });
            graph.resetCells(cells);
        };

        const { parents, children } = refers;
        const size = {
            width: 380,
            height: 35,
        };
        const currentNode = {
            shape: 'dag-node',
            ...size,
            data: defaultData,
            id: Math.uuid(),
            ports: [],
        };
        let nodes = [currentNode];
        const edges = [];
        parents.forEach((parent) => {
            const parentNode = {
                id: Math.uuid(),
                shape: 'dag-node',
                ...size,
                data: parent,
                isParent: true,
                ports: [
                    {
                        id: Math.uuid(),
                        group: 'bottom',
                    },
                ],
            };
            nodes.push(parentNode);
            const currentNodePort = {
                id: Math.uuid(),
                group: 'top',
            };
            currentNode.ports.push(currentNodePort);
            edges.push({
                shape: 'dag-edge',
                source: {
                    cell: parentNode.id,
                    port: parentNode.ports[0].id,
                },
                target: {
                    cell: currentNode.id,
                    port: currentNodePort.id,
                },
                zIndex: 0,
            });
        });
        children.forEach((child) => {
            const childNode = {
                id: Math.uuid(),
                shape: 'dag-node',
                ...size,
                data: child,
                isChild: true,
                ports: [
                    {
                        id: Math.uuid(),
                        group: 'top',
                    },
                ],
            };
            nodes.push(childNode);
            const currentNodePort = {
                id: Math.uuid(),
                group: 'bottom',
            };
            currentNode.ports.push(currentNodePort);
            edges.push({
                shape: 'dag-edge',
                target: {
                    cell: childNode.id,
                    port: childNode.ports[0].id,
                },
                source: {
                    cell: currentNode.id,
                    port: currentNodePort.id,
                },
                zIndex: 0,
            });
        });
        const gridCells = new DagreLayout({
            type: 'dagre',
            rankdir: 'TB',
        }).layout({
            nodes: nodes.map((n) => {
                return {
                    id: n.id,
                    size,
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
        init(nodes.concat(edges));
        graph.centerContent();

    }, []);
    return <div ref={containerRef} className={currentPrefix}/>;
});
