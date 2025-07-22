import { combineReducers } from 'redux';

import core from './core';
import config from './config';
import user from './user';

export default combineReducers({
  core,
  config,
  user,
});
