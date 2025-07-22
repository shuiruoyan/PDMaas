import React, { useState } from 'react';
import {IconTitle, Message, closeLoading, openLoading, Modal} from 'components';
import {classesMerge, getPrefix} from '../../../lib/classes';
import BaseType from './basetype';
import Domain from './domain';
import LanguageType from './languagetype';
import OperationFormat from './operationformat';
import './style/index.less';
import {
    baseBizDataType, baseDataType,
    checkPermission, codegen, commandTpl, dbType,
} from '../../../lib/permission';
import {downloadString, upload} from '../../../lib/rest';
import {loadTypeFromFile, restoreDefaultType} from '../../../lib/profile_data_handling';

export default React.memo(({dataSource, onRefresh,
                               updateUser, getCurrentUserConfig}) => {
    const [active, setActive] = useState(() => {
        if(checkPermission(baseBizDataType)) {
            return 'domain';
        }
        if(checkPermission(baseDataType)) {
            return 'basetype';
        }
        if(checkPermission(dbType)) {
            return 'database';
        }
        if(checkPermission(codegen)) {
            return 'program';
        }
        if(checkPermission(commandTpl)) {
            return 'message';
        }
        return '';
    });
    const currentPrefix = getPrefix('container-type');
    const comArray = [
        {
            com: Domain,
            title: '业务域类型',
            key: 'domain',
            nsKey: baseBizDataType,
        },
        {
            com: BaseType,
            title: '基本数据类型',
            key: 'basetype',
            nsKey: baseDataType,
        },
        {
            com: LanguageType,
            title: '数据库品牌',
            key: 'database',
            nsKey: dbType,
        },
        {
            com: LanguageType,
            title: '编程语言类型',
            key: 'program',
            nsKey: codegen,
        },
        {
            com: OperationFormat,
            title: '操作格式化显示',
            key: 'message',
            nsKey: commandTpl,
        }];
    const _setActive = (key, disable) => {
        if(!disable) {
            setActive(key);
        }
    };

    const downLoadType = () => {
        downloadString(JSON.stringify({
                profile: {
                    team: {
                        bizDomainTypes: dataSource.profile.team.bizDomainTypes,
                    },
                    global: {
                        ...dataSource.profile.global,
                    },
                },
            }, null, 2),
            'application/json', 'pdmass_type.json');

    };

    const _restoreDefaultType = () => {
        openLoading('正在恢复默认设置！');
        updateUser(restoreDefaultType(getCurrentUserConfig))
            .then(() => {
                closeLoading();
                Message.success({title: '恢复成功'});
            })
            .catch((err) => {
                closeLoading();
                Modal.error({
                    title: '错误',
                    message: JSON.stringify(err?.message || err),
                });
            });
    };

    const _loadTypeFromFile = () => {
        // openLoading('正在加载中。。。');
        const typeArray = ['json'];
        upload(typeArray.join(','), (data) => {
            try {
                updateUser(loadTypeFromFile(getCurrentUserConfig, JSON.parse(data)))
                    .then(() => {
                        // closeLoading();
                        Message.success({title: '恢复成功'});
                    })
                    .catch((err) => {
                        // closeLoading();
                        Modal.error({
                            title: '错误',
                            message: JSON.stringify(err?.message || err),
                        });
                    });
            } catch (e) {
                Message.error({title: '格式错误'});
            }
        }, (e) => {
            const {name} = e;
            if(typeArray.filter(it => name.endsWith(it)).length > 0) {
                return true;
            }
            Message.error({title: '文件类型错误'});
            return false;
        }, true);

    };

    return  <div className={currentPrefix}>
      {
        updateUser && <div className={`${currentPrefix}-tool`}>
          <div>类型设置</div>
          <div>
            <IconTitle icon="icon-folder-open" title="从文件加载" onClick={() => { _loadTypeFromFile(); }}/>
            <IconTitle icon="icon-folder-open" title="另存为" onClick={() => { downLoadType(); }}/>
            <IconTitle icon="icon-folder-open" title="恢复默认" onClick={() => { _restoreDefaultType(); }}/>
          </div>
        </div>
      }
      <div className={`${currentPrefix}-header`}>
        {
                comArray.map((c) => {
                    const disable = c.nsKey && !checkPermission(c.nsKey);
                    return <span
                      onClick={() => _setActive(c.key, disable)}
                      key={c.key}
                      className={classesMerge({
                            [`${currentPrefix}-header-active`]: c.key === active,
                            [`${currentPrefix}-header-normal`]: c.key !== active,
                            [`${currentPrefix}-header-disable`]: disable,
                        })}>
                      {c.title}
                    </span>;
                })
            }
      </div>
      <div className={`${currentPrefix}-body`}>
        {
                comArray.map((c) => {
                    const Com = c.com;
                    return <div
                      key={c.key}
                      className={classesMerge({
                            [`${currentPrefix}-body-active`]: c.key === active,
                            [`${currentPrefix}-body-normal`]: c.key !== active,
                        })}>
                      <Com
                        setActive={setActive}
                        type={c.key}
                        getCurrentUserConfig={getCurrentUserConfig}
                        updateUser={updateUser}
                        onRefresh={onRefresh}
                        dataSource={dataSource}/>
                    </div>;
                })
            }
      </div>
    </div>;
});
