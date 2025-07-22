import React, {useRef, useState} from 'react';
import {Checkbox, Input, Slider, NumberInput} from 'components';
import CustomerColor from './CustomerColor';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(({defaultValue, onChange}) => {
    const [waterMark, setWaterMark] = useState(defaultValue);
    const waterMarkRef = useRef();
    waterMarkRef.current = waterMark;
    const _onChange = (data) => {
        const currentData = {...waterMarkRef.current, ...data};
        setWaterMark(currentData);
        onChange(currentData);
    };
    const currentPrefix = getPrefix('container-model-mind-config-base');
    return <div className={`${currentPrefix}-line-item`}>
      <span>
        <span>是否显示水印</span>
        <span>
          <Checkbox
            onChange={e => _onChange({
                  show: e.target.checked,
              })}
            defaultChecked={defaultValue.show}
          />
        </span>
      </span>
      {
            waterMark.show ? <>
              <span>
                <span>是否仅在导出时显示</span>
                <span>
                  <Checkbox
                    onChange={e => _onChange({
                  onlyExport: e.target.checked,
              })}
                    defaultChecked={defaultValue.onlyExport}
          />
                </span>
              </span>
              <span>
                <span>水印文字</span>
                <span style={{width: 87}}>
                  <Input
                    onChange={e => _onChange({
                  text: e.target.value,
              })}
                    defaultValue={defaultValue.text}
          />
                </span>
              </span>
              <span>
                <span>文字颜色</span>
                <span>
                  <CustomerColor
                    onChange={color => _onChange({
                  textStyle: {
                      ...waterMark.textStyle,
                      color,
                  },
              })}
                    defaultValue={defaultValue.textStyle.color}
          />
                </span>
              </span>
              <span>
                <span>文字透明度</span>
                <span style={{width: 145}}>
                  <Slider
                    onChangeComplete={v => _onChange({
                  textStyle: {
                      ...waterMark.textStyle,
                      opacity: v,
                  },
              })}
                    defaultValue={defaultValue.textStyle.opacity}
          />
                </span>
              </span>
              <span>
                <span>文字字号</span>
                <span style={{width: 87}}>
                  <NumberInput
                    onBlur={e => _onChange({
                  textStyle: {
                      ...waterMark.textStyle,
                      fontSize: e.target.value,
                  },
              })}
                    defaultValue={defaultValue.textStyle.fontSize}
          />
                </span>
              </span>
              <span>
                <span>旋转角度</span>
                <span style={{width: 87}}>
                  <NumberInput
                    onBlur={e => _onChange({
                  angle: e.target.value,
              })}
                    defaultValue={defaultValue.angle}
          />
                </span>
              </span>
              <span>
                <span>水印行间距</span>
                <span style={{width: 87}}>
                  <NumberInput
                    onBlur={e => _onChange({
                  lineSpacing: e.target.value,
              })}
                    defaultValue={defaultValue.lineSpacing}
          />
                </span>
              </span>
              <span>
                <span>水印文字间距</span>
                <span style={{width: 87}}>
                  <NumberInput
                    onBlur={e => _onChange({
                  textSpacing: e.target.value,
              })}
                    defaultValue={defaultValue.textSpacing}
          />
                </span>
              </span>
            </> : null
        }
    </div>;
});
