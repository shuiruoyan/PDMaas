import React, {useState, useCallback, forwardRef, useImperativeHandle} from 'react';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Icon, Tooltip } from 'components';
import _ from 'lodash';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import Arrow from './style/arrow.svg';
import Ellipse from './style/ellipse.svg';
import {
  getNodeDefaultAttrs,
  getNodeDefaultTools,
  getNodeDefaultPorts,
  calcNodeSize,
  getNodePortAttrs,
  getEntityNodeTools,
  getCirclePorts,
  getParallelogramPorts, getDiamondPorts, getRectPorts,
} from '../util/celltools';
import {getId, getIdAsyn} from '../../../../../lib/idpool';
import {sendData} from '../../../../../lib/utils';
import {COMPONENT, PROFILE, WS} from '../../../../../lib/constant';
import {searchTreeNode} from '../../../../../lib/tree';

export default React.memo(forwardRef(({getGraph, entityRelationRank, type, defaultData,
                                        getCurrentDataSource}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-comtool');
    const [expand, setExpand] = useState(true);
    const nodeAttrs = getNodeDefaultAttrs();
    const nodeTools = getNodeDefaultTools();
    const entityNodeTools = getEntityNodeTools();
    const ports = getNodeDefaultPorts(4);
    const [isHidden, setIsHidden] = useState(false);
    const getCurrentRelationProps = () => {
      return (getCurrentDataSource().project?.diagrams || [])
          .find(d => d.id === defaultData.id).props;
    };
    const getDragNode = (shape, data) => {
      const props = getCurrentRelationProps();
      switch (shape) {
        case 'group': return {
          zIndex: -1,
          shape: 'group',
          width: 300,
          height: 200,
          attrs: {
            ...getNodeDefaultAttrs('shapeGeneral', props),
            body: {
              rx: 5,
              ..._.omit(getNodeDefaultAttrs('shapeGeneral', props).body, 'fill'),
            },
          },
          tools: nodeTools,
        };
        case 'rect': return {
          shape: 'rect',
          width: 120,
          height: 80,
          attrs: getNodeDefaultAttrs('shapeGeneral', props),
          tools: nodeTools,
          ports: getRectPorts(),
        };
        case 'round': return {
          shape: 'rect',
          width: 120,
          height: 80,
          attrs: {
            ...getNodeDefaultAttrs('shapeGeneral', props),
            body: {
              ...getNodeDefaultAttrs('shapeGeneral', props).body,
              rx: 10,
              ry: 10,
            },
          },
          tools: nodeTools,
          ports,
        };
        case 'circle': return {
          shape: 'circle',
          width: 100,
          height: 100,
          attrs: getNodeDefaultAttrs('shapeGeneral', props),
          tools: nodeTools,
          ports: getCirclePorts(),
        };
        case 'ellipse': return {
          shape: 'ellipse',
          width: 100,
          height: 60,
          attrs: getNodeDefaultAttrs('shapeGeneral', props),
          tools: nodeTools,
          ports: getCirclePorts(),
        };
        case 'parallelogram': return {
          shape: 'polygon',
          width: 120,
          height: 80,
          attrs: {
            ...getNodeDefaultAttrs('shapeGeneral', props),
            body: {
              ...getNodeDefaultAttrs('shapeGeneral', props).body,
              refPoints: '10,0 40,0 30,20 0,20',
            },
          },
          tools: nodeTools,
          ports: getParallelogramPorts(),
        };
        case 'diamond': return {
          shape: 'polygon',
          width: 120,
          height: 120,
          attrs: {
            ...getNodeDefaultAttrs('shapeGeneral', props),
            body: {
              ...getNodeDefaultAttrs('shapeGeneral', props).body,
              refPoints: '0,10 10,0 20,10 10,20',
            },
          },
          tools: nodeTools,
          ports: getDiamondPorts(),
        };
        case 'notes': return {
          shape: 'notes',
          width: 100,
          height: 100,
          attrs: {
            ...nodeAttrs,
            body: {
              ...nodeAttrs.body,
              fill: 'rgb(254, 243, 164)',
              stroke: 'rgb(245, 245, 245)',
            },
          },
          tools: nodeTools,
        };
        case 'arrow_top':
        case 'arrow_right':
        case 'arrow_bottom':
        case 'arrow_left': return {
          shape: shape,
          width: (shape === 'arrow_top' || shape === 'arrow_bottom') ? 60 : 100,
          height: (shape === 'arrow_top' || shape === 'arrow_bottom') ? 100 : 60,
          attrs: {
            ...nodeAttrs,
            body: {
              ...nodeAttrs.body,
              //fill: 'rgb(254, 243, 164)',
              //stroke: 'rgb(245, 245, 245)',
            },
          },
          tools: nodeTools,
        };
        case 'text': return {
          width: 100,
          height: 20,
          shape: 'text',
          attrs: {
            text: {
              ...getNodeDefaultAttrs('textbox', props),
              text: '文本',
            },
          },
          tools: nodeTools,
        };
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
          width: size.nodeSize.width,
          height: size.nodeSize.height,
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
            width: nodeSize.width,
            height: nodeSize.height,
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
            //attrs: getNodeDefaultAttrs(type, props),
          };
        case 'markdown-node':
          return {
            shape: 'markdown-node',
            width: 200,
            height: 100,
            // attrs: nodeAttrs,
            attrs: getNodeDefaultAttrs('shapeGeneral', props),
            tools: nodeTools,
            ports,
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
            width: conceptEntityNodeSize.width,
            height: conceptEntityNodeSize.height,
            tools: entityNodeTools,
            ports,
            entityDisplay: props.entityDisplay,
            entitySetting: props.entitySetting,
            attrs: {
              body: {
                rx: 5,
              },
            },
          };
        default: return {
          shape: 'rect',
          width: 100,
          height: 40,
          attrs: nodeAttrs,
          tools: nodeTools,
          ports,
        };
      }
    };
    const createNewEntity = (data, resolve) => {
      const dataSource = getCurrentDataSource();
      const hierarchyType = dataSource.profile?.user?.modelingNavDisplay?.hierarchyType;
      const categories = dataSource.project.categories || [];
      const id = Math.uuid();
      sendData({
        event: WS.ENTITY.MOP_ENTITY_CREATE,
        payload: [{
          type: COMPONENT.TREE.SUB,
          to: hierarchyType === PROFILE.USER.TREE ? searchTreeNode(categories, (category) => {
            return category.diagramRefs.some(d => d.refObjectId === defaultData.id);
          })?.id : 'base_flat',
          position: COMPONENT.TREE.AFTER,
          data: [_.omit(data, 'isTemp')],
          hierarchyType,
        }],
      }, id, () => {
        resolve(true);
      });
    };
    const createNodes = (shape, data, position) => {
      const graph = getGraph();
      graph.cleanSelection();
      graph.clearTransformWidgets();
      const pointer = graph.pageToLocal(position);
      graph.addNodes(data.map((d, i) => graph.createNode({
        cellType: shape,
        originData: d,
        position: {
          x: pointer.x,
          y: pointer.y + i * 350,
        },
        ...getDragNode(shape, d),
      })));
    };
    const startDrag = (e, shape, data) => {
      const graph = getGraph();
      graph.cleanSelection();
      graph.clearTransformWidgets();
      const node = graph.createNode({
        cellType: shape,
        originData: data,
        ...getDragNode(shape, data),
      });
      const dnd = new Dnd({
        target: graph,
        validateNode: (droppingNode) => {
          return new Promise((resolve) => {
            const originData = droppingNode.prop('originData');
            if(originData?.isTemp) {
              createNewEntity(originData, resolve);
            } else {
              resolve(true);
            }
          });
        },
      });
      dnd.start(node, e.nativeEvent);
  };
    const onDragStartEdge = (e, connector, router, isEr) => {
      e.dataTransfer.setData('edge', JSON.stringify({
        connector, router, isEr,
      }));
    };
    const ShapeList = useCallback(() => {
      return <div className={`${currentPrefix}-shape-list`}>
        <div onMouseDown={e => startDrag(e, 'rect')}>
          <Icon type='icon-shape-rectangle'/>
        </div>
        <div onMouseDown={e => startDrag(e, 'round')}>
          <Icon type='icon-shape-rectangle-corner'/>
        </div>
        <div onMouseDown={e => startDrag(e, 'circle')}>
          <Icon type='icon-shape-circular'/>
        </div>
        <div style={{height: 46}} onMouseDown={e => startDrag(e, 'ellipse')}>
          <img src={Ellipse} alt=''/>
        </div>
        <div onMouseDown={e => startDrag(e, 'parallelogram')}>
          <Icon type='icon-shape-parallelogram'/>
        </div>
        <div onMouseDown={e => startDrag(e, 'diamond')}>
          <Icon type='icon-shape-rhombus'/>
        </div>
        <div style={{height: 46}} onMouseDown={e => startDrag(e, 'arrow_top')}>
          <img style={{transform: 'rotate(45deg)'}} src={Arrow} alt=''/>
        </div>
        <div style={{height: 46}} onMouseDown={e => startDrag(e, 'arrow_right')}>
          <img style={{transform: 'rotate(135deg)'}} src={Arrow} alt=''/>
        </div>
        <div style={{height: 46}} onMouseDown={e => startDrag(e, 'arrow_bottom')}>
          <img style={{transform: 'rotate(225deg)'}} src={Arrow} alt=''/>
        </div>
        <div style={{height: 46}} onMouseDown={e => startDrag(e, 'arrow_left')}>
          <img style={{transform: 'rotate(315deg)'}} src={Arrow} alt=''/>
        </div>
      </div>;
    }, []);
  const EdgeList = useCallback(({er}) => {
    return <div className={`${currentPrefix}-edge-list`}>
      <div
        draggable
        onDragStart={e => onDragStartEdge(e, 'normal', {
          name: 'normal',
        }, er)}
        ><Icon type='icon-line-diagonal'/></div>
      <div
        draggable
        onDragStart={e => onDragStartEdge(e, 'rounded', {
        name: 'manhattan',
      }, er)}><Icon type='icon-line-polygonal'/></div>
      <div
        draggable
        onDragStart={e => onDragStartEdge(e, 'smooth',{
        name: 'normal',
      }, er)}><Icon type='icon-line-curve'/></div>
    </div>;
  }, []);
  const hidden = () => {
    setIsHidden(true);
  };
  const show = () => {
    setIsHidden(false);
  };
  useImperativeHandle(ref, () => {
    return {
      setExpand,
      startDrag,
      createNodes,
      hidden,
      show,
    };
  }, []);
  const typeMaps = {
    P: {
      shape: 'physical-entity-node',
      data: {
        defName: '数据表',
        defKey: 'T_NEW_TABLE',
      },
    },
    L: {
      shape: 'logic-entity-node',
      data: {
        defName: '逻辑模型',
        defKey: 'L_NEW_MODEL',
      },
    },
    C: {
      shape: 'concept-entity-node',
      data: {
        defName: '概念模型',
        defKey: 'C_NEW_MODEL',
      },
    },
  };
    const createTempEntity = (e) => {
      const event = e.nativeEvent;
      const createDragNode = (fields) => {
        const entities = getCurrentDataSource()?.project?.entities || [];
        const getNewCount = (name, count) => {
          if(entities.some(entity => entity.defKey === `${name}_${count}`)){
            return getNewCount(name, count + 1);
          }
          return count;
        };
        const count = getNewCount(typeMaps[type].data.defKey, 1);
        startDrag({
          nativeEvent: event,
        }, typeMaps[type].shape, {
          id: getId(1)[0],
          isTemp: true,
          type,
          defName: `${typeMaps[type].data.defName}_${count}`,
          defKey: `${typeMaps[type].data.defKey}_${count}`,
          fields,
        });
      };
      if(type === 'P') {
        const physicEntityPresetFields = getCurrentDataSource()?.profile?.project
            ?.setting?.physicEntityPresetFields || [];
        getIdAsyn(physicEntityPresetFields.length).then((ids) => {
          createDragNode(physicEntityPresetFields.map((f, i) => {
            return {
              ...f,
              id: ids[i],
            };
          }));
        });
      } else {
        createDragNode([]);
      }
    };
    const iconMaps = {
        P: 'icon-diagram-er-table',
        L: 'icon-diagram-er-logic',
        C: 'icon-diagram-er-concept',
    };
    return <div className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-expand`]: expand,
        [`${currentPrefix}-hidden`]: isHidden,
    })}>
      <Tooltip title='容器' force placement='right'>
        <span onMouseDown={e => startDrag(e, 'group')}>
          <Icon style={{width: 28}} type='icon-container'/>
        </span>
      </Tooltip>
      <span className={`${currentPrefix}-line`}/>
      <Tooltip title={`创建${typeMaps[type].data.defName}`} force placement='right'>
        <span onMouseDown={e => createTempEntity(e)}>
          <Icon type={iconMaps[type]}/>
        </span>
      </Tooltip>
      <Tooltip mouseLeaveDelay={200} closeArrow offsetLeft={10} title={<EdgeList er/>} force placement='right'>
        <span>
          <Icon type='icon-er-one-to-many'/>
        </span>
      </Tooltip>
      <Tooltip mouseLeaveDelay={200} closeArrow offsetLeft={10} title={<ShapeList/>} force placement='right'>
        <span>
          <Icon type='icon-shape-general'/>
        </span>
      </Tooltip>
      <Tooltip closeArrow offsetLeft={10} title={<EdgeList/>} force placement='right'>
        <span>
          <Icon type='icon-arrow-right-upper'/>
        </span>
      </Tooltip>
      <Tooltip title='Markdown' force placement='right'>
        <span onMouseDown={e => startDrag(e, 'markdown-node')}>
          <Icon type='icon-editor-markdown'/>
        </span>
      </Tooltip>
      <Tooltip title='便签' force placement='right'>
        <span onMouseDown={e => startDrag(e, 'notes')}>
          <Icon type='icon-editor-note'/>
        </span>
      </Tooltip>
      <Tooltip title='文字' force placement='right'>
        <span onMouseDown={e => startDrag(e, 'text')}>
          <Icon type='icon-textbox'/>
        </span>
      </Tooltip>
      <span className={`${currentPrefix}-line`}/>
      <span onClick={() => setExpand(!expand)}>
        <Icon type='icon-double-arrow-left'/>
      </span>
    </div>;
}));
