import React from 'react';
import ReactDom from 'react-dom';
import Icon from 'components/icon';

import './style/index.less';
import {getPrefix} from '../../lib/classes';

const Message = React.memo(({title, status, icon, onClose}) => {
  const currentPrefix = getPrefix('components-message');
  return <div
    className={currentPrefix}
  >
    <span className={`${currentPrefix}-${status}`}><Icon type={icon}/></span>
    <span>{title}</span>
    <Icon className={`${currentPrefix}-close`} type='icon-close' onClick={onClose} />
  </div>;
});

const renderMessage = ({
                         time = 15000,
                         ...restProps
                       }) => {
  const currentPrefix = getPrefix('components-message');
  let dom = document.querySelector(`.${currentPrefix}-container`);
  if (!dom) {
    dom = document.createElement('div');
    dom.setAttribute('class', `${currentPrefix}-container`);
    document.body.appendChild(dom);
  }
  const tempDom = document.createElement('div');
  tempDom.setAttribute('class', `${currentPrefix}-context`);
  dom.appendChild(tempDom);
  const removeMessage = () => {
    if (tempDom.parentElement) {
      tempDom.parentElement.removeChild(tempDom);
    }
  };
  ReactDom.render(<Message {...restProps} onClose={removeMessage}/>, tempDom, () => {
    setTimeout(() => {
      // tempDom.parentElement.removeChild(tempDom);
      removeMessage();
    }, time);
  });
};

Message.success = ({title, time}) => {
  // 操作成功提示
  renderMessage({title, time, status: 'success', icon: 'icon-check'});
};

Message.error = ({title, time}) => {
  // 操作失败提示
  renderMessage({title, time, status: 'error', icon: 'icon-close'});
};

Message.warring = ({title, time}) => {
  // 操作提示
  renderMessage({title, time, status: 'warring', icon: 'icon-warning-circle'});
};

export default Message;
