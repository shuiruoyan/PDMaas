import React, {useEffect, useMemo, useRef, useState} from 'react';

import {Icon, Button, openModal} from 'components';
import {classesMerge, getPrefix} from '../../lib/classes';
import logo from '../main/style/logo.png';
import json from '../../../package';
import './style/index.less';
import HomeModel from '../container/homemodel';
import defaultProfile from '../../lib/default_profile';
import {openLink} from '../../lib/app_tool';
import {compareVersion, getVersion} from '../../lib/update';
import Version from './Version';
import NotificationTitle from '../container/homemodel/NotificationTitle';

export default React.memo(({open, openDemo, create, updateUser, user, demoList}) => {
    const currentPrefix = getPrefix('welcome-homePage');
    const [version, setVersion] = useState(null);
    const bodyComponents = useMemo(() => [
        {
            type: 'model',
            icon: 'icon-model-design',
            name: '模型',
            content: HomeModel,
        },
    ], []);
    const getContent = (type) => {
        return bodyComponents.find(t => t.type === type).content;
    };

    const comRef = useRef({});
    const userConfigRef = useRef({});

    const [loadContent, updateLoadContent] = useState([{
        type: bodyComponents[0].type,
        content: getContent(bodyComponents[0].type),
    }]);
    const [selectedType, setSelectedType] = useState(bodyComponents[0].type);

    userConfigRef.current = {...(user || {})};

    const getVersionData = () => {
        getVersion().then((res) => {
            setVersion(res);
            if(res.release && compareVersion(res.release.version)) {
                let model = null;
                const onOk = () => {
                    // eslint-disable-next-line no-use-before-define
                    jumpLink(res.release.downloadURL);
                };
                const onCancel = () => {
                    model && model.close();
                };
                model = openModal(<Version data={res.release}/>, {
                    title: '检测到新版本',
                    closeable: !res.release.forceUpdate,
                    bodyStyle: {
                        width: '80%',
                    },
                    buttons: [
                      <Button key='ok' type='primary' onClick={onOk}>
                            去升级
                      </Button>,
                      <Button key='cancel' onClick={onCancel}>
                            以后再说
                      </Button>].filter((b, i) => {
                          if(res.release.forceUpdate) {
                              return i === 0;
                          } else {
                              return true;
                          }
                    }),
                });
            }
        });
    };

    useEffect(() => {
        getVersionData();
    }, []);

    const initComInstance = (instance, type) => {
        comRef.current[type] = instance;
    };

    const getCurrentUserConfig = () => {
        return userConfigRef.current;
    };

    const _setSelectedType = (type, disable) => {
        if(!disable) {
            if(loadContent.find(c => c.type === type)) {
                setSelectedType(type);
            } else {
                setSelectedType(type);
                updateLoadContent(p => p.concat({
                    type,
                    content: getContent(type),
                }));
            }
        }
        comRef.current[type]?.setSelectedType?.(type);
    };

    const jumpLink = (link) => {
        if(link) {
            openLink(link);
        }
    };

    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-header`}>
        <div className={`${currentPrefix}-header-left`}>
          <img src={logo} alt=""/>
          <div className={`${currentPrefix}-header-left-title`}>
            <div>
              <span>PDMaas</span>
              <span>v{json.version}</span>
              <span>CE<span>(开源版)</span></span>
            </div>
            <div>
              <span>元数建模</span>
            </div>
          </div>
        </div>
        <NotificationTitle version={version} currentPrefix={currentPrefix} jumpLink={jumpLink}/>
        <div className={`${currentPrefix}-header-right`}>
          <span onClick={() => jumpLink('http://www.yonsum.com/ProductStory?explore=EE')}>立即探索企业版</span>
        </div>
      </div>
      <div className={`${currentPrefix}-body`}>
        <div className={`${currentPrefix}-body-left`}>
          {
            bodyComponents.map((t) => {
              return <div
                onClick={() => _setSelectedType(t.type, false)}
                key={t.type}
                className={classesMerge({
                  [`${currentPrefix}-body-left-item`]: true,
                  [`${currentPrefix}-body-left-item-bottom`]: t.bottom,
                  [`${currentPrefix}-body-left-item-selected`]: t.type === selectedType,
                })}>
                <span><Icon type={t.icon}/></span>
                <span>{t.name}</span>
              </div>;
            })
          }
        </div>
        <div className={`${currentPrefix}-body-right`}>
          {
            loadContent.map((c) => {
              const Com = c.content;
                return <div
                  className={`${currentPrefix}-body-right-item`}
                  key={c.type}
                  style={{display: c.type === selectedType ? 'block' : 'none'}}
                >
                  <Com
                    create={create}
                    demoList={demoList}
                    openDemo={openDemo}
                    ref={instance => initComInstance(instance, c.type)}
                    open={open}
                    updateUser={updateUser}
                    setSelectedType={_setSelectedType}
                    dataSource={{profile: {...(defaultProfile || {})}}}
                    getCurrentUserConfig={getCurrentUserConfig}
                    userConfig={user}
                  />
                </div>;
              })
          }
        </div>
      </div>
    </div>;
});
