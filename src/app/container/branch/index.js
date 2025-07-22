import React from 'react';
import {getPrefix} from '../../../lib/classes';
import {openLink} from '../../../lib/app_tool';
import './style/index.less';

export default React.memo(() => {
    const currentPrefix = getPrefix('branch-container-home');
    return <div className={currentPrefix}>
      <div>企业版产品提供分支管理功能，了解详情请[<span
        className={`${currentPrefix}-link`}
        onClick={() => openLink('http://www.yonsum.com/ProductStory?explore=EE')}>点击</span>]这里查看</div>
    </div>;
});
