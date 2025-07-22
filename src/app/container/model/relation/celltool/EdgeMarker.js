import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';
import {getEdgeAllMarkerIcon, getEdgeMarkerIcon} from '../util/celltools';

const currentPrefix = getPrefix('container-model-relation-celltool');

const getTransform = (type, marker) => {
    if(type === 'sourceMarker') {
        if(marker?.startsWith('er')) {
            return 'rotate(180deg)';
        }
        return 'rotate(0deg)';
    } else if(marker?.startsWith('er')) {
        return 'rotate(0deg)';
    }
    return 'rotate(180deg)';
};

const EdgeMarker = ({updateMarker, defaultValue, type}) => {
    const [marker, setMarker] = useState(defaultValue.marker);
    const _updateMarker = (s) => {
        setMarker(s.value);
        updateMarker && updateMarker(s);
    };
    const markerList = getEdgeAllMarkerIcon();
    return <div className={`${currentPrefix}-detail-marker`}>
      {markerList.map((s) => {
            return <span
              className={classesMerge({
                    [`${currentPrefix}-detail-marker-active`]: marker === s.value,
                    [`${currentPrefix}-detail-marker-border`]: s.value === 'er-1',
                })}
              key={s.value}
              onClick={() => _updateMarker(s)}
            >
              <span>
                {marker === s.value && <Icon type='icon-check-solid'/>}
              </span>
              <span>
                <Icon style={{transform: getTransform(type, s.value || '')}} type={s.name}/>
              </span>
            </span>;
        })}
    </div>;
};

export default React.memo(({ cell, type }) => {

    const getMarker = () => {
        const markerData = cell.attr(`line/${type}`);
        return typeof markerData === 'string' ? markerData : (markerData.name || null);
    };
    const [marker, setMarker] = useState(getMarker());

    const updateMarker = (s) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells()
            .filter(c => c.isEdge());
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                c.attr(`line/${type}/name`, s.value);
                if(c.prop('relation')) {
                    c.prop('relation', null);
                }
            });
        });
        setMarker(s.value);
    };
    useEffect(() => {
        const handler = () => {
            console.log('getMarker()');
            console.log(getMarker());
            setMarker(getMarker());
        };
        cell.on('change:attrs', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);

    return <Tooltip
      force
      title={<EdgeMarker
        type={type}
        defaultValue={{marker}}
        updateMarker={updateMarker}
      />}
    >
      <span>
        <Icon
          style={{transform: getTransform(type, marker)}}
          type={getEdgeMarkerIcon(marker)}
        />
      </span>
    </Tooltip>;

});
