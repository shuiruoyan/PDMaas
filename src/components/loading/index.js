import React from 'react';
import ReactDOM from 'react-dom';

import Icon from '../icon';
import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';

export const Loading = React.memo(({title, children, index,
                                     visible = false, isFull = false, customerStyle}) => {
  const currentPrefix = getPrefix('components-loading');
  return (
    <React.Fragment>
      <div
        style={{zIndex: index || 1000}}
        className={
        classesMerge({
          [`${currentPrefix}`]: true,
          [`${currentPrefix}-full`]: isFull,
          [`${currentPrefix}-show`]: visible,
        })}>
        <div className={`${currentPrefix}-bg`}>
          <div className={`${currentPrefix}-content`} style={customerStyle}>
            <Icon type='icon-loading'/>
            <span>{title}</span>
          </div>
        </div>
      </div>
      {children}
    </React.Fragment>
  );
});


export const closeLoading = (id) => {
  const currentPrefix = getPrefix('components-loading');
  const loadingDom = document.getElementById(id || currentPrefix);
  loadingDom && loadingDom.parentElement.removeChild(loadingDom);
};


export const openLoading = (title, id, customerStyle) => {
  closeLoading(id);
  const currentPrefix = getPrefix('components-loading');
  const loadingDom = document.createElement('div');
  loadingDom.setAttribute('id', id || currentPrefix);
  document.body.appendChild(loadingDom);
  // eslint-disable-next-line max-len
  ReactDOM.render(<Loading title={title} visible isFull customerStyle={customerStyle}/>, loadingDom);
};
