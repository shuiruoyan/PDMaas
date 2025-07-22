import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';


const currentPrefix = getPrefix('container-model-relation-celltool');

const FontSize = ({updateSize, defaultValue}) => {
    const [size, setSize] = useState(defaultValue.size || 14);
    const _updateSize = (s) => {
        setSize(s);
        updateSize(s);
    };
    const sizeList = [10, 12, 14, 18, 24, 36, 48, 64, 80, 144, 288];
    return <div className={`${currentPrefix}-detail-font-size`}>
      {sizeList.map((s) => {
            return <span
              className={classesMerge({
                    [`${currentPrefix}-detail-font-size-active`]: size === s,
                })}
              key={s}
              onClick={() => _updateSize(s)}
            >
              <span>
                {size === s && <Icon type='icon-check-solid'/>}
              </span>
              <span>
                {s}
              </span>
            </span>;
        })}
    </div>;
};
export default React.memo(({cell, styleName}) => {
    const getFontSize = () => {
        if(cell.isEdge()) {
            return cell.getLabels()[0]?.attrs?.label?.fontSize;
        } else if(styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/text/fontSize`);
        }
        return cell.attr('text/fontSize');
    };
    const [size, setSize] = useState(getFontSize() || 14);
    const updateSize = (value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                if(c.isEdge()) {
                    const currentLabel = c.getLabels()[0]?.attrs;
                    c.setLabelAt(0, {
                        attrs: {
                            ...currentLabel,
                            label: {
                                ...currentLabel?.label,
                                fontSize: value,
                            },
                        },
                    });
                } else if(isEntityNode(c)) {
                    styleName && c.prop(`entitySetting/${styleName}/text/fontSize`, value);
                    if(isConceptEntitySimple(c)) {
                        c.attr('text/fontSize', value);
                    }
                } else {
                    c.attr('text/fontSize', value);
                }
            });
        });
        setSize(value);
    };

    useEffect(() => {
        const handler = () => {
            setSize(getFontSize());
        };
        cell.on('change:labels', handler);
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);

    return<Tooltip
      force
      title={<FontSize
        defaultValue={{size}}
        updateSize={updateSize}
      />}>
      <span>{size}</span>
    </Tooltip>;
});
