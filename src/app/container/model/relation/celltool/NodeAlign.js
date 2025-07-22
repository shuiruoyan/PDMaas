import React from 'react';
import { Icon, Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';

const currentPrefix = getPrefix('container-model-relation-celltool');

const NodeAlign = ({updateAnchor}) => {
    return <div className={`${currentPrefix}-detail-font-align`}>
      <div>
        <span
          onClick={() => updateAnchor('h', 'start')}><Icon type="icon-align-left"/></span>
        <span
          onClick={() => updateAnchor('h', 'middle')}><Icon
            type="icon-distrib-vertical"/></span>
        <span
          onClick={() => updateAnchor('h', 'end')}><Icon type="icon-align-right"/></span>
      </div>
      <div>
        <span
          onClick={() => updateAnchor('v', 'start')}><Icon type="icon-valign-top"/></span>
        <span
          onClick={() => updateAnchor('v', 'middle')}><Icon type="icon-valign-middle"/></span>
        <span
          onClick={() => updateAnchor('v', 'end')}><Icon type="icon-valign-bottom"/></span>
      </div>
    </div>;
};

export default React.memo(({cell}) => {

    const updateAnchor = (name, value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells()
            .filter(c => c.isNode());
        const positionSize = selectedCells.map((c) => {
            return {
                ...c.position(),
                ...c.size(),
            };
        });
        graph.batchUpdate(() => {
            if (name === 'h') {
                const pX = positionSize.map(p => p.x);
                const minX = Math.min(...pX);
                const pXW = positionSize.map(p => p.x + p.width);
                const maxX = Math.max(...pXW);
                if (value === 'start') {
                    // 左对齐
                    selectedCells.forEach((c) => {
                        c.position(minX, c.position().y);
                    });
                } else if(value === 'middle') {
                    // 水平对齐
                    const offsetX = (maxX - minX) / 2 + minX;
                    selectedCells.forEach((c) => {
                        c.position(offsetX - c.size().width / 2, c.position().y);
                    });
                } else {
                    // 右对齐
                    selectedCells.forEach((c) => {
                        c.position(maxX - c.size().width, c.position().y);
                    });
                }
            } else if(name === 'v'){
                const pY = positionSize.map(p => p.y);
                const minY = Math.min(...pY);
                const pYH = positionSize.map(p => p.y + p.height);
                const maxY = Math.max(...pYH);
                if(value === 'start') {
                    // 顶部对齐
                    selectedCells.forEach((c) => {
                        c.position(c.position().x, minY);
                    });
                } else if(value === 'middle') {
                    // 垂直对齐
                    const offsetY = (maxY - minY) / 2 + minY;
                    selectedCells.forEach((c) => {
                        c.position(c.position().x, offsetY - c.size().height / 2);
                    });
                } else {
                    // 底部对齐
                    selectedCells.forEach((c) => {
                        c.position(c.position().x, maxY - c.size().height);
                    });
                }
            }
        });
    };
    return <Tooltip
      force
      title={<NodeAlign
        updateAnchor={updateAnchor}
      />}
    >
      <span>
        <Icon type='icon-align-center'/>
      </span>
    </Tooltip>;
});
