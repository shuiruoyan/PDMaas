import React from 'react';
import {getPrefix} from '../../lib/classes';

export default React.memo(({data}) => {
    const currentPrefix = getPrefix('welcome-version');
    return <div className={currentPrefix}>
      <div>
        <span>版本号</span>
        <span>{data.version}</span>
      </div>
      <div>
        <span>发布日期</span>
        <span>{data.date}</span>
      </div>
      <div>
        <span>版本介绍</span>
        <span>{data.desc}</span>
      </div>
      <div>
        <span>是否强制更新</span>
        <span>{data.forceUpdate ? '是' : '否'}</span>
      </div>
      <div>
        <span>更新日志</span>
        <span className={`${currentPrefix}-log`}>
          {
              data.leaseLog.map((l) => {
                  return <span key={l}>{l}</span>;
              })
            }
        </span>
      </div>
    </div>;
});
