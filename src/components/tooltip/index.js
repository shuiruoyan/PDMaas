import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback, useMemo,
} from 'react';
import ReactDom from 'react-dom';

import './style/index.less';
import {getScroller} from 'components/multipleselect/util';
import {getPrefix} from '../../lib/classes';
import { subscribeEvent, unSubscribeEvent } from '../../lib/subscribe';
import {isChild} from '../../lib/dom';
import {APP_EVENT} from '../../lib/constant';

const Tooltip = React.memo(forwardRef(({children, offsetLeft = 0, offsetTop = 0,
                                         title, visible = true, className = '', mouseEnterDelay = 0,
                                         force, placement = 'bottom', trigger = 'hover',
                                         conversion = 1, clickClose, mouseLeaveDelay = 0,
                                         offsetRight = 0, propagation, closeArrow,
                                         leaveClose = true, style}, ref) => {
  const currentPrefix = getPrefix('components-tooltip');
  const containerRef = useRef(null);
  const parentRef = useRef(null);
  const statusRef = useRef(null);
  const overStatusRef = useRef(null);
  const titleRef = useRef(null);
  const arrowRef = useRef(null);
  const currentRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipId = useMemo(() => Math.uuid(), []);
  const sunEvent = 'clearTooltip';
  useImperativeHandle(ref, () => {
    return {
      setTooltipVisible,
    };
  }, []);
  useEffect(() => {
    if(trigger === 'click') {
      const eventId = Math.uuid();
      subscribeEvent(APP_EVENT.CLICK, (e) => {
        const currentTarget = e.target;
        if(currentRef.current && (currentTarget === currentRef.current ||
            currentTarget === containerRef.current ||
            isChild(currentRef.current, currentTarget) ||
            isChild(containerRef.current, currentTarget))) {
          setTooltipVisible(true);
        } else {
          setTooltipVisible(false);
        }
      }, eventId);
      return () => {
        unSubscribeEvent(APP_EVENT.CLICK, eventId);
      };
    } else {
      subscribeEvent(sunEvent, (currentId) => {
        if(tooltipId !== currentId && (statusRef.current || !leaveClose)) {
          // 进入销毁状态的立即销毁
          setTooltipVisible(false);
        }
      }, tooltipId);
    }
    return () => {
      if(trigger !== 'click') {
        unSubscribeEvent(sunEvent, tooltipId);
      }
    };
  }, []);
  const _onMouseEnter = (e) => {
    const currentTarget = e.currentTarget;
    const show = () => {
      if ((currentTarget.clientWidth < currentTarget.scrollWidth ||
              currentTarget.clientHeight < currentTarget.scrollHeight  || force)
          && visible && title) {
        // if (statusRef.current) {
        //   clearTimeout(statusRef.current);
        //   statusRef.current = null;
        // }
        if(trigger !== 'click') {
          // 清除所有的tooltip
          notify(sunEvent, tooltipId);
        }
       // parentRef.current = currentTarget;
        setTooltipVisible(true);
      }
    };
    if(trigger === 'hover') {
      if(e.buttons === 0) {
        // 非鼠标按下状态
        overStatusRef.current = setTimeout(() => {
          overStatusRef.current = null;
          show();
        }, mouseEnterDelay + 100);
      }
    } else {
      show();
    }
    !propagation && e?.stopPropagation?.();
  };
  const _onMouseLeave = (e) => {
    if(leaveClose && (!e || (e && (e.toElement || e.relatedTarget)))) {
      if (statusRef.current) {
        clearTimeout(statusRef.current);
        statusRef.current = null;
      }
      if (overStatusRef.current) {
        clearTimeout(overStatusRef.current);
        overStatusRef.current = null;
      }
      if(trigger === 'hover') {
        statusRef.current = setTimeout(() => {
          statusRef.current = null;
          containerRef.current && setTooltipVisible(false);
        }, mouseLeaveDelay + 100);
        !propagation && e?.stopPropagation?.();
      } else {
        containerRef.current && setTooltipVisible(false);
      }
    }
  };
  const onContainerMouseEnter = () => {
    if (statusRef.current) {
      clearTimeout(statusRef.current);
      statusRef.current = null;
    }
    setTooltipVisible(true);
  };
  const bodyRef = useRef(null);
  useEffect(() => {
    if(trigger !== 'click' && bodyRef.current) {
      bodyRef.current.addEventListener('mouseenter', onContainerMouseEnter);
      bodyRef.current.addEventListener('mouseleave', _onMouseLeave);
    }
    return () => {
      if(trigger !== 'click' && bodyRef.current) {
        bodyRef.current.removeEventListener('mouseenter', onContainerMouseEnter);
        bodyRef.current.removeEventListener('mouseleave', _onMouseLeave);
      }
    };
  }, [tooltipVisible, visible]);
  useEffect(() => {
    if (tooltipVisible && parentRef.current && containerRef.current) {
      const rect = parentRef.current.getBoundingClientRect();
      containerRef.current.style.display = 'block';
      const containerRect = containerRef.current.getBoundingClientRect();
      if (placement === 'bottom') {
        containerRef.current.style.top = `${rect.bottom + 10 + offsetTop}px`;
        const left = rect.left + (rect.width / 2)
            - containerRef.current.clientWidth / 2 + offsetLeft;
        if(left < 10) {
          // 超出浏览器左侧
          containerRef.current.style.left = '10px';
        } else if((containerRef.current.clientWidth + left) >= window.innerWidth){
          // 超出浏览器右侧
          containerRef.current.style.right = '10px';
        } else if((rect.bottom + 10 + containerRect.height) > window.innerHeight) {
          // 超出浏览器底部 显示到顶部
          const top = rect.top - containerRect.height - 10 + offsetTop;
          if(top < 0) {
            // 判断顶部的高度是否足够 出滚动条
            containerRef.current.style.top = '0px';
            containerRef.current.style.maxHeight = `${rect.top}px`;
            containerRef.current.style.overflow = 'auto';
          } else {
            containerRef.current.style.top = `${top}px`;
          }
          containerRef.current.style.left = `${left}px`;
          arrowRef.current.setAttribute('class', `${currentPrefix}-content-arrow-top`);
        } else {
          // 正常
          containerRef.current.style.left = `${left}px`;
        }
        // 箭头位置 -5 去除padding影响
        arrowRef.current.style.left = `${rect.left - containerRef.current.offsetLeft + rect.width / 2 - 5}px`;
      } else if (placement === 'top') {
        const top = rect.top - containerRect.height - 10 + offsetTop;
        if(top < 0) {
          // 顶部空间不够
          containerRef.current.style.top = `${rect.bottom + 10 + offsetTop}px`;
        } else {
          containerRef.current.style.bottom = `${window.innerHeight - rect.top / conversion + 10 + offsetTop}px`;
        }
        containerRef.current.style.left = `${rect.left / conversion + (rect.width / 2 / conversion) - containerRef.current.clientWidth / 2 + offsetLeft}px`;
      } else if (placement === 'topLeft') {
        titleRef.current.style.maxHeight = `${rect.top - 20}px`;
        titleRef.current.style.maxWidth = `${window.innerWidth - 20}px`;
        containerRef.current.style.bottom = `${window.innerHeight - rect.top + 10 + offsetTop}px`;
        let right = window.innerWidth - rect.x - (rect.width / 2);
        if ((right + containerRect.width) >= window.innerWidth) {
          arrowRef.current.style.right = `${right}px`;
          right = 5;
        }
        containerRef.current.style.right = `${right}px`;
      } else if (placement === 'left') {
        const top = rect.y + rect.height / 2 - containerRef.current.clientHeight / 2;
        containerRef.current.style.top = `${top < 0 ? 0 : top}px`;
        containerRef.current.style.right = `${window.innerWidth - rect.x + offsetRight + 8}px`;
      } else if(placement === 'bottomLeft') {
        titleRef.current.style.maxHeight = `${window.innerHeight - rect.top - rect.height - 20}px`;
        containerRef.current.style.top = `${rect.bottom + 10 + offsetTop}px`;
        containerRef.current.style.left = `${rect.left + offsetTop}px`;
        arrowRef.current.style.left = `${rect.width / 2 - 5}px`;
      } else if(placement === 'bottomRight') {
        titleRef.current.style.maxHeight = `${window.innerHeight - rect.top - rect.height - 20}px`;
        containerRef.current.style.top = `${rect.bottom + 10 + offsetTop}px`;
        containerRef.current.style.left = `${rect.right - containerRef.current.clientWidth}px`;
        arrowRef.current.style.right = `${rect.width / 2 - 5}px`;
      } else if(placement === 'right') {
        const top = rect.y + rect.height / 2 - containerRef.current.clientHeight / 2;
        containerRef.current.style.top = `${top < 0 ? 0 : top}px`;
        containerRef.current.style.left = `${rect.x + rect.width + offsetLeft + 8}px`;
      }
    }
  }, [tooltipVisible]);
  const Compose = useCallback(() => {
    const composeRef = useRef(null);
    useEffect(() => {
      const scrollDom = getScroller(composeRef.current);
      const onScroll = () => {
        setTooltipVisible(false);
      };
      if(scrollDom) {
        scrollDom.addEventListener('scroll', onScroll);
      }
      if(trigger !== 'click') {
        composeRef.current.addEventListener('mouseenter', _onMouseEnter);
        composeRef.current.addEventListener('mouseleave', _onMouseLeave);
      }
      parentRef.current = composeRef.current;
      return () => {
        if(scrollDom) {
          scrollDom.removeEventListener('scroll', onScroll);
        }
        if(trigger !== 'click') {
          composeRef.current.removeEventListener('mouseenter', _onMouseEnter);
          composeRef.current.removeEventListener('mouseleave', _onMouseLeave);
        }
      };
    }, []);
    return React.cloneElement(children, {
      ref: composeRef,
      onClick: (e) => {
        if (clickClose) {
          setTooltipVisible(false);
        }
        if(trigger === 'click') {
          _onMouseEnter({
            currentTarget: e.currentTarget,
          });
          !propagation && e?.stopPropagation?.();
        }
        currentRef.current = e.currentTarget;
        children.props?.onClick?.(e);
      },
    });
  }, [children]);
  return [<Compose key='parent'/>,
  tooltipVisible && visible && title && ReactDom.createPortal(<div
    className={`${currentPrefix}-container`}
    ref={bodyRef}
  >
    <div className={`${currentPrefix}-content ${className}`} ref={containerRef} style={style}>
      <div
        onClick={e => e.stopPropagation()}
        ref={titleRef}>{typeof title === 'object' ? React.cloneElement(title, {
        close: _onMouseLeave,
      }) : title}</div>
      {!closeArrow && <div ref={arrowRef} className={`${currentPrefix}-content-arrow-${placement}`}>{}</div>}
    </div>
  </div>, document.body),
  ];
}));

export default Tooltip;
