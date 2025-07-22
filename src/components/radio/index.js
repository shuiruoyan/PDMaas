import React, {useContext, useState} from 'react';

import Group from './Group';
import Icon from '../icon';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {ViewContent} from '../../lib/context';

const Radio = React.memo(({name, direction, value, children, onChange, defaultChecked,
                            ...restProps}) => {
  const isView = useContext(ViewContent);
  const currentPrefix = getPrefix('components-radio');
  const [state, setState] = useState(!!defaultChecked);
  const finalChecked = 'checked' in restProps ? restProps.checked : state;
  const _onClick = (e) => {
    const event = {
      target: {
        checked: !finalChecked,
        value,
      },
    };
    if (!('checked' in restProps)) {
      setState(event);
    }
    onChange && onChange(event, value);
    e.stopPropagation();
  };
  const _onInputClick = (e) => {
    e.stopPropagation();
  };
  return (
    <span className={`${currentPrefix} ${currentPrefix}-${direction}`} onClick={_onClick}>
      {
        finalChecked ? <span className={`${currentPrefix}-checked`}>
          <Icon type='icon-circle-dot'/>
        </span> :
        <span className={`${currentPrefix}-unchecked`}><Icon type='icon-circle'/></span>
      }
      <input
        onClick={_onInputClick}
        disabled={isView}
        onChange={_onClick}
        type='radio'
        name={name}
        value={value}
        checked={finalChecked}
      />
      <span className={`${currentPrefix}-children`}>{children}</span>
    </span>
  );
});
Radio.RadioGroup = Group;
export default Radio;
