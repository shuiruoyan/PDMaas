import React, {useState, useEffect, useRef} from 'react';
import TabItem from './TabItem';
import Icon from '../icon';
import DropDown from '../dropdown';
import {getPrefix, classesMerge} from '../../lib/classes';
import { addDomResize, removeDomResize } from '../../lib/listener';
import './style/index.less';
import {antiShake} from '../../lib/event';
import {ViewContent} from '../../lib/context';

const Tab = React.memo(({children,
                            active, defaultActive, onChange, onClose, operation,
                            onOperationClick, onTabClickActive}) => {
    const currentPrefix = getPrefix('components-tab');
    const headerListRef = useRef(null);
    const [currentActive, setCurrentActive] = useState(defaultActive);
    const [headerWidth, setHeaderWidth] = useState(250);
    const resizeFuc = antiShake((rect) => {
        if(rect.width !== 0) {
            setHeaderWidth(rect.width);
        }
    });
    useEffect(() => {
        const resizeId = Math.uuid();
        addDomResize(headerListRef.current, resizeId, resizeFuc);
        return () => {
            removeDomResize(headerListRef.current, resizeId);
        };
    }, []);
    const onActive = (key) => {
        if(active === undefined) {
            setCurrentActive(key);
        }
        onChange && onChange(key);
    };
    const _onClose = (e, key) => {
      e.stopPropagation();
      onClose && onClose(key);
    };
    const menuClick = (m) => {
        if(operation && operation.find(it => it.key === m.key) !== undefined) {
            onOperationClick && onOperationClick(m.key);
            return;
        }
        onActive(m.key);
    };
    const getChildren = () => {
        const maxSize = Math.floor(headerWidth / 120);
        let showChildren, hiddenChildren, itemWidth;
        if(children.length <= maxSize) {
            showChildren = children.slice(0, maxSize);
            itemWidth = headerWidth / showChildren.length;
            hiddenChildren = [];
        } else {
            showChildren = children.slice(children.length - maxSize);
            itemWidth = headerWidth / showChildren.length;
            hiddenChildren = children.slice(0, children.length - maxSize);
        }
        if(operation) {
            hiddenChildren = hiddenChildren.concat([{line: true}, ...operation]);
        }
        // const showChildren = children.slice(0, maxSize);
        // const itemWidth = headerWidth / showChildren.length;
        // const hiddenChildren = children.slice(0, children.length - showChildren.length);
        // 如果隐藏的节点中包含了激活节点 则需要移出
        const activeChildIndex = hiddenChildren.findIndex(c => c.key === active);
        if(activeChildIndex > -1) {
            const temp = hiddenChildren[activeChildIndex];
            if(maxSize > 0) {
                hiddenChildren[activeChildIndex] = showChildren[maxSize - 1];
                showChildren[maxSize - 1] = temp;
            }
        }
        return [showChildren, hiddenChildren, itemWidth];
    };
    const _onTabClickActive = (key) => {
        onActive(key);
        onTabClickActive && onTabClickActive(key);
    };
    const [showChildren, hiddenChildren, itemWidth] = getChildren();
    const finalActive = active === undefined ? currentActive : active;
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-header`}>
        <div className={`${currentPrefix}-header-list`} ref={headerListRef}>
          {
              showChildren.map((c) => {
                    return <span
                      style={{width: itemWidth < 40 ? 40 : itemWidth}}
                      key={c.key}
                      onClick={() => _onTabClickActive(c.key)}
                      className={classesMerge({
                            [`${currentPrefix}-header-item`]: true,
                            [`${currentPrefix}-header-item-active`]: finalActive === c.key,
                        })}>
                      <span>
                        {c.props.title}
                      </span>
                      <Icon
                        onClick={e => _onClose(e, c.key)}
                        className={`${currentPrefix}-header-item-close`}
                        type='icon-close'
                      />
                    </span>;
                })
            }
        </div>
        <div className={`${currentPrefix}-header-more`}>
          <ViewContent.Provider value={false}>
            <DropDown
              menuClick={menuClick}
              trigger='click'
              menus={hiddenChildren
                      .map((c) => {
                          return {key: c.key, name: c.props?.title, ...c};
                      })}
              position='bottom-left'
              >
              <Icon
                type='icon-down-more-copy'
                  />
            </DropDown>
          </ViewContent.Provider>
        </div>
      </div>
      <div className={`${currentPrefix}-body`}>{
          children.map(c => React.cloneElement(c, {
              currentActive: finalActive,
              currentKey: c.key,
          }))
      }</div>
    </div>;
});

Tab.TabItem = TabItem;

export default Tab;


