import React, {useCallback, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import { Resize, Icon } from 'components';
import {classesMerge, getPrefix} from '../../../lib/classes';
import './style/index.less';
import Home from './home';
import {getCache, setCache} from '../../../lib/cache';
import Menu from './menu';
import Search from './search';

export default React.memo(forwardRef(({dataSource,
                               updateUserProfile, onSelectedLenChange,
                               onRefresh, getSelectedType,
                               updateUser, config, user,
                                          openProjectSetting}, ref) => {
    const currentPrefix = getPrefix('container-model');
    const menuLeftOpen = getCache('menuLeftOpen', true) || {};
    const [leftOpen, setLeftOpen] = useState(menuLeftOpen[dataSource.id] !== undefined ?
        menuLeftOpen[dataSource.id] : true);
    const homeRef = useRef(null);
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const menuRightOpen = getCache('menuRightOpen', true) || {};
    const [rightOpen, setRightOpen] = useState(menuRightOpen[dataSource.id] !== undefined ?
        menuRightOpen[dataSource.id] : false);
    const quickClick = (position) => {
        if(position === 'left') {
            setCache('menuLeftOpen', {
                ...(getCache('menuLeftOpen', true) || {}),
                [dataSource.id]: !leftOpen,
            });
            setLeftOpen(p => !p);
        } else {
            setCache('menuRightOpen', {
                ...(getCache('menuRightOpen', true) || {}),
                [dataSource.id]: !rightOpen,
            });
            setRightOpen(p => !p);
        }
    };
    const expandHome = useCallback((expand) => {
        setLeftOpen(expand);
        setRightOpen(expand);
    }, []);
    const onDoubleClick = useCallback((node) => {
        homeRef.current.open(node, null, false);
    }, []);
    const onMenuDragStart = useCallback((e, node, selectedData) => {
        const currentTab = homeRef.current.get();
        if(currentTab?.dragCreateNode) {
            currentTab.dragCreateNode(e, node, selectedData);
        } else {
            e.preventDefault();
        }
    }, []);
    const getCurrentTab = useCallback(() => {
        return homeRef.current.getActive();
    }, []);
    const getCurrentMenu = useCallback(() => {
        return menuRef.current;
    }, []);
    const onResizeDrag = (width, position) => {
        const menuPosition = position === 'right' ? 'menuLeftWidth' : 'menuRightWidth';
        setCache(menuPosition, {
            ...(getCache(menuPosition, true) || {}),
            [dataSource.id]: width,
        });
    };
    const jump = useCallback((item, isDetail) => {
        homeRef.current.jump(item, isDetail);
    }, []);
    const showSearch = useCallback((e, selectedNodes) => {
        e.stopPropagation();
        searchRef.current.show(selectedNodes);
    }, []);
    const menuLeftWidth = getCache('menuLeftWidth' ,true) || {};
    useImperativeHandle(ref, () => {
        return {
            setSelectedType: (type) => {
                if(type === 'model') {
                    setCache('menuLeftOpen', {
                        ...(getCache('menuLeftOpen', true) || {}),
                        [dataSource.id]: true,
                    });
                    setLeftOpen(true);
                }
            },
            jump,
            setNodeSelected: id => menuRef.current?.setMenuSelected(id),
        };
    }, []);
    return <div className={currentPrefix}>
      <Resize
        position='right'
        maxSize={600}
        onDrag={v => onResizeDrag(v, 'right')}
      >
        <div
          style={{
                width: menuLeftWidth[dataSource.id] || '',
            }}
          className={classesMerge({
            [`${currentPrefix}-left`]: true,
            [`${currentPrefix}-left-fold`]: !leftOpen,
         })}
        >
          <Menu
            user={user}
            getSelectedType={getSelectedType}
            ref={menuRef}
            getCurrentTab={getCurrentTab}
            onRefresh={onRefresh}
            onSelectedLenChange={onSelectedLenChange}
            onMenuDragStart={onMenuDragStart}
            updateUserProfile={updateUserProfile}
            onDoubleClick={onDoubleClick}
            dataSource={dataSource}
            showSearch={showSearch}
          />
        </div>
      </Resize>
      <div className={`${currentPrefix}-center`}>
        <div
          onClick={() => quickClick('left')}
          className={classesMerge({
                    [`${currentPrefix}-center-quick-left`]: true,
                    [`${currentPrefix}-center-quick-left-fold`]: !leftOpen,
                })}
            >
          <Icon
            type={`icon-double-arrow-${leftOpen ? 'left' : 'right'}`}
                />
        </div>
        <Home
          openProjectSetting={openProjectSetting}
          config={config}
          setLeftOpen={setLeftOpen}
          updateUser={updateUser}
          getSelectedType={getSelectedType}
          getCurrentMenu={getCurrentMenu}
          updateUserProfile={updateUserProfile}
          expandHome={expandHome}
          ref={homeRef}
          user={user}
          dataSource={dataSource}
            />
      </div>
      <Search
        ref={searchRef}
        fixed
        jump={jump}
        dataSource={dataSource}
        project={dataSource.project}
        />
    </div>;
}));
