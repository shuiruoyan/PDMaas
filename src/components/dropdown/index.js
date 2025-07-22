import React, {useContext, useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import ReactDOM from 'react-dom';

import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {PermissionContext, ViewContent} from '../../lib/context';
import { checkPermission } from '../../lib/permission';

export default React.memo(forwardRef(({children, trigger, menus,
                             menuClick, position = 'bottom', nsKey,
                             filterMenus, focusVisible = true, ...restProps}, ref) => {
  const isView = useContext(ViewContent);
  const disable = isView || restProps.disable;
  const finalNsKey = nsKey || useContext(PermissionContext);
  const finalReadOnly = finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable;
  const currentPrefix = getPrefix('components-dropdown');
  const [visible, setVisible] = useState(false);
  const menuDom = useRef(null);
  const eventPosition = useRef(null);
  const timeRef = useRef(null);
  useImperativeHandle(ref, () => {
    return {
      setVisible,
    };
  }, []);
  const showMenu = (e) => {
    if(trigger === 'contextmenu') {
      eventPosition.current = {
        value: e.target.value,
        valueArray: e.target.valueArray,
        clientY: e.clientY,
        clientX: e.clientX,
      };
    } else {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      eventPosition.current = {
        clientY: rect.top + rect.height,
        clientX: rect.left,
      };
    }
    !finalReadOnly && setVisible(true);
    e.stopPropagation();
    e.preventDefault();
  };
  useEffect(() => {
    if (visible) {
      menuDom.current.style.left = `${eventPosition.current.clientX}px`;
      if (position === 'top') {
        menuDom.current.style.bottom = `${window.innerHeight - eventPosition.current.clientY}px`;
        menuDom.current.style.maxHeight = `${window.innerHeight - (window.innerHeight - eventPosition.current.clientY)}px`;
      } else if(position === 'bottom-left') {
        let top = eventPosition.current.clientY;
        let left = eventPosition.current.clientX - menuDom.current.clientWidth + 16;
        if((eventPosition.current.clientY + menuDom.current.clientHeight) > window.innerHeight) {
          menuDom.current.style.height = `${window.innerHeight - eventPosition.current.clientY - 10}px`;
        }
        menuDom.current.style.top = `${top}px`;
        menuDom.current.style.left = `${left}px`;
      } else {
        let top = eventPosition.current.clientY;
        if((top + menuDom.current.clientHeight) > window.innerHeight) {
          const finalTop = top - menuDom.current.clientHeight;
          if(finalTop >= 0) {
            menuDom.current.style.top = `${finalTop}px`;
          } else if(top < (window.innerHeight - top)) {
            menuDom.current.style.top = `${top}px`;
            menuDom.current.style.height = `${window.innerHeight - top}px`;
          } else {
            menuDom.current.style.top = `${0}px`;
            menuDom.current.style.height = `${top}px`;
          }
        } else {
          menuDom.current.style.top = `${top}px`;
        }
      }
      focusVisible && menuDom.current.focus();
    }
  }, [visible]);
  const onBlur = () => {
      setVisible(false);
  };
  const onMenuClick = (m, e) => {
    if (!m.disable) {
      e.target.value = eventPosition.current.value;
      e.target.valueArray = eventPosition.current.valueArray;
      menuClick && menuClick(m, e);
      setVisible(false);
    }
  };
  if (!menus || menus.length === 0) {
    return children;
  }
  const renderMenu = (m) => {
    if(m.render){
      return m.render(m);
    } else if(m.line) {
      return <div className={`${currentPrefix}-item-line`} />;
    }
    const temp = {
      ...m,
      disable: m.disable || (m.nsKey && !checkPermission(typeof m.nsKey === 'function'
          ? m.nsKey(eventPosition.current.value) : m.nsKey)),
    };
    return <div
      draggable={m.draggable}
      style={m.style}
      key={m.name}
      className={`${currentPrefix}-item ${currentPrefix}-item-${temp.disable ? 'disable' : 'normal'}`}
      onDragStart={e => onMenuClick(temp, e)}
      onClick={e => onMenuClick(temp, e)}
    >
      {m.icon}{m.name}
    </div>;
  };
  const onMouseLeave = () => {
    if(trigger === 'hover') {
      timeRef.current = setTimeout(() => {
        onBlur();
      }, 100);
    }
  };
  const onMouseEnter = (e) => {
    if(trigger === 'hover') {
      if(timeRef.current) {
        clearTimeout(timeRef.current);
      }
      showMenu(e);
    }
  };
  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return <>
    {React.cloneElement(children, {
      onClick: (e) => {
        if(trigger === 'click') {
          showMenu(e);
        }
      },
      onContextMenu: (e) => {
        e.preventDefault();
        if(trigger === 'contextmenu') {
          showMenu(e);
        }
      },
      onMouseLeave,
      onMouseEnter,
    })}
    {
      visible ? ReactDOM.createPortal(
        <div
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onBlur={onBlur}
          ref={menuDom}
          tabIndex='-1'
          className={`${currentPrefix}-container`}
      >
          {
          (menus || []).filter((m) => {
            if (filterMenus) {
              return filterMenus(m, eventPosition.current.value);
            }
            return m;
          }).map((m) => {
            if(m.children){
              return [<div
                style={m.style}
                key={m.name}
                className={`${currentPrefix}-item-group`}
              >
                {m.icon}{m.name}
              </div>, m.children.map(c => renderMenu(c))];
            }
            return renderMenu(m);
          })
        }
        </div>, document.body) : null
    }
  </>;
}));
