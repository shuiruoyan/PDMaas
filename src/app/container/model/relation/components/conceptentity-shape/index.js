import { Graph } from '@antv/x6';

import Circle from './circle';
import Diamond from './diamond';

Graph.registerNode('concept-entity-node-circle', Circle);
Graph.registerNode('concept-entity-node-diamond', Diamond);
