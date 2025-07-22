import React, { forwardRef, useImperativeHandle } from 'react';
import { getPrefix } from '../../../../../../lib/classes';
import './style/index.less';
import {isEntityNode} from '../../util/celltools';

export default React.memo(forwardRef(({ opt, renderDetail, cell }, ref) => {
    const currentPrefix = getPrefix('container-model-relation-celltool-model');
    const optsTitle = ['边框和填充', '颜色', '对象布局', '形状大小', '增强'];
    useImperativeHandle(ref, () => {
        return {

        };
    }, []);
    const selectedCells = cell.model.graph.getSelectedCells();
    const edge = selectedCells.find(c => c.isEdge());
    const entityNode = selectedCells.find(c => c.isNode() && isEntityNode(c));
    const node = selectedCells.find(c => c.isNode() && !isEntityNode(c)) || edge || cell;
    const cells = [node, edge, entityNode];
    return <div className={`${currentPrefix}-item-group`}>
      {
          opt.map((tool,i) => {
                return tool.length > 0 && <div
                  key={i}
                  className={`${currentPrefix}-item`}>
                  <div className={`${currentPrefix}-item-title`}>
                    {optsTitle[i]}
                  </div>
                  <div className={`${currentPrefix}-item-body`}>
                    {
                        tool.map((icon, index) => {
                            return <div
                              key={index}
                            >{renderDetail(icon, null, cells)}
                            </div>;
                        })
                    }
                  </div>
                </div>;
            })
        }
    </div>;
}));
