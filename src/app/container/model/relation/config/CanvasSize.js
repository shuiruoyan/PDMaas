import React, {forwardRef, useCallback, useState} from 'react';
import {Button} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {BUTTON_ID} from './canvasData';
import {Message, NumberInput} from 'components';
import './style/index.less'


const CanvasSize = React.memo(forwardRef(({setCanvasStyle,
                                               diagramData, defaultData}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-canvasSize')
    const canvasSize = {...(defaultData.props.entitySetting.defaultSize || {})};
    const [buttonActive, setButtonActive] = useState(canvasSize.optionValue || BUTTON_ID.A)
    const ButtonGroup = Button.ButtonGroup;
    const buttonOptions = [
        {optionValue: BUTTON_ID.A, text: '自适应'},
        {optionValue: BUTTON_ID.C, text: '指定'},
    ];
    const updateCanvasSize = useCallback(({ key, value, uniqueKey}) => {
        setCanvasStyle((p) =>{
            const tempP = {...p};
            if(key) {
                tempP.entitySetting.defaultSize.optionValue = key;
            }
            if(uniqueKey) {
                tempP.entitySetting.defaultSize[uniqueKey] = value;
            }
            return tempP
        })
        if(key) {
            diagramData.current = {
                ...diagramData.current,
                entitySetting: {
                    ...diagramData.current.entitySetting,
                    defaultSize: {
                        ...(diagramData.current.entitySetting.defaultSize || {}),
                        optionValue: key,
                    }
                }
            }
        }
        if(uniqueKey) {
            diagramData.current = {
                ...diagramData.current,
                entitySetting: {
                    ...diagramData.current.entitySetting,
                    defaultSize: {
                        ...(diagramData.current.entitySetting.defaultSize || {}),
                        [uniqueKey]: value,
                    }
                }
            }
        }
    }, [])
    const modifyCanvasSize = useCallback((e, key) => {
        setButtonActive(key)
        updateCanvasSize({key, uniqueKey: 'width', value: canvasSize.width})
        updateCanvasSize({key, uniqueKey: 'height', value: canvasSize.height})
    },[])
    const _onBlur = useCallback((e, uniqueKey) => {
        const targetValue = e.target.value;
        if(uniqueKey === 'height') {
            if(targetValue < 50) {
                Message.error({title: '最小高度为50'})
                updateCanvasSize({value: 50, uniqueKey})
            }
        } else {
            if(targetValue < 100) {
                Message.error({title: '最小宽度为100'})
                updateCanvasSize({value: 100, uniqueKey})
            }
        }
    },[])
    return <span className={`${currentPrefix}`}>
        <span>
            <ButtonGroup
                onClick={modifyCanvasSize}
                active={buttonActive}
            >
            {
                buttonOptions.map((o) => <Button
                    key={o.optionValue}>{o.text}</Button>)
            }
            </ButtonGroup>
        </span>
        {
            buttonActive !== BUTTON_ID.C ||
            <span>
                <span>
                    宽：
                    <span className={`${currentPrefix}-cell`}>
                        <NumberInput
                            defaultValue={canvasSize.width || 100}
                            onBlur={e => _onBlur(e, 'width')}
                            onChange={(e) => updateCanvasSize({value: e.target.value, uniqueKey: 'width'})}
                        />
                    </span>
                </span>
                <span>
                    高：
                    <span className={`${currentPrefix}-cell`}>
                        <NumberInput
                            defaultValue={canvasSize.height || 100}
                            onBlur={e => _onBlur(e, 'height')}
                            onChange={e => updateCanvasSize({ value: e.target.value, uniqueKey: 'height'})}
                        />
                    </span>
                </span>
            </span>
        }
    </span>
}));


export default CanvasSize;
