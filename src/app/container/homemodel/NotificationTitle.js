import React, {useEffect, useState} from 'react';
import {Icon, Tooltip} from 'components';
import Notifications from './Notifications';

export default React.memo(({version, currentPrefix, jumpLink}) => {
    const [currentLinkIndex, setCurrentLinkIndex] = useState(0);

    useEffect(() => {
        if(version) {
            setCurrentLinkIndex(0);
            setInterval(() => {
                setCurrentLinkIndex((p) => {
                    if(p + 1 === version.notice.length) {
                        return 0;
                    }
                    return p + 1;
                });
            }, 5000);
        }
    }, [version]);

    return version && version.notice.length > 0 && <div className={`${currentPrefix}-header-middle`}>
      <div><Icon type="icon-sound"/></div>
      <div
        style={{color: version.notice[currentLinkIndex].hot ? 'red' : ''}}
        onClick={() => jumpLink(version.notice[currentLinkIndex].link)}
        className={`${currentPrefix}-header-middle-${version.notice[currentLinkIndex].link ? 'link' : 'normal'}`}>[{version.notice[currentLinkIndex].type === 'news' ? '推荐文章' : '更新通知'}]{version.notice[currentLinkIndex].title}
      </div>
        {version.notice.length > 1 && <Tooltip
          force
          placement="bottomRight"
          trigger='hover'
          title={<Notifications data={version.notice}/>}
        >
          <div>
            <span><Icon type="icon-down-expand"/></span>
            <span>还有{version.notice.length - 1}篇</span>
          </div>
        </Tooltip>}
    </div>;
});
