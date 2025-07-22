import {execCmd} from 'dataSource_utils';
import {
  saveProjectData,
  getProject,
  getUser,
  initIdPool,
  getPermissions,
  saveCmdHistory,
saveProjectDataAs} from '../../lib/json';
import {ACTION} from '../../lib/constant';
import {setCache, setMemoryCache} from '../../lib/cache';
import {
  updateProjectSaveStatus,
  updateProjectPath,
  updateProjectSaveCount,
  updateProjectCmdHistory,
  clearConfig, updateProjectChange,
} from '../config';
import fixDataSource from '../../lib/fix_data';

import {ensureDirectoryExistence, saveJsonPromise} from '../../lib/file';
import {updateUserHistory} from '../user';

const CORE = ACTION.CORE;

/*
* 核心的action 负责整个项目的更新
* */

/*
 * action 创建函数
 */
const readProjectSuccess = (data) => {
  return {
    type: CORE.GET_PROJECT_SUCCESS,
    data: data,
  };
};

const clearCore = () => {
  return {
    type: CORE.CLEAR,
  };
};

const updateProfileUserSuccess = (data) => {
  return {
    type: CORE.UPDATE_PROFILE_USER_SUCCESS,
    data: data,
  };
};

const execCommandSuccess = (data) => {
  return {
    type: CORE.EXEC_COMMAND_SUCCESS,
    data: data,
  };
};


const optTypeSuccess = (data, type) => {
  return {
    type,
    data,
  };
};


const UpdateProjectStatusSuccess = (data) => {
  return {
    type: CORE.UPDATE_PROJECT_STATUS_SUCCESS,
    data: data,
  };
};

export const updateProjectStatus = (status, allowWs) => {
  return (dispatch, getState) => {
    const data = getState().core.data;
    dispatch(UpdateProjectStatusSuccess({
      ...data,
      project: {
        ...data.project,
        readonly: status,
        allowWs,
      },
    }));
  };
};


export const clearProject = () => {
  return (dispatch) => {
    dispatch(clearConfig());
    dispatch(clearCore());
  };
};

export const readDemoProject = (project) => {
  return (dispatch) => {
    return new Promise((resolve) => {
      initIdPool().then(() => {
        const dataSource = fixDataSource.fix(project.data);
        dispatch(updateProjectPath(''));
        dispatch(readProjectSuccess(dataSource));
        resolve(dataSource);
      });
    });
  };
};

export const createProject = (dir, path, dataSource) => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      // 创建目录
      ensureDirectoryExistence(dir);
      saveJsonPromise(path, dataSource, false, true).then(() => {
        dispatch(updateProjectPath(path));
        dispatch(readProjectSuccess(dataSource));
        resolve(dataSource);
      }).catch((err) => {
        reject(err);
      });
    });
  };
};

/*
 * action 操作函数
 */
export const  readProject = (projectId, callback) => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      Promise.all([getUser(projectId), getPermissions(projectId)]).then(([user, permission]) => {
         setCache('user', user);
         setMemoryCache('permission',(user?.permissionList || []).concat(permission));
         getProject(projectId, callback)
            .then((data) => {
              const dataSource = fixDataSource.fix(data);
              // 评审状态下只读
              dataSource.project.readonly = data.reviewStatus === 'P';
              dataSource.project.allowWs = data.reviewStatus === 'P';
              if(!dataSource.id) {
                // 给项目加上ID
                dataSource.id = Math.uuid();
              }
              window.document.title = dataSource.project.name;
              initIdPool(projectId).then(() => {
                dispatch(updateUserHistory(dataSource, projectId));
                dispatch(updateProjectPath(projectId));
                dispatch(readProjectSuccess(dataSource));
                resolve(dataSource);
              });
            }).catch((err) => {
                reject(err);
         });
      });
    });
  };
};

export const reloadDemoProject = (project) => {
  return (dispatch) => {
    return new Promise((resolve) => {
      const tempData = {
        ...project.data,
        id: Math.uuid(),
      };
      dispatch(updateProjectPath(''));
      dispatch(readProjectSuccess(tempData));
      resolve(tempData);
    });
  };
};

