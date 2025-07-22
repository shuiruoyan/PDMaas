import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import { logger } from 'redux-logger';
import {Modal} from 'components';
import reducers from './reducers';
import './style/detault.less';
import { notify } from './lib/subscribe';
import {APP_EVENT} from './lib/constant';
import Welcome from './app/welcome';


const store = createStore(reducers,
    {},
    applyMiddleware(
        thunkMiddleware,
        BUILD_ENV.env === 'dev' ? logger : () => next => action => next(action),
    ));


class Container extends React.Component{
  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error) {
    Modal.error({
      title: '出错了',
      message: <span>
          程序出现异常，{error.message}
      </span>,
    });
    console.log(error);
  }
  onContextMenu = (e) => {
    e.stopPropagation();
    // e.preventDefault();
  };

  onClick = (e) => {
    notify(APP_EVENT.CLICK, e);
  }

  render() {
    return <div
      onClick={this.onClick}
      onContextMenu={this.onContextMenu}
      style={{width: '100%', height: '100%'}}
    >
      <Welcome/>
    </div>;
  }
}


function render(props) {
  const { container } = props;
  ReactDOM.render(<Provider store={store}><Container/></Provider>, container ? container.querySelector('#app') : document.querySelector('#app'));
}

render({});

