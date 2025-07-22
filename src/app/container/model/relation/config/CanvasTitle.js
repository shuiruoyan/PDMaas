import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import './style/index.less'
import { Button, Input, Tooltip, CodeEditor, Icon} from 'components';
import {BUTTON_ID, getDiagramsStyle, originData} from './canvasData';
import {getPrefix} from '../../../../../lib/classes';

const CanvasTitle = React.memo(forwardRef(({setCanvasStyle,
                                                     diagramData, defaultData}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig')
    const titleText = {...(defaultData.props.entitySetting.titleText || {})};
    const [customValue, setCustomValue] = useState(titleText.customValue || '{defKey}[{defName}]')
    const [buttonActive, setButtonActive] = useState(titleText.optionValue || BUTTON_ID.A)
    const [isDisable, setIsDisable] = useState(titleText.optionValue !== BUTTON_ID.C)
    const ButtonGroup = Button.ButtonGroup;
    const titleCustomValueRef = useRef(titleText.customValue)

    useImperativeHandle(ref, () => ({
        reset: modifyTitleText
    }),[]);

    const buttonOptions = [
        {optionValue: BUTTON_ID.A, text: '全部'},
        {optionValue: BUTTON_ID.N, text: '名称'},
        {optionValue: BUTTON_ID.K, text: '代码'},
        {optionValue: BUTTON_ID.C, text: '自定义'},
    ];
    const updateTitle = useCallback((key, text) => {
        setCanvasStyle((p) =>{
            return {
                ...p,
                entitySetting: {
                    ...p.entitySetting,
                    titleText: {
                        ...p.entitySetting.titleText,
                        optionValue: key,
                        customValue: text
                    }
                }
            }
        })
        diagramData.current = {
            ...diagramData.current,
            entitySetting: {
                ...diagramData.current.entitySetting,
                titleText: {
                    ...(diagramData.current.entitySetting.titleText || {}),
                    optionValue: key,
                    customValue: text
                }
            }
        }
    }, [])
    const modifyTitleText = useCallback((e, key) => {
        setButtonActive(key)
        switch (key) {
            case BUTTON_ID.A:
                setIsDisable(true)
                updateTitle(key, '{defKey}[{defName}]')
                break;
            case BUTTON_ID.N:
                setIsDisable(true)
                updateTitle(key, '{defName}')
                break;
            case BUTTON_ID.K:
                setIsDisable(true)
                updateTitle(key, '{defKey}')
                break;
            case BUTTON_ID.C:
               updateTitle(key, titleCustomValueRef.current)
                setIsDisable(false)
                break;
            default:
                break;
        }
    },[])
    const inputChange = (e) => {
        setCustomValue(e.target.value);
        titleCustomValueRef.current = e.target.value;
        updateTitle(BUTTON_ID.C, e.target.value);
    }
    return <span className={`${currentPrefix}-buttonGroup`}>
        <span>
            <ButtonGroup
                onClick={modifyTitleText}
                active={buttonActive}
            >
            {
                buttonOptions.map((o) => <Button
                    key={o.optionValue}>{o.text}</Button>)
            }
            </ButtonGroup>
        </span>
        {
            isDisable || <>
                <span>
                    数据样本
                    <Tooltip
                        force
                        // trigger='click'
                        title={<CodeEditor value={JSON.stringify(originData, null, 2)} mode="json"/>}
                    >
                        <Icon type='icon-down-more-copy' />
                    </Tooltip>
                </span>

                <Input disable={isDisable}
                       placeholder={'{defKey}[{defName}]'}
                       value={customValue}
                       maxLength={30}
                       style={{
                           height: '30px',
                           lineHeight: '30px',
                           width: '250px'
                       }}
                       onChange={(e) => inputChange(e)}/>
            </>
        }

    </span>;
}));
export default CanvasTitle;
