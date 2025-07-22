import React, {forwardRef, useCallback, useImperativeHandle, useRef, useEffect } from 'react';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import './style/index.less';

export default React.memo(forwardRef(({steps, ...restProps}, ref) => {
    const currentPrefix = getPrefix('container-model-tools-step');
    let tempValue = restProps.value;
    const currentStepRef = useRef(restProps.value);
    currentStepRef.current = tempValue;
    const getPosition = useCallback((i) => {
        switch (i) {
            case 0:
                return {
                    left: '50%',
                };
            case steps.length - 1:
                return {
                    left: 0,
                    right: '50%',
                };
            default:
                return {
                    left: 0,
                };
        }
    }, []);

    useEffect(() => {
    }, []);
    useImperativeHandle(ref, () => {
        return {
            isEnd: () => {
                return currentStepRef.current === steps.length - 1;
            },
        };

    }, []);
    return <div className={`${currentPrefix}`}>
      {
          steps.map((item, i) => {
            return <div className={`${currentPrefix}-item`} key={item.key}>
              <div className={classesMerge({
                    [`${currentPrefix}-item-circle`]: true,
                    [`${currentPrefix}-item-active`]: tempValue === i,
                })}>
                {item.key}
              </div>
              <div className={classesMerge({
                    [`${currentPrefix}-item-label`]: true,
                    [`${currentPrefix}-item-active`]: tempValue === i,
                })}>
                {item.name}
              </div>
              <div style={getPosition(i)} className={`${currentPrefix}-item-line`}/>
            </div>;
        })
      }
    </div>;
}));
