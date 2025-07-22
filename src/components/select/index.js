import React, {useContext, useState} from 'react';

import MultipleSelect from '../multipleselect';
import './style/index.less';
import {PermissionContext} from '../../lib/context';
import {checkPermission} from '../../lib/permission';


const Select = React.memo(({ children = [], style, disable,
                             showNotMatch = false, className, allowClear,
                             defaultValue, onChange, notAllowEmpty, valueRender, onKeyDown,
                             nsKey, onBlur, suffix,
                             ...restProps}) => {
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalDisable = finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable;
  const [state, updateState] = useState(defaultValue);
  const _onChange = (e) => {
    updateState(e.target.value);
    onChange && onChange(e);
  };
  let tempValue = state;
  if ('value' in restProps) {
    tempValue = restProps?.value;
  }
  const _onKeyDown = (e) => {
    onKeyDown && onKeyDown(e);
  };
  return <MultipleSelect
    onKeyDown={_onKeyDown}
    allowClear={allowClear}
    onChange={value => _onChange(value)}
    value={tempValue}
    simple
    showNotMatch={showNotMatch}
    disable={finalDisable}
    className={className}
    valueRender={valueRender}
    onBlur={onBlur}
    suffix={suffix}
  >
    {
      children
    }
  </MultipleSelect>;
});
Select.Option = MultipleSelect.Option;

export default Select;
