import React, { useContext } from 'react';

import {getPrefix, classesMerge} from '../../lib/classes';
import { FormContext } from '../../lib/context';

export default React.memo(({children, cols, label, require}) => {
    const { labelWidth, configCols } = useContext(FormContext);
    const currentPrefix = getPrefix('components-form-item');
    const getWidth = () => {
        const max = parseInt(configCols, 10) || 4;
        const current = parseInt(cols, 10) || max;
        return (current / max) * 100;
    };
    return <div
      className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-cols-${cols}`]: cols,
        [`${currentPrefix}-require`]: require,
    })}
      style={{width: `${getWidth()}%`}}>
      <span style={{width: labelWidth}}>
        <span className={`${currentPrefix}-label`}>{label}</span>
      </span>
      <span>{children}</span>
    </div>;
});
