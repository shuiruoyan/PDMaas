import { register } from '@antv/x6-react-shape';
import { Graph } from '@antv/x6';

import PhysicalEntity from './physicalentity';
import PhysicalEntityImg from './physicalentity-img';
import LogicEntityImg from './logicentity-img';
import LogicEntity from './logicentity';
import Markdown from './markdown';
import ConceptEntity from './conceptentity';
import Group from './group';
import Text from './text';
import './edgemarker';
import './highlighting';
import Notes from './notes';
import './conceptentity-shape';
import { getAllow } from './arrow';

Graph.registerNode('arrow_top', getAllow('top'));
Graph.registerNode('arrow_right', getAllow('right'));
Graph.registerNode('arrow_bottom', getAllow('bottom'));
Graph.registerNode('arrow_left', getAllow('left'));
Graph.registerNode('notes', Notes);
Graph.registerNode('text', Text);

register({
    shape: 'physical-entity-node',
    effect: ['data', 'attrs', 'count', 'originData', 'entityDisplay', 'entitySetting'],
    component: PhysicalEntity,
});

register({
    shape: 'physical-entity-node-img',
    effect: ['fieldsData', 'entitySetting'],
    component: PhysicalEntityImg,
});

register({
    shape: 'logic-entity-node',
    effect: ['data', 'attrs', 'isExpand', 'count', 'originData', 'entityDisplay', 'entitySetting'],
    component: LogicEntity,
});

register({
    shape: 'logic-entity-node-img',
    effect: ['fieldsData', 'entitySetting', 'isExpand'],
    component: LogicEntityImg,
});

register({
    shape: 'markdown-node',
    effect: ['attrs'],
    component: Markdown,
});

register({
    shape: 'concept-entity-node',
    effect: ['data', 'attrs', 'size', 'count', 'originData', 'entityDisplay', 'entitySetting'],
    component: ConceptEntity,
});

register({
    shape: 'group',
    effect: ['attrs'],
    component: Group,
});
