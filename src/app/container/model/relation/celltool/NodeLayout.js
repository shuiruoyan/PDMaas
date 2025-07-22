import React from 'react';
import { GridLayout, CircularLayout, DagreLayout } from '@antv/layout';
import { Icon, Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';


const currentPrefix = getPrefix('container-model-relation-celltool');

const NodeLayout = ({updateLayout}) => {
    return <div className={`${currentPrefix}-detail-font-size`}>
      <span
        onClick={() => updateLayout('grid')}
      >
        <span>
          <Icon type='icon-layout-grid'/>
        </span>
        <span>
          网格布局
        </span>
      </span>
      <span
        onClick={() => updateLayout('circle')}
        >
        <span>
          <Icon type='icon-layout-circle'/>
        </span>
        <span>
          环形布局
        </span>
      </span>
      <span
        onClick={() => updateLayout('star')}
        >
        <span>
          <Icon type='icon-layout-star'/>
        </span>
        <span>
          星形布局
        </span>
      </span>
    </div>;
};

export default React.memo(({cell}) => {

    const updateLayout = (type) => {
        const graph = cell.model.graph;
        console.log(graph.toJSON());
        graph.batchUpdate(() => {
            const selectedCells = graph.getSelectedCells();
            const nodes = selectedCells.filter(c => c.isNode()).map(c => ({
                id: c.id,
                size: c.size(),
                position: c.position(),
            }));
            const edges = selectedCells.filter(c => c.isEdge()).map(c => ({
                id: c.id,
                source: c.getSource().cell,
                target: c.getTarget().cell,
            }));
            switch (type) {
                case 'grid':
                    // eslint-disable-next-line no-case-declarations
                    const gridLayout = new GridLayout({
                        type: 'grid',
                    });
                    // eslint-disable-next-line no-case-declarations
                    const gridCells = gridLayout.layout({
                        nodes,
                    });
                    selectedCells.forEach((c) => {
                        if(c.isNode()) {
                            const tempNode = gridCells.nodes.find(t => t.id === c.id);
                            c.position(tempNode.x, tempNode.y);
                        }
                    });
                    break;
                case 'circle':
                    // eslint-disable-next-line no-case-declarations
                    const circularLayout = new CircularLayout({
                            type: 'circular',
                        });
                    // eslint-disable-next-line no-case-declarations
                    const circularCells = circularLayout.layout({
                        nodes,
                    });
                    selectedCells.forEach((c) => {
                        if(c.isNode()) {
                            const tempNode = circularCells.nodes.find(t => t.id === c.id);
                            c.position(tempNode.x, tempNode.y);
                        }
                    });
                    break;
                case 'star':
                    // eslint-disable-next-line no-case-declarations
                    const dagreLayout = new DagreLayout({
                        type: 'dagre',
                        rankdir: 'LR',
                    });
                    // eslint-disable-next-line no-case-declarations
                    const dagreCells = dagreLayout.layout({
                        nodes,
                        edges,
                    });
                    selectedCells.forEach((c) => {
                        if(c.isNode()) {
                            const tempNode = dagreCells.nodes.find(t => t.id === c.id);
                            c.position(tempNode.x, tempNode.y);
                        }
                    });break;
                default: break;
            }
        });
    };
    return <Tooltip
      force
      title={<NodeLayout updateLayout={updateLayout}/>}
    >
      <span>
        <Icon type='icon-layout'/>
      </span>
    </Tooltip>;
});
