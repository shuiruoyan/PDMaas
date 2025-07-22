import React, {forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import {Button} from 'components';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';

export default React.memo(forwardRef(({steps, close, nextStep, preStep, isLoad,
                                          ...restProps}, ref) => {
    const currentPrefix = getPrefix('container-model-tools-toolButton');
    let tempValue = restProps.value;
    const currentStepRef = useRef(restProps.value);
    currentStepRef.current = tempValue;

    useEffect(() => {
    }, []);
    useImperativeHandle(ref, () => {
        return {

        };

    }, []);

    switch (tempValue) {
        case 0:
            return <div className={`${currentPrefix}`}>
              <Button key='onCancel' onClick={close}>取消</Button>
              <Button key='onNext' onClick={nextStep} type='primary' disable={isLoad}>下一步</Button>
            </div>;
        case steps.length - 1:
            return <div className={`${currentPrefix}`}>
              <Button key='onPre' onClick={preStep}>上一步</Button>
              <Button key='onCancel' onClick={close} type='primary'>关闭</Button>
            </div>;
        default:
            return <div className={`${currentPrefix}`}>
              <Button key='onPre' onClick={preStep}>上一步</Button>
              <Button key='onNext' onClick={nextStep} type='primary' disable={isLoad}>下一步</Button>
            </div>;
    }
}));
