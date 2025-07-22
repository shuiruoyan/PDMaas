import React, {useState, forwardRef, useImperativeHandle, useRef} from 'react';
import { Input, Icon } from 'components';
import {getPrefix} from '../../../../../lib/classes';

import './style/index.less';

export default React.memo(forwardRef(({getMind}, ref) => {
    const [expandReplace, setExpandReplace] = useState(false);
    const [search, showSearch] = useState(false);
    const [searchInfo, setSearchInfo] = useState(null);
    const searchRef = useRef(null);
    const currentPrefix = getPrefix('container-model-mind-search');
    const searchValueRef = useRef('');
    const replaceValueRef = useRef('');
    const onSearchChange = (e) => {
        searchValueRef.current = e.target.value;
    };
    const onReplaceChange = (e) => {
        replaceValueRef.current = e.target.value;
    };
    const onKeyDown = (e) => {
        if(e.key === 'Enter') {
            const mind = getMind();
            mind.search.search(searchValueRef.current, () => {
                searchRef.current.focus();
            });
        }
    };
    const onReplace = (isAll) => {
        const mind = getMind();
        if(isAll) {
            mind.search.replaceAll(replaceValueRef.current);
        } else {
            mind.search.replace(replaceValueRef.current, true);
        }
    };
    useImperativeHandle(ref, () => {
        return {
            setSearchInfo,
            showSearch,
        };
    }, []);
    return search ? <div className={currentPrefix}>
      <Icon className={`${currentPrefix}-close`} onClick={() => showSearch(false)} type='icon-close'/>
      <div>
        <span className={`${currentPrefix}-search`}>
          <Icon className={`${currentPrefix}-search-icon`} type='icon-search'/>
          <Input ref={searchRef} onKeyDown={onKeyDown} onChange={onSearchChange}/>
          {searchInfo && <span className={`${currentPrefix}-search-count`}>
              {searchInfo.currentIndex + 1}/{searchInfo.total}
            </span>}
        </span>
        {searchInfo && <span className={`${currentPrefix}-search-replace`} onClick={() => setExpandReplace(true)}>替换</span>}
      </div>
      {expandReplace && <><div>
        <span className={`${currentPrefix}-replace`}>
          <Icon className={`${currentPrefix}-replace-icon`} type='icon-oper-edit'/>
          <Input onChange={onReplaceChange}/>
        </span>
        <span
          className={`${currentPrefix}-replace-cancel`}
          onClick={() => setExpandReplace(false)}>取消</span>
      </div>
        <div className={`${currentPrefix}-footer`}>
          <span onClick={() => onReplace(false)}>替换</span>
          <span onClick={() => onReplace(true)}>全部替换</span>
        </div></>}
    </div> : null;
}));
