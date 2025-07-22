import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

import './style/index.less';
import ButtonGroup from './Group';
import Icon from '../icon';
import {classesMerge, getPrefix} from '../../lib/classes';
import { LOADING, NORMAL, DISABLE } from '../../lib/constant';
import {checkPermission} from '../../lib/permission';

const Button = React.memo(forwardRef(({ type, active, children,
                                        onClick, disable, style, nsKey }, ref) => {
  const finalDisable = (nsKey && !checkPermission(nsKey)) || disable;
  const [status, updateStatus] = useState(finalDisable ? DISABLE : NORMAL);
  const _onClick = (e) => {
    if (status === NORMAL) {
      onClick && onClick(e, {
        updateStatus,
      });
    }
  };
  const currentPrefix = getPrefix('components-button');
  useImperativeHandle(ref, () => {
    return {
      updateStatus,
    };
  }, []);
  useEffect(() => {
    updateStatus(finalDisable ? DISABLE : NORMAL);
  }, [finalDisable]);
  return (
    <span
      style={style}
      className={
      classesMerge({
        [`${currentPrefix}`]: true,
        [`${currentPrefix}-${type}`]: true,
        [`${currentPrefix}-${status}`]: true,
        [`${currentPrefix}-${type}-active`]: active,
      })}
      onClick={_onClick}
    >
      {status === LOADING ? <Icon type='icon-loading'/> : children}
    </span>
  );
}));

Button.ButtonGroup = ButtonGroup;
Button.defaultProps = {
  type: 'default',
};

export default Button;
