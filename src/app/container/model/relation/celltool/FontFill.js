import React, {useEffect, useState} from 'react';
import { Icon, Tooltip, Button } from 'components';
import * as colorTool from '../../../../../lib/color';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';
import CustomerColor from './CustomerColor';

const currentPrefix = getPrefix('container-model-relation-celltool');
const ButtonGroup = Button.ButtonGroup;

const FontFill = ({onFillChange, defaultValue}) => {
    const [fill, setFill] = useState(defaultValue.fill);

    const [presetColors, setPresetColors] = useState(colorTool.getPresetClassicalColors());
    const _onFillChange = (color) => {
        setFill(color);
        onFillChange && onFillChange(color);
        colorTool.setPresetColors(color);
    };
    return <div className={`${currentPrefix}-detail-fill`}>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>
            <span>标准颜色</span>
            <ButtonGroup
              className={`${currentPrefix}-detail-button`}
              onClick={(e, key) => setPresetColors(key === 'major' ?
                      colorTool.getPresetMajorColors() : colorTool.getPresetClassicalColors())}
              defaultActive="classical"
              >
              <Button key="classical">经典</Button>
              <Button key="major">专业</Button>
            </ButtonGroup>
          </span>
          <span>
            <CustomerColor onChange={_onFillChange}/>
          </span>
        </span>
        <span className={`${currentPrefix}-detail-fill-color-container`}>{
              presetColors.map((c) => {
                  return <span
                    onClick={() => _onFillChange(c)}
                    className={classesMerge({
                          [`${currentPrefix}-detail-fill-color`]: true,
                          [`${currentPrefix}-detail-fill-color-active`]: fill === c,
                      })}
                    key={c}
                    style={{background: c}}/>;
              })
          }</span>
      </div>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>最近颜色</span>
        </span>
        <span className={`${currentPrefix}-detail-fill-color-container`}>{
                colorTool.getPresetColors()
                    .map((c) => {
                        return <span
                          onClick={() => _onFillChange(c)}
                          className={`${currentPrefix}-detail-fill-color`}
                          key={c}
                          style={{background: c}}/>;
                    })
            }</span>
      </div>
    </div>;
};

export default React.memo(({
                               cell,
                               styleName,
                           }) => {
    const getFill = (name) => {
        if (cell.isEdge()) {
            return cell.getLabels()[0]?.attrs?.label?.[name];
        } else if(styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/text/${name}`);
        }
        return cell.attr(`text/${name}`);
    };
    const updateFill = (name, value) => {
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
                                fill: value,
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
    };
    const [fill, setFill] = useState(getFill('fill'));

    useEffect(() => {
        const handler = () => {
            setFill(getFill('fill'));
        };
        cell.on('change:labels', handler);
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);
    const onFillChange = (color) => {
        updateFill('fill', color);
        setFill(color);
    };
    return <Tooltip
      force
      title={<FontFill
        defaultValue={{fill}}
        onFillChange={onFillChange}
        />}>
      <span>
        <Icon
          style={{color: fill}}
          type='icon-font-color'
          />
      </span>
    </Tooltip>;
});
