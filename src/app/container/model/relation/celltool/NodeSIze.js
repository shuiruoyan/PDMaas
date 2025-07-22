import React, {useRef, useState} from 'react';
import {NumberInput, Icon, Switch, Tooltip} from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isEntityNode} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');

const NodeSize = ({cell}) => {
    const disableAutoSize = useRef(false);
    const graph = cell.model.graph;
    const checkAutoSize = (c) => {
      return c.prop('cellType') === 'logic-entity-node'
          || c.prop('cellType') === 'physical-entity-node';
    };
    const checkRx = (c) => {
        return isEntityNode(c) || c.prop('cellType') === 'group'
            || c.prop('cellType') === 'rect'
            || c.prop('cellType') === 'round'
            || c.prop('cellType') === 'markdown-node';
    };
    const disableRx = !graph.getSelectedCells().some(c => checkRx(c));
    const [autoSize, setAutoSize] = useState(() => {
        const autoSizeCells = graph.getSelectedCells()
            .filter(c => checkAutoSize(c));
        if(autoSizeCells.length > 0) {
            return autoSizeCells[0].prop('autoSize');
        }
        disableAutoSize.current = true;
        return false;
    });
    const [lock, setLock] = useState(false);
    const [size, setSize] = useState(() => {
        const rx = cell.attr('body/rx');
        const currentSize = cell.size();
        return {
            ...currentSize,
            rx,
            proportion: currentSize.width / currentSize.height,
        };
    });
    const onSizeChange = (e, name) => {
        const value = e.target.value || (name === 'rx' ? 0 : 10);

        graph.batchUpdate(() => {
            const selectedCells = graph.getSelectedCells()
                .filter(c => c.isNode());
            let preSize = cell.size();
            if(name !== 'rx') {
                if(lock) {
                    if(name === 'width') {
                        preSize = {
                            width: value,
                            height: value / size.proportion,
                        };
                    } else {
                        preSize = {
                            height: value,
                            width: value * size.proportion,
                        };
                    }
                } else {
                    preSize = {
                        ...preSize,
                        [name]: value,
                    };
                }
                setSize((p) => {
                    return {
                        ...p,
                        ...preSize,
                    };
                });
            }
            selectedCells.forEach((c) => {
                if(name === 'rx') {
                    if(checkRx(c)) {
                        c.attr('body/rx', value);
                        c.attr('body/ry', value);
                    }
                } else {
                    if(checkAutoSize(c)) {
                        // 只有物理模型和逻辑模型有自适应的功能
                        c.prop('autoSize', false);
                    }
                    c.size(preSize.width, preSize.height);
                }
            });
        });
    };
    const autoSizeChange = (checked) => {
        setAutoSize(checked);
        graph.batchUpdate(() => {
            const selectedCells = graph.getSelectedCells()
                .filter(c => c.isNode());
            selectedCells.forEach((c) => {
                if (checkAutoSize(c)) {
                    c.prop('autoSize', checked);
                }
            });
        });
    };
    return <div className={`${currentPrefix}-detail-node-size`}>
      <span>
        <span>自适应</span>
        <span>
          <Switch disable={disableAutoSize.current} onChange={autoSizeChange} checked={autoSize}/>
        </span>
      </span>
      {!autoSize && <span>
        <span className={`${currentPrefix}-detail-node-size-input`}>
          <span>
            <span className={`${currentPrefix}-detail-node-size-input-label`}>宽度</span>
            <span>
              <NumberInput
                onChange={e => onSizeChange(e, 'width')}
                value={size.width}/>
            </span>
          </span>
          <span>
            <span className={`${currentPrefix}-detail-node-size-input-label`}>高度</span>
            <span>
              <NumberInput
                onChange={e => onSizeChange(e, 'height')}
                value={size.height}/>
            </span>
          </span>
        </span>
        <span>
          <Icon
            onClick={() => setLock(!lock)}
            className={classesMerge({
                  [`${currentPrefix}-detail-node-size-lock`]: lock,
              })}
            type='icon-width-height-lock'
          />
        </span>
        </span>}
      {!disableRx && <span>
        <span className={`${currentPrefix}-detail-node-size-input-label`}>
          圆角
        </span>
        <span>
          <NumberInput
            onChange={e => onSizeChange(e, 'rx')}
            value={size.rx}/>
        </span>
        </span>}
    </div>;
};

export default React.memo(({cell}) => {

    return <Tooltip
      force
      title={<NodeSize
        cell={cell}
      />}
    >
      <span>
        <Icon type='icon-width-height-set'/>
      </span>
    </Tooltip>;
});
