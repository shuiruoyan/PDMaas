import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import './style/index.less'
import { MultipleSelect } from 'components';
import {getPrefix} from '../../../../../lib/classes';
import { commonCanvasSetup, logicAndPhysicalCanvasSetup, PREVIEW_TYPE,
    getDiagramsStyle, originData,
} from './canvasData';
import CanvasItem from './CanvasItem';
import CanvasPreviewCom from './CanvasPreviewCom';
import IconRender from './IconRender';

const PhysicalModelCanvas = React.memo(forwardRef(({defaultData}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig')
    const MultipleSelectOption = MultipleSelect.Option;
    const props = defaultData.props;
    const [physicalDefaultSetup, setPhysicalDefaultSetup] = useState(getDiagramsStyle(props))
    const [relationDisplayName, setRelationDisplayName] = useState(props.entityDisplay.showFields.join(','))
    const physicalDataRef = useRef({...props})
    const comRef = useRef()
    const attrArray =[];
    for (let i = 1; i <= 20; i++) {
        attrArray[i - 1] = {
            value: 'attr' + i,
            displayName: '扩展' + i,
        }
    }
    const physicalModelDisplayColumn = [
        {value: 'defKey', displayName: '代码'},
        {value: 'defName', displayName: '名称'},
        {value: 'intro', displayName: '备注说明'},
        {value: 'baseDataType', displayName: '基本数据类型'},
        {value: 'bizDomainType', displayName: '业务域类型'},
        {value: 'dbDataType', displayName: '数据类型'},
        {value: 'dataLen', displayName: '长度'},
        {value: 'numScale', displayName: '小数点'},
        {value: 'primaryKey', displayName: '主键'},
        {value: 'notNull', displayName: '不为空'},
        {value: 'autoIncrement', displayName: '自增'},
        {value: 'defaultValue', displayName: '默认值'},
    ].concat(attrArray)
    useImperativeHandle(ref, () => {
        return {
            getDataRef: () => {
                return physicalDataRef.current;
            },
            importConfig: (props) => {
                physicalDataRef.current = props;
                setPhysicalDefaultSetup(getDiagramsStyle(props))
                setRelationDisplayName([...props.entityDisplay.showFields].join(','))
                comRef.current?.reset(props.entitySetting.titleText.customValue,
                    props.entitySetting.titleText.optionValue)
            }
        }
    },[]);

    useEffect(() => {

    }, []);


    const onFieldsChange = (e) => {
        const targetValue = e.target.value;
        setRelationDisplayName(targetValue);
        physicalDataRef.current.entityDisplay.showFields = targetValue.split(',')
    }
    return <React.Fragment>
        <div className={`${currentPrefix}-logicandphysical`}>
            <div className={`${currentPrefix}-logicandphysical-left`}>
                <div>
                    <div>
                        <span>物理模型-显示设置</span>
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
                            onChange={onFieldsChange}
                        >
                            {
                                physicalModelDisplayColumn.map((item) => {
                                    return <MultipleSelectOption
                                        key={item.value}
                                        value={item.value}>{item.displayName}</MultipleSelectOption>;
                                })
                            }
                        </MultipleSelect>
                    </div>
                </div>
                <div>
                    <div>
                        <span>物理模型-默认设置</span>
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
                                        setCanvasStyle={setPhysicalDefaultSetup}
                                        diagramData={physicalDataRef}
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
                                 setCanvasStyle={setPhysicalDefaultSetup}
                                 diagramData={physicalDataRef}
                                 canvasStyle={physicalDefaultSetup}
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
                        previewType={PREVIEW_TYPE.PHYSICAL}
                        previewStyle={physicalDefaultSetup}
                        fields={originData.fields}
                        relationDisplayName={relationDisplayName}
                    />
                </span>
            </div>
        </div>
        {
            commonCanvasSetup.map((item, i) => {
                return <CanvasItem
                    data={item}
                    setCanvasStyle={setPhysicalDefaultSetup}
                    key={i}
                    diagramData={physicalDataRef}
                    canvasStyle={physicalDefaultSetup}
                >
                    <CanvasPreviewCom
                        previewType={item.previewType}
                        previewStyle={physicalDefaultSetup}
                    />
                </CanvasItem>;
            })
        }
    </React.Fragment>;
}));
export default PhysicalModelCanvas;
