import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
} from 'react';
import {CodeEditor, Button, openModal, DotGrammar, Tooltip} from 'components';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {getTemplate2String} from '../../../../lib/json2code';
import {commandTplNsKey} from '../../../../lib/permission';
import {LOADING, NORMAL} from '../../../../lib/constant';
import {updateOpce} from '../../../../lib/profile_data_handling';

export default React.memo(({dataSource, updateUser,
                                          getCurrentUserConfig}) => {
    const currentPrefix = getPrefix('type-operationformat');
    const [showFormatDisplay, setShowFormatDisplay] = useState(true);
    const [opceTemplets, setOpceTemplets] = useState(_.groupBy(
        [...dataSource.profile.global.opceTemplets],
        item => item.opceKey.split('_')[1]));
    const [currentOpceTemplet, setCurrentOpceTemplet] = useState({});
    const [messageTemplet, setMessageTemplet] = useState('');
    const [dataSample, setDataSample] = useState('');
    const opceTempletsKeys = _.keys(opceTemplets);
    const opceMap = {
        MODE: '模式操作',
        CATEGORY: '目录操作',
        ENTITY: '实体操作',
        FIELD: '字段操作',
        DIAGRAM: '关系图操作',
        PROJECT: '项目操作',
        INDEX: '索引操作',
        FORBIDDEN: '请求禁止',
        MERGE: '分支合并',
        BRANCH: '分支操作',
        REVIEW: '评审',
        REVISION: '修订',
        BATCH: '批量调整',
    };
    const opceTempletClick = useCallback((o) => {
        setCurrentOpceTemplet({...o});
        setShowFormatDisplay(false);
        setMessageTemplet(o.messageTemplet);
        setDataSample(o.dataSample || '');
    }, []);
    const opceTempletChange = useCallback((e) => {
        const targetValue = e.target.value;
        setMessageTemplet(targetValue);
    }, []);
    const dataSampleChange = useCallback((e) => {
        const targetValue = e.target.value;
        setDataSample(targetValue);
    }, []);
    const _updateOpce = (btn) => {
        btn.updateStatus(LOADING);
        updateUser(updateOpce(getCurrentUserConfig, {
            ...currentOpceTemplet,
            messageTemplet,
            dataSample,
        })).then(() => {
            btn.updateStatus(NORMAL);
        });
    };
    useEffect(() => {

    }, []);
    useEffect(() => {
        setOpceTemplets(_.groupBy(
            [...dataSource.profile.global.opceTemplets],
            item => item.opceKey.split('_')[1]));
    }, [dataSource.profile.global.opceTemplets]);

    const openDotIntroduce = useCallback(() => {
        let modal;
        const onClose = () => {
            modal.close();
        };
        modal = openModal(<DotGrammar />, {
            title: 'dot.js语法介绍',
            bodyStyle: {
                width: '60%',
            },
            buttons: [
              <Button
                onClick={onClose}
                key="onClose"
              >
                  关闭
              </Button>,
            ],
        });
    }, []);

    const outValue = useMemo(() => {
        const tempOutValue = '';
        try {
            return getTemplate2String(messageTemplet,
                JSON.parse(dataSample || '{}'));
        } catch (e) {
            return tempOutValue;
        }
    }, [dataSample, messageTemplet]);
    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-left`}>
        <div className={`${currentPrefix}-left-title`}>
          <span>所有操作</span>
          {/*<IconTitle*/}
          {/*  loading={loading}*/}
          {/*  onClick={reloadOpce}*/}
          {/*  icon='icon-reload'*/}
          {/*  title='刷新列表'/>*/}
        </div>
        <div className={`${currentPrefix}-left-body`}>
          <span>
            <span>操作代码</span>
            <span>操作名称</span>
          </span>
          {
            opceTempletsKeys.map((key, index) => {
              return<React.Fragment
                key={index}
              >
                <span style={{
                  fontWeight:'bold',
                  paddingTop: '3px',
                }}>{opceMap[key]}</span>
                {
                  opceTemplets[key].map((o, i) => {
                    return <span
                      key={i}
                    >
                      <Tooltip
                        force
                        title={o.opceKey}>
                        <span onClick={() => {
                            opceTempletClick(o);
                        }}>{o.opceKey}</span>
                      </Tooltip>
                      <span>{o.opceName}</span>
                    </span>;
                  })
                }
              </React.Fragment>;
            })
          }
        </div>
      </div>
      {
        showFormatDisplay ||
        <div className={`${currentPrefix}-right`}>
          <div className={`${currentPrefix}-right-title`}>
            <span>格式化显示配置{`(${currentOpceTemplet.opceKey}_${currentOpceTemplet.opceName})`}</span>
          </div>
          <div className={`${currentPrefix}-right-body`}>
            <div>
              <div>
                <span>
                      格式化代码
                  <span
                    onClick={openDotIntroduce}
                      >(dot.js语法介绍)</span>
                </span>
                <span><CodeEditor
                  width='100%'
                  readOnly={!updateUser}
                  height='100%'
                  value={messageTemplet}
                  onChange={(e) => { opceTempletChange(e); }}
                    /></span>
              </div>
              <div>
                <span>参考数据</span>
                <span><CodeEditor
                  width='100%'
                  readOnly={!updateUser}
                  height='100%'
                  value={dataSample}
                  onChange={(e) => { dataSampleChange(e); }}
                      // readOnly
                    /></span>
              </div>
            </div>
            <div>
              <span>输出内容</span>
              <span>
                <CodeEditor
                  height='80px'
                  width='100%'
                  readOnly={!updateUser}
                  value={outValue}
                />
              </span>
            </div>
            <div>
              <Button onClick={() => { setShowFormatDisplay(true); }}>取消</Button>
              {updateUser && <Button type="primary" onClick={(e, btn) => _updateOpce(btn)} nsKey={commandTplNsKey.U}>确认</Button>}
            </div>
          </div>
        </div>
      }
    </div>;
});
