import React, {useEffect, useState} from 'react';
import {Slider, Tooltip, Button} from 'components';
import * as colorTool from '../../../../../lib/color';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {isConceptEntitySimple, isEntityNode} from '../util/celltools';
import CustomerColor from './CustomerColor';

const ButtonGroup = Button.ButtonGroup;

const currentPrefix = getPrefix('container-model-relation-celltool');

const Fill = ({onFillChange, onOpacityChange, defaultValue}) => {
    const [opacity, setOpacity] = useState(defaultValue.opacity);
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
          <span>不透明度</span>
          <span>{parseInt(opacity * 100, 10)}%</span>
        </span>
        <span>
          <Slider
            onChangeComplete={onOpacityChange}
            value={opacity}
            onChange={setOpacity}
         />
        </span>
      </div>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>
            <span>标准颜色</span>
            <ButtonGroup
              className={`${currentPrefix}-detail-button`}
              onClick={(e, key) => setPresetColors(key === 'major' ?
                      colorTool.getPresetMajorColors() : colorTool.getPresetClassicalColors())}
              defaultActive='classical'
              >
              <Button key='classical'>经典</Button>
              <Button key='major'>专业</Button>
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
                            [`${currentPrefix}-detail-fill-color-notColor`]: c === 'rgba(0, 0, 0, 0)',
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
                colorTool.getPresetColors().map((c) => {
                    return <span onClick={() => _onFillChange(c)} className={`${currentPrefix}-detail-fill-color`} key={c} style={{background: c}}/>;
                })
            }</span>
      </div>
    </div>;
};

export default React.memo(({cell, styleName}) => {
    const getFill = (name) => {
        if(cell.shape === 'edge') {
            return cell.getLabels()[0]?.attrs?.body?.[name];
        } else if(styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/body/${name}`);
        }
        return cell.attr(`body/${name}`);
    };
    const getOpacity = () => {
        const tempOpacity = getFill('fill-opacity');
        if(!tempOpacity && tempOpacity !== 0) {
            return 1;
        }
        return tempOpacity;
    };
    const [opacity, setOpacity] = useState(getOpacity());
    const [fill, setFill] = useState(getFill('fill'));
    useEffect(() => {
        const handler = () => {
            setFill(getFill('fill'));
            setOpacity(getOpacity());
        };
        cell.on('change:labels', handler);
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);
    const updateFill = (name, value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                if(c.isEdge()) {
                    const currentLabel = c.getLabels()[0]?.attrs;
                    c.setLabels([{
                        attrs: {
                            ...currentLabel,
                            body: {
                                ...currentLabel?.body,
                                [name]: value,
                            },
                        },
                    }]);
                } else if(isEntityNode(c)) {
                    styleName && c.prop(`entitySetting/${styleName}/body/${name}`, value);
                    if(isConceptEntitySimple(c)) {
                        c.attr(`body/${name}`, value);
                    }
                } else  {
                    c.attr(`body/${name}`, value);
                }
            });
        });
    };
    const onFillChange = (color) => {
        updateFill('fill', color);
        setFill(color);
    };
    const onOpacityChange = (o) => {
        updateFill('fill-opacity', o);
    };
    const renderIcon = () => {
        const color = (fill && !fill.includes('，')) ? fill : null;
        return <span className={`${currentPrefix}-detail-fill-icon`}>
          <span style={{borderColor: !color ? 'rgba(0,0,0,0)' : color}}/>
        </span>;
    };
    return <Tooltip
      force
      title={<Fill
        defaultValue={{fill, opacity}}
        onFillChange={onFillChange}
        onOpacityChange={onOpacityChange}
        />}>
      {renderIcon()}
    </Tooltip>;
});
