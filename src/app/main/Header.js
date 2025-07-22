import React, {useMemo, useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle} from 'react';
import moment from 'moment';
import {
    Icon,
    DropDown,
    Tooltip,
    IconTitle,
    openModal,
    Button,
    Message,
    openLoading,
    closeLoading,
    Modal, UserList, SVGPicker,
} from 'components';
import {getPrefix} from '../../lib/classes';
import {LOADING, NORMAL, WS} from '../../lib/constant';
import ProjectConfig from '../container/projectconfig';
import CommonTools from '../container/commontools';
import {exportRelationExcel, sendData} from '../../lib/utils';
import {downloadBlob, downloadString, upload} from '../../lib/rest';
import {MODAL_ID, sendWsRequest} from '../container/model/menu/tool';
import {getCache, setCache} from '../../lib/cache';
import {getDefaultProjectSetting} from '../../lib/json';
import {
    baseCompareNsKey,
    batchToolsNsKey, bizdatatyeNskey, checkPermission,
    projectSettingNsKey,
} from '../../lib/permission';
import { ViewContent } from '../../lib/context';
import {defaultDBSvg} from '../container/type/languagetype/DatabaseType';
import {postWorkerFuc} from '../../lib/event';
import EntityRelation from '../container//model/tools/EntityRelation';

