import React, { useEffect, useRef } from 'react';
import hoistNonReactStatics from '../../lib/statics';
import {addBodyEvent, removeBodyEvent} from '../../lib/listener';

const DragCom = (Com) => {
  const NewCom = React.memo(({dragIndex = 0, offset = 30, refactorPosition, ...restProps}) => {
    const ref = useRef(null);
    useEffect(() => {
      if (ref) {
        const { current } = ref;
        current.style.position = 'absolute';
        const children = current.children;
        const dragDom = children[dragIndex];
        let flag = false;
        let position = {};
        let currentRect = {};
        const eventId = Math.uuid();
        dragDom.onmousedown = (e) => {
          flag = true;
          position = { x: e.clientX, y: e.clientY };
          const rect = current.getBoundingClientRect();
          currentRect = refactorPosition ? refactorPosition(rect) : rect;
        };
        addBodyEvent('onmousemove', eventId, (e) => {
          if (flag) {
            const currentPosition = { x: e.clientX, y: e.clientY };
            let left = currentRect.left + (currentPosition.x - position.x);
            let top = currentRect.top + (currentPosition.y - position.y);
            // 考虑边界情况
            const dragDomRect = dragDom.getBoundingClientRect();
            if (top < 0) {
              top = 0;
            } else if (top > document.body.clientHeight - offset){
              top = document.body.clientHeight - offset;
            }
            if (left < offset - dragDomRect.width) {
              left = offset - dragDomRect.width;
            } else if (left > document.body.clientWidth - offset) {
              left = document.body.clientWidth - offset;
            }
            current.style.left = `${left}px`;
            current.style.top = `${top}px`;
          }
        });
        dragDom.onmouseup = () => {
          flag = false;
        };
        dragDom.style.cursor = 'move';
        dragDom.style.userSelect = 'none';
        return () => {
          removeBodyEvent('onmousemove', eventId);
        };
      }
      return () => {};
    });
    return <Com {...restProps} ref={ref}/>;
  });
  hoistNonReactStatics(NewCom, Com);
  return NewCom;
};

export default DragCom;
