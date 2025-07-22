import React, { forwardRef, useState } from 'react';
import {SketchPicker} from 'react-color';
import Icon from '../icon';
import {getPrefix} from '../../lib/classes';

import './style/index.less';

export default React.memo(forwardRef(({onChange, recentColors, defaultColor,
                                          restColor, isSimple, style, closeable, footer,
                                          onClose, presetColors = [], ...restProps}, ref) => {
    const [currentColor, setCurrentColor] = useState(defaultColor);
    const currentPrefix = getPrefix('components-color-picker');
    const _onChange = (color) => {
        setCurrentColor(color.hex);
        onChange && onChange(color);
    };
    const onChangeComplete = (color) => {
       onChange && onChange(color, true);
    };
    const _iconClose = () => {
        onClose && onClose();
    };
    const realValue = 'color' in restProps ? restProps.color : currentColor;
    return <div className={currentPrefix} style={style} ref={ref}>
      {
            closeable && <div className={`${currentPrefix}-header`}>
              颜色选择
              <Icon className={`${currentPrefix}-header-icon`} type='fa-times' onClick={_iconClose}/>
            </div>
      }
      <SketchPicker
        disableAlpha
        presetColors={presetColors}
        color={realValue}
        onChange={_onChange}
        onChangeComplete={onChangeComplete}
        />
      {!isSimple && <div className={`${currentPrefix}-footer`}>
        <div>最近使用的颜色</div>
        <div>
          {
                    recentColors.map((r) => {
                        return <div
                          onClick={() => onChange({hex: r})}
                          key={r}
                          title={r}
                          style={{background: r}}
                          className={`${currentPrefix}-color-picker-footer-item`}>{}</div>;
                    })
                }
        </div>
        <div><a onClick={() => onChange({hex: restColor})}>恢复默认</a></div>
        </div>}
      {footer}
    </div>;
}));