export default React.memo(forwardRef(({dataSource, onRefresh, loading, getCurrentStandard, save,
                               updateUserProfile, config,
                               setShowProject, getCurrentUserConfig, user,
                               updateUser}, ref) => {
    const readonly = dataSource.project.readonly;
    const allowWs = dataSource.project.allowWs;
    const darkOrLight = getCache('darkOrLight') || '0';
    const currentPrefix = getPrefix('main-header');

    const [isSaving, setIsSaving] = useState(false);
    const [saveTime, updateSaveTime] = useState(() => {
        const formatTime = (time) => {
            if(moment(time).isSame(moment(), 'day')) {
                return moment(time).format('HH:mm:ss');
            }
            return `${moment(moment().format('YYYY-MM-DD')).diff(moment(time).format('YYYY-MM-DD'), 'days')}天前 ${moment(time).format('HH:mm:ss')}`;
        };
        return dataSource.updateTime ? `最近保存：${formatTime(dataSource.updateTime)}` : '';
    });
    const [currentTime, setCurrentTime] = useState('');
    const [projectSetting, setProjectSetting] = useState(null);
    const [modeSwitch, setModeSwitch] = useState(darkOrLight === '1');
    const [custSave, setCustSave] = useState(false);

    const custSaveRef = useRef(null);
    const intervalRef = useRef(null);
    const dataSourceRef = useRef(null);
    const projectSettingRef = useRef(projectSetting);
    const commonToolsRef = useRef(null);

    const projectConfigRef = useRef(null);
    dataSourceRef.current = dataSource;
    projectSettingRef.current = projectSetting;

    const getCurrentDataSource = useCallback(() => {
        return dataSourceRef.current;
    }, []);

    const dropDownMenus = useMemo(() => ([
        {key: 'save', name: '保存'},
    ]),[]);

    const _menuClick = (m) => {
        if(m.key === 'save') {
            save && save();
        }
    };

    const updateSaveStatus = (status) => {
        if(status === 0) {
            setIsSaving(true);
        } else  {
            setIsSaving(false);
            if(status === 1) {
                updateSaveTime(`最近保存：${moment().format('HH:mm:ss')}`);
                setCustSave(true);
                if(custSaveRef.current) {
                    clearTimeout(custSaveRef.current);
                    custSaveRef.current = null;
                }
                custSaveRef.current = setTimeout(() => {
                    setCustSave(false);
                }, 3000);
            }
        }
    };

    useImperativeHandle(ref, () => {
        return {
            updateSaveStatus,
            openProjectSetting: (key) => {
                // eslint-disable-next-line no-use-before-define
                doProjectSetting(key);
            },
        };
    }, []);

    const commonToolsMenus = useMemo(() => ([
        {
            key: 9,
            name: '主题',
            children: [
                { key: 0, name: !modeSwitch ? '夜间模式' : '白天模式', mode: true }],
        },
        {
            key: 10,
            name: '批量',
            children: [
                { key: 1, name: '大小写转换', title: '大小写批量转换工具' },
                { key: 3, name: '批量添加字段' },
                { key: 4, name: '批量删除字段' },
                { key: 5, name: '批量处理预置字段'},
                { key: 15, name: '批量处理数据类型'},
                { key: 16, name: '展示表关系'},
            ].filter((m) => {
                if(m.key === 15) {
                    return checkPermission(bizdatatyeNskey.U);
                }
                return true;
            }),
        },
    ].filter((m) => {
        if(readonly) {
            return m.key === 9;
        } else if(m.key === 10) {
            return checkPermission(batchToolsNsKey);
        } else if(m.key === 8) {
            return checkPermission(baseCompareNsKey);
        }
        return true;
    })), [modeSwitch, readonly]);

    const _toolsClick = (menuTool) => {
      if(menuTool.mode) {
          setModeSwitch(!modeSwitch);
          setCache('darkOrLight', !modeSwitch ? '1' : '0');
          document.body.setAttribute('theme',
              !modeSwitch ? 'themeNigh' : '',
          );
          return;
      }
      let modal;
      if(menuTool.key === 15) {
          const onOk = (btn) => {
              btn.updateStatus(LOADING);
              commonToolsRef.current.batchDataProcess().then(() => {
                  Modal.confirm({
                      title: '警告',
                      message: '是否立即刷新页面？(数据类型修改会影响全局，请提醒项目成员刷新项目，以避免数据混乱)',
                      onOk: () => {
                          window.location.reload();
                      },
                      okText: '确定',
                      cancelText: '取消',
                  });
                  modal.close();
              }).catch((err) => {
                  Modal.error({
                      title: '错误',
                      message: JSON.stringify(err?.message || err),
                  });
              }).finally(() => {
                  btn.updateStatus(NORMAL);
              });
          };
          buttons.push(<Button key="close" onClick={() => modal.close()}>取消</Button>);
          buttons.push(<Button type="primary" key='onOk' onClick={(e, btn) => onOk(btn)}>确定</Button>);
      }
      if(menuTool.key === 16) {
          openLoading('正在根据关系图自动计算模型关联关系...');
          postWorkerFuc('utils.updateEntityRefersBatch', true, [dataSource])
              .then((result) => {
                  console.log(result);
                  const entities = dataSource.project?.entities || [];
                  const showResult = () => {
                      const getLabel = (e) => {
                          if(e.defName && (e.defKey !== e.defName)) {
                              return `${e.defKey}[${e.defName}]`;
                          }
                          return e.defKey;
                      };
                      //defKey: tempEntity.defKey,
                      //             defName: tempEntity.defName,
                      //             refers: []
                      //                     myFieldKey: targetField.defKey,
                      //                     refSchemaName: sourceEntity.schemaName,
                      //                     refEntityKey: sourceEntity.defKey,
                      //                     refFieldKey: sourceField.defKey,
                      let modalCom;
                      const oncancel = () => {
                          modalCom && modalCom.close();
                      };
                      const data = result.filter((m) => {
                          return m.refers.length > 0;
                      }).reduce((p, n) => {
                          const myEntity = entities.find(e => e.id === n.id);
                          return p.concat(n.refers.map((refer) => {
                              const refEntity = entities.find((e) => {
                                  return (e.defKey === refer.refEntityKey)
                                      && (e.schemaName === refer.refSchemaName);
                              });
                              if(refEntity && myEntity) {
                                  const refField = (refEntity.fields || [])
                                      .find(f => f.defKey === refer.refFieldKey);
                                  const myField = (myEntity.fields || [])
                                      .find(f => f.defKey === refer.myFieldKey);
                                  if(refField && myField) {
                                      return {
                                          id: Math.uuid(),
                                          parentName: getLabel(refEntity),
                                          parentFieldName: getLabel(refField),
                                          childName: getLabel(myEntity),
                                          childFieldName: getLabel(myField),
                                      };
                                  }
                                  return null;
                              }
                              return null;
                          }).filter(d => !!d));
                      }, []);
                      const onOk = (e, btn) => {
                          btn.updateStatus(LOADING);
                          exportRelationExcel(data).then((res) => {
                              const blobData = new Blob([res], { type: 'application/octet-stream' });
                              downloadBlob(blobData, `${dataSource.project.name}-表关系.xlsx`);
                          }).finally(() => {
                              btn.updateStatus(NORMAL);
                          });
                      };
                      modalCom = openModal(<EntityRelation
                        data={data}
                      />, {
                          title: '展示表关系',
                          bodyStyle: {
                              width: '80%',
                          },
                          buttons: [
                            <Button onClick={oncancel} key='oncancel'>关闭</Button>,
                            <Button onClick={onOk} key='onOK' type='primary'>导出EXCEL</Button>],
                      });
                  };
                  console.log(result);
                  const cmd = {
                      event: WS.ENTITY.MOP_ENTITY_BATCH_REFERS,
                      payload: result,
                  };
                  sendWsRequest(cmd).then(() => {
                      showResult();
                      closeLoading();
                  }).catch((err) => {
                      Modal.error({
                          title: '错误',
                          message: JSON.stringify(err?.message || err),
                      });
                  });

          });
          return;
      }
      modal = openModal(<CommonTools
        getCurrentStandard={getCurrentStandard}
        getCurrentDataSource={getCurrentDataSource}
        ref={commonToolsRef}
        getCurrentUserConfig={getCurrentUserConfig}
        config={config}
        updateUser={updateUser}
        updateUserProfile={updateUserProfile}
        menuTool={menuTool}
        dataSource={dataSource}
        user={user}
      />, {
        title: menuTool.title || menuTool.name,
        id: MODAL_ID,
        fullScreen: true,
      });
    };

    const saveProjectSetting = (modal, btn) => {
        btn?.updateStatus(LOADING);
        const commandObj = projectConfigRef.current.getCommandObj();
        sendData({
            event: WS.PROJECT.MOP_PROJECT_SETTING,
            payload: commandObj,
        }, null, (d) => {
            setProjectSetting(d.payload);
            btn?.updateStatus(NORMAL);
            modal.close();
        });
    };

    const resetSetting = (e) => { // 恢复默认的项目设置
        e.stopPropagation();
        getDefaultProjectSetting().then(defaultSetting => notify('resetProjectSetting', defaultSetting));
    };

    const doProjectSetting = (key) => {
        const prefix = getPrefix('project-config-container');
        const exportSetup = () => {
            downloadString(JSON.stringify(projectConfigRef.current.getCommandObj(), null, 2), 'application/json', 'projectConfig');
            Message.success({title: '导出成功'});
        };
        const importConfig = () => {
            upload('application/json', (projectConfig) => {
                try {
                    const currentConfig = JSON.parse(projectConfig);
                    notify('resetProjectSetting', currentConfig);
                    Message.success({title: '导入成功'});
                } catch (e) {
                    Message.error({title: '格式错误'});
                }
            }, () => true, true);
        };
        // eslint-disable-next-line max-len
        const modal = openModal(<ProjectConfig
          user={user}
          defaultActive={key}
          getCurrentDataSource={getCurrentDataSource}
          getCurrentStandard={getCurrentStandard}
          ref={projectConfigRef}
          dataSource={dataSource}
          baseClass={prefix} />, {
            title: <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ marginRight: '10px' }}>项目设置</div>
              {!readonly && <div className={`${prefix}-header-reset`} onClick={e => resetSetting(e)}>恢复默认</div>}
              {!readonly && <IconTitle onClick={importConfig} icon="icon-inout-import" title="导入" />}
              <ViewContent.Provider value={false}>
                <IconTitle onClick={exportSetup} icon="icon-inout-export" title="导出" />
              </ViewContent.Provider>
            </div>,
            id: MODAL_ID,
            bodyStyle: {
                width: '80%',
            },
            closeable: false,
            readonly,
            buttons: [
              <Button key='onCancel' onClick={() => modal.close()}>取消</Button>,
              <Button key='onOK' type="primary" onClick={(e, btn) => saveProjectSetting(modal, btn)}>确定</Button>,
            ],
        });
    };

    useEffect(() => {
        document.body.setAttribute('theme', !modeSwitch ? '' : 'themeNigh');
    }, []);

    const _onMouseEnter = () => {
        setCurrentTime(moment(new Date().getTime()).format('HH:mm:ss'));
        intervalRef.current = setInterval(() => {
            setCurrentTime(moment(new Date().getTime()).format('HH:mm:ss'));
        }, 1000);
    };

    const _onMouseLeave = () => {
        clearInterval(intervalRef.current);
    };

    const _onRefresh = () => {
        onRefresh();
    };

    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-project`}>
        <Icon onClick={() => setShowProject(false)} type='icon-polygon-left'/>
        <SVGPicker
          width={21}
          height={21}
          value={dataSource.project.avatar || defaultDBSvg}
          readOnly/>
        <Tooltip placement='bottom' title={dataSource.project.name}>
          <span style={{marginLeft: 10}}>{dataSource.project.name}</span>
        </Tooltip>
        <span>
          {!readonly && <DropDown trigger='click' menus={dropDownMenus} menuClick={_menuClick} position='buttom'>
            <span><Icon
              type='icon-polygon-down'/></span>
          </DropDown>}
        </span>
      </div>
      <div className={`${currentPrefix}-tools`}>
        <span>
          {!readonly && <IconTitle loading={loading} onClick={_onRefresh} icon='icon-reload' title='重新加载'/>}
          {saveTime && !readonly && <IconTitle
            loading={isSaving}
            title={<span className={`${currentPrefix}-tools-time`}>
              <span
                onMouseEnter={_onMouseEnter}
                onMouseLeave={_onMouseLeave}
                className={`${currentPrefix}-tools-time-left`}>
                {!isSaving && <span className={`${currentPrefix}-success`}><Icon type="icon-check"/></span>}
                <span>{saveTime}</span>
              </span>
              {custSave && <span className={`${currentPrefix}-tools-time-center`}>
                保存成功
                </span>}
              <span className={`${currentPrefix}-tools-time-right`}>
                    当前：{currentTime}
              </span>
            </span>}/>}
        </span>
        <span>
          <DropDown trigger='hover' menus={commonToolsMenus} menuClick={_toolsClick} nsKey={batchToolsNsKey} position='buttom'>
            <span><IconTitle icon='icon-toolbox' title='常用工具' nsKey={batchToolsNsKey}/></span>
          </DropDown>
          {!readonly && <IconTitle icon='icon-setting' onClick={() => doProjectSetting()} nsKey={projectSettingNsKey} title='项目设置'/>}
        </span>
      </div>
      {
        (!readonly || (readonly && allowWs)) &&
        <UserList dataSource={dataSource} config={config}/>
      }
    </div>;
}));
