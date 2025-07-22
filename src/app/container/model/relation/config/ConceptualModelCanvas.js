import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import './style/index.less'
import {getPrefix} from '../../../../../lib/classes';
import {conceptualModelData, getDiagramsStyle} from './canvasData';
import CanvasItem from './CanvasItem';
import CanvasPreviewCom from './CanvasPreviewCom';
import _ from 'lodash'

const ConceptualModelCanvas = React.memo(forwardRef(({defaultData}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig')
    const [conceptualDefaultSetup, setConceptualDefaultSetup] = useState(getDiagramsStyle(defaultData.props))
    const conceptualDataRef = useRef(defaultData.props)
    const comRef = useRef(null)
    useImperativeHandle(ref, () => {
        return {
            getDataRef: () => {
                return conceptualDataRef.current;
            },
            importConfig: (props) => {
                conceptualDataRef.current = props;
                setConceptualDefaultSetup(getDiagramsStyle(props))
                comRef.current?.reset(props.entitySetting.titleText.customValue,
                    props.entitySetting.titleText.optionValue)
            }
        }
    }, []);

    useEffect(() => {

    }, []);
    return <React.Fragment>
        {
            conceptualModelData.map((item,i) => {
                return <CanvasItem
                    data={item}
                    setCanvasStyle={setConceptualDefaultSetup}
                    diagramData={conceptualDataRef}
                    key={i}
                    defaultData={defaultData}
                    canvasStyle={conceptualDefaultSetup}
                    comRef={comRef}
                >
                    <CanvasPreviewCom
                        previewType={item.previewType}
                        previewStyle={conceptualDefaultSetup}
                    />
                </CanvasItem>
            })
        }
    </React.Fragment>;
}));
export default ConceptualModelCanvas;
