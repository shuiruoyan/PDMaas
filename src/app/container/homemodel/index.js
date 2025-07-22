import React, {useRef} from 'react';

import moment from 'moment';
import {
    Icon,
    openModal,
    Button,
    Message,
    openLoading,
    closeLoading,
    Modal,
    SVGPicker,
    IconTitle, Tooltip,
} from 'components';
import qun from './style/qun.jpg';
import {classesMerge, getPrefix} from '../../../lib/classes';
import './style/index.less';
import yonsum from '../../main/style/yonsum.svg';
import AddOrEditProject from './AddOrEditProject';
import {
    checkIsAppPath,
    dirSplicing,
    fileExists,
    getBaseName, isReadonly,
    openFileOrDirPath, openPath,
} from '../../../lib/file';
import defaultProfile from '../../../lib/default_profile';
import {openLink} from '../../../lib/app_tool';
import MiddleTruncate from './MiddleTruncate';
import {defaultDBSvg} from '../type/languagetype/DatabaseType';
import {LOADING, NORMAL} from '../../../lib/constant';
import {checkStringsInObject} from '../model/menu/tool';


export default React.memo(({open, userConfig, getCurrentUserConfig,
                                           updateUser, openDemo,
                                          demoList, create}) => {
    const currentPrefix = getPrefix('container-homeModel');
    const recentTitle = {
        name: '项目',
        path: '文件位置',
        entityNum: '实体数量',
        diagramNum: '关系图数量',
        timestamp: '最近修改',
        operation: '操作',
    };

    const referenceCaseTitle = {
        name: '项目',
        entityNum: '实体数量',
        diagramNum: '关系图数量',
    };

    const addOrEditProjectRef = useRef();
    const userConfigRef = useRef(userConfig);
    userConfigRef.current = userConfig;

    const buttonStyle = {
        width: '60%',
        borderRadius: 5,
    };

    const newProject = () => {
        let modal;

        const onCancel = () => {
            modal.close();
        };

        const onOK = () => {
            const projectObj = addOrEditProjectRef.current.getData();
            const projectPath = dirSplicing(projectObj.path, `${projectObj.name}.pdma`);
            if(checkStringsInObject(projectObj, ['name', 'path', 'dbDialectKey'])) {
                // 校验项目目录是都是软件安装目录
                if(checkIsAppPath(projectObj.path)) {
                    Modal.error({
                        title: '操作失败',
                        message: '项目文件不能放在软件的安装或运行目录！',
                    });
                    return;
                }
                const flag = fileExists(projectPath);
                if(flag) {
                    Modal.error({
                        title: '操作失败',
                        message: '项目文件已存在！',
                    });
                    return;
                }
                openLoading('正在创建项目...');
                create(projectObj.path, projectPath, {
                    id: Math.uuid(),
                    profile: {
                        ...defaultProfile,
                        user: {
                            ...defaultProfile.user,
                        },
                        project: {
                            branch: 'master',
                            dbDialect: projectObj.dbDialectKey,
                            schema: null,
                            status: 'EDIT',
                            allow: 'W',
                            setting: defaultProfile.project.setting,
                        },
                    },
                    project: {
                        avatar: projectObj.avatar,
                        name: projectObj.name,
                        categories: [],
                        flat: [],
                        entities: [],
                        diagrams: [],
                    },
                    updateTime: moment().valueOf(),
                }).then(() => {
                    modal.close();
                    closeLoading();
                    open(projectPath);
                }).catch((err) => {

                    Modal.error({
                        title: '错误',
                        message: JSON.stringify(err?.message || err),
                    });
                    closeLoading();
                });
            } else {
                Modal.error({
                    title: '操作失败',
                    message: '带星号为必输项，不能为空！',
                });
            }
        };

        modal = openModal(<AddOrEditProject
          ref={addOrEditProjectRef}
          userConfig={userConfig}
        />, {
            title: '新建项目',
            bodyStyle: {
                width: '50%',
            },
            buttons: [
              <Button onClick={() => onCancel()} key='oncancel'>取消</Button>,
              <Button onClick={() => onOK()} key='onOK' type='primary'>确认</Button>],
        });
    };

    const openFile = () => {
        openFileOrDirPath([{
            name: 'PDMaas',
            extensions: ['json', 'pdma'],
        }]).then((res) => {
            if(res && (res.endsWith('.pdma.json') || res.endsWith('.pdma'))) {
                const openProjectFile = () => {
                    open(res).then(() => {
                        // eslint-disable-next-line max-len
                        const currentProjectHistories = getCurrentUserConfig().projectHistories || [];
                        // eslint-disable-next-line max-len
                        const newProjectHistories = currentProjectHistories.find(it => it.path === res) ?
                            currentProjectHistories.map((it) => {
                                if(it.path === res) {
                                    return {
                                        ...it,
                                        timestamp: moment().valueOf(),
                                    };
                                }
                                return it;
                            }) : [
                                ...currentProjectHistories,
                                {
                                    avatar: '',
                                    color: '',
                                    name: getBaseName(res).split('.pdma')[0],
                                    dbDialectKey: '',
                                    intro: '',
                                    path: res,
                                    entityNum: 0,
                                    diagramNum: 0,
                                    timestamp: moment().valueOf(),
                                },
                            ];
                        updateUser({
                            ...getCurrentUserConfig(),
                            projectHistories: [
                                ...newProjectHistories,

                            ],
                        });
                    }).catch((err) => {
                        Modal.error({
                            title: '错误',
                            message: JSON.stringify(err?.message || err),
                        });
                    });
                };
                isReadonly(res).then((status) => {
                    if(status) {
                        Modal.confirm({
                            title: '警告',
                            message: '当前选择的项目文件为只读文件，打开后修改的内容将无法保存，是否继续打开？',
                            onOk: () => {
                                openProjectFile();
                            },
                            okText: '继续',
                            cancelText: '取消',
                        });
                    } else {
                        openProjectFile();
                    }
                }).catch(() => {
                    openProjectFile();
                });
            } else {
                Modal.error({
                    title: '操作失败',
                    message: '仅支持打开[.pdma.json/.pdma]类型的文件！',
                });
            }
        });
    };

    const formatTime = (timestamp) => {
        const now = moment();
        const time = moment(timestamp); // 解析时间戳（毫秒）

        if (time.isSame(now, 'day')) {
            return `今天 ${time.format('HH:mm')}`;
        } else if (time.isSame(now.clone().subtract(1, 'day'), 'day')) {
            return `昨天 ${time.format('HH:mm')}`;
        } else {
            return time.format('YYYY-MM-DD HH:mm'); // 更早的时间：返回完整日期
        }
    };

    const openProject = (data) => {
        const { path } = data;
        isReadonly(path).then((status) => {
            if(status) {
                Modal.confirm({
                    title: '警告',
                    message: '当前选择的项目文件为只读文件，打开后修改的内容将无法保存，是否继续打开？',
                    onOk: () => {
                        open(path);
                    },
                    okText: '继续',
                    cancelText: '取消',
                });
            } else {
                open(path);
            }
        }).catch(() => {
            open(path);
        });
    };

    const openDemoProject = (it) => {
        openDemo(it);
    };

    const locationProject = (it) => {
        openPath(it.path);
    };

    const removeProject = (data) => {
        Modal.confirm({
            title: '警告',
            message: '是否从最近使用中清除该项目（清除操作不影响项目本身）',
            onOk: (e, btn) => {
                btn.updateStatus(LOADING);
                const projectHistories = getCurrentUserConfig().projectHistories;
                updateUser({
                    ...getCurrentUserConfig(),
                    projectHistories: projectHistories.filter(it => it.path !== data.path),
                }).then(() => {
                    Message.success({title: '已经从列表中移除，如果您需要删除文件，请您手动操作'});
                }).finally(() => {
                    btn.updateStatus(NORMAL);
                });
            },
            okText: '确定',
            cancelText: '取消',
        });
    };

    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-left`}>
        <div className={`${currentPrefix}-left-top`}>
          <div>
            <Button onClick={() => newProject()} style={buttonStyle} type='primary'>
              <Icon type='icon-oper-plus'/>新建
            </Button>
          </div>
          <div>
            <Button onClick={() => openFile()} style={buttonStyle}>
              <Icon type='icon-folder-open'/>打开
            </Button>
          </div>
        </div>
        <div className={`${currentPrefix}-left-middle`}>
          <div onClick={() => openLink('http://www.yonsum.com/DocumentCenter')}>
            <span><Icon type='icon-doc'/></span>
            <span>使用手册</span>
          </div>
          <Tooltip
            force
            title={<div style={{padding: 10}}>
              <div style={{marginBottom: 5}}>扫码加入交流群</div>
              <div>
                <img src={qun} alt='' style={{width: 200, height: 200}}/>
              </div>
            </div>}>
            <div>
              <span><Icon type='icon-community'/></span>
              <span>讨论交流</span>
            </div>
          </Tooltip>
        </div>
        <div className={`${currentPrefix}-left-bottom`}>
          <div>
            <span>
              <img src={yonsum} alt=""/>
              <span>
                <span>杨数起元</span>
                <span>YONSUM</span>
              </span>
            </span>
            <span style={{cursor: 'pointer'}} onClick={() => openLink('http://www.yonsum.com')}>http://www.yonsum.com</span>
          </div>
        </div>
      </div>
      <div className={`${currentPrefix}-right`}>
        <div className={`${currentPrefix}-right-recent`}>
          <div className={`${currentPrefix}-right-recent-title`}>最近使用</div>
          <div className={`${currentPrefix}-right-recent-body`}>
            {[recentTitle].concat(userConfig?.projectHistories || []).map((it, i) => {
              const currentStyle = it.color ? {'--div-color': it.color} : {};
              return <div className={`${currentPrefix}-right-recent-body-item`} key={i}>
                <div
                  className={classesMerge({
                    [`${currentPrefix}-right-recent-body-item-color`]: !!it.color,
                  })}
                  style={currentStyle}>{i !== 0 && <SVGPicker width="100" height="100" value={it.avatar || defaultDBSvg} readOnly/>}</div>
                <div onClick={() => i !== 0 && openProject(it)}>{it.name}</div>
                {/*<div>{it.path}</div>*/}
                <div><MiddleTruncate text={it.path}/></div>
                <div>{it.entityNum}</div>
                <div>{it.diagramNum}</div>
                <div>{Number(it.timestamp) ? formatTime(Number(it.timestamp)) : it.timestamp}</div>
                <div>
                  {
                    i === 0 ? it.operation : <>
                      <IconTitle icon='icon-take-aim' onClick={() => locationProject(it)} />
                      <IconTitle icon='icon-close' onClick={() => removeProject(it)} />
                    </>
                  }
                </div>
              </div>;
            })}
          </div>
        </div>
        <div className={`${currentPrefix}-right-reference`}>
          <div className={`${currentPrefix}-right-reference-title`}>参考案例</div>
          <div className={`${currentPrefix}-right-reference-body`}>
            {[referenceCaseTitle, ...demoList].map((it, i) => {
              return <div className={`${currentPrefix}-right-reference-body-item`} key={i}>
                <div>{i !== 0 &&
                  <SVGPicker width="100" height="100" value={it.avatar || defaultDBSvg} readOnly/>}</div>
                <div onClick={() => openDemoProject(it)}>{it.name}</div>
                <div>{it.entityNum}</div>
                <div>{it.diagramNum}</div>
              </div>;
          })}
          </div>
        </div>
      </div>
    </div>;
});
