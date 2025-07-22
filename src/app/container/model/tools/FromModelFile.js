import React, {forwardRef, useCallback, useState, useImperativeHandle, useRef } from 'react';
import _ from 'lodash';
import moment from 'moment';
import {Button, closeLoading, Icon, Message, Modal, openLoading} from 'components';
import { getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {
    getCanvasDefaultSetting,
} from '../../../../lib/json';
import Step from './Step';
import SelectTable from './SelectTable';
import ExecRead from './ExecRead';
import ToolButton from './ToolButton';
import {upload} from '../../../../lib/rest';
import {parseProjectFile} from '../../../../lib/utils';
import {getIdAsyn} from '../../../../lib/idpool';
import SelectTableAndDiagram from './SelectTableAndDiagram';
import {tree2array} from '../../../../lib/tree';


const steps = [
    {key: 1, name: '选择模型文件'},
    {key: 2, name: '选择表并进行分类'},
    {key: 3, name: '执行读取'},
];

export default React.memo(forwardRef(({close, defaultTreeData, defaultActive,
                                          getCurrentDataSource}, ref) => {
    const currentPrefix = getPrefix('container-model-tools-fromModelFile');
    const newHomeCoverRef = useRef(null);
    const stepRef = useRef();
    const execReadRef = useRef();
    const selectTableRef = useRef();
    const treeRef = useRef();
    const execReadDataRef = useRef([]);
    const isRushModeRef = useRef(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoad, setIsLoad] = useState(true);
    const ButtonGroup = Button.ButtonGroup;
    const selectTableDataRef = useRef([]);
    const buttons = [
        {key: 'fromEZDML', name: '从EZDML文件', type: '~dmj', fileType: 'EZDML'},
        {key: 'fromPDManer', name: '从PDManer及老版本文件', title: 'pdmaner-v4.0-4.9版本的json文件' , type: 'json', fileType: 'PDManer'},
        {key: 'fromPDManerEE', name: '从项目文件', title: 'PDMaas-EE/PDMaas-CE的项目文件格式' , type: 'json,pdma', fileType: 'PDMaas'},
    ];
    const [activeButton, setActiveButton] = useState(buttons.find(it => it.key === defaultActive));
    const activeButtonRef = useRef(buttons.find(it => it.key === defaultActive));
    const currentStepRef = useRef(0);
    activeButtonRef.current = activeButton;
    currentStepRef.current = currentStep;

    useImperativeHandle(ref, () => {
        return {
            resetTree: (t) => {
                selectTableRef.current?.resetTree(t);
            },
        };
    }, []);
    const readData = (data) => {
        switch (activeButtonRef.current.key) {
            case 'fromEZDML':
            case 'fromPDManer':
            case 'fromPDManerEE':
                try {
                    const parse = () => {
                        openLoading('文件解析中...');
                        setIsLoad(true);
                        setCurrentStep(s => s + 1);
                        parseProjectFile(data, getCurrentDataSource(), (size) => {
                            return getIdAsyn(size);
                        }).then((res) => {
                            setIsLoad(false);
                            if(activeButtonRef.current.key !== 'fromEZDML') {
                                getCanvasDefaultSetting('P').then((r) => {
                                    selectTableDataRef.current = [res.categories,
                                        res.entities, res.diagrams.map((it) => {
                                            return {
                                                ...it,
                                                props: it.props ? it.props : r,
                                                cellsData: it.cellsData.map((c) => {
                                                    if(c.cellType === 'physical-entity-node') {
                                                        return {
                                                            ...c,
                                                            autoSize: 'autoSize' in c ? c.autoSize : false,
                                                            // eslint-disable-next-line max-len
                                                            size: c.size || r.entitySetting.defaultSize,
                                                            // eslint-disable-next-line max-len
                                                            entityDisplay: c.entityDisplay || r.entityDisplay,
                                                            // eslint-disable-next-line max-len
                                                            entitySetting: c.entitySetting || r.entitySetting,
                                                        };
                                                    }
                                                    return c;
                                                }),
                                            };
                                        })];
                                    newHomeCoverRef.current = res.homeCoverDiagram;
                                    // eslint-disable-next-line max-len
                                    selectTableRef.current?.setData([...selectTableDataRef.current]);
                                }, () => {
                                    closeLoading();
                                    setIsLoad(false);
                                    Modal.error({
                                        title: '错误',
                                        message: `解析${activeButtonRef.current.fileType}文件失败`,
                                    });
                                });
                            } else {
                                selectTableDataRef.current = [res.categories,
                                    res.entities, []];
                                // newHomeCoverRef.current = res.homeCoverDiagram;
                                // eslint-disable-next-line max-len
                                selectTableRef.current?.setData([...selectTableDataRef.current]);
                            }
                        },() => {
                            closeLoading();
                            setIsLoad(false);
                            Modal.error({
                                title: '错误',
                                message: `解析${activeButtonRef.current.fileType}文件失败`,
                            });
                        }).finally(() => {
                            closeLoading();
                        });
                    };
                    if(moment(data.lastModified).isBefore('2024-01-01')) {
                        Modal.confirm({
                            title: '警告',
                            message: '当前导入的项目可能版本过低，导致解析失败，建议先通过PDManer客户端打开后另存为再导入！',
                            onOk: () => {
                                parse();
                            },
                            onCancel: () => {
                            },
                            okText: '继续导入',
                            cancelText: '取消',
                        });
                    } else {
                        parse();
                    }
                } catch (e) {
                    closeLoading();
                    setIsLoad(false);
                    Modal.error({
                        title: '错误',
                        message: `解析${activeButtonRef.current.fileType}文件失败`,
                    });
                }
                break;
            default:
                break;
        }
    };
    const updateDDL = (type) => {
        const typeArray = type.split(',').map(filename => `.${filename}`);
        upload(typeArray.join(','), (data) => {
            try {
                setIsLoad(false);
                readData(data);
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
        }, false);
    };

    const nextStep = useCallback(() => {
        if(currentStepRef.current === 1) {
            execReadDataRef.current = selectTableRef.current.getData();
            if(execReadDataRef.current.length === 0) {
                Message.error({title: '请至少选择一条数据'});
                return;
            }
            isRushModeRef.current = selectTableRef.current.isRushMode();
            treeRef.current = selectTableRef.current.getTree();
            setIsLoad(true);
            setCurrentStep(s => s + 1);
        }
    }, []);

    const preStep = useCallback(() => {
        if(currentStepRef.current === 1) {
            selectTableDataRef.current = [];
            setIsLoad(true);
        } else if(currentStepRef.current === 2) {
            const tempInterval = setInterval(() => {
                if(selectTableRef.current) {
                    setIsLoad(false);
                    clearInterval(tempInterval);
                    if(activeButtonRef.current.key === 'fromPDManer' ||
                        activeButtonRef.current.key === 'fromPDManerEE' ||
                        activeButtonRef.current.key === 'fromEZDML') {
                        const categoryIds = [...(_.map(tree2array(getCurrentDataSource().project.categories), 'id') || [])];
                        // eslint-disable-next-line max-len
                        selectTableDataRef.current[0] = selectTableDataRef.current[0].filter(e => !categoryIds.includes(e.id));
                    }
                    selectTableRef.current?.setData([...selectTableDataRef.current]);
                    selectTableRef.current?.setFullData([...selectTableDataRef.current]);
                }
            }, 100);
        }
        setCurrentStep(s => s - 1);
    }, []);

    const buttonGroupChange = (e, key) => {
        console.log(e, key);
        setActiveButton(buttons.find(it => it.key === key));
    };
    const handleDrop = (e, type) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        if(droppedFiles[0]) {
            const typeArray = type.split(',').map(filename => `.${filename}`);
            if(typeArray.filter(it => droppedFiles[0].name.endsWith(it)).length > 0) {
                setIsLoad(true);
                readData(droppedFiles[0]);
            } else {
                Message.error({title: '文件类型错误'});
            }
        }
    };
    return <div className={`${currentPrefix}`}>
      <Step
        ref={stepRef}
        steps={steps}
        value={currentStep}
        />
      <div className={`${currentPrefix}-body`}>
        {
            currentStep === 0 && <div className={`${currentPrefix}-body-model`}>
              <div className={`${currentPrefix}-body-model-top`}>
                <ButtonGroup
                  active={activeButton.key}
                  onClick={(e, key) => { buttonGroupChange(e, key); }}
                >
                  {
                        buttons.map((it) => {
                            return <Button
                              key={it.key}
                            >{it.name}</Button>;
                        })
                    }
                </ButtonGroup>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={e => handleDrop(e, activeButton.type)}
                className={`${currentPrefix}-body-model-middle`}>
                <span>
                  <Icon
                    type="icon-cloud-upload"
                    onClick={() => { updateDDL(activeButton.type); }}
                    /></span>
                <span>
                  <span onClick={() => { updateDDL(activeButton.type); }}>点击</span>
                    或将文件<span>拖拽</span>到这里上传
                </span>
                <span>支持{activeButton.title || activeButton.type}文档格式</span>
              </div>
            </div>
        }
        {
              currentStep === 1 && (
                  activeButton.key === 'fromPDManer' || activeButton.key === 'fromEZDML' || activeButton.key === 'fromPDManerEE' ?
                    <SelectTableAndDiagram
                      ref={selectTableRef}
                      isLoad={isLoad}
                      getCurrentDataSource={getCurrentDataSource}
                  />
                    :
                    <SelectTable
                      type='file'
                      isLoad={isLoad}
                      ref={selectTableRef}
                      defaultData={[]}
                      getCurrentDataSource={getCurrentDataSource}
                      defaultTreeData={defaultTreeData} />
            )
        }
        {
            currentStep === 2 && <ExecRead
              newHomeCover={newHomeCoverRef.current}
              type='file'
              isRushMode={isRushModeRef.current}
              hasId={activeButton.key === 'fromPDManer' || activeButton.key === 'fromEZDML' || activeButton.key === 'fromPDManerEE'}
              dataSource={getCurrentDataSource()}
              defaultTreeData={treeRef.current}
              defaultData={execReadDataRef.current}
              // onRefresh={onRefresh}
              ref={execReadRef}
              getCurrentDataSource={getCurrentDataSource}
            />
        }
      </div>
      <ToolButton
        steps={steps}
        value={currentStep}
        nextStep={nextStep}
        close={close}
        preStep={preStep}
        isLoad={isLoad}
      />
    </div>;
}));
