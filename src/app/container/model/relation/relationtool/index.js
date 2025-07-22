import React, {useState, forwardRef, useImperativeHandle} from 'react';
import numeral from 'numeral';
import { Icon, Tooltip, Slider } from 'components';

import './style/index.less';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {DISABLE, NORMAL} from '../../../../../lib/constant';

export default React.memo(forwardRef(({getGraph, interactChange, minMapChange,
                                          undo, redo, onFullScreen, readonly}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-relationtool');
    const [scaleNumber, setScaleNumber] = useState(1);
    const [isEdit, setIsEdit] = useState(!readonly);
    const [openMinMap, setOpenMinMap] = useState(false);
    const [history, setHistory] = useState({
        canRedo: false,
        canUndo: false,
    });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const scaleGraph = (scale) => {
        const graph = getGraph();
        graph.zoomTo(scale);
    };
    const _setScaleNumber = (scale) => {
        const tempScale = numeral(scaleNumber).add(scale).value();
        if(tempScale >= 0.1 && tempScale <= 2) {
            scaleGraph(tempScale);
        }
    };
    const onSliderChange = (scale) => {
        const tempScale = numeral(scale).multiply(2).value();
        if(tempScale >= 0.1) {
            scaleGraph(tempScale);
        }
    };
    const _setIsEdit = () => {
        if(!readonly) {
            setIsEdit(!isEdit);
            interactChange(!isEdit);
        }
    };
    const renderSlider = () => {
      return <div className={`${currentPrefix}-slider`}>
        <Slider onChange={onSliderChange} value={numeral(scaleNumber).divide(2).value()}/>
      </div>;
    };
    const _setOpenMinMap = () => {
        setOpenMinMap(!openMinMap);
        minMapChange(!openMinMap);
    };
    const _focusGraph = () => {
        const graph = getGraph();
        graph.zoomTo(1);
        const rect = graph.getCellsBBox(graph.getCells().filter((c) => {
            return c.prop('cellType') !== 'group';
        }));
        const center = rect.getCenter();
        graph.centerPoint(center.x, center.y);
        //graph.centerContent();
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
            setHistory,
        };
    }, []);
    return <div className={currentPrefix}>
      {!readonly && <div className={`${currentPrefix}-group`}>
        <Icon
          status={history.canUndo ? NORMAL : DISABLE}
          onClick={undo}
          className={`${currentPrefix}-item`}
          type='icon-undo-solid'/>
        <span className={`${currentPrefix}-line`}/>
        <Icon
          status={history.canRedo ? NORMAL : DISABLE}
          onClick={redo}
          className={`${currentPrefix}-item`}
          type='icon-redo-solid'/>
        </div>}
      <div className={`${currentPrefix}-group`}>
        <Icon
          status={!readonly ? NORMAL : DISABLE}
          onClick={_setIsEdit}
          className={`${currentPrefix}-item`}
          type={isEdit ? 'icon-mouse-pointer' : 'icon-hand'}
            />
        <span className={`${currentPrefix}-line`}/>
        <span className={`${currentPrefix}-scale`}>
          <span><Icon type='icon-zoom-in' onClick={() => _setScaleNumber(-0.1)}>缩小</Icon></span>
          <span>
            <span onClick={() => scaleGraph(1)}>{parseInt(scaleNumber * 100, 10)}%</span>
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
          onClick={_focusGraph}
          className={classesMerge({
                    [`${currentPrefix}-item`]: true,
                })}
          type='icon-focus'
            />
        <span className={`${currentPrefix}-line`}/>
        <Icon
          onClick={_setOpenMinMap}
          className={classesMerge({
                    [`${currentPrefix}-item`]: true,
                    [`${currentPrefix}-item-active`]: openMinMap,
                })}
          type='icon-maps'/>
        <span className={`${currentPrefix}-line`}/>
        <span onClick={_setIsFullScreen} className={`${currentPrefix}-item`}>
          <Icon type={isFullScreen ? 'icon-ui-restore' : 'icon-ui-full-screen'}/>
        </span>
      </div>
    </div>;
}));
