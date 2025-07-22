import React, { useState, useRef } from 'react';
import Icon from '../icon';
import Switch from '../switch';
import {classesMerge, getPrefix} from '../../lib/classes';
import './style/index.less';
import * as colorTool from '../../lib/color';
import Button from '../button';
import CustomerColor from '../../app/container/model/relation/celltool/CustomerColor';
import NumberInput from '../numberinput';

export default React.memo(({opacity, color, width,
                               dasharray, onChange, hasWidth = true}) => {
    const [stroke, setStroke] = useState(true);
    const [dasharrayState, setDasharrayState] = useState(dasharray || '0');
    const dasharrayStateRef = useRef();
    dasharrayStateRef.current = dasharrayState;
    const [widthState, setWidthState] = useState(width || 1);
    const widthStateRef = useRef();
    widthStateRef.current = widthState;
    const [opacityState, setOpacityState] = useState(opacity || 1);
    const opacityStateRef = useRef();
    opacityStateRef.current = opacityState;
    const [colorState, setColorState] = useState(color);
    const colorStateRef = useRef();
    colorStateRef.current = colorState;


    const [presetColors, setPresetColors] = useState(colorTool.getPresetClassicalColors());
    const ButtonGroup = Button.ButtonGroup;
    const currentPrefix = getPrefix('components-presetstroke');

    const onStrokeStatusChange = (checked) => {
        setStroke(checked);
    };

    const _setDasharrayState = (v) => {
        setDasharrayState(v);
        onChange && onChange([colorStateRef.current, opacityStateRef.current, v,
            widthStateRef.current]);
    };
    const _setWidthState = (v) => {
        setWidthState(v);
        onChange && onChange([colorStateRef.current, opacityStateRef.current,
            dasharrayStateRef.current, v]);
    };
    const _setColorState = (v) => {
        setColorState(v);
        onChange && onChange([v, opacityStateRef.current, dasharrayStateRef.current,
            widthStateRef.current]);
        colorTool.setPresetColors(v);
    };
    const _setOpacityState = (v) => {
        setOpacityState(v);
        onChange && onChange([colorStateRef.current, v, dasharrayStateRef.current,
            widthStateRef.current]);
    };
    return <div className={`${currentPrefix}-fill`}>
      <div className={`${currentPrefix}-fill-item`}>
        <span>
          <span>展示边框</span>
          <span><Switch checked={stroke} onChange={onStrokeStatusChange}/></span>
        </span>
        <span/>
      </div>
      {stroke && <>
        <div className={`${currentPrefix}-fill-item`}>
          <span>
            <span>边框样式</span>
          </span>
          <span className={`${currentPrefix}-fill-item-list`}>
            <span
              className={classesMerge({
                    [`${currentPrefix}-fill-item-list-active`]: dasharrayState === '0',
                })}
              onClick={() => _setDasharrayState('0')}>
              <Icon type='icon-line-real'/>
            </span>
            <span
              className={classesMerge({
                    [`${currentPrefix}-fill-item-list-active`]: dasharrayState === '2',
                })}
              onClick={() => _setDasharrayState('2')}>
              <Icon type='icon-line-dotted'/>
            </span>
            <span
              className={classesMerge({
                    [`${currentPrefix}-fill-item-list-active`]: dasharrayState === '5, 2',
                })}
              onClick={() => _setDasharrayState('5, 2')}>
              <Icon type='icon-line-dashed'/>
            </span>
          </span>
        </div>
        <div className={`${currentPrefix}-fill-item`}>
          <span>
            {
                hasWidth && <span>
                    边框粗细
                  <span className={`${currentPrefix}-cell`}>
                    <NumberInput
                      max={100}
                      min={1}
                      value={parseInt(widthState, 10)}
                      onChange={e => _setWidthState(e.target.value)}
                    />
                  </span>
                </span>
            }
            <span>
                不透明度
              <span className={`${currentPrefix}-cell`}>
                <NumberInput
                  max={100}
                  min={0}
                  value={parseInt(opacityState * 100, 10)}
                  onChange={e => _setOpacityState(e.target.value / 100)}
                />
              </span>
                %
            </span>
          </span>
        </div>
        <div className={`${currentPrefix}-fill-item`}>
          <span>
            <span>
              <span>标准颜色</span>
              <ButtonGroup
                className={`${currentPrefix}-button`}
                onClick={(e, key) => setPresetColors(key === 'major' ?
                    colorTool.getPresetMajorColors() : colorTool.getPresetClassicalColors())}
                defaultActive='classical'
            >
                <Button key='classical'>经典</Button>
                <Button key='major'>专业</Button>
              </ButtonGroup>
            </span>
            <span>
              <CustomerColor onChange={_setColorState}/>
            </span>
          </span>
          <span className={`${currentPrefix}-fill-color-container`}>{
                  presetColors.map((c) => {
                      return <span
                        onClick={() => _setColorState(c)}
                        className={classesMerge({
                              [`${currentPrefix}-fill-color`]: true,
                              [`${currentPrefix}-fill-color-notColor`]: c === 'rgba(0, 0, 0, 0)',
                              [`${currentPrefix}-fill-color-active`]: colorState === c,
                          })}
                        key={c}
                        style={{background: c}}/>;
                  })
              }</span>
        </div>
        <div className={`${currentPrefix}-fill-item`}>
          <span>
            <span>最近颜色</span>
          </span>
          <span className={`${currentPrefix}-fill-color-container`}>{
              colorTool.getPresetColors()
                      .map((c) => {
                          return <span
                            className={`${currentPrefix}-fill-color`}
                            key={c}
                            style={{background: c}}/>;
                      })
              }</span>
        </div>
      </>}
    </div>;
});
