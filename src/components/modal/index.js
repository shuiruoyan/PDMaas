import React, { useEffect, useRef, useImperativeHandle } from 'react';
import ReactDom from 'react-dom';
import { Button, FormatMessage } from 'components';

import { ViewContent } from '../../lib/context';
import Icon from '../icon';
import DragCom from '../dragcom';
import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {notify} from '../../lib/subscribe';
import {APP_EVENT} from '../../lib/constant';

export const Modal = DragCom(React.memo(React.forwardRef(({title, onClose, focusFirst,
                    children, small, status, buttons = [], closeable = true, onEnter,
                    fullScreen, bodyStyle = {}, modalStyle = {}, contentStyle = {},
                    header, model, readonly, icon, preventClick }, forwardRef) => {
  const isView = readonly;
  const currentPrefix = getPrefix('components-modal');
  const _iconClose = () => {
    onClose && onClose();
  };
  const modalClick = (e) => {
    !preventClick && notify(APP_EVENT.CLICK, e);
  };
  const ref = useRef(null);
  const fullScreenStyle = fullScreen ? { width: '100%', borderRadius: 0 } : {};
  const fullScreenModalStyle = fullScreen ? { borderRadius: 0, overflow: 'hidden' } : {};
  const fullScreenContentStyle = fullScreen ? { height: 'calc(100vh - 32px)', maxHeight: 'calc(100vh - 32px)' } : {};
  useImperativeHandle(model, () => {
    return {
      focus: (index = 0) => {
        const inputs = Array.from(ref.current.querySelectorAll('input'))
      .filter(i => !i.getAttribute('type') || i.getAttribute('type') === 'text');
        inputs[index]?.focus();
        inputs[index]?.setSelectionRange(0,  inputs[index].value.length);
      },
    };
  }, []);
  useEffect(() => {
    const { current } = ref;
    if (focusFirst) {
      const firstInput = current.querySelector('input');
      firstInput && firstInput.focus();
    } else {
      current && current.focus();
    }
  });
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && closeable) {
      // 按了键盘的返回键
      onClose && onClose();
    }
    if (e.key === 'Enter') {
      onEnter && onEnter();
    }
    //ArrowDown
    //ArrowUp
    //ArrowLeft
    //ArrowRight
    //Tab
    if(e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const itemPrefix = getPrefix('components-form-item');
      const items = ref.current.querySelectorAll(`.${itemPrefix}`);
      const target = e.target;
      const currentIndex = Array.from(items).findIndex((d) => {
        return d.compareDocumentPosition(target) === 20;
      });
      const focusDom = (index) => {
        let domIndex = 0;
        if(e.key === 'ArrowUp') {
          domIndex = index === 0 ? items.length - 1 : index - 1;
        } else {
          domIndex = index === items.length - 1 ? 0 : index + 1;
        }
        const nextDom = items[domIndex];
        if(nextDom) {
          const input = nextDom.querySelector('input');
          const textarea = nextDom.querySelector('textarea');
          const dom = (input || textarea);
          if(dom && (!dom.getAttribute('type') || dom.getAttribute('type') === 'text')) {
            dom.focus();
            dom.setSelectionRange(0,  dom.value.length);
          } else {
            focusDom(domIndex);
          }
        }
      };
      focusDom(currentIndex);
    }
  };
  return (
    <ViewContent.Provider value={isView}>
      <div
        className={currentPrefix}
        style={{...fullScreenModalStyle, ...modalStyle}}
        tabIndex='1'
        onKeyDown={onKeyDown}
        ref={ref}
        onClick={modalClick}
        >
        <div
          className={`${currentPrefix}-container ${small ? `${currentPrefix}-header-small` : ''}`}
          ref={forwardRef}
          style={{...fullScreenStyle, ...bodyStyle}}
          >
          {header || <div
            style={fullScreenStyle}
            className={`${currentPrefix}-header`}
            >
            <div
              className={`${currentPrefix}-header-title ${small ? `${currentPrefix}-content-small-${status}` : ''}`}>{title}</div>
              {closeable && <Icon className={`${currentPrefix}-header-icon`} type={icon || 'icon-close'} onClick={_iconClose}/>}
            </div>}
          <div
            className={`${currentPrefix}-content ${small ? `${currentPrefix}-content-small` : ''}`}
            style={{
                  ...contentStyle,
                  ...fullScreenContentStyle,
                }}
            >
            <div className={`${currentPrefix}-body`}>
              {children}
            </div>
            <div
              className={`${currentPrefix}-footer`}
              style={{display: buttons.length > 0 ? '' : 'none'}}
              >
              {isView ? buttons[0] : buttons}
            </div>
          </div>
        </div>
      </div>
    </ViewContent.Provider>
  );
})));

