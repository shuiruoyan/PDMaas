import React, {useState, useRef, useEffect} from 'react';
import { Icon, Tooltip, Button, Switch, NumberInput} from 'components';
import * as colorTool from '../../../../../lib/color';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import CustomerColor from './CustomerColor';
import {getNodeDefaultAttrs, isConceptEntitySimple, isEntityNode} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');
const ButtonGroup = Button.ButtonGroup;

const Stroke =  ({onStrokeChange, onOpacityChange, onDasharrayChange,
                     onWidthChange, updateStore ,defaultValue, hasWidth, defaultStroke}) => {
    const [stroke, setStroke] = useState(defaultValue.stroke);
    const [opacity, setOpacity] = useState(defaultValue.opacity || 1);
    const [dasharray, setDasharray] = useState(defaultValue.dasharray || '0');
    const [width, setWidth] = useState(defaultValue.width || 1);
    const strokeRef = useRef(defaultValue.stroke);

    const [presetColors, setPresetColors] = useState(colorTool.getPresetClassicalColors());
    const _onStrokeChange = (color) => {
        setStroke(color);
        strokeRef.current = color;
        onStrokeChange && onStrokeChange(color);
        colorTool.setPresetColors(color);
    };

    const _onDasharrayChange = (value) => {
        setDasharray(value);
        onDasharrayChange && onDasharrayChange(value);
    };

    const _onStrokeStatusChange = (checked) => {
        const getStroke = () => {
            if(checked) {
                return strokeRef.current === 'none' ? defaultStroke : strokeRef.current;
            }
            return 'none';
        };
        const tempStroke =  getStroke();
        updateStore('stroke', tempStroke);
        setStroke(tempStroke);
    };

    const _onWidthChange = (value) => {
        setWidth(value);
        onWidthChange && onWidthChange(value);
    };

    const _onOpacityChange = (value) => {
        setOpacity(value);
        onOpacityChange && onOpacityChange(value);
    };

    return <div className={`${currentPrefix}-detail-fill`}>
      <div className={`${currentPrefix}-detail-fill-item`}>
        <span>
          <span>展示边框</span>
          <span><Switch checked={stroke !== 'none'} onChange={_onStrokeStatusChange}/></span>
        </span>
        <span/>
      </div>
      {stroke !== 'none' && <>
        <div className={`${currentPrefix}-detail-fill-item`}>
          <span>
            <span>边框样式</span>
          </span>
          <span className={`${currentPrefix}-detail-fill-item-list`}>
            <span
              className={classesMerge({
                    [`${currentPrefix}-detail-fill-item-list-active`]: dasharray === '0',
                })}
              onClick={() => _onDasharrayChange('0')}>
              <Icon type="icon-line-real"/>
            </span>
            <span
              className={classesMerge({
                    [`${currentPrefix}-detail-fill-item-list-active`]: dasharray === '2',
                })}
              onClick={() => _onDasharrayChange('2')}>
              <Icon type="icon-line-dotted"/>
            </span>
            <span
              className={classesMerge({
                    [`${currentPrefix}-detail-fill-item-list-active`]: dasharray === '5, 2',
                })}
              onClick={() => _onDasharrayChange('5, 2')}>
              <Icon type="icon-line-dashed"/>
            </span>
          </span>
        </div>
        <div className={`${currentPrefix}-detail-fill-item`}>
          <span>
            {hasWidth && <span>
                边框粗细
              <span
                style={{width: 50}}
                className={`${currentPrefix}-detail-cell`}
              >
                <NumberInput
                  max={100}
                  min={1}
                  value={parseInt(width, 10)}
                  onChange={e => _onWidthChange(e.target.value)}
                />
              </span>
            </span>
            }
            <span>
                不透明度
              <span className={`${currentPrefix}-detail-cell`}>
                <NumberInput
                  max={100}
                  min={0}
                  value={parseInt(opacity * 100, 10)}
                  onChange={e => _onOpacityChange(e.target.value / 100)}
                />
              </span>
                %
            </span>
          </span>
        </div>
        <div className={`${currentPrefix}-detail-fill-item`}>
          <span>
            <span>
              <span>边框颜色</span>
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
              <CustomerColor onChange={_onStrokeChange}/>
            </span>
          </span>
          <span className={`${currentPrefix}-detail-fill-color-container`}>{
                  presetColors.map((c) => {
                      return <span
                        onClick={() => _onStrokeChange(c)}
                        className={classesMerge({
                              [`${currentPrefix}-detail-fill-color`]: true,
                              [`${currentPrefix}-detail-fill-color-notColor`]: c === 'rgba(0, 0, 0, 0)',
                              [`${currentPrefix}-detail-fill-color-active`]: stroke === c,
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
                            onClick={() => _onStrokeChange(c)}
                            className={`${currentPrefix}-detail-fill-color`}
                            key={c}
                            style={{background: c}}/>;
                      })
              }</span>
        </div>
      </>}
    </div>;
};

export default React.memo(({
                               cell, hasWidth = true,
                               styleName, getCurrentDataSource, defaultData,
                           }) => {
    const getDefaultStroke = () => {
        const getCurrentRelationProps = () => {
            return (getCurrentDataSource().project?.diagrams || [])
                .find(d => d.id === defaultData.id).props;
        };
        const props = getCurrentRelationProps();
        return getNodeDefaultAttrs('shapeGeneral', props)?.body?.stroke || '';
    };
    const attrName = cell.isEdge() ? 'line' : 'body';
    const getCurrentAttrName = (c) => {
        return c.isEdge() ? 'line' : 'body';
    };
    const getStroke = (name) => {
        if (styleName && isEntityNode(cell)) {
            return cell.prop(`entitySetting/${styleName}/${attrName}/${name}`);
        }
        return cell.attr(`${attrName}/${name}`);
    };


    const getOpacity = () => {
        const tempOpacity = getStroke('stroke-opacity');
        if (!tempOpacity && tempOpacity !== 0) {
            return 1;
        }
        return tempOpacity;
    };

    const getStrokeWidth = () => {
        const tempStrokeWidth = getStroke('stroke-width');
        if(!tempStrokeWidth && tempStrokeWidth !== 0) {
            return 1;
        }
        return tempStrokeWidth;
    };
    const [stroke, setStroke] = useState(getStroke('stroke'));
    const [opacity, setOpacity] = useState(getOpacity());
    const dasharrayRef = useRef(getStroke('stroke-dasharray'));
    // const [dasharray, setDasharray] = useState(getStroke('stroke-dasharray'));
    const widthRef = useRef(getStrokeWidth());

    useEffect(() => {
        const handler = () => {
            setStroke(getStroke('stroke'));
            setOpacity(getOpacity());
        };
        cell.on('change:entitySetting', handler);
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);
    const updateStore = (name, value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells();
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                if(isEntityNode(c)) {
                    styleName && c.prop(`entitySetting/${styleName}/${getCurrentAttrName(c)}/${name}`, value);
                    if(isConceptEntitySimple(c)) {
                        c.attr(`${getCurrentAttrName(c)}/${name}`, value);
                    }
                } else  {
                    c.attr(`${getCurrentAttrName(c)}/${name}`, value);
                    if(c.isEdge() && name === 'stroke-width') {
                        // 需要更新箭头的粗细
                        c.attr('line/sourceMarker/strokeWidth', value);
                        c.attr('line/targetMarker/strokeWidth', value);
                    }
                    if(c.isEdge() && name === 'stroke-dasharray' && c.prop('relation')) {
                        c.prop('relation', null);
                    }
                }
            });
        });
    };

    // 边框颜色
    const onStrokeChange = (color) => {
        updateStore('stroke', color);
        setStroke(color);
    };
    // 边框透明度
    const onStrokeOpacityChange = (o) => {
        updateStore('stroke-opacity', o);
        setOpacity(o);
    };

    // 边框样式
    const onStrokeDasharrayChange = (style) => {
        updateStore('stroke-dasharray', style);
    };
    // 边框粗细
    const onStrokeWidthChange = (size) => {
        updateStore('stroke-width', size);
    };
    const renderIcon = () => {
        const color = stroke && !stroke.includes('，') ? stroke : null;
        return <span className={`${currentPrefix}-detail-fill-stroke-icon`}>
          <span style={{borderColor: !color ? 'rgba(0,0,0,0)' : color}}/>
        </span>;
    };
    return <Tooltip
      force
      title={<Stroke
        defaultStroke={getDefaultStroke()}
        defaultValue={{stroke, opacity, dasharray:dasharrayRef.current, width: widthRef.current}}
        onStrokeChange={onStrokeChange}
        onWidthChange={onStrokeWidthChange}
        onDasharrayChange={onStrokeDasharrayChange}
        onOpacityChange={onStrokeOpacityChange}
        updateStore={updateStore}
        hasWidth={hasWidth}
      />}>
      {renderIcon()}
    </Tooltip>;
});
