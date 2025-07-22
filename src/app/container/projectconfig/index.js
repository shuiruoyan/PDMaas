import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {Message} from 'components';
import {projectConfigTabs, selectFrameOptions} from './tabs';
import './style/index.less';
// eslint-disable-next-line import/order
import {classesMerge} from '../../../lib/classes';
import {subscribeEvent, unSubscribeEvent} from '../../../lib/subscribe';


export default React.memo(forwardRef(({ baseClass, getCurrentStandard, getCurrentDataSource,
                                          dataSource, user, defaultActive }, ref) => {
    const displayDomRef = useRef(null);
    const [defaultSetting, setDefaultSetting] = useState(null);
    // 最终命令对象，当数据库中没有数据的时候，进行初始化设置，从mock的JSON中获取默认数据
    const [commandObj, setCommandObj] = useState(dataSource.profile.project.setting || {});
    const commandObjRef = useRef(commandObj);
    commandObjRef.current = {...commandObj};
    const updateTab = () => {
        return projectConfigTabs.map(it => ({
            ...it,
            dataList: (() => {
                const settingKeys = Object.keys(commandObjRef.current);
                const itemStr = settingKeys.find(o => it.id === o);
                const settingItem = commandObjRef.current[itemStr] || [];
                // eslint-disable-next-line max-len
                let dataList = Array.isArray(settingItem) ? settingItem : Object.keys(settingItem).map(p => ({ ...settingItem[p], defKey: p, id: Math.uuid() }));
                return dataList.sort((a, b) => a?.orderValue - b?.orderValue);
            })(),
        }));
    };
    const [tabs, setTabs] = useState(updateTab());
    // 设置默认选中第一个标签页
    const [activeTab, setActiveTab] = useState(defaultActive || tabs[0].id);
    // 设置默认展示第一个标签页中的组件
    const [DisplayCom, setDisplayCom] = useState(tabs[0].component);
    // 处理标签点击
    const handleTabClick = useCallback((tabItem) => {
        setActiveTab(tabItem.id);
    }, [activeTab]);
    const fieldViewArray = useMemo(() => {
        const fieldTab = tabs.find(it => it.id === 'physicEntityFieldAttr');
        const fieldDataList = fieldTab?.dataList;
        return (fieldDataList || []).map(it => ({
            key: it.defKey,
            component: (() => {
                const optionItem = selectFrameOptions.find(p => p.value === it.editType);
                return optionItem.component || React.Fragment;
            })(),
            options: (() => {
                try {
                    return JSON.parse(it.optionsData);
                } catch (err) {
                    return [];
                }
            })(),
        }));
    }, [tabs]);
    useEffect(() => {
        let currentTab = tabs.find(it => it.id === activeTab);
        setDisplayCom(currentTab.component);
    }, [activeTab]);
    useEffect(() => {
        if (commandObj) {
            setDefaultSetting(null);
            setTabs(updateTab());
        }
    }, [commandObj]);
    // eslint-disable-next-line max-len
    useImperativeHandle(ref, () => ({
        getCommandObj: () => {
            return commandObjRef.current;
        },
        setCommandObj,
    }), []);
    useEffect(() => {
        subscribeEvent('resetProjectSetting', (settingOBj) => {
            try {
                setDefaultSetting(settingOBj);
            } catch (e) {
                Message.error({title: '数据异常'});
            }
        });
        return () => {
            unSubscribeEvent('resetProjectSetting');
        };
    }, []);
    useEffect(() => {
        setCommandObj(dataSource.profile.project.setting);
    }, [dataSource.profile.project.setting]);
    return <div className={`${baseClass}`}>
      <div className={`${baseClass}-body`}>
        <div className={`${baseClass}-body-tabs`}>
          {
                  tabs.map((it) => {
                      return <div
                        key={it.id}
                        onClick={() => handleTabClick(it)}
                        className={classesMerge({
                          [`${baseClass}-body-tabs-item`]: true,
                          [`${baseClass}-body-tabs-active`]: activeTab === it.id,
                      })}>{it.name}</div>;
                  })
              }
        </div>
        <div className={`${baseClass}-body-display`}>
          {(() => {
              let currentTab = tabs.find(it => it.id === activeTab);
              const headerTab = tabs.find(it => it.id === 'physicEntityHeader');
              const headerDataList = headerTab?.dataList || [];
              let defaultSettingArray = null;
              if (defaultSetting) {
                  defaultSettingArray = defaultSetting[currentTab.id];
              }
              return React.cloneElement(<DisplayCom
                user={user}
                getCurrentDataSource={getCurrentDataSource}
                getCurrentStandard={getCurrentStandard}
                setTabs={setTabs}
                ref={displayDomRef}
                setting={{...commandObj}}
                currentTab={currentTab}
                dataSource={dataSource}
                setCommandObj={setCommandObj}
                fieldViewArray={fieldViewArray}
                headerDataList={headerDataList}
                defaultSetting={defaultSettingArray}
                baseClass={`${baseClass}-body-display-${currentTab.className}`}
                dataList={currentTab.dataList} />);
          })()}
        </div>
      </div>
    </div>;
}));
