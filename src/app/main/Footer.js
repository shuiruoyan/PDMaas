import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {Icon, DropDown, Modal, openLoading, closeLoading} from 'components';
import _ from 'lodash';
import {getPrefix} from '../../lib/classes';
import {ENTITY, LOADING, WS} from '../../lib/constant';
import {sendData} from '../../lib/utils';

export default React.memo(({ dataSource, selectedLen }) => {
    const currentPrefix = getPrefix('main-footer');
    const dbDialects = [...dataSource.profile.global.dbDialects];
    const [projectId, setProjectId] = useState(dataSource.id);
    const entities = [...dataSource.project.entities];
    const diagrams = [...dataSource.project.diagrams];
    const types = _.values(ENTITY.TYPE);
    const [currentDbDialects,setCurrentDbDialects] = useState(dataSource.profile.project.dbDialect);
    const dbDialectsMenu = useMemo(() => {
      return dbDialects.map((db) => {
        return {
          key: db.defKey,
          name: db.defKey,
        };
      });
    }, [dbDialects]);

    const entityCount = useMemo(() => {
      return types.reduce((acc, type) => {
        const countOfType = _.filter(entities, { type: type }).length;
        return {...acc, [type]: countOfType };
      }, {});
    }, [entities]);

    const diagramsCount = useMemo(() => {
      return diagrams.length;
    }, [diagrams]);

    const _dropClick = useCallback((m) => {
        Modal.confirm({
            title: '警告',
            message: `是否切换到${m.key}数据库品牌？`,
            onOk: (ev, btn) => {
                btn.updateStatus(LOADING);
                openLoading('正在切换数据库品牌');
                sendData({
                    event: WS.USER.SWITCH_DBDIALECT,
                    ctId: Math.uuid(),
                    payload: {
                        dbDialect:  m.key,
                    },
                }, null, () => {
                    closeLoading();
                }, true);
            },
            okText: '确定',
            cancelText: '取消',
        });

    }, [projectId, dataSource.project.branch]);

    useEffect(() => {
        setProjectId(dataSource.id);
    }, [dataSource.id]);
    useEffect(() => {
        setCurrentDbDialects(dataSource.profile.project.dbDialect);
    }, [dataSource.profile.project.dbDialect]);
    const getProjectStatus = () => {
        if(dataSource.project.readonly) {
            return '只读';
        }
        return '正常';
    };
    return <div className={currentPrefix}>
      <div>
        <div>
          <span className={`${currentPrefix}-item`}>
            <span>状态</span>
            <span>{getProjectStatus()}</span>
          </span>
          <span className={`${currentPrefix}-item`}>
            <span>数据库类型</span>
            {!dataSource.project.readonly ? <DropDown
              trigger='click'
              menus={dbDialectsMenu}
              position='top'
              menuClick={_dropClick}
              >
              <span>{currentDbDialects}<Icon type="icon-exchange"/></span>
            </DropDown> : <span>{currentDbDialects}</span>}
          </span>
          {/*<span className={`${currentPrefix}-item`}>*/}
          {/*  <span>权限</span>*/}
          {/*  <span>只读<Icon type='icon-exchange'/></span>*/}
          {/*</span>*/}
        </div>
        <div>
          <span className={`${currentPrefix}-item`}>
            <span>概念模型</span>
            <span>{entityCount[ENTITY.TYPE.C]}</span>
          </span>
          <span className={`${currentPrefix}-item`}>
            <span>逻辑模型</span>
            <span>{entityCount[ENTITY.TYPE.L]}</span>
          </span>
          <span className={`${currentPrefix}-item`}>
            <span>物理模型</span>
            <span>{entityCount[ENTITY.TYPE.P]}</span>
          </span>
          <span className={`${currentPrefix}-item`}>
            <span>关系图总数</span>
            <span>{diagramsCount}</span>
          </span>
          {
                    selectedLen > 0 && <span className={`${currentPrefix}-item`}>
                      <span>已经选中了</span>
                      <span>{selectedLen}</span>
                    </span>
                }
        </div>
      </div>
    </div>;
});
