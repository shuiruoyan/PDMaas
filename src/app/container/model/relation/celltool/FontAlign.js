import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');

const FontAlign = ({updateTextAnchor, defaultValue}) => {
    const [style, setStyle] = useState(defaultValue.style);
    const _updateTextAnchor = (name, value) => {
        setStyle((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
        updateTextAnchor && updateTextAnchor(name, value);
    };
    return <div className={`${currentPrefix}-detail-font-align`}>
      <div className={`${currentPrefix}-detail-font-align-h`}>
        <span
          className={classesMerge({
                [`${currentPrefix}-detail-font-align-active`]: style.textAnchor === 'end',
            })}
          onClick={() => _updateTextAnchor('textAnchor', 'end')}><Icon
            type="icon-text-align-left"/></span>
        <span
          className={classesMerge({
                    [`${currentPrefix}-detail-font-align-active`]: style.textAnchor === 'middle',
                })}
          onClick={() => _updateTextAnchor('textAnchor', 'middle')}><Icon
            type="icon-text-align-center"/></span>
        <span
          className={classesMerge({
                    [`${currentPrefix}-detail-font-align-active`]: style.textAnchor === 'start',
                })}
          onClick={() => _updateTextAnchor('textAnchor', 'start')}><Icon
            type="icon-text-align-right"/></span>
      </div>
      <div className={`${currentPrefix}-detail-font-align-v`}>
        <span
          className={classesMerge({
                [`${currentPrefix}-detail-font-align-active`]: style.textVerticalAnchor === 'bottom',
            })}
          onClick={() => _updateTextAnchor('textVerticalAnchor', 'bottom')}><Icon
            type="icon-to-top"/></span>
        <span
          className={classesMerge({
                    [`${currentPrefix}-detail-font-align-active`]: style.textVerticalAnchor === 'middle',
                })}
          onClick={() => _updateTextAnchor('textVerticalAnchor', 'middle')}><Icon
            type="icon-to-middle"/></span>
        <span
          className={classesMerge({
                    [`${currentPrefix}-detail-font-align-active`]: style.textVerticalAnchor === 'top',
                })}
          onClick={() => _updateTextAnchor('textVerticalAnchor', 'top')}><Icon
            type="icon-to-bottom"/></span>
      </div>
    </div>;
};

export default React.memo(({cell, styleName}) => {

    const getFont = () => {
        if (cell.isEdge()) {
            return {
                textAnchor: 'middle',
                textVerticalAnchor: 'middle',
                ...cell.getLabels()[0]?.attrs?.label,
            };
        } else if(styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/text`);
        }
        return cell.attr('text');
    };
    const [style, setStyle] = useState(getFont());

    useEffect(() => {
        const handler = () => {
            setStyle(getFont());
        };
        cell.on('change:labels', handler);
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);
    const updateTextAnchor = (name, value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                if (c.isEdge()) {
                    const currentLabel = c.getLabels()[0]?.attrs;
                    c.setLabelAt(0, {
                        attrs: {
                            ...currentLabel,
                            label: {
                                ...currentLabel?.label,
                                [name]: value,
                            },
                        },
                    });
                }  else if(isEntityNode(c)) {
                    styleName && c.prop(`entitySetting/${styleName}/text/fontSize`, value);
                    if(isConceptEntitySimple(c)) {
                        c.attr(`text/${name}`, value);
                    }
                } else {
                    c.attr(`text/${name}`, value);
                }
            });
        });
        setStyle((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
    };
    return <Tooltip
      force
      title={<FontAlign
        defaultValue={{style}}
        updateTextAnchor={updateTextAnchor}
      />}
    >
      <span>
        {/* eslint-disable-next-line no-nested-ternary */}
        <Icon type={`icon-text-align-${(style?.textAnchor || 'middle') === 'middle' ?
              'center' : (style?.textAnchor === 'start' ? 'right' : 'left')}`}/>
      </span>
    </Tooltip>;
});
