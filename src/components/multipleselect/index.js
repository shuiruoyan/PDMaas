import React, {useRef, useEffect, useState, useMemo, useContext} from 'react';
import {FixedSizeList as List} from 'react-window';
import ReactDOM from 'react-dom';

import { Icon } from 'components';
import Option from './Option';
import { addBodyClick, removeBodyClick, addOnResize, removeOnResize } from '../../lib/listener';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {ViewContent, TableContext, PermissionContext} from '../../lib/context';
import {getScroller} from './util';
import {checkPermission} from '../../lib/permission';

const MultipleSelect = React.memo(({children, dropdownRender, allowClear = true,
                                     defaultValue, showNotMatch = false, className,
                                     onChange, simple = false, valueRender, onKeyDown,
                                     nsKey, suffix,
                                     ...restProps}) => {
  const isView = useContext(ViewContent);
  const { isTable } = useContext(TableContext);
  const disable = isView || restProps.disable;
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalDisable = finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable;
  const scrollDomRef = useRef(null);
  const inputRef = useRef(null);
  const optionsRef = useRef(null);
  const selectRef = useRef(null);
  const inputOffsetRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const id = useMemo(() => Math.uuid(), []);
  const splitValue = (v) => {
    if(simple) {
      return [v];
    }
    if(typeof v === 'string') {
      return v.split(',') || [];
    }
    return [v];
  };
  const [checkValues, updateCheckValues] = useState(() => {
    if ('value' in restProps) {
      return splitValue(restProps.value);
    }
    return splitValue(defaultValue);
  });
  const [searchValue, updateSearch] = useState('');
  const currentPrefix = getPrefix('components-multiple-select');
  useEffect(() => {
    const { current } = selectRef;
    addBodyClick(id, (e) => {
      const target = e.target;
      if (!current.contains(target) && !optionsRef?.current?.contains(target)) {
        // 点击不在多选框的节点内
        setVisible(false);
        if (!simple) {
          inputRef.current.style.width = '4px';
        }
        updateSearch('');
      }
    });
    return () => {
      removeBodyClick(id);
    };
  }, []);
  const inputChange = (e) => {
    const { target } = e;
    if (!simple) {
      const { current } = inputOffsetRef;
      current.innerText = target.value;
      let width = current.clientWidth;
      inputRef.current.style.width = `${width + 2}px`;
    }
    updateSearch(target.value);
    if (showNotMatch) {
      onChange && onChange(e);
    }
  };
  const valueChange = (value, e) => {
    let tempValues = [];
    if (simple) {
      tempValues = [value];
      setVisible(false);
      e.stopPropagation();
    } else if (checkValues.includes(value)) {
      tempValues = checkValues.filter(v => v !== value);
    } else {
      tempValues = checkValues.concat(value);
    }
    updateCheckValues(tempValues);
    onChange && onChange({
      target: {
        value: simple ? tempValues[0] : tempValues.join(','),
      },
    });
    updateSearch('');
  };
  let finalCheckValues = checkValues;
  if ('value' in restProps) {
    finalCheckValues = splitValue(restProps.value);
  }
  const closeClick = (value) => {
    const tempValues = finalCheckValues.filter(v => v !== value);
    updateCheckValues(tempValues);
    onChange && onChange({
      target: {
        value: tempValues.join(','),
      },
    });
  };
  const reg = new RegExp((searchValue || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  const options = [].concat(children)
      .filter(c => reg.test(c.props?.value || '') || reg.test(c.props?.children || ''));
  const finalValue = showNotMatch ? finalCheckValues[0] : searchValue;
  let needAdd = finalCheckValues[0] && showNotMatch
      && !options.some(o => o.props?.value === finalCheckValues[0]);
  const getOptionStyle = () => {
    const rectSelect = selectRef.current.getBoundingClientRect();
    const style = {};
    style.opacity = 1;
    style.width = `${rectSelect.width}px`;
    if(isTable) {
      // const scrollRect = scrollDomRef.current.getBoundingClientRect();
      // style.left = `${0}px`;
      // const offsetTop = rectSelect.top - scrollRect.top;
      // const offsetBottom = scrollRect.bottom - rectSelect.bottom;
      // if(offsetBottom > offsetTop) {
      //   style.top = `${rectSelect.height + 2}px`;
      //   style.maxHeight = `${offsetBottom - rectSelect.height}px`;
      // } else {
      //   style.bottom = `${rectSelect.height + 2}px`;
      //   style.maxHeight = `${offsetTop - rectSelect.height * 2}px`;
      // }
    } else {
      // style.left = `${rectSelect.left}px`;
      // style.zIndex = 999;
      // const offsetTop = rectSelect.top;
      // const offsetBottom = window.innerHeight - rectSelect.bottom;
      // if(offsetBottom > offsetTop) {
      //   style.top = `${rectSelect.top + rectSelect.height + 2}px`;
      //   style.maxHeight = `${offsetBottom}px`;
      // } else {
      //   style.bottom = `${offsetBottom + rectSelect.height + 2}px`;
      //   style.maxHeight = `${offsetTop}px`;
      // }
    }
    style.left = `${rectSelect.left}px`;
    style.zIndex = 999;
    const offsetTop = rectSelect.top;
    const maxHeight = 300;
    const offsetBottom = window.innerHeight - rectSelect.bottom;
    if(offsetBottom > offsetTop) {
      style.top = `${rectSelect.top + rectSelect.height + 2}px`;
      if(offsetBottom > maxHeight) {
        style.maxHeight = `${maxHeight}px`;
      } else {
        style.maxHeight = `${offsetBottom}px`;
      }
    } else {
      style.bottom = `${offsetBottom + rectSelect.height + 2}px`;
      if(offsetTop > maxHeight) {
        style.maxHeight = `${maxHeight}px`;
      } else {
        style.maxHeight = `${offsetTop}px`;
      }
    }
    return style;
  };
  const getChildren = () => {
    const optionStyle = getOptionStyle();
    const maxHeight = parseInt(optionStyle.maxHeight.split('px')[0], 10);
    const menus = (options.length > 0 || needAdd)
        ? options.map(c => React.cloneElement(c, {
      checkValues: finalCheckValues,
      onChange: valueChange,
        })).concat(needAdd ? [<Option
          key='__customer_match'
          value={finalCheckValues[0]}
          checkValues={finalCheckValues}
          onChange={valueChange}
        >{finalCheckValues[0]}</Option>] : []) : [];
    const renderList = () => {
      if(menus.length === 0) {
        return <div className={`${currentPrefix}-empty`}>
          暂无数据
        </div>;
      }
      return <List
        height={menus.length * 31 > maxHeight ? maxHeight - 2 : menus.length * 31}
        itemCount={menus.length}
        itemSize={31}
      >
        {({index, style}) => {
          const menu = menus[index];
          return React.cloneElement(menu, {
            style: {
              ...style,
              ...menu.props?.style,
            }});
        }}
      </List>;
    };
    const onMouseDown = (e) => {
      e.preventDefault();
    };
    return <div
      onMouseDown={onMouseDown}
      style={optionStyle}
      className={`${currentPrefix}-children`}
      ref={optionsRef}
    >
      {dropdownRender ? dropdownRender(renderList()) : renderList()}
    </div>;
  };
  const selectClick = (e) => {
    const { current } = inputRef;
    current && current.focus();
    setVisible(true);
    if (!simple && (e.target !== current) && !showNotMatch) {
      inputRef.current.style.width = '4px';
      updateSearch('');
    }
  };
  const onFocus = () => {
    setVisible(true);
  };
  const onBlur = (e) => {
    const blur = restProps.onBlur;
    blur && blur(e);
  };
  const _onKeyDown = (e) => {
    if (e.keyCode === 9) {
      setVisible(false);
    }
    onKeyDown && onKeyDown(e);
  };
  const selected = [].concat(children).filter((c) => {
    //console.log(c.props, c);
    return finalCheckValues.includes(c.props.value);
  });
  const onClear = (e) => {
    e.stopPropagation();
    updateCheckValues([]);
    onChange && onChange({
      target: {
        value: '',
      },
    });
  };
  const getEmptyChildren = () => {
    const firstChildren = [].concat(children)[0];
    if (firstChildren && firstChildren.props.value === '') {
      return firstChildren?.props;
    }
    return '';
  };
  const _valueRender = (itemProps, value) => {
    if(valueRender) {
      return valueRender(itemProps, value);
    }
    return itemProps?.children || '';
  };
  useEffect(() => {
    const resizeId = Math.uuid();
    addOnResize(resizeId, () => {
      if(optionsRef.current) {
        const style = getOptionStyle();
        Object.keys(style).forEach((k) => {
          optionsRef.current.style[k] = style[k];
        });
        const list = optionsRef.current.children[0];
        if(list) {
          const listRect = list.getBoundingClientRect();
          const max = parseInt(style.maxHeight.split('px')[0], 10) - 2;
          if(listRect.height > max) {
            list.style.height = `${max}px`;
          }
        }
      }
    });
    return () => {
      removeOnResize(resizeId);
    };
  });
  useEffect(() => {
    const scrollDom = getScroller(selectRef.current);
    const onScroll = () => {
      setVisible(false);
    };
    scrollDomRef.current = scrollDom;
    if(scrollDom) {
      scrollDom.addEventListener('scroll', onScroll);
    }
    return () => {
      if(scrollDom) {
        scrollDom.removeEventListener('scroll', onScroll);
      }
    };
  }, []);
  return <div className={`${currentPrefix} ${className || ''}`} onClick={selectClick} ref={selectRef}>
    <div className={`${currentPrefix}-data ${currentPrefix}-data-${finalDisable ? 'disable' : 'default'} ${currentPrefix}-data-${visible ? 'focus' : 'normal'}`}>
      {simple ? <span
        title={selected[0]?.props?.children || ''}
        className={`${currentPrefix}-data-item-simple`}
          >{
            (searchValue || showNotMatch) ? '' : _valueRender((selected[0]?.props ||  getEmptyChildren()), finalCheckValues)
          }{allowClear && selected[0]
          && !finalDisable && <span
            onClick={onClear}
            className={`${currentPrefix}-data-item-simple-clear`}
          >
            <Icon type='icon-close'/>
          </span>}
      </span> :
          selected.map((c) => {
            return <span key={c.key || c.props.value} className={`${currentPrefix}-data-item`}>
              <span>{_valueRender(c?.props, finalCheckValues)}</span>
              {!finalDisable && <Icon type='icon-close' onClick={() => closeClick(c.props.value)}/>}
            </span>;
          })}
      <span
        className={`${currentPrefix}-data-input-placeholder`}
        style={{display: searchValue || finalCheckValues.length > 0 ? 'none' : ''}}
      >
        {restProps.placeholder || ''}
      </span>
      {
        !finalDisable && <span className={`${currentPrefix}-data-input-icon`}>
          <Icon type='icon-down-more-copy'/>
        </span>
      }
      <input
        onBlur={onBlur}
        disabled={finalDisable}
        onKeyDown={_onKeyDown}
        ref={inputRef}
        onFocus={onFocus}
        onChange={inputChange}
        value={finalValue}
        className={`${currentPrefix}-data-${simple ? 'simple' : 'normal'}-input`}
      />
      <span
        ref={inputOffsetRef}
        className={`${currentPrefix}-data-hidden-input`}
      />
    </div>
    {suffix && <span className={`${currentPrefix}-suffix`}>{typeof suffix === 'function' ? suffix(finalCheckValues) : suffix}</span>}
    {
      // eslint-disable-next-line no-nested-ternary
      !finalDisable && visible ? ReactDOM.createPortal(getChildren(), document.body) : null
    }
  </div>;
});

MultipleSelect.Option = Option;

export default MultipleSelect;
