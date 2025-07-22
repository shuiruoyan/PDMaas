import React from "react";
import { Checkbox } from 'components'

export default React.memo(({setCanvasStyle,
    diagramData}) => {
    const defaultChecked = diagramData.current.linkLine.body.jumpover;
    const onChange = (e) => {
        const checked = e.target.checked;
        setCanvasStyle((p) =>{
            return {
                ...p,
                linkLine: {
                    ...p.linkLine,
                    body: {
                        ...p.linkLine.body,
                        jumpover: checked,
                    }
                }
            }
        })
        diagramData.current = {
            ...diagramData.current,
            linkLine: {
                ...diagramData.current.linkLine,
                body: {
                    ...diagramData.current.linkLine.body,
                    jumpover: checked,
                }
            }
        }
    }
    return <Checkbox defaultChecked={defaultChecked} onChange={onChange}/>
})