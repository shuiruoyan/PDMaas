import React, {useImperativeHandle, useState, forwardRef} from 'react';
import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';
import {checkPermission} from '../../lib/permission';

export default React.memo(forwardRef(({options, defaultActive, active, tabChange,
                                          onTabItemClick}, ref) => {
    const currentPrefix = getPrefix('components-simpletab');
    const verifyActive = (key) => {
        if (key === undefined) {
            return key;
        }
        let tempActive;
        options.forEach((o) => {
            if(o.key === key) {
                let disable;
                if(o.disable !== undefined) {
                    disable = o.disable;
                } else if(o.nsKey !== undefined) {
                    disable = !(checkPermission(o.nsKey));
                }
                if(!disable) {
                    tempActive = key;
                }
            }
        });
        return tempActive;
    };
    const getAllowActive = () => {
        let tempActive;
        options.forEach((o) => {
            let disable;
            if(o.disable !== undefined) {
                disable = o.disable;
            } else if(o.nsKey !== undefined) {
                disable = !(checkPermission(o.nsKey));
            }
            if(!disable && tempActive === undefined) {
                tempActive = o.key;
            }
        });
        return tempActive;
    };
    const [activeState, setActiveState] = useState(() => {
        let tempActive = verifyActive(active);

        if(tempActive === undefined) {
            return verifyActive(defaultActive) || getAllowActive();
        }
        return tempActive;
    });

    useImperativeHandle(ref, () => ({
        setActiveState,
    }),[]);

    const _setActiveState = (key, disable) => {
        if(disable) {
            return;
        }
        onTabItemClick && onTabItemClick(key);
        if(active === undefined) {
            setActiveState(key);
        } else {
            tabChange && tabChange(key);
        }
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-header`}>
        {options.map((o) => {
                let disable;
                if(o.disable !== undefined) {
                    disable = o.disable;
                } else if(o.nsKey !== undefined) {
                    disable = !(checkPermission(o.nsKey));
                }
                return <span
                  onClick={() => _setActiveState(o.key, disable)}
                  className={classesMerge({
                        [`${currentPrefix}-header-item`]: true,
                        [`${currentPrefix}-header-item-active`]: o.key === activeState,
                        [`${currentPrefix}-header-item-normal`]: o.key !== activeState,
                        [`${currentPrefix}-header-item-disable`]: disable,
                    })}
                  key={o.key}
                >
                  {o.title}
                </span>;
            })}
        <span className={`${currentPrefix}-header-extra`}>
          {options.find(o => o.key === activeState)?.extra}
        </span>
      </div>
      <div className={`${currentPrefix}-body`}>
        {options.map((o) => {
                return <div
                  className={classesMerge({
                        [`${currentPrefix}-body-item`]: true,
                        [`${currentPrefix}-body-item-active`]: o.key === activeState,
                        [`${currentPrefix}-body-item-normal`]: o.key !== activeState,
                    })}
                  key={o.key}
                >
                  {o.content && React.cloneElement(o.content, {
                      activeState,
                  })}
                </div>;
            })}
      </div>
    </div>;
}));