export const reloadProject = (projectId, onOk = null, onError = null) => {
  return (dispatch) => {
    return new Promise((resolve) => {
      Promise.all([getUser(projectId), getPermissions(projectId)])
          .then(([user, permission]) => {
            setCache('user', user);
            setMemoryCache('permission',(user?.permissionList || []).concat(permission));
            getProject(projectId).then((data) => {
              const dataSource = fixDataSource.fix(data);
              dataSource.project.readonly = data.reviewStatus === 'P';
              dataSource.project.allowWs = data.reviewStatus === 'P';
              window.document.title = dataSource.project.name;
              initIdPool().then(() => {
                const newDataSource = {
                  ...dataSource,
                };
                dispatch(readProjectSuccess(newDataSource));
                resolve(dataSource);
              });
            }).then(res => onOk && onOk?.(res));
            })
          .catch(error => onError && onError?.(error));
    });
  };
};

export const updateProfileUser = ({profile}) => {
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch(updateProjectChange(true));
      dispatch(updateProfileUserSuccess(profile));
      resolve(profile);
    });
  };
};

// 项目保存
export const saveProject = (callback) => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      const state = getState();
      // 判断项目是否正处于保存状态
      const data = state.core.data;
      const config = state.config;
      if(config.isSaving) {
        // 需要等待上次保存结束 再执行保存
        dispatch(updateProjectSaveCount(config.saveCount + 1));
      } else {
        dispatch(updateProjectSaveStatus(true));
        const saveSuccess = (dataSource, path) => {
          saveCmdHistory(config, dataSource.project.name);
          dispatch(updateUserHistory(dataSource,path));
          dispatch(updateProjectCmdHistory([]));
          dispatch(updateProjectChange(false));
          callback && callback(dataSource);
          resolve(dataSource);
        };
        if(config.path) {
          saveProjectData(config.path, data).then(() => {
            const newState = getState();
            dispatch(updateProjectSaveStatus(false));
            if(newState.config.saveCount > 0) {
              // 需要再次保存
              dispatch(updateProjectSaveCount(0));
              dispatch(saveProject((newData) => {
                saveSuccess(newData, config.path);
              }));
            } else {
              saveSuccess(data, config.path);
            }
          }).catch((err) => {
            reject(err);
          }).finally(() => {
            dispatch(updateProjectSaveCount(0));
            dispatch(updateProjectSaveStatus(false));
          });
        } else {
          saveProjectDataAs(data).then((path) => {
            dispatch(updateProjectPath(path));
            const newState = getState();
            dispatch(updateProjectSaveStatus(false));
            if(newState.config.saveCount > 0) {
              // 需要再次保存
              dispatch(updateProjectSaveCount(0));
              dispatch(saveProject((newData) => {
                saveSuccess(newData, path);
              }));
            } else {
              saveSuccess(data, path);
            }
          }).catch((err) => {
            reject(err);
          }).finally(() => {
            dispatch(updateProjectSaveCount(0));
            dispatch(updateProjectSaveStatus(false));
          });
        }
      }
    });
  };
};

export const execCommand = (cmd) => {
  return (dispatch, getState) => {
    return new Promise((resolve) => {
      const state = getState();
      // 此处需要调用执行命令方法更新项目数据
      const data = execCmd(state.core.data, cmd);
      // 缓存操作历史
      dispatch(updateProjectCmdHistory(state.config.cmdHistory.concat({
        ...cmd,
        timestamp: new Date().getTime(),
      })));
      dispatch(updateProjectChange(true));
      dispatch(execCommandSuccess(data));
      // 将操作历史更新到本地文件
      resolve(data);
    });
  };
};

export const fixDatasourceOnProfileChange = (profile) => {
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch(updateProjectChange(true));
      dispatch(optTypeSuccess(profile, CORE.FIX_PROFILE));
      resolve(profile);
    });
  };
};

export const updateProjectProfile = (user) => {
  return {
    type: CORE.UPDATE_PROJECT_PROFILE,
    data: user,
  };
};


