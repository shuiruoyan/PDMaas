import React, { useState,useRef } from 'react';
import Slider from '../slider';
import Button from '../button';
import {classesMerge, getPrefix} from '../../lib/classes';
import './style/index.less';
import * as colorTool from '../../lib/color';
import CustomerColor from '../../app/container/model/relation/celltool/CustomerColor';

export default React.memo(({hasOpacity = true, opacity, color, onChange, close, autoClose}) => {
    const [opacityState, setOpacityState] = useState(opacity || 1);
    const [colorState, setColorState] = useState(color);
    const colorStateRef = useRef();
    colorStateRef.current = colorState;
    const opacityStateRef = useRef();
    opacityStateRef.current = opacityState;
    const currentPrefix = getPrefix('components-presetcolorpicker');

    const [presetColors, setPresetColors] = useState(colorTool.getPresetClassicalColors());
    const ButtonGroup = Button.ButtonGroup;
    const _setColorState = (v) => {
        setColorState(v);
        onChange && onChange([v, opacityStateRef.current]);
        colorTool.setPresetColors(v);
        autoClose && close && close();
    };
    const _setOpacityState = (v) => {
        setOpacityState(v);
        onChange && onChange([colorStateRef.current, v]);
    };
    return <div className={currentPrefix}>
      {
        hasOpacity &&
        <div className={`${currentPrefix}-item`}>
          <span>
            <span>不透明度</span>
            <span>{parseInt(opacityState * 100, 10)}%</span>
          </span>
          <span>
            <Slider
              onChangeComplete={_setOpacityState}
              value={opacityState}
              onChange={_setOpacityState}
        />
          </span>
        </div>
      }
      <div className={`${currentPrefix}-item`}>
        <span>
          <span>
            <span>标准颜色</span>
            <ButtonGroup
              className={`${currentPrefix}-button`}
              onClick={(e, key) => setPresetColors(key === 'major' ?
                    colorTool.getPresetMajorColors() : colorTool.getPresetClassicalColors())}
              defaultActive="classical"
            >
              <Button key="classical">经典</Button>
              <Button key="major">专业</Button>
            </ButtonGroup>
          </span>
          <span>
            <CustomerColor onChange={_setColorState}/>
          </span>
        </span>
        <span className={`${currentPrefix}-color-container`}>{
                presetColors.map((c) => {
                    return <span
                      onClick={() => _setColorState(c)}
                      className={classesMerge({
                            [`${currentPrefix}-color`]: true,
                            [`${currentPrefix}-color-notColor`]: c === 'rgba(0, 0, 0, 0)',
                            [`${currentPrefix}-color-active`]: colorState === c,
                        })}
                      key={c}
                      style={{background: c}} />;
                })
            }</span>
      </div>
      <div className={`${currentPrefix}-item`}>
        <span>
          <span>最近颜色</span>
        </span>
        <span className={`${currentPrefix}-color-container`}>{
                colorTool.getPresetColors()
                    .map((c) => {
                        return <span
                          onClick={() => _setColorState(c)}
                          className={`${currentPrefix}-color`}
                          key={c}
                          style={{background: c}}/>;
                    })
            }</span>
      </div>
    </div>;
});
