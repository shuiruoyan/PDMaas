import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {isJumpOverEdge} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');

export default React.memo(({ cell }) => {

    const [isJumpOver, setIsJumpOver] = useState(() => {
        return isJumpOverEdge(cell);
    });

    const updateJumpOver = () => {
        const graph = cell.model.graph;
        const selectedEdges = graph.getSelectedCells()
            .filter(c => c.isEdge());
        graph.batchUpdate(() => {
            selectedEdges.forEach((e) => {
                const name = e.getConnector()?.name || e.getConnector() || 'normal';
                const radius = e.getConnector()?.args?.radius || 0;
                if(name !== 'jumpover') {
                    e.setConnector({
                        name: 'jumpover',
                        args: {
                            radius: name === 'normal' ? 0 : 10,
                        },
                    });
                } else {
                    e.setConnector({
                        name: radius === 0 ? 'normal' : 'rounded',
                        args: {
                            radius,
                        },
                    });
                }
            });
        });
        setIsJumpOver(p => !p);
    };
    useEffect(() => {
        const handler = () => {
            setIsJumpOver(isJumpOverEdge(cell));
        };
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);

    return <Tooltip
      force
      placement='top'
      title={isJumpOver ? '跳线开启' : '跳线关闭'}
    >
      <span className={`${currentPrefix}-jump-over-${isJumpOver ? 'start' : 'end'}`}>
        <Icon onClick={updateJumpOver} type='icon-line-jump'/>
      </span>
    </Tooltip>;

});
