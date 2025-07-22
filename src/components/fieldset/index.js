import React, { useState, useRef } from 'react';

import Icon from '../icon';

import './style/index.less';
import {getPrefix} from '../../lib/classes';

export default React.memo(({title, children, style, onExpand,
                             defaultExpand = true, expandEnable = true, extra, titleStyle}) => {
  const [expand, setExpand] = useState(defaultExpand);
  const contentRef = useRef(null);
  const expandStr = expand ? 'expand' : 'un-expand';
  const onClick = () => {
    if(expandEnable) {
      onExpand && onExpand(!expand);
      setExpand(!expand);
    }
  };
  const currentPrefix = getPrefix('components-fieldset');
  return <div
    style={style}
    className={`${currentPrefix} ${currentPrefix}-${expandEnable ? 'enable' : 'disable'}`}
  >
    <div onClick={onClick} style={titleStyle}>
      {title}
      {
        expandEnable && <span
          className={`${currentPrefix}-icon`}
        >
          <Icon type={`${expand ? 'icon-up-collapse' : 'icon-down-expand'}`}/>
        </span>
      }
      <span
        className={`${currentPrefix}-extra`}
      >
        {extra}
      </span>
    </div>
    <div ref={contentRef} className={`${currentPrefix}-content ${currentPrefix}-content-${expandStr}`}>
      {children}
    </div>
  </div>;
});
