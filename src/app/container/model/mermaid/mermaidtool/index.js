import React, {useState, forwardRef, useImperativeHandle} from 'react';
import numeral from 'numeral';
import { Icon, Tooltip, Slider } from 'components';

import './style/index.less';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

export default React.memo(forwardRef(({getPzoom, onFullScreen}, ref) => {
    const currentPrefix = getPrefix('container-model-mermaid-tool');
    const [scaleNumber, setScaleNumber] = useState(1);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const scalePzoom = (scale) => {
        const pzoom = getPzoom();
        pzoom.zoom(scale);
    };
    const _setScaleNumber = (scale) => {
        const tempScale = numeral(scaleNumber).add(scale).value();
        if(tempScale >= 0.1 && tempScale <= 2) {
            scalePzoom(tempScale);
        }
    };
    const onSliderChange = (scale) => {
        const tempScale = numeral(scale).multiply(2).value();
        if(tempScale >= 0.1) {
            scalePzoom(tempScale);
        }
    };
    const renderSlider = () => {
      return <div className={`${currentPrefix}-slider`}>
        <Slider onChange={onSliderChange} value={numeral(scaleNumber).divide(2).value()}/>
      </div>;
    };
    const _focusPzoom = () => {
        const pzoom = getPzoom();
        pzoom.resize();
        pzoom.fit();
        pzoom.center();
    };
    const _setIsFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        onFullScreen(!isFullScreen);
    };
    useImperativeHandle(ref, () => {
        return {
            scaleChange: (value) => {
                setScaleNumber(value);
            },
        };
    }, []);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-group`}>
        <span className={`${currentPrefix}-scale`}>
          <span><Icon type='icon-zoom-in' onClick={() => _setScaleNumber(-0.1)}>缩小</Icon></span>
          <span>
            <span onClick={() => scalePzoom(1)}>{parseInt(scaleNumber * 100, 10)}%</span>
            <Tooltip force offsetTop={10} title={renderSlider()} placement='top' trigger='click'>
              <Icon type='icon-down-more-copy'/>
            </Tooltip>
          </span>
          <span>
            <Icon type='icon-zoom-out' onClick={() => _setScaleNumber(+0.1)}>放大</Icon>
          </span>
        </span>
        <span className={`${currentPrefix}-line`}/>
        <Icon
          onClick={_focusPzoom}
          className={classesMerge({
                    [`${currentPrefix}-item`]: true,
                })}
          type='icon-focus'
            />
        <span className={`${currentPrefix}-line`}/>
        <span onClick={_setIsFullScreen} className={`${currentPrefix}-item`}>
          <Icon type={isFullScreen ? 'icon-ui-restore' : 'icon-ui-full-screen'}/>
        </span>
      </div>
    </div>;
}));
