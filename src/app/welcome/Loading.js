import React, {useEffect, useRef, useState} from 'react';
import {Message} from 'components';
import {getPrefix} from '../../lib/classes';
import logo from '../main/style/logo.png';
import yonsum from '../main/style/yonsum.svg';
import {setSimpleUserCache} from '../../lib/cache';
import {getSysUser} from '../../lib/app_tool';


export default React.memo(({getUser, updateUser}) => {
    const currentPrefix = getPrefix('welcome-loading');
    const [messages, setMessages] = useState([]);
    const [percent, setPrecent] = useState(0);
    const isDestory = useRef(false);

    useEffect(() => {
        return () => {
            isDestory.current = true;
        };
    }, []);

    const loadUserData = () => {
        setSimpleUserCache(getSysUser());
        setMessages(['正在加载用户数据...']);
        setPrecent(0);
        getUser().then((res) => {
            console.log(res);
        }).catch((err) => {
          updateUser({
            projectHistories: [],
            serviceConfig: {},
          }, true);
          Message.error({title: typeof err === 'string' ? err : err?.message});
        }).finally(() => {
            if(!isDestory.current) {
                setPrecent(100);
                setMessages(p => p.concat('用户数据完成...'));
            }
        });
    };

    useEffect(() => {
        loadUserData();
    }, []);

    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-header`}>
        <div className={`${currentPrefix}-header-left`}>
          <img src={logo} alt=""/>
          <div className={`${currentPrefix}-header-left-title`}>
            <div>PDMaas</div>
            <div>元数建模</div>
          </div>
        </div>
        <div className={`${currentPrefix}-header-middle`}>
                CE
          <span style={{fontWeight: 'bold'}}>(开源版)</span>
        </div>
        <div className={`${currentPrefix}-header-right`}>
          <div>
            <img src={yonsum} alt=""/>
            <span>
              <span>杨数起元</span>
              <span>YONSUM</span>
            </span>
          </div>
          <div>版权所有</div>
        </div>
      </div>
      <div className={`${currentPrefix}-content`} />
      <div className={`${currentPrefix}-content-progress`}>
        <div className={`${currentPrefix}-content-progress-bar`}>
          <div
            className={`${currentPrefix}-content-progress-bar-fill`}
            style={{width: `${percent}%`}}>
            <div style={{left: `calc(${percent}% - 60px)`}}>{percent}%</div>
          </div>
        </div>
        <div className={`${currentPrefix}-content-progress-info`}>
          {messages[messages.length - 1]}
        </div>
      </div>
    </div>;
});
