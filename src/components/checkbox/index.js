import React, {useContext, useState} from 'react';

import Group from './Group';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import Icon from '../icon';
import {PermissionContext, ViewContent} from '../../lib/context';
import {checkPermission} from '../../lib/permission';

const Checkbox = React.memo(({onChange, valueFormat, name, value, disable, force, style,
                               children, indeterminate = false, defaultChecked, className, nsKey,
                               ...restProps}) => {
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalDisable = finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable;
  const isView = useContext(ViewContent);
  const currentPrefix = getPrefix('components-checkbox');
  const [state, setState] = useState(defaultChecked);
  const finalChecked = valueFormat.checked === ('checked' in restProps ? restProps.checked : state);
  const _onClick = (e) => {
    if (!finalDisable && !isView) {
      const event = {
        target: {
          checked: !finalChecked ? valueFormat.checked : valueFormat.unchecked,
        },
      };
      if (!('checked' in restProps)) {
        setState(event.target.checked);
      }
      onChange && onChange(event, value);
      e.stopPropagation();
    }
  };
  const onClick = (e) => {
    e.stopPropagation();
  };
  return (
    <span
      style={style}
      onClick={_onClick}
      className={`${currentPrefix} ${currentPrefix}-${disable ? 'disable' : 'normal'} ${className}`}
    >
      {
        finalChecked ? <span className={`${currentPrefix}-checked`}>
          <Icon type={indeterminate ? 'icon-square-check-half' : 'icon-square-check'}/>
        </span> :
        <span className={`${currentPrefix}-unchecked`}><Icon type='icon-square-uncheck'/></span>
      }
      <input
        disabled={finalDisable || (force ? false : isView)}
        onClick={onClick}
        onChange={_onClick}
        value={value}
        type='checkbox'
        name={name}
        checked={finalChecked}
      />
      {children}
    </span>
  );
});

Checkbox.CheckboxGroup = Group;
Checkbox.defaultProps = {
  type: 'default',
  valueFormat: {
    checked: true,
    unchecked: false,
  },
};
export default Checkbox;
