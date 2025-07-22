import React, { useEffect, useRef } from 'react';
import { Icon, Modal } from 'components';
import { minimize, close, resizable, maximize, maximizeChange, fullScreen } from '../../../lib/electron-window-opt';

import './style/index.less';
import {getPrefix} from '../../../lib/classes';

export default React.memo(({title, resizeable, config, dataSource}) => {
  const info = dataSource ? (config.path || '参考案例项目') : '';
  const iconRef = useRef(null);
  const currentPrefix = getPrefix();
  const _close = () => {
    Modal.confirm({
      title: '关闭软件确认',
      message: config.cmdHistory.length > 0 ? '当前项目还有内容尚未保存，确定要关闭？' : '确定关闭？',
      onOk: () => {
        close();
      },
      okText: '确定',
      cancelText: '取消',
    });
  };
  useEffect(() => {
    // 如果是可以调整大小 则需要开启electron的大小调整功能
    if (resizeable) {
      const { current } = iconRef;
      maximizeChange((type) => {
        if (process.platform === 'darwin') {
          if (type === 'enter-full-screen') current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-min darwin-window-fullscreen`);
          else current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-min`);
        } else {
          current.setAttribute('class', 'fa fa-window-restore');
        }
      }, () => {
        if (process.platform === 'darwin') {
          current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-max`);
        } else {
          current.setAttribute('class', 'fa fa-window-maximize');
        }
      });
      resizable(true);
      return () => {
        maximizeChange(null, null);
        //resizable(false);
      };
    }
    return () => {};
  }, []);
  const fullScreenClick = () => {
    const { current } = iconRef;
    if (process.platform === 'darwin') {
      if (!current?.getAttribute('class').includes('fullscreen')) {
        fullScreen(true);
        current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-min darwin-window-fullscreen`);
      } else {
        fullScreen(false);
        current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-max`);
      }
    } else if (current?.getAttribute('class').includes('fa-window-maximize')) {
        maximize(true);
        current.setAttribute('class', 'fa fa-window-restore');
      } else {
        maximize(false);
        current.setAttribute('class', 'fa fa-window-maximize');
      }
  };
  const titleBarDoubleClick = () => {
    const { current } = iconRef;
    if (process.platform === 'darwin') {
      if (current?.getAttribute('class').includes('fullscreen')) return;
      if (current?.getAttribute('class').includes('max')) {
        maximize(true);
        current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-min`);
      } else {
        maximize(false);
        current.setAttribute('class', `${currentPrefix}-toolbar-opt-darwin-max`);
      }
    } else if (current?.getAttribute('class').includes('fa-window-maximize')) {
        maximize(true);
        current.setAttribute('class', 'fa fa-window-restore');
      } else {
        maximize(false);
        current.setAttribute('class', 'fa fa-window-maximize');
      }
  };
  const darwinClass = process.platform === 'darwin' ? ` ${currentPrefix}-toolbar-title-darwin` : '';
  return <div className={`${currentPrefix}-toolbar`} onDoubleClick={titleBarDoubleClick}>
    <span className={`${currentPrefix}-toolbar-title${darwinClass}`}>
      <span>{}</span>
      <span>{title}</span>
      <span
        className={`${currentPrefix}-toolbar-info`}
        title={info}
        >
        {info}
      </span>
    </span>
    {
      process.platform !== 'darwin' ? <span className={`${currentPrefix}-toolbar-opt`}>
        <Icon type='fa-window-minimize' onClick={minimize}/>
        {
          resizeable ? <Icon type='fa-window-maximize' onClick={fullScreenClick} ref={iconRef}/> : ''
        }
        <Icon type='fa-window-close-o' onClick={_close}/>
      </span> : <span className={`${currentPrefix}-toolbar-opt-darwin`}>
        <span onClick={_close}><Icon type='fa-times'/></span>
        <span onClick={minimize}><Icon type='fa-minus'/></span>
        <span className={`${currentPrefix}-toolbar-opt-darwin-max`} ref={iconRef} onClick={fullScreenClick}>{}</span>
      </span>
    }
  </div>;
});
