import React, { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import './style/index.less';
import {DIAGRAM} from '../../../../../lib/constant';
import {getPrefix} from '../../../../../lib/classes';
import ConceptualModelCanvas from './ConceptualModelCanvas';
import LogicModelCanvas from './LogicModelCanvas';
import PhysicalModelCanvas from './PhysicalModelCanvas'
import _ from 'lodash'

const CanvasConfig = React.memo(forwardRef(({defaultData},
                                            ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig');
    const scrollContainerRef = useRef(null);
    const [topShadowVisible, setTopShadowVisible] = useState(false);
    const [bottomShadowVisible, setBottomShadowVisible] = useState(false);

    const updateShadows = () => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        setTopShadowVisible(scrollTop > 0);
        setBottomShadowVisible(scrollTop + clientHeight < scrollHeight);
    };

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;
        const handleScroll = () => updateShadows();
        scrollContainer.addEventListener('scroll', handleScroll);
        updateShadows();
        const resizeObserver = new ResizeObserver(() => updateShadows());
        resizeObserver.observe(scrollContainer);
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, []);
    let Com;
    switch (defaultData.type) {
        case DIAGRAM.TYPE.C:
            Com = ConceptualModelCanvas;
            break;
        case DIAGRAM.TYPE.L:
            Com = LogicModelCanvas;
            break;
        case DIAGRAM.TYPE.P:
            Com = PhysicalModelCanvas;
            break;
        default:
            Com = ConceptualModelCanvas;
            break;
    }
    return <div className={`${currentPrefix}`}>
        <div className={`${currentPrefix}-container`} ref={scrollContainerRef}>
            <div>
                <Com
                    ref={ref}
                    defaultData={_.cloneDeep(defaultData)}
                />
            </div>
            <div
                className={`${currentPrefix}-container-top-shadow`}
                style={{opacity: topShadowVisible ? 1 : 0}}
            ></div>
            <div
                className={`${currentPrefix}-container-bottom-shadow`}
                style={{opacity: bottomShadowVisible ? 1 : 0}}
            ></div>
        </div>
    </div>;
}));


export default CanvasConfig;
