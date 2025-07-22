import React, {useEffect, useRef, useState} from 'react';
import {ColorPicker, Icon} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import { addBodyClick, removeBodyClick } from '../../../../../lib/listener';

export default React.memo(({onChange}) => {
    const currentPrefix = getPrefix('container-model-relation-celltool');
    const [position, setPosition] = useState(null);
    const colorRef = useRef(null);
    const openColor = (e) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        setPosition((pre) => {
            if(!pre) {
                return {
                    left: `${rect.left}px`,
                    top: `${rect.top + 25}px`,
                };
            }
            return pre;
        });
    };
    useEffect(() => {
        const eventId = Math.uuid();
        colorRef.current.onclick = (e) => {
            openColor(e);
            e.stopPropagation();
        };
        addBodyClick(eventId, () => {
            setPosition(null);
        });
        return () => {
            colorRef.current.onclick = null;
            removeBodyClick(eventId);
        };
    }, []);
    return <span ref={colorRef} className={`${currentPrefix}-customer-color`}>
      <Icon type='icon-palette'/>
      {position && <div style={position} className={`${currentPrefix}-customer-color-picker`}>
        <ColorPicker onChange={(v, complete) => complete && onChange(v.hex)} isSimple/>
        </div>}
    </span>;
});
