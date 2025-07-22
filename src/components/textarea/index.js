import React, {useContext, useEffect, useRef, useState} from 'react';

import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {PermissionContext, ViewContent} from '../../lib/context';
import {checkPermission} from '../../lib/permission';

const Input = React.memo(({rows = 3, cols = 20, prefix,
                            defaultValue, onChange, style, preventEnter, onMouseLeave, nsKey,
                            readOnly, onBlur, autoFocus, onFocus, ...restProps}) => {
  const isView = useContext(ViewContent) || readOnly;
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalReadOnly = finalNsKey ? (!checkPermission(finalNsKey) || isView) : isView;
  const [state, updateState] = useState(defaultValue);
  const inputRef = useRef(null);
  const _onChange = (e) => {
    updateState(e.target.value);
    onChange && onChange(e);
  };
  let tempValue = state;
  if ('value' in restProps) {
    tempValue = restProps?.value;
  }
  const currentPrefix = getPrefix('components-textarea');
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      preventEnter && e.stopPropagation();
    }
  };
  useEffect(() => {
    if(autoFocus) {
      setTimeout(() => {
        inputRef.current.focus();
      });
    }
  }, []);
  return (<textarea
    onFocus={onFocus}
    ref={inputRef}
    onBlur={onBlur}
    onMouseLeave={onMouseLeave}
    disabled={finalReadOnly}
    placeholder={restProps.placeholder}
    onKeyDown={onKeyDown}
    className={currentPrefix}
    style={style}
    value={tempValue}
    rows={rows}
    cols={cols}
    maxLength={restProps.maxLength}
    onChange={_onChange}/>);
});

export default Input;
