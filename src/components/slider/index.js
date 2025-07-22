import React, {useRef, useState, useEffect, useCallback} from 'react';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {antiShake} from '../../lib/event';
import {addDomResize, removeDomResize} from '../../lib/listener';

export default React.memo(({onChange, defaultValue, value, onChangeComplete}) => {
    const [size, setSize] = useState(0);
    const currentPrefix = getPrefix('components-slider');
    const isMoveRef = useRef(false);
    const moveXRef = useRef(0);
    const sizeRef = useRef(0);
    const contentRef = useRef(null);
    const widthRef = useRef(0);
    const changeComplete  = useCallback(antiShake(onChangeComplete || (() => {})), []);
    useEffect(() => {
        const eventId = Math.uuid();
        const currentValue = value === undefined ? defaultValue : value;
        widthRef.current = contentRef.current.clientWidth;
        setSize(widthRef.current * (currentValue || 0));
        addDomResize(contentRef.current, eventId, () => {
            if(widthRef.current === 0 && contentRef.current.clientWidth !== 0) {
                widthRef.current = contentRef.current.clientWidth;
                setSize(widthRef.current * (currentValue || 0));
            }
        });
        return () => {
            removeDomResize(contentRef.current, eventId);
        };
    }, []);
    const onMouseDown = (e) => {
        isMoveRef.current = true;
        moveXRef.current = e.clientX;
        sizeRef.current = value === undefined ?
            size : value * (widthRef.current || 0);
    };
    const onMouseMove = (e) => {
        if(isMoveRef.current) {
            let tempSize = sizeRef.current + (e.clientX - moveXRef.current);
            if(tempSize < 0) {
                tempSize = 0;
            } else if(tempSize > widthRef.current) {
                tempSize = widthRef.current;
            }
            setSize(tempSize);
            const changeSize = tempSize / (widthRef.current);
            onChange && onChange(changeSize);
            changeComplete(changeSize);
        }
    };
    const onMouseLeave = () => {
        isMoveRef.current = false;
        moveXRef.current = 0;
        sizeRef.current = 0;
    };
    const finalSize = value === undefined ?
        (widthRef.current ? size / widthRef.current : 0)
        * 100 : value * 100;
    return <div
      className={currentPrefix}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseLeave}
    >
      <div ref={contentRef} className={`${currentPrefix}-content`}>
        <div className={`${currentPrefix}-content-default`}/>
        <div style={{width: `${finalSize}%`}} className={`${currentPrefix}-content-active`}/>
        <div style={{left: `${finalSize}%`}} onMouseDown={onMouseDown} className={`${currentPrefix}-bar`}/>
      </div>
    </div>;
});
