import React from 'react';
import Slider from 'components/slider';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(({defaultValue, onChange, name = 'padding', max = 100}) => {
    const currentPrefix = getPrefix('container-model-mind-config-base');
    const valueX = `${name}X`;
    const valueY = `${name}Y`;
    return <div className={`${currentPrefix}-line-item`}>
      <span>
        <span>水平</span>
        <span style={{width: 145}}>
          <Slider
            onChangeComplete={v => onChange({
                      [valueX]: v * max,
                  })}
            defaultValue={defaultValue[valueX] / max}
              />
        </span>
      </span>
      <span>
        <span>垂直</span>
        <span style={{width: 145}}>
          <Slider
            onChangeComplete={v => onChange({
                      [valueY]: v * max,
                  })}
            defaultValue={defaultValue[valueY] / max}
              />
        </span>
      </span>
    </div>;
});
