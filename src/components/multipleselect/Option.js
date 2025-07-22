import React from 'react';

import { Icon } from 'components';
import './style/index.less';
import {getPrefix, classesMerge} from '../../lib/classes';
import {checkPermission} from '../../lib/permission';

export default React.memo(({value, checkValues, children, onChange, style, nsKey, disable}) => {
  const optionDisable = disable || (nsKey && !checkPermission(nsKey));
  const onClick = (e) => {
    !optionDisable && onChange && onChange(value, e);
  };
  const currentPrefix = getPrefix('components-multiple-select-option');
  const check = checkValues?.includes(value);
  return <span
    style={style}
    className={classesMerge({
      [currentPrefix]: true,
      [`${currentPrefix}-default`]: !check,
      [`${currentPrefix}-check`]: check,
      [`${currentPrefix}-onCheck`]: !check && checkValues?.filter(it => it)?.length > 0 && !optionDisable,
      [`${currentPrefix}-disable`]: optionDisable,
    })}
    onClick={onClick}
  >
    <Icon type='icon-check-solid'/>
    <span>{children}</span>
  </span>;
});
