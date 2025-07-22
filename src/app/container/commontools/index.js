import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import _ from 'lodash';
import {getPrefix} from '../../../lib/classes';
import './style/index.less';
import {PROFILE, PROJECT} from '../../../lib/constant';
import {sendData} from '../../../lib/utils';
import {filterTreeData, labelRenderGlobal} from '../model/menu/filterTree';

export default React.memo(forwardRef(({ menuTool,dataSource, getCurrentStandard,
                                          getCurrentDataSource,
                                          updateUserProfile, getCurrentUserConfig,
                                          updateUser, config, user}, ref) => {
    const toolDomRef = useRef(null);
    const prefix = getPrefix('common-tools');
    const [ToolCom, setToolCom] = useState(null);
    const [toolComArr, setToolComArr] = useState([]);
    const [currentDataSource, setCurrentDataSource] = useState(dataSource);
    const [isFlat, setIsFlat] = useState(false);
    const [progress, setProgress] = useState({
        key: '',
        totalNumber: 0,
        currentDataKey: '',
        currentSendId: '',
        completedNumber: 0,
        data: [],
        disable: false,
    });
    const progressRef = useRef({});
    const entitiesRef = useRef();
    const userProfileRef = useRef();
    const currentDataSourceRef = useRef();

    currentDataSourceRef.current = currentDataSource;
    userProfileRef.current = currentDataSource.profile?.user;
    entitiesRef.current = currentDataSource.project.entities;

    const labelRender = useCallback((node) => {
        const modelingNavDisplay = userProfileRef.current.modelingNavDisplay;
        return labelRenderGlobal(node, {modelingNavDisplay});
    }, []);

    const flatTreeData = useMemo(() => {
        const cur = currentDataSourceRef.current;
        return filterTreeData({
            ...cur,
            profile: {
                ...cur.profile,
                user: {
                    ...cur.profile.user,
                    modelingNavDisplay: {
                        ...cur.profile.user.modelingNavDisplay,
                        hierarchyType: PROFILE.USER.FLAT,
                    },
                },
            },
        }, {
            filterNodes: [
                PROJECT.ENTITY_SUB,
                ...(ToolCom && ToolCom.orderValue === 1 ?
                    [PROJECT.LOGIC_ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB] : []),
            ],
        });
    }, [
        ToolCom,
        currentDataSource.project.categories,
        currentDataSource.project.entities,
    ]);


    const treeData = useMemo(() => {
        if(isFlat) {
            return flatTreeData;
        }
        const cur = currentDataSourceRef.current;
        return filterTreeData({
            ...cur,
            profile: {
                ...cur.profile,
                user: {
                    ...cur.profile.user,
                    modelingNavDisplay: {
                        ...cur.profile.user.modelingNavDisplay,
                        hierarchyType: PROFILE.USER.TREE,
                    },
                },
            },
        }, {
            filterNodes: [
                PROJECT.ENTITY_SUB,
                ...(ToolCom && ToolCom.orderValue === 1 ?
                    [PROJECT.LOGIC_ENTITY_SUB, PROJECT.CONCEPT_ENTITY_SUB] : []),
            ],
        });
    }, [
        ToolCom,
        isFlat,
        currentDataSource.project.categories,
        currentDataSource.project.entities,
        currentDataSource.profile?.user?.modelingNavDisplay,
    ]);

    const _sendData = (data, key, filterNumber, totalNumber) => {
        const id = Math.uuid();
        const callback = (d) => {
            setCurrentDataSource(pre => ({
                ...(getCurrentDataSource() || pre),
            }));
            if (progressRef.current.currentSendId === d.ctId && d.payload) {
                progressRef.current.currentSendId = '';
                _sendData();
            }
        };
        if(data) {
            const tempData = [...data];
            if(tempData.length === 0) {
                progressRef.current = {
                    key,
                    totalNumber: totalNumber || data.length + filterNumber,
                    currentDataKey: '',
                    currentSendId: '',
                    completedNumber: filterNumber,
                    data: [...tempData],
                    disable: false,
                };
                setProgress(() => ({
                    ...progressRef.current,
                }));
                return;
            }
            const payload = tempData.shift();
            progressRef.current = {
                key,
                totalNumber: totalNumber || data.length + filterNumber,
                currentDataKey: payload.defKey,
                currentSendId: id,
                completedNumber: filterNumber,
                data: [...tempData],
                disable: true,
            };
            setProgress(() => ({
                ...progressRef.current,
            }));
            sendData(_.omit(payload, 'defKey'), id, callback, true);
        } else {
            if(progressRef.current.data.length === 0) {
                progressRef.current = {
                    ...progressRef.current,
                    currentDataKey: '',
                    disable: false,
                    completedNumber: progressRef.current.completedNumber + 1,
                };
                setProgress({...progressRef.current});
                return;
            }
            const tempData = [...progressRef.current.data];
            const payload = tempData.shift();
            progressRef.current = {
                ...progressRef.current,
                currentDataKey: payload.defKey,
                currentSendId: id,
                completedNumber: payload.defKey !== progressRef.current.currentDataKey ?
                    progressRef.current.completedNumber + 1 : progressRef.current.completedNumber,
                data: [...tempData],
            };
            setProgress({...progressRef.current});
            sendData(_.omit(payload, 'defKey'), id, callback, true);
        }
    };

    useEffect(() => {
        const tmpArr = [];
        const requireContext = require.context('../commontools', true,  /\.js$/);
        requireContext.keys().filter(it => !it.includes('index.js'))?.forEach((key) => {
            let toolComObj = {};
            const com = requireContext(key).default;
            toolComObj.id = com.orderValue;
            toolComObj.component = com;
            tmpArr.push(toolComObj);
        });
        setToolComArr([].concat(tmpArr));
    }, []);
    useEffect(() => {
        const toolItem = toolComArr.find(it => it.id === menuTool.key);
        if (toolItem) {
            const Com = toolItem.component;
            Com && setToolCom(Com);
        }
    }, [toolComArr]);

    useImperativeHandle(ref, () => {
        return {
            batchDataProcess: () => {
                return toolDomRef.current.batchDataProcess();
            },
            isUpdate: () => {
                return toolDomRef.current.isUpdate();
            },
        };
    }, []);

    return <div className={`${prefix}`}>{ ToolCom && <ToolCom
      user={user}
      getCurrentStandard={getCurrentStandard}
      _sendData={_sendData}
      ref={toolDomRef}
      dataSource={dataSource}
      config={config}
      baseClass={prefix}
      progress={progress}
      treeData={treeData}
      getCurrentUserConfig={getCurrentUserConfig}
      updateUser={updateUser}
      flatTreeData={flatTreeData}
      setIsFlat={setIsFlat}
      isFlat={isFlat}
      getCurrentDataSource={getCurrentDataSource}
      currentDataSource={currentDataSource}
      updateUserProfile={updateUserProfile}
      labelRender={labelRender}
    /> || <div />}</div>;
}));
