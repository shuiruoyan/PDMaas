import React, {useState} from 'react';
import { Tooltip } from 'components';
import {getPrefix} from '../../../../../lib/classes';

import Color from './Color';

export default React.memo(({defaultValue, onChange}) => {
    const currentPrefix = getPrefix('container-model-mind-config-customer-color');
    const [color, setColor] = useState(defaultValue);
    const _onChange = (c) => {
        onChange && onChange(c);
        setColor(c);
    };
    return <div className={currentPrefix}>
      <Tooltip force title={<Color onChange={_onChange}/>}>
        <div style={{background: color}}/>
      </Tooltip>
    </div>;
});
