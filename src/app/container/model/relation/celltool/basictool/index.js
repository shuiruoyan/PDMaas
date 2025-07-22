import React, { forwardRef, useImperativeHandle } from 'react';
import './style/index.less';
import {classesMerge, getPrefix} from '../../../../../../lib/classes';
import {isEntityNode} from '../../util/celltools';

export default React.memo(forwardRef(({ opt, cell, lock, renderDetail }, ref) => {
    const currentPrefix = getPrefix('container-model-relation-celltool-basictool');
    useImperativeHandle(ref, () => {
        return {

        };
    }, []);
    const finalOpt = opt.map(o => o.filter((p) => {
        if (lock) {
            // 如果是锁定状态 所有图标不可用
            return p === 'lock';
        }
        return true;
    })).filter(o => o.length > 0);
    const selectedCells = cell.model.graph.getSelectedCells();
    const edge = selectedCells.find(c => c.isEdge());
    const node = selectedCells.find(c => c.isNode() && !isEntityNode(c)) || edge;
    const cells = [node, edge];
    return <div className={`${currentPrefix}`}>
      {
            opt.map(o => o.filter((p) => {
                if (lock) {
                    // 如果是锁定状态 所有图标不可用
                    return p === 'lock';
                }
                return true;
            })).filter(o => o.length > 0).map((o, i) => {
                    return <div key={i} className={`${currentPrefix}-item-group`}>
                      {
                            o.map(p => <span className={`${currentPrefix}-item`} key={p}>
                              {renderDetail(p, null, cells)}
                            </span>)
                        }
                      {i !== finalOpt.length - 1 && <div className={classesMerge({
                          [`${currentPrefix}-line`]: true,
                          [`${currentPrefix}-item`]: true,
                      })}/>}
                    </div>;
                })
        }
    </div>;
}));
