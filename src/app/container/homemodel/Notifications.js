import React from 'react';
import {Icon} from 'components';
import { getPrefix} from '../../../lib/classes';
import {openLink} from '../../../lib/app_tool';

export default React.memo(({data}) => {
    const currentPrefix = getPrefix('container-homeModel-notifications');

    const options = [
        {
            title: '更新通知',
            data: data.filter(d => d.type === 'release'),
            icon: 'fa-bell-o',
        },
        {
            title: '推荐文章',
            data: data.filter(d => d.type === 'news'),
            icon: 'fa-rss',
        },
    ].filter(d => d.data.length > 0);

    const jumpLink = (link) => {
        if(link) {
            openLink(link);
        }
    };
    return <div className={`${currentPrefix}`}>
      {
        options.map((it) => {
          return <div className={`${currentPrefix}-item`} key={it.title}>
            <div className={`${currentPrefix}-item-title`}>
              <span><Icon type={it.icon} /><span>{it.title}</span></span>
            </div>
            <div className={`${currentPrefix}-item-body`}>
              {
                it.data.map((d, index) => {
                  return <div
                    style={{color: d.hot ? 'red' : ''}}
                    key={d.title}
                    onClick={() => jumpLink(d.link)}
                    className={`${currentPrefix}-item-body-item ${currentPrefix}-item-body-item-${d.link ? 'link' : 'normal'}`}>
                    <div>{index + 1}.</div>
                    <div>{d.title}</div>
                  </div>;
                })
              }
            </div>
          </div>;
        })
      }
    </div>;
});
