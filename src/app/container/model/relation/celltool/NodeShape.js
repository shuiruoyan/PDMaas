import React, {useState} from 'react';
import { Icon, Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {
    entityAttr2Simple,
    getCirclePorts,
    getDiamondPorts,
    getEntityNodeTools, getNodeDefaultPorts,
    getNodeDefaultTools,
    isEntityNode,
} from '../util/celltools';


const currentPrefix = getPrefix('container-model-relation-celltool');

const shapIconMap = {
    'concept-entity-node': 'icon-shape-rectangle',
    'concept-entity-node-circle': 'icon-shape-circular',
    'concept-entity-node-diamond': 'icon-shape-rhombus',
};

const NodeShape = ({updateShape, defaultValue}) => {
    const [shape, setShape] = useState(defaultValue);
    const _updateShape = (s) => {
        setShape(s);
        updateShape(s);
    };
    const shapeList = ['concept-entity-node', 'concept-entity-node-circle', 'concept-entity-node-diamond'];
    return <div className={`${currentPrefix}-detail-node-shape`}>
      {shapeList.filter(s => shape !== s).map((s) => {
            return <span
              key={s}
              onClick={() => _updateShape(s)}
            >
              <Icon type={shapIconMap[s]}/>
            </span>;
        })}
    </div>;
};
export default React.memo(({cell}) => {
    const getShape = () => {
        return cell.cellType || cell.prop?.('cellType');
    };
    const [shape, setShape] = useState(() => {
        return getShape();
    });
    const entity2circle = (sameProps, value) => {
        const min = sameProps.size.width > sameProps.size.height
            ? sameProps.size.height : sameProps.size.width;
        return {
            ...sameProps,
            position: {
              x: sameProps.size.width > min ?
                  sameProps.position.x + (sameProps.size.width - min) / 2
                  : sameProps.position.x,
            y: sameProps.size.height > min ?
                sameProps.position.y + (sameProps.size.height - min) / 2
                : sameProps.position.y,
            },
            ports: {
                groups: getCirclePorts().groups,
                items: (sameProps.ports?.items || []).map((p) => {
                    return {
                        ...p,
                        group: 'ellipseSpread',
                    };
                }),
            },
            tools: getNodeDefaultTools(),
            width: min,
            height: min,
            cellType: value,
            shape: value,
        };
    };
    const entity2diamond = (sameProps, value) => {
        const ports = getDiamondPorts();
        return {
            ...sameProps,
            ports: {
                groups: ports.groups,
                items: ports.items.map((item, index) => {
                    const sameItem = sameProps.ports?.items?.[index];
                    return {
                        ...item,
                        id: sameItem?.id || Math.uuid(),
                    };
                }),
            },
            attrs: entityAttr2Simple(sameProps.entitySetting || {}),
            tools: getNodeDefaultTools(),
            width: sameProps.size.width,
            height: sameProps.size.height,
            cellType: value,
            shape: value,
        };
    };
    const circle2entity = (sameProps, value) => {
        const ports = getNodeDefaultPorts(4);
        return {
            ...sameProps,
            ports: {
                groups: ports.groups,
                items: ports.items.map((item, index) => {
                    const sameItem = sameProps.ports?.items?.[index];
                    return {
                        ...item,
                        id: sameItem?.id || Math.uuid(),
                    };
                }),
            },
            attrs: {
                body: {
                    rx: 5,
                },
            },
            tools: getEntityNodeTools(),
            cellType: value,
            shape: value,
        };
    };
    const simple2simple = (sameProps, value, ports) => {
        return {
            ...sameProps,
            ports: {
                groups: ports.groups,
                items: ports.items.map((item, index) => {
                    const sameItem = sameProps.ports?.items?.[index];
                    return {
                        ...item,
                        id: sameItem?.id || Math.uuid(),
                    };
                }),
            },
            width: sameProps.size.width,
            height: sameProps.size.height,
            cellType: value,
            shape: value,
        };
    };
    const circle2diamond = (sameProps, value) => {
        const ports = getDiamondPorts();
        return simple2simple(sameProps, value, ports);
    };
    const diamond2circle = (sameProps, value) => {
        const ports = getCirclePorts();
        return simple2simple(sameProps, value, ports);
    };
    const diamond2entity = (sameProps, value) => {
        return circle2entity(sameProps, value);
    };
    const updateShape = (value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        const removes = [];
        const adds = [];
        selectedCells.forEach((c) => {
            if(isEntityNode(c) && c.prop('shape').startsWith('concept-entity-node')) {
                // 无法直接修改 只能删除加新增
                const allProp = c.prop();
                const sameProps = Object.keys(allProp).reduce((a, b) => {
                    return {
                        ...a,
                        [b]: c.prop(b),
                    };
                }, {});
                let newNode = null;
                if(c.prop('shape') === 'concept-entity-node') {
                    if(value === 'concept-entity-node-circle') {
                        newNode = entity2circle(sameProps, value);
                    } else if (value === 'concept-entity-node-diamond') {
                        newNode = entity2diamond(sameProps, value);
                    }
                } else if(c.prop('shape') === 'concept-entity-node-circle'){
                    if(value === 'concept-entity-node') {
                        newNode = circle2entity(sameProps, value);
                    } else if (value === 'concept-entity-node-diamond') {
                        newNode = circle2diamond(sameProps, value);
                    }
                } else if(c.prop('shape') === 'concept-entity-node-diamond'){
                    if(value === 'concept-entity-node') {
                        newNode = diamond2entity(sameProps, value);
                    } else if (value === 'concept-entity-node-circle') {
                        newNode = diamond2circle(sameProps, value);
                    }
                }
                if(newNode) {
                    removes.push(c);
                    adds.push(newNode);
                }
            }
        });
        const tempEdges = [];
        graph.batchUpdate(() => {
            // 批量清除删除节点的锚点
            removes.forEach((c) => {
                tempEdges.push(...graph.removeConnectedEdges(c));
            });
        });
        graph.removeCells(removes);
        graph.addNodes(adds);
        graph.addEdges(tempEdges);
        graph.resetSelection([]);
        setShape(value);
    };

    return<Tooltip
      force
      title={<NodeShape
        defaultValue={shape}
        updateShape={updateShape}
        />}>
      <span><Icon type={shapIconMap[shape]}/></span>
    </Tooltip>;
});
