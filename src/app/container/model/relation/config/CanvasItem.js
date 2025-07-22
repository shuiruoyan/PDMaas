import React, {  forwardRef } from 'react';
import './style/index.less'
import {getPrefix} from '../../../../../lib/classes';
import IconRender from './IconRender';

const CanvasItem = React.memo(forwardRef(({setCanvasStyle, data,
                                              children, diagramData, defaultData,canvasStyle, comRef}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig')
    return <div className={`${currentPrefix}-item`}>
        <div>
            <div>
                <span>{data.firstTitle}</span>
                <span>{data.secondTitle}</span>
            </div>
            {
                data.children.map((c, i) => {
                    const Com = c.Com;
                    if (Com) {
                        return <div
                            key={i}
                        >
                            <span>{c.title}</span>
                            <Com
                                setCanvasStyle={setCanvasStyle}
                                diagramData={diagramData}
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
                                 firstKey={data.firstKey}
                                 secondKey={c.secondKey}
                                 iconItems={c.items}
                                 setCanvasStyle={setCanvasStyle}
                                 diagramData={diagramData}
                                 canvasStyle={canvasStyle}
                             />
                        </span>
                    </div>
                })
            }
        </div>
        <div>
            <span>效果预览</span>
            <span className={`${currentPrefix}-preview`}>{children}</span>
        </div>
    </div>;
}));
export default CanvasItem;
