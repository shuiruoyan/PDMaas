import React, {useMemo, useRef, useEffect} from 'react';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import { addBodyEvent, removeBodyEvent } from '../../lib/listener';
import {notify} from '../../lib/subscribe';

export default React.memo(({
                               children, position,
                               onDrag,
                               minSize = 100,
                                maxSize = 400,
                           }) => {
    const resizeId = useMemo(() => Math.uuid(), []);
    const currentPrefix = getPrefix('components-resize');
    const moveRef = useRef(null);
    const containerRef = useRef(null);
    const dragData = useRef({
        isDrag: false,
    });
    const onMouseUp = () => {
        if(dragData.current.isDrag) {
            moveRef.current.style.display = 'none';
            if(position === 'right' || position === 'left'){
                containerRef.current.style.width = `${dragData.current.tempSize}px`;
            } else {
                containerRef.current.style.height = `${dragData.current.tempSize}px`;
            }
            onDrag && onDrag(dragData.current.tempSize);
            dragData.current = {
                isDrag: false,
                currentSize: dragData.current.tempSize,
            };
            notify('endResize');
        }
    };
    useEffect(() => {
        addBodyEvent('onmousemove', resizeId, (e) => {
            if(dragData.current.isDrag) {
                if(position === 'right' || position === 'left') {
                    const offsetX = e.clientX - dragData.current.x;
                    const tempSize = position === 'right' ? dragData.current.currentSize + offsetX
                        : dragData.current.currentSize - offsetX;
                    if((tempSize <= maxSize) && (tempSize >= minSize)) {
                        //  containerRef.current.style.width = `${tempSize}px`;
                        moveRef.current.style.left = `${e.clientX}px`;
                        dragData.current.tempSize = tempSize;
                    }
                } else {
                    const offsetY = e.clientY - dragData.current.y;
                    const tempSize = position === 'bottom' ? dragData.current.currentSize + offsetY
                        : dragData.current.currentSize - offsetY;
                    if((tempSize <= maxSize) && (tempSize >= minSize)) {
                        //  containerRef.current.style.width = `${tempSize}px`;
                        moveRef.current.style.top = `${e.clientY}px`;
                        dragData.current.tempSize = tempSize;
                    }
                }
                e.preventDefault();
            }
        });
        addBodyEvent('onmouseup', resizeId, onMouseUp);
        return () => {
            removeBodyEvent('onmousemove', resizeId);
            removeBodyEvent('onmouseup', resizeId);
        };
    }, []);
    const onMouseDown = (e) => {
        notify('startResize');
        if(position === 'right' || position === 'left') {
            const rect = containerRef.current.getBoundingClientRect();
            moveRef.current.style.left = `${e.clientX}px`;
            moveRef.current.style.height = `${rect.height}px`;
            moveRef.current.style.top = `${rect.top}px`;
            moveRef.current.style.display = 'block';
            dragData.current = {
                ...dragData.current,
                x: e.clientX,
                isDrag: true,
                currentSize: rect.width,
            };
        } else {
            const rect = containerRef.current.getBoundingClientRect();
            moveRef.current.style.left = `${rect.left}px`;
            moveRef.current.style.width = `${rect.width}px`;
            moveRef.current.style.top = `${e.clientY}px`;
            moveRef.current.style.display = 'block';
            dragData.current = {
                ...dragData.current,
                y: e.clientY,
                isDrag: true,
                currentSize: rect.height,
            };
        }
    };
    return <>
      <div ref={moveRef} className={`${currentPrefix}-border-move-${position}`} />
      {React.cloneElement(children, {
          ref: containerRef,
          style: {position: 'relative', ...(children.props?.style || {})},
          children: [<div
            key='border'
            onMouseDown={onMouseDown}
            className={`${currentPrefix}-border-${position}`}
          />].concat(children.props.children),
      })}
    </>;
});
