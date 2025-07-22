import React, {useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import {Message, closeLoading, openLoading, Modal, Button, DiffCode, openModal, Checkbox} from 'components';
import {isSameProfile, removeProfileUnlessField} from 'dataSource_utils';
import Main from '../main';
import { getPrefix } from '../../lib/classes';
import {
  readProject,
  createProject,
  readDemoProject,
  clearProject,
  saveProject,
  reloadProject,
  updateProfileUser,
  execCommand,
  updateProjectStatus,
  fixDatasourceOnProfileChange, reloadDemoProject,
// eslint-disable-next-line import/named
} from '../../actions/core';
import { getUserConfig, updateUserConfig } from '../../actions/user';

import './style/index.less';
import {getCache, getMemoryCache} from '../../lib/cache';
import HomePage from './HomePage';
import ToolBar from './ToolBar';
import {addAppQuitListener, openLink} from '../../lib/app_tool';
import Loading from './Loading';
import defaultProfile from '../../lib/default_profile';
import demo1 from '../../lib/demo/大学综合管理系统.pdma';
import demo2 from '../../lib/demo/章鱼师兄MES.pdma';
import demo3 from '../../lib/demo/罗斯文商贸.pdma';
import demo4 from '../../lib/demo/三层模型-生产销售.pdma';
import demo5 from '../../lib/demo/维度建模-产品销售.pdma';


const Welcome = React.memo((props) => {
  const { open, dataSource, reload, user, getUser,
    updateStatus, updateUser, typeUpdate, openDemo, reloadDemo } = props;
  const prefix = getPrefix('welcome');

const [resetProjectId, setResetProjectId] = useState(() => Math.uuid());
  const currentProjectRef = useRef('');
  const userRef = useRef();

  userRef.current = {...user};

  useEffect(() => {
    // 禁用window.open
    window.open = (link) => {
      openLink(link);
    };
  }, []);
  useEffect(() => {
    const darkOrLight = getCache('darkOrLight');
    document.body.setAttribute('theme',
        darkOrLight !== '1' ? '' : 'themeNigh',
    );

    addAppQuitListener(() => {
      const preService = getMemoryCache('service');
      if(preService) {
        preService.kill();
      }
    });
  }, []);

  const _openDemo = (it) => {
    currentProjectRef.current = it.data;
    openDemo(it);
  };

  const _open = (project) => {
    openLoading('项目加载中...');
    currentProjectRef.current = project;

    return open(project).then((res) => {
      const currentProject = (userRef.current.projectHistories || [])
          .find(it => it.path === project);
      if((currentProject?.ignoreVersion || []).includes(defaultProfile.version) ||
        isSameProfile(defaultProfile, res.profile)
      ) {
        closeLoading();
      } else {
        closeLoading();
        let modal;
        const onIgnoreVersion = () => {
          return updateUser({
            ...userRef.current,
            projectHistories: (userRef.current.projectHistories || []).map((it) => {
              if(project === it.path) {
                return {
                  ...it,
                  ignoreVersion: [...(it.ignoreVersion || []), defaultProfile.version],
                  diagramNum: (res.project.diagrams || []).length,
                  entityNum: (res.project.entities || []).length,
                };
              }
              return {
                ...it,
              };
            }),
          }, true);
        };

        const _viewDiff = () => {
          openModal(<DiffCode
            value={[
              {
                name: '默认',
                value: removeProfileUnlessField(defaultProfile),
              },{
                name: '当前项目',
                value: removeProfileUnlessField(res.profile),
              },
            ]}
          />, {
            title: '查看差异',
            fullScreen: true,
          });
        };

        const basedOnSystemDefault = async () => {
          try {
            openLoading('数据更新中');
            // eslint-disable-next-line no-use-before-define
            if(isIgnore) {
              await onIgnoreVersion();
            }
            await typeUpdate('fixDatasourceOnProfileChange', defaultProfile);
            await props.saveProject();
            modal.close();
            closeLoading();
          } catch (err) {
            modal.close();
            closeLoading();
            Modal.error({
              title: '错误',
              message: JSON.stringify(err?.message || err),
            });
          }

        };

        let isIgnore = false;

        const basedOnCurrentProject = async () => {
          if(isIgnore) {
            openLoading('数据更新中');
            onIgnoreVersion().then(() => {
              modal.close();
            }).finally(() => {
              closeLoading();
            });
          } else {
            modal.close();
          }
        };

        const checkIgnore = (e) => {
          isIgnore = e.target.checked;
        };

        modal = openModal(<div style={{margin: '13px'}}>
          <div>当前项目类型配置与系统默认类型配置不一致，可执行以下操作</div>
          <div style={{textAlign: 'center', marginTop: 5}}><Checkbox onChange={checkIgnore}>本项目不再提醒</Checkbox></div>
        </div>, {
          title: '提示',
          closeable: false,
          buttons: [
            <Button onClick={() => _viewDiff()}>查看差异</Button>,
            <Button onClick={() => basedOnSystemDefault()}>以系统默认为准</Button>,
            <Button type='primary' onClick={() => basedOnCurrentProject()}>以当前项目为准</Button>,
          ],
        });
      }
    }).catch((err) => {
      closeLoading();
      if(err.message === 'PDManer') {
        Modal.error({
          title: '无效的PDMaas文件',
          message: <span>当前项目为PDManer项目，打开方式看<span style={{cursor: 'pointer', color: '#0F40F5'}} onClick={() => openLink('http://www.yonsum.com/')}>[这里]</span></span>,
        });
      } else if(err.message === 'Invalid') {
        Message.error({title: '无效的PDMaas文件'});
      } else {
        Message.error({title: typeof err === 'string' ? err : err?.message});
      }
    });
  };

  const refresh = (onOk = null, onError = null) => {
    return reload(currentProjectRef.current, onOk, onError).then(() => {
     // 刷新后将整个项目重置 包括ws也重连
     setResetProjectId(Math.uuid());
   });
  };
  const refreshDemo = () => {
    // eslint-disable-next-line no-use-before-define
    return reloadDemo(demoList.find(d => d.name === currentProjectRef.current.project.name));
  };
  const _setShowProject = (callback) => {
    if(props.config.isChange) {
      Modal.confirm({
        title: '警告',
        message: '当前项目还有内容尚未保存，是否要退出',
        onOk: () => {
          callback && callback();
          props.clear();
        },
        okText: '确定',
        cancelText: '取消',
      });
    } else {
      props.clear();
    }
  };
  const demoList = [{
    name: demo1.project.name,
    entityNum: demo1.project.entities.length,
    diagramNum: demo1.project.diagrams.length,
    data: demo1,
  },{
    name: demo2.project.name,
    entityNum: demo2.project.entities.length,
    diagramNum: demo2.project.diagrams.length,
    data: demo2,
  },{
    name: demo3.project.name,
    entityNum: demo3.project.entities.length,
    diagramNum: demo3.project.diagrams.length,
    data: demo3,
  },{
    name: demo4.project.name,
    entityNum: demo4.project.entities.length,
    diagramNum: demo4.project.diagrams.length,
    data: demo4,
  },{
    name: demo5.project.name,
    entityNum: demo5.project.entities.length,
    diagramNum: demo5.project.diagrams.length,
    data: demo5,
  }];
  if(!user.projectHistories) {
    return <Loading getUser={getUser} updateUser={updateUser}/>;
  }
  return <div className={prefix}>
    <ToolBar
      resizeable
      title='PDMaas-CE'
      dataSource={dataSource}
      config={props.config}
    />
    {
      // eslint-disable-next-line no-nested-ternary
      dataSource ?  <Main
        key={resetProjectId}
        updateStatus={updateStatus}
        refresh={refresh}
        refreshDemo={refreshDemo}
        setShowProject={_setShowProject}
        {...props}
        updateUser={(data, falg = false) => updateUser(data, falg)}/> :
      <HomePage
        {...props}
        demoList={demoList}
        updateUser={data => updateUser(data, true)}
        open={_open}
        openDemo={_openDemo}/>
    }
  </div>;
});

const mapStateToProps = (state) => {
  return {
    dataSource: state.core.data,
    config: state.config,
    user: state.user,
  };
};
const mapDispatchToProps = (dispatch) => {
  const typeUpdateFuc = {
    fixDatasourceOnProfileChange,
  };
  return {
    open: (project, callback) => {
      return dispatch(readProject(project, callback));
    },
    create: (dir, path, project) => {
      return dispatch(createProject(dir, path, project));
    },
    openDemo: (project) => {
      return dispatch(readDemoProject(project));
    },
    clear: () => {
      return dispatch(clearProject());
    },
    saveProject: () => {
      return dispatch(saveProject());
    },
    updateStatus: (status, allowWs) => {
      return dispatch(updateProjectStatus(status, allowWs));
    },
    reload: (projectId, onOk = null, onError = null) => {
      return dispatch(reloadProject(projectId, onOk, onError));
    },
    reloadDemo: (project) => {
      return dispatch(reloadDemoProject(project));
    },
    updateUserProfile: (profile) => {
      return dispatch(updateProfileUser(profile));
    },
    execCmd: (cmd) => {
      return dispatch(execCommand(cmd));
    },
    typeUpdate: (fuc, data) => {
      return dispatch(typeUpdateFuc[fuc](data));
    },
    getUser: () => {
      return dispatch(getUserConfig());
    },
    updateUser: (user, updateGlobal) => {
      return dispatch(updateUserConfig(user, updateGlobal));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Welcome);

