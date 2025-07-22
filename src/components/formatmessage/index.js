import React, { useContext } from 'react';

import { ConfigContent } from '../../lib/context';
import { getMessage } from '../../lib/utils';
import {getMemoryCache} from '../../lib/cache';
import {CONFIG} from '../../lib/constant';

const string = (params) => {
  // 支持非react组件 纯字符串
  const config = getMemoryCache(CONFIG);
  return getMessage({
    ...params,
    lang: config.lang,
  });
};

const FormatMessage = React.memo(({id = '', format, defaultMessage = '', data}) => {
  const { lang } = useContext(ConfigContent);
  return getMessage({lang, id, defaultMessage, format, data});
});

FormatMessage.string = string;

export default FormatMessage;
