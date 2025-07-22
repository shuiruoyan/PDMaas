import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import './style/index.less'
import { Button, Input, Radio, MultipleSelect } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {
    commonCanvasSetup,
    logicAndPhysicalCanvasSetup,
    PREVIEW_TYPE,
    LOGICAL_COMPACT,
    getDiagramsStyle, originData
} from './canvasData';
import _ from 'lodash';
import CanvasItem from './CanvasItem';
import CanvasPreviewCom from './CanvasPreviewCom';
import IconRender from './IconRender';

const LogicModelCanvas = React.memo(forwardRef(({defaultData}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig')
    const logicalModelDisplayColumn = [
        {value: 'defKey', displayName: '代码'},
        {value: 'defName', displayName: '名称'},
        {value: 'primaryKey', displayName: '主鍵'},
        {value: 'notNull', displayName: '不为空'},
        {value: 'baseDataType', displayName: '基本数据类型'},
        {value: 'dataLen', displayName: '长度'},
        {value: 'numScale', displayName: '小数点'},
        {value: 'intro', displayName: '备注说明'},
    ]
    const props = {...defaultData.props};
    const ButtonGroup = Button.ButtonGroup;
    const [logicalDefaultSetup, setLogicalSDefaultSetup] = useState(getDiagramsStyle(props))
    const MultipleSelectOption = MultipleSelect.Option;
    const [logicModelCompactShow, setLogicModelCompactShow] = useState(props.entityDisplay.logicModelCompactShow);
    const [logicModelCompactDelimiter, setLogicModelCompactDelimiter] = useState(props.entityDisplay.logicModelCompactDelimiter)
    const [relationDisplayName, setRelationDisplayName] = useState(
        [...(props.entityDisplay.showFields || [])
            .filter(item => logicalModelDisplayColumn.find(f => item === f.value))]
            .join(',')
    )
    const logicDataRef = useRef(defaultData.props)
    const comRef = useRef();


    const displayContent = _.trimStart(_.trimEnd(_.map(originData.fields.slice(2)
        , logicModelCompactShow === LOGICAL_COMPACT.N ? 'defName' : 'defKey')
        .join(logicModelCompactDelimiter), logicModelCompactDelimiter), logicModelCompactDelimiter);
    useImperativeHandle(ref, () => {
        return {
            getDataRef: () => {
                return logicDataRef.current;
            },
            importConfig: (props) => {
                logicDataRef.current = props;
                setLogicalSDefaultSetup(getDiagramsStyle(props))
                setLogicModelCompactShow(props.entityDisplay.logicModelCompactShow)
                setLogicModelCompactDelimiter(props.entityDisplay.logicModelCompactDelimiter)
                setRelationDisplayName([...props.entityDisplay.showFields].join(','))
                comRef.current?.reset(props.entitySetting.titleText.customValue,
                    props.entitySetting.titleText.optionValue)
            }
        }
    }, []);

    useEffect(() => {

    }, []);
    const logicModelCompactDelimiterChange = (e) => {
        const targetValue = e.target.value;
        setLogicModelCompactDelimiter(targetValue)
        logicDataRef.current.entityDisplay.logicModelCompactDelimiter = targetValue
    }

    const logicModelCompactShowChange = (key) => {
        setLogicModelCompactShow(key)
        logicDataRef.current.entityDisplay.logicModelCompactShow = key
    }

    const showFieldsChange = (e) => {
        const targetValue = e.target.value;
        setRelationDisplayName(targetValue);
        logicDataRef.current.entityDisplay.showFields = targetValue.split(',')
    }
    return <React.Fragment>
        <div className={`${currentPrefix}-logicandphysical`}>
            <div className={`${currentPrefix}-logicandphysical-left`}>
                <div>
                    <div>
                        <span>逻辑模型-显示设置</span>
                    </div>
                    <div>
                        <span>关联精度</span>
                        <span>
                            {defaultData.entityRelationRank === 'F' ? '字段/属性' : '表/实体'}
                        </span>
                        <span> (项目新建时指定，后续不可修改) </span>
                    </div>
                    <div>
                        <span>关系图显示列</span>
                        <MultipleSelect
                            value={relationDisplayName}
                            onChange={(e) => { showFieldsChange(e) }}>
                            {
                                logicalModelDisplayColumn.map((item) => {
                                    return <MultipleSelectOption
                                        key={item.value}
                                        value={item.value}>{item.displayName}</MultipleSelectOption>;
                                })
                            }
                        </MultipleSelect>
                    </div>
                    <div>
                        <span>紧凑模式显示内容</span>
                        <span>
                            <ButtonGroup
                                onClick={(e, key) => { logicModelCompactShowChange(key)}}
                                active={logicModelCompactShow}
                            >
                            <Button key={LOGICAL_COMPACT.N}>名称</Button>
                            <Button key={LOGICAL_COMPACT.K}>代码</Button>
                        </ButtonGroup>
                        </span>
                    </div>
                    <div>
                        <span>紧凑模式分割字符</span>
                        <Input
                            maxLength={1}
                            value={logicModelCompactDelimiter}
                            onChange={(e) => { logicModelCompactDelimiterChange(e) }} />
                    </div>
                </div>
                <div>
                    <div>
                        <span>逻辑模型-默认设置</span>
                        <span>{logicAndPhysicalCanvasSetup.secondTitle}</span>
                    </div>
                    {
                        logicAndPhysicalCanvasSetup.children.map((c, i) => {
                            const Com = c.Com;
                            if (Com) {
                                return <div
                                    key={i}
                                >
                                    <span>{c.title}</span>
                                    <Com
                                        setCanvasStyle={setLogicalSDefaultSetup}
                                        diagramData={logicDataRef}
                                        defaultData={defaultData}
                                        ref={comRef}
                                    />
                                </div>
                            }
                            return <div
                                key={i}
                            >
                                <span>{c.title}</span>
                                <span>
                             <IconRender
                                 firstKey={logicAndPhysicalCanvasSetup.firstKey}
                                 secondKey={c.secondKey}
                                 iconItems={c.items}
                                 setCanvasStyle={setLogicalSDefaultSetup}
                                 diagramData={logicDataRef}
                                 canvasStyle={logicalDefaultSetup}
                             />
                        </span>
                            </div>
                        })
                    }
                </div>
            </div>
            <div className={`${currentPrefix}-logicandphysical-right`}>
                <span>效果预览</span>
                <span>
                    <CanvasPreviewCom
                        previewType={PREVIEW_TYPE.LOGIC}
                        previewStyle={logicalDefaultSetup}
                        fields={originData.fields}
                        relationDisplayName={relationDisplayName}
                        displayContent={displayContent}
                    />
                </span>
            </div>
        </div>
        {
            commonCanvasSetup.map((item, i) => {
                return <CanvasItem
                    data={item}
                    setCanvasStyle={setLogicalSDefaultSetup}
                    key={i}
                    diagramData={logicDataRef}
                    canvasStyle={logicalDefaultSetup}
                >
                    <CanvasPreviewCom
                        previewType={item.previewType}
                        previewStyle={logicalDefaultSetup}
                    />
                </CanvasItem>;
            })
        }
    </React.Fragment>;
}));
export default LogicModelCanvas;
