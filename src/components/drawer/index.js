import React, { useEffect, useRef, useContext } from 'react';
import ReactDom from 'react-dom';
import {getPrefix} from '../../lib/classes';
import Icon from '../icon';

import './style/index.less';
import {EventContext, ViewContent} from '../../lib/context';
import {notify} from '../../lib/subscribe';
import {APP_EVENT} from '../../lib/constant';

export const Drawer = React.memo(({title, onClose, children, width,
                                    bodyStyle, buttons, maskClosable,
                                    closeable = true, placement, onScroll,
                                    height, closeModal}) => {
  const isView = useContext(ViewContent);
  const currentPrefix = getPrefix('components-drawer');
  const ref = useRef(null);
  const containerRef = useRef(null);
  const updateStyle = () => {
    onClose && onClose();
  };
  const _iconClose = () => {
    updateStyle();
  };
  useEffect(() => {
    containerRef.current.style.transform = 'translate(0px, 0px)';
  }, []);
  useEffect(() => {
    const { current } = ref;
    current && current.focus();
  });
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && closeable) {
      // 按了键盘的返回键
      updateStyle();
    }
  };
  const onClick = (e) => {
    notify(APP_EVENT.CLICK, e);
    if (containerRef.current &&
        e.target.compareDocumentPosition(containerRef.current) === 20 && maskClosable) {
      updateStyle();
    }
  };
  const _onScroll = () => {
    onScroll && onScroll();
  };
  const style = {};
  if (placement === 'left') {
    style.left = 0;
    style.transform = 'translateX(-100%)';
  } else if(placement === 'top') {
    style.top = 0;
    style.transform = 'translateY(-100%)';
    style.height = height || '80%';
    style.width = '100%';
  } else {
    style.right = 0;
    style.transform = 'translateX(100%)';
  }
  return (
    <div
      onScroll={_onScroll}
      className={`${currentPrefix} ${currentPrefix}-${closeModal ? 'close' : 'normal'}`}
      tabIndex='1'
      onKeyDown={onKeyDown}
      ref={ref}
      onClick={onClick}
      >
      <div
        style={{width, ...style}}
        ref={containerRef}
        className={`${currentPrefix}-container`}
        >
        <div
          className={`${currentPrefix}-header`}
          >
          <div className={`${currentPrefix}-title`}>{title}</div>
          <ViewContent.Provider value={false}>
            <Icon className={`${currentPrefix}-icon`} type='icon-close' onClick={_iconClose}/>
          </ViewContent.Provider>
        </div>
        <div
          style={{height: `calc(100% - ${buttons ? 70 : 32}px)`, ...bodyStyle}}
          className={`${currentPrefix}-content`}
          >
          {children}
        </div>
        {
          buttons && <div className={`${currentPrefix}-button-${placement}`}>
              {isView ? buttons[buttons.length - 1] : buttons}
            </div>
        }
      </div>
    </div>
  );
});

const drawerInstance = {};
export const openDrawer = (com, params) => {
  const drawerId = params.id || Math.uuid();
  if(!drawerInstance[drawerId]) {
    const isView = false;
    let scrollEvents = [];
    const addScrollEvent = (event) => {
      scrollEvents.push(event);
    };
    const removeScrollEvent = (event) => {
      scrollEvents = scrollEvents.filter(e => e !== event);
    };
    const onScroll = () => {
      scrollEvents.forEach((e) => {
        e();
      });
    };
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    const close = () => {
      const { beforeClose } = params;
      const remove = () => {
        scrollEvents = [];
        const result = ReactDom.unmountComponentAtNode(dom);
        if (result) {
          delete drawerInstance[drawerId];
          dom.parentElement.removeChild(dom);
        }
      };
      if (beforeClose && typeof beforeClose === 'function') {
        const result = beforeClose();
        if (result.then) {
          result.then(() => {
            remove();
          });
        } else {
          result && remove();
        }
      } else {
        remove();
      }
    };
    drawerInstance[drawerId] = {close};
    const DrawerCompose = () => {
      const { title, width,bodyStyle, buttons,  maskClosable = true, placement = 'left', height, closeable, closeModal } = params;
      const _iconClose = () => {
        const { onClose } = params;
        onClose && onClose();
        close();
      };
      return (
        <EventContext.Provider value={{addScrollEvent, removeScrollEvent}}>
          <ViewContent.Provider value={isView}>
            <Drawer
              closeable={closeable}
              closeModal={closeModal}
              onScroll={onScroll}
              placement={placement}
              buttons={buttons}
              title={title}
              height={height}
              width={width}
              maskClosable={maskClosable}
              bodyStyle={bodyStyle}
              onClose={_iconClose}
              >
              {com}
            </Drawer>
          </ViewContent.Provider>
        </EventContext.Provider>
      );
    };
    ReactDom.render(<DrawerCompose/>, dom);
    return {
      close,
    };
  }
  return {};
};

Drawer.instance = () => {
  return {
    ...drawerInstance,
  };
};
