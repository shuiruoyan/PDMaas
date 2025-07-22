import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');

const FontStyle = ({updateStyle, defaultValue, cell}) => {
    const [style, setStyle] = useState(defaultValue.style);

    const _updateStyle = (key, value) => {
        setStyle({
            ...style,
            [key]: value,
        });
        updateStyle && updateStyle(key, value);
    };
    return <div className={`${currentPrefix}-detail-font-style`}>
      {
            isEntityNode(cell) || <span
              className={classesMerge({
                    [`${currentPrefix}-detail-font-style-active`]: style['font-weight'] === 'bold',
                })}
              onClick={() => _updateStyle('font-weight', style['font-weight'] === 'bold' ? 'normal' : 'bold')}
            >
              <Icon type="icon-font-bold"/>
            </span>
      }
      <span
        className={classesMerge({
                [`${currentPrefix}-detail-font-style-active`]: style['font-style'] === 'italic',
            })}
        onClick={() => _updateStyle('font-style', style['font-style'] === 'italic' ? 'normal' : 'italic')}>
        <Icon type="icon-font-italics"/>
      </span>
      <span
        className={classesMerge({
                [`${currentPrefix}-detail-font-style-active`]: style['text-decoration'] === 'underline',
            })}
        onClick={() => _updateStyle('text-decoration', style['text-decoration'] === 'underline' ? 'none' : 'underline')}>
        <Icon type='icon-font-underline'/>
      </span>
      <span
        className={classesMerge({
                [`${currentPrefix}-detail-font-style-active`]: style['text-decoration'] === 'line-through',
            })}
        onClick={() => _updateStyle('text-decoration', style['text-decoration'] === 'line-through' ? 'none' : 'line-through')}>
        <Icon type='icon-font-strikethrough'/>
      </span>
    </div>;
};

export default React.memo(({cell, styleName}) => {

    const getStyle = () => {
        if (cell.isEdge()) {
            return cell.getLabels()[0]?.attrs?.label || {};
        } else if(styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/text`);
        }
        return cell.attr('text');
    };
    const [style, setStyle] = useState(getStyle());

    useEffect(() => {
        const handler = () => {
            setStyle(getStyle());
        };
        cell.on('change:labels', handler);
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);
    const updateStyle = (name, value) => {
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
                } else if(isEntityNode(c)) {
                    styleName && c.prop(`entitySetting/${styleName}/text/${name}`, value);
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
      title={
        <FontStyle
          defaultValue={{style}}
          updateStyle={updateStyle}
          cell={cell}
      />}
    >
      <span>
        <Icon
          style={{
                  fontWeight: style?.['font-weight'],
                  fontStyle: style?.['font-style'] ,
                  textDecoration: style?.['text-decoration'] ,
              }}
          type='icon-font-underline'
          />
      </span>
    </Tooltip>;
});
