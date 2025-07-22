import React, {useState, forwardRef, useRef, useEffect, useContext} from 'react';

import Icon from '../icon';
import Tooltip from '../tooltip';
import Textarea from '../textarea';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import { PermissionContext, ViewContent } from '../../lib/context';
import {checkPermission} from '../../lib/permission';

const Input = React.memo(forwardRef(({defaultValue, suffix, placeholder, readOnly,
                                       onClick, type = 'text', style, trim, accept, autoFocus,
                                       onKeyDown, maxLength, disable, toggleCase, onFocus, nsKey,
                                       onMouseLeave, autoSelection, showDetails, detailsStyle,
                                       detailsStyleCol,
                                       ...restProps }, ref) => {

  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalReadOnly = useContext(ViewContent) ||
      (finalNsKey ? (!checkPermission(finalNsKey) || readOnly) : readOnly);
  const [stateValue, setDefaultValue]  = useState(defaultValue);
  const composition = useRef(false);
  const [isFocus, setFocus] = useState(false);
  const inputRef = useRef(null);
  const _onChange = (e) => {
    const { onChange } = restProps;
    if (composition.current) {
      setDefaultValue(e.target.value);
      onChange && onChange(e);
    } else {
      e.target.value = e.target.value.substr(0, maxLength);
      setDefaultValue(e.target.value);
      onChange && onChange(e);
    }

  };
  let tempValue = stateValue;
  if ('value' in restProps) {
    tempValue = restProps.value;
  }
  const toggle = (e, toggleType) => {
    const { onChange } = restProps;
    const newValue = toggleType === 'up' ? tempValue.toLocaleUpperCase() : tempValue.toLocaleLowerCase();
    setDefaultValue(newValue);
    e.target.value = newValue;
    onChange && onChange(e);
  };
  const low = (e) => {
    toggle(e, 'low');
  };
  const up = (e) => {
    toggle(e, 'up');
  };
  const _onFocus = (e) => {
    setFocus(true);
    onFocus && onFocus(e);
    if(autoSelection) {
      e.target.setSelectionRange(0, e.target.value.length);
    }
  };
  const _onBlur = (e) => {
    setFocus(false);
    const { onBlur, onChange } = restProps;
    const blurValue = e.target.value;
    // 去除空格
    e.target.value = trim ? blurValue.replace(/\s/g, '') : blurValue.trim();
    onBlur && onBlur(e);
    if (e.target.value !== tempValue) {
      onChange && onChange(e);
      setDefaultValue(e.target.value);
    }
  };
  const onDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onCompositionEnd = (e) => {
    const { onChange } = restProps;
    e.target.value = e.target.value.substr(0, maxLength);
    setDefaultValue(e.target.value);
    onChange && onChange(e);
    composition.current = false;
  };
  const onCompositionStart = () => {
    composition.current = true;
  };
  const currentPrefix = getPrefix('components-input');
  const _onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 75) {
      const { onChange } = restProps;
      const value = e.target.value === undefined ? '' : e.target.value;
      const newValue = value.toLocaleUpperCase() === value
          ? value.toLocaleLowerCase() : value.toLocaleUpperCase();
      setDefaultValue(newValue);
      e.target.value = newValue;
      onChange && onChange(e);
    }
    onKeyDown && onKeyDown(e);
    if(e.key === 'Enter' && composition.current) {
      e.stopPropagation();
    }
  };
  useEffect(() => {
    if(autoFocus) {
      setTimeout(() => {
        inputRef.current.focus();
      });
    }
  }, []);
  useEffect(() => {
    setDefaultValue(defaultValue);
  }, [defaultValue]);
  const refInstance = (instance) => {
    inputRef.current = instance;
    if(ref) {
      // eslint-disable-next-line no-param-reassign
      ref.current = instance;
    }
  };
  const renderDetail = (value, readonly) => {
    return <Textarea
      autoFocus
      cols={detailsStyleCol || 40}
      rows={6}
      onBlur={_onBlur}
      defaultValue={value}
      readOnly={readonly}
    />;
  };
  return (<span style={style} className={`${currentPrefix} ${suffix ? `${currentPrefix}-suffix-container` : ''}`}>
    <span className={`${currentPrefix}-${isFocus ? 'focus' : 'blur'}`}>
      <input
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={_onKeyDown}
        ref={refInstance}
        onClick={onClick}
        readOnly={finalReadOnly}
        placeholder={placeholder}
        draggable
        disabled={disable}
        accept={accept}
        onDragStart={onDragStart}
        type={type}
        value={tempValue === 0 ? 0 : (tempValue || '')}
        onChange={_onChange}
        onFocus={_onFocus}
        onBlur={_onBlur}
        onMouseLeave={onMouseLeave}
      />
      {maxLength && <span className={`${currentPrefix}-count`}>{tempValue?.length || 0}/{maxLength}</span>}
    </span>
    {showDetails && <Tooltip placement='top' trigger='click' title={renderDetail(tempValue === 0 ? 0 : (tempValue || ''), finalReadOnly)}>
      <span
        className={`${currentPrefix}-detail ${currentPrefix}-detail-${detailsStyle ? 'border' : 'normal'}`}
      >
        <Icon type='icon-ellipsis-more'/>
      </span>
    </Tooltip>}
    {suffix && <span
      className={`${currentPrefix}-suffix`}>{typeof suffix === 'function' ? suffix(finalReadOnly) : suffix}</span>}
    {toggleCase && <span className={`${currentPrefix}-toggle`}>
      <span onClick={up}>转大写</span><span />
      <span onClick={low}>转小写</span></span>}
  </span>);
}));
export default Input;
