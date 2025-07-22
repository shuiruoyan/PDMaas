import React, {useState, forwardRef, useCallback, useImperativeHandle, useRef} from 'react';

import './style/index.less';
import Input from 'components/input';
import Icon from 'components/icon';
import {getPrefix} from '../../lib/classes';
import {ViewContent} from '../../lib/context';
import {antiShake} from '../../lib/event';

export default React.memo(forwardRef(({ placeholder, onChange, onBlur, onKeyDown,
                                        defaultValue, comRef, className, autoFocus}, ref) => {
  const currentPrefix = getPrefix('components-search-input');
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  useImperativeHandle(comRef, () => {
    return {
      resetSearchValue: () => {
        setValue('');
      },
      focus: () => {
        inputRef.current.focus();
      },
      setLoading,
    };
  }, []);
  const antiShakeFuc = useCallback(antiShake((v) => {
    setLoading(true);
    const result = onChange && onChange({
      target: {
        value: v.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
      },
    });
    if(result && result.then) {
      result.finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }), []);
  const _onChange = (e) => {
    setValue(e.target.value);
    antiShakeFuc(e.target.value);
  };
  return <div className={`${currentPrefix} ${className} ${loading ? `${currentPrefix}-loading` : ''}`} ref={ref}>
    <Icon className={`${currentPrefix}-icon`} type='icon-search'/>
    <ViewContent.Provider value={false}>
      <Input
        onKeyDown={onKeyDown}
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={_onChange}
        onBlur={onBlur}/>
    </ViewContent.Provider>
    {loading && <Icon type='icon-loading'/>}
  </div>;
}));
