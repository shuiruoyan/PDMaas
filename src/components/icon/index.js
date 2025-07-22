import React, {useState, useEffect} from 'react';

import './style/index.less';
import {getPrefix, classesMerge} from '../../lib/classes';
import * as constant from '../../lib/constant';
import {checkPermission} from '../../lib/permission';
import mermaid from './svg/mermaid.svg';

const SVGIcon = {
  'svg-mermaid': mermaid,
};

export default React.forwardRef((props, ref) => {
  const { draggable, className = '', type, style, onClick, title,
    onDragEnd, onMouseDown,
    onDragStart,
    onMouseOver, onMouseLeave, status = constant.NORMAL, nsKey } = props;
  let finalStatus;
  if(nsKey) {
    finalStatus = checkPermission(nsKey) ? status : constant.DISABLE;
  } else {
    finalStatus = status;
  }
  const [iconStatus, setIconStatus] = useState(finalStatus);
  const currentPrefix = getPrefix('components-icon');
  const _onClick = (e) => {
    if(iconStatus === constant.NORMAL) {
      onClick && onClick(e, {setIconStatus});
    }
  };
  const iconType = iconStatus === constant.LOADING ? 'icon-loading' : type;
  useEffect(() => {
    setIconStatus(finalStatus);
  }, [status]);
  if(type) {
    if(type.startsWith('svg')) {
      return <img style={{width: 16, height: 16, verticalAlign: 'middle'}} src={SVGIcon[type]} alt=''/>;
    }
    return (
      <i
        ref={ref}
        onClick={_onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        style={style}
        draggable={draggable}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        className={
              classesMerge({
                fa: type.startsWith('fa-'),
                [`${currentPrefix}-${iconStatus}`]: true,
                [`${currentPrefix}`]: true,
                'ys-iconfont': type.startsWith('icon-'),
                [iconType]: true,
                [className]: true,
              })
            }
        aria-hidden="true"
        title={title}
        >{}</i>
    );
  }
  return null;
});
