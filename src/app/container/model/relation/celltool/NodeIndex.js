import React from 'react';
import { Icon, Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';


const currentPrefix = getPrefix('container-model-relation-celltool');

const NodeIndex = ({updateIndex, close}) => {
    const _updateIndex = (...args) => {
        updateIndex && updateIndex(...args);
        close && close();
    };
    return <div className={`${currentPrefix}-detail-font-size`}>
      <span
        onClick={() => _updateIndex('up')}
      >
        <span>
          <Icon type="icon-zindex-up"/>
        </span>
        <span>
          上移一层
        </span>
      </span>
      <span
        onClick={() => _updateIndex('down')}
        >
        <span>
          <Icon type="icon-zindex-down"/>
        </span>
        <span>
          下移一层
        </span>
      </span>
      <span
        onClick={() => _updateIndex('bottom')}
        >
        <span>
          <Icon type="icon-zindex-bottom-copy"/>
        </span>
        <span>
          置底
        </span>
      </span>
      <span
        onClick={() => _updateIndex('top')}
        >
        <span>
          <Icon type="icon-zindex-top-copy"/>
        </span>
        <span>
          置顶
        </span>
      </span>
    </div>;
};

export default React.memo(({cell}) => {

    const updateIndex = (type) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells()
            .filter(c => c.isNode());
        graph.batchUpdate(() => {
            selectedCells
                .forEach((c) => {
                    const index = c.getZIndex();
                    switch (type) {
                        case 'up':
                            c.setZIndex(index + 1);
                            break;
                        case 'down':
                            c.setZIndex(index - 1);
                            break;
                        case 'top':
                            c.toFront();
                            break;
                        case 'bottom':
                            c.toBack();
                            break;
                        default:
                            break;
                    }
                });
        });
    };
    return <Tooltip
      force
      title={<NodeIndex
        updateIndex={updateIndex}
      />}
    >
      <span>
        <Icon type='icon-zindex'/>
      </span>
    </Tooltip>;
});