const modalInstance = {};
export const openModal = (com, params) => {
  const modalId = params.id || Math.uuid();
  if (!modalInstance[modalId]) {
    const modalRef = React.createRef(null);
    const dom = document.createElement('div');
    document.body.appendChild(dom);
    const close = () => {
      const result = ReactDom.unmountComponentAtNode(dom);
      if (result) {
        delete modalInstance[modalId];
        dom.parentElement.removeChild(dom);
      }
    };
    modalInstance[modalId] = {close};
    const focus = (index) => {
      modalRef.current.focus(index);
    };
    const ModalCompose = () => {
      const {
        title, small, buttons, status, fullScreen, bodyStyle, readonly,
        modalStyle, contentStyle, closeable, focusFirst, onEnter, header, icon,
        preventClick,
      } = params;
      const _iconClose = () => {
        const {onClose} = params;
        onClose && onClose();
        close();
      };
      return (
        <Modal
          icon={icon}
          model={modalRef}
          onEnter={onEnter}
          closeable={closeable}
          modalStyle={modalStyle}
          bodyStyle={bodyStyle}
          contentStyle={contentStyle}
          fullScreen={fullScreen}
          status={status}
          small={small}
          title={title}
          onClose={_iconClose}
          buttons={buttons}
          focusFirst={focusFirst}
          header={header}
          readonly={readonly}
          preventClick={preventClick}
          >
          {React.cloneElement(com, {
            _close: close,
          })}
        </Modal>
      );
    };
    ReactDom.render(<ModalCompose/>, dom);
    return {
      close,
      focus,
    };
  }
  return {};
};

Modal.instance = () => {
  return {
    ...modalInstance,
  };
};

Modal.error = ({title, message, bodyStyle = {}, contentStyle = {}, id, buttons, preventClick}) => {
  return openModal(<React.Fragment>
    <span style={{overflow: 'auto', padding: '5px 0px 15px 0px'}}>{message}</span>
  </React.Fragment>, {
    bodyStyle,
    contentStyle,
    title: <span><Icon type='icon-close'/>{title}</span>,
    small: true,
    status: 'error',
    id,
    buttons,
    preventClick,
  });
};

Modal.success = ({title, message, bodyStyle, contentStyle}) => {
  return openModal(<React.Fragment>
    <span style={{overflow: 'auto', padding: '5px 0px 15px 0px'}}>{message}</span>
  </React.Fragment>, {
    title: <span><Icon type='icon-check-solid'/>{title}</span>,
    small: true,
    status: 'success',
    bodyStyle,
    contentStyle,
  });
};

Modal.warring = ({title}) => {
  return openModal(title, {small: true, status: 'error'});
};

Modal.info = ({title, message, bodyStyle, contentStyle, closeable, buttons}) => {
  return openModal(<React.Fragment>
    <div style={{overflow: 'auto', padding: '5px 0px 15px 0px'}}>{message}</div>
  </React.Fragment>, {
    title: <span><Icon type='icon-warning-circle'/>{title}</span>,
    small: true,
    status: 'info',
    bodyStyle,
    contentStyle,
    closeable,
    buttons,
  });
};

Modal.confirm = ({title, message, onOk, onCancel, okText, cancelText}) => {
  let modal = null;
  const _onCancel = () => {
    modal && modal.close();
    onCancel && onCancel();
  };
  const _onOK = (e, btn) => {
    const result = onOk && onOk(e, btn);
    if(result?.then) {
      result.then(() => {
        modal && modal.close();
      });
    } else {
      modal && modal.close();
    }
  };
  modal = openModal(<React.Fragment>
    <div style={{overflow: 'auto', padding: '5px 0px 15px 0px'}}>{message}</div>
  </React.Fragment>, {
    small: true,
    closeable: false,
    title: <span><Icon type='fa-question'/>{title}</span>,
    status: 'warring',
    buttons: [
      <Button key='onOK' onClick={_onOK} type='primary'>
        {okText || <FormatMessage id='button.ok'/>}
      </Button>,
      <Button key='onCancel' onClick={_onCancel}>
        {cancelText || <FormatMessage id='button.cancel'/>}
      </Button>],
  });
};
