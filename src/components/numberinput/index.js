import React, {useState, useEffect, useContext} from 'react';
import numeral from 'numeral';

import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {ViewContent} from '../../lib/context';

const NumberInput = React.memo(({ defaultValue, formatter, parser,
                                  onBlur, readOnly, disable, onFocus, onKeyDown,
                                  maxLength = 14, placeholder,
                                  min = Number.MIN_SAFE_INTEGER,
                                  max = Number.MAX_SAFE_INTEGER,
                                  integer = true,
                                  allowZero = false, textAlign = 'right',
                                  ...restProps }) => {
  const isView = useContext(ViewContent);
  const calcValue = (v) => {
    const value = numeral(v).value();
    if (typeof value === 'number') {
      const str = `${value}`;
      return formatter ? formatter(str) : str;
    }
    return '';
  };
  const assembleValue = (e, value) => {
    return {
      ...e,
      target: {
        ...e.target,
        value,
      },
    };
  };
  const [stateValue, setStateValue]  = useState('');
  useEffect(() => {
    let tempValue = 'value' in restProps ? restProps.value : defaultValue;
    if((tempValue === '0' || tempValue === 0) && !allowZero) {
      tempValue = '';
    }
    setStateValue(calcValue(tempValue));
  }, [restProps.value]);
  const _onChange = (e) => {
    const value = e.target.value;
    // 只能输入数字
    const { onChange } = restProps;
    let str = '';
    if(integer) {
      str = value.replace(/[^0-9]/g, '').substring(0, maxLength);
      const realValue = numeral(str).value();
      let finalValue = '';
      if (typeof realValue === 'number') {
        if (realValue < min) {
          finalValue = min;
          setStateValue(`${min}`);
        } else if (realValue > max){
          finalValue = max;
          setStateValue(`${max}`);
        } else {
          finalValue = realValue;
          setStateValue(`${realValue}`);
        }
      } else {
        setStateValue(finalValue);
      }
      onChange && onChange(assembleValue(e, finalValue));
    } else {
      str = value.replace(/[^0-9.]/g, '').substring(0, maxLength);
      if(str.split('.').length <= 2) {
        setStateValue(str);
      }
    }
  };
  const onDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const getParse = (value) => {
    return parser ? parser(value) : value;
  };
  const _onFocus = (e) => {
    if (!readOnly) {
      setStateValue(getParse(stateValue));
      onFocus && onFocus(e);
    }
  };
  const _onBlur = (e) => {
    if (!readOnly) {
      let tempStateValue = stateValue;
      if(!allowZero) {
        if(tempStateValue === '0' || tempStateValue === 0) {
          tempStateValue = '';
        }
      }
      setStateValue(formatter ? formatter(tempStateValue) : tempStateValue);
      const finalValue = numeral(getParse(tempStateValue)).value();
      onBlur && onBlur(assembleValue(e, typeof finalValue === 'number' ? finalValue : ''));
    }
  };
  const _onKeyDown = (e) => {
    onKeyDown && onKeyDown(e);
  };
  const currentPrefix = getPrefix('components-numberinput');
  return (<input
    style={{textAlign}}
    onKeyDown={_onKeyDown}
    className={currentPrefix}
    disabled={disable || isView}
    readOnly={readOnly}
    draggable
    onDragStart={onDragStart}
    type='text'
    value={stateValue}
    onChange={_onChange}
    onFocus={_onFocus}
    onBlur={_onBlur}
    placeholder={placeholder}
  />);
});
export default NumberInput;
