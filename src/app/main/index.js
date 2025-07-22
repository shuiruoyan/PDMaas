import React, {useCallback, useEffect, useRef, useState} from 'react';
import './style/index.less';
import {Modal, Message, openLoading, closeLoading} from 'components';
import {getPrefix} from '../../lib/classes';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import {PROJECT, WS} from '../../lib/constant';
import { notify, subscribeEvent, unSubscribeEvent } from '../../lib/subscribe';
import {antiShake} from '../../lib/event';

export default React.memo(({dataSource, standard, execCmd, saveProject,
                               openStand, openStandList, updateUserProfile, refresh, config,
                               updateStatus, setShowProject, updateUser, user, refreshDemo}) => {
    const currentPrefix = getPrefix('main');

    const [selectedLen, setSelectedLen] = useState(0);
    const [loading, setLoading] = useState(false);

    const standardRef = useRef(null);
    const dataSourceRef = useRef(null);
    const bodyRef = useRef();
    const userConfigRef = useRef();
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const timerRef = useRef(null);

    const configRef = useRef(null);
    configRef.current = config;

    dataSourceRef.current = dataSource;
    standardRef.current = standard;
    userConfigRef.current = user;

    const onRefresh = useCallback((onOk = null, onError = null) => {
        setLoading(true);
        openLoading('项目重新加载中...');
        const preDataSource = dataSourceRef.current;
        if(config.path) {
            refresh(onOk, onError).then((res) => {
                setLoading(false);
                closeLoading();
                Message.success({title: '数据已刷新'});
                notify(PROJECT.REFRESH, [preDataSource, res]);
            }).catch((err) => {
                Modal.error({
                    title: '错误',
                    message: JSON.stringify(err?.message || err),
                });
                closeLoading();
            });
        } else {
            refreshDemo().then((res) => {
                setLoading(false);
                closeLoading();
                Message.success({title: '数据已刷新'});
                notify(PROJECT.REFRESH, [preDataSource, res]);
            });
        }
    }, [dataSource.id]);

    useEffect(() => {
        // 订阅所有的消息发送
        const subscribeId = Math.uuid();
        subscribeEvent(WS.SEND_DATA, (message) => {
            const { callback, notifyLocal, ...rest} = message;
            // 根据发送的消息内容更新页面数据
            execCmd(rest).then((data) => {
                callback && callback(rest);
                notify(WS.MESSAGE_STATUS_UPDATE, rest);
                if(notifyLocal) {
                    notify(WS.TAB_UPDATE, message, data);
                }
            });
        }, subscribeId);
        return () => {
            unSubscribeEvent(WS.SEND_DATA, subscribeId);
        };
    }, []);

    const save = useCallback((showMessage = true) => {
        notify('isSaving');
        headerRef.current?.updateSaveStatus(0);
        saveProject().then(() => {
            //showMessage && Message.success({title:'保存成功'});
                headerRef.current?.updateSaveStatus(1);
            // eslint-disable-next-line no-use-before-define
                openAutoSave(); //手动保存成功后 打开自动保存
            }).catch((err) => {
            headerRef.current?.updateSaveStatus(-1);
            showMessage && Message.error({title:`保存失败 ${typeof err === 'string' ? err : err?.message}`});
        }).finally(() => {
            notify('endSaving');
        });
    }, []);
    const closeAutoSave = () => {
        if(timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    const openAutoSave = () => {
        closeAutoSave();
        // 开启自动保存 30s自动保存一次
        timerRef.current = setInterval(() => {
            if(configRef.current.isChange && configRef.current.path) {
                save(false);
            }
        }, 1000 * 30);
    };
    useEffect(() => {
        const saveFuc = antiShake(() => {
            closeAutoSave(); // 手动保存开始 先关闭自动保存
            save();
        }, 300);
        openAutoSave(); // 项目打开 开启自动保存
        document.onkeydown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 83)) {
                e.preventDefault();
                saveFuc();
            }
        };
        subscribeEvent('save', () => {
            saveFuc();
        });
        return () => {
            closeAutoSave();
            document.onkeydown = null;
            unSubscribeEvent('save');
        };
    }, []);

    const onSelectedLenChange = useCallback((selected) => {
        setSelectedLen(selected);
    }, []);

    const getCurrentStandard = useCallback(() => {
        return standardRef.current;
    }, []);

    const getCurrentUserConfig = useCallback(() => {
        return {
            profile: dataSourceRef.current.profile,
        };
    }, []);

    const jump = useCallback((item, isDetail) => {
        bodyRef.current?.jump(item, isDetail);
    }, []);

    const setNodeSelected = useCallback((id) => {
        bodyRef.current?.setNodeSelected(id);
    }, []);

    const openProjectSetting = useCallback((key) => {
        headerRef.current?.openProjectSetting?.(key);
    }, []);

    return <div className={currentPrefix}>
      <Header
        ref={headerRef}
        updateStatus={updateStatus}
        save={save}
        getCurrentStandard={getCurrentStandard}
        updateUserProfile={updateUserProfile}
        loading={loading}
        getCurrentUserConfig={getCurrentUserConfig}
        updateUser={updateUser}
        jump={jump}
        setShowProject={setShowProject}
        setNodeSelected={setNodeSelected}
        onRefresh={onRefresh}
        dataSource={dataSource}
        config={config}
        user={user}
      />
      <Body
        openProjectSetting={openProjectSetting}
        user={user}
        config={config}
        ref={bodyRef}
        getCurrentStandard={getCurrentStandard}
        onRefresh={onRefresh}
        getCurrentUserConfig={getCurrentUserConfig}
        updateUser={updateUser}
        onSelectedLenChange={onSelectedLenChange}
        dataSource={dataSource}
        standard={standard}
        openStand={openStand}
        openStandList={openStandList}
        updateUserProfile={updateUserProfile}
      />
      <Footer
        ref={footerRef}
        selectedLen={selectedLen}
        onRefresh={onRefresh}
        dataSource={dataSource}
      />
    </div>;
});
