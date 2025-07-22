import React, {useState} from 'react';
import {Button} from 'components';
import * as colorTool from '../../../../../lib/color';
import CustomerColor from '../../relation/celltool/CustomerColor';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

const Color = ({onChange, defaultValue}) => {
    const ButtonGroup = Button.ButtonGroup;
    const currentPrefix = getPrefix('container-model-relation-celltool');
    const [fill, setFill] = useState(defaultValue);

    const [presetColors, setPresetColors] = useState(colorTool.getPresetMajorColors());
    const _onColorChange = (color) => {
        setFill(color);
        onChange && onChange(color);
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
              defaultActive="major"
            >
              <Button key="major">专业</Button>
              <Button key="classical">经典</Button>
            </ButtonGroup>
          </span>
          <span>
            <CustomerColor onChange={_onColorChange}/>
          </span>
        </span>
        <span className={`${currentPrefix}-detail-fill-color-container`}>{
                presetColors.map((c) => {
                    return <span
                      onClick={() => _onColorChange(c)}
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
                          onClick={() => _onColorChange(c)}
                          className={`${currentPrefix}-detail-fill-color`}
                          key={c}
                          style={{background: c}}/>;
                    })
            }</span>
      </div>
    </div>;
};

export default Color;
