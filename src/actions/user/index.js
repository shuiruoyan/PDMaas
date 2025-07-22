import {ACTION} from '../../lib/constant';

import { getUser, updateUser } from '../../lib/json';
import {updateProjectProfile} from '../core';
import {defaultDBSvg} from '../../app/container/type/languagetype/DatabaseType';
import {updateProjectChange} from '../config';

const USER = ACTION.USER;


export const updateUserSuccess = (user) => {
    return {
        type: USER.UPDATE_USER_SUCCESS,
        data: user,
    };
};

export const updateUserFail = (user) => {
    return {
        type: USER.UPDATE_USER_FAIL,
        data: user,
    };
};

export const getUserSuccess = (user) => {
    return {
        type: USER.GET_USER_SUCCESS,
        data: user,
    };
};

export const getUserFail = (user) => {
    return {
        type: USER.GET_USER_FAIL,
        data: user,
    };
};

export const getUserConfig = () => {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            getUser().then((user) => {
                dispatch(getUserSuccess(user));
                resolve(user);
            }).catch(() => {
                dispatch(getUserFail());
                reject();
            });
        });
    };
};

export const updateUserHistory = (dataSource, path) => {
    return (dispatch, getState) => {
        return new Promise((resolve, reject) => {
            const user = getState().user;
            const tempProjectHistories = [...user.projectHistories];
            const currentProjectIndex = tempProjectHistories
                .findIndex(p => p.path === path);
            let current = {};
            if(currentProjectIndex > -1) {
                current = tempProjectHistories[currentProjectIndex];
                tempProjectHistories.splice(currentProjectIndex, 1);
            }
            tempProjectHistories.unshift({
                ...current,
                avatar: dataSource.project.avatar || defaultDBSvg,
                color: '',
                name: dataSource.project.name,
                dbDialectKey: dataSource.profile.project.dbDialect,
                intro: dataSource.project.intro,
                path: path,
                diagramNum: (dataSource.project.diagrams || []).length,
                entityNum: (dataSource.project.entities || []).length,
                timestamp: dataSource.updateTime,
            });
            const tempUser = {
                ...user,
                projectHistories: tempProjectHistories,
            };
            updateUser(tempUser).then(() => {
                dispatch(updateUserSuccess(tempUser));
                resolve(tempUser);
            }).catch(() => {
                dispatch(updateUserFail());
                reject();
            });
        });
    };
};

export const updateUserConfig = (user, updateGlobal) => {
    return (dispatch) => {
        return new Promise((resolve, reject) => {
            if(updateGlobal) {
                updateUser(user).then(() => {
                    dispatch(updateUserSuccess(user));
                    // dispatch(updateProjectProfile(user));
                    resolve(user);
                }).catch(() => {
                    dispatch(updateUserFail());
                    reject();
                });
            } else {
                dispatch(updateProjectChange(true));
                dispatch(updateProjectProfile(user));
                resolve(user);
            }
        });
    };
};
