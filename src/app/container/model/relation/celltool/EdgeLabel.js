import React, {useEffect, useState} from 'react';
import {Tooltip, Icon, Textarea} from 'components';
import {getPrefix} from '../../../../../lib/classes';


const currentPrefix = getPrefix('container-model-relation-celltool');
const EdgeLabel = ({close, onLabelChange, defaultValue}) => {
    const [label, setLabel] = useState(defaultValue);
    const onOk = () => {
        onLabelChange && onLabelChange(label);
        close();
    };
    const onCancel = () => {
        close();
    };

    const _setLabel = (e) => {
        setLabel(e.target.value);
    };
    const onMouseLeave = (e) => {
        e.stopPropagation();
    };
    return <div className={`${currentPrefix}-detail-label`}>
      <Textarea onMouseLeave={onMouseLeave} placeholder='连线备注' value={label} onChange={_setLabel}/>
      <div className={`${currentPrefix}-detail-label-button`}>
        <span onClick={onCancel}>取消</span>
        <span onClick={onOk}>确定</span>
      </div>
    </div>;
};
export default React.memo(({cell}) => {
    const [label, setLabel] = useState(() => {
        const attrs = cell.getLabels()[0]?.attrs || {};
        return attrs.label?.text || '';
    });

    useEffect(() => {
        const changeLabels = () => {
            setLabel((cell.getLabels()[0]?.attrs || {}).label?.text || '');
        };
        cell.on('change:labels', changeLabels);
        return () => {
            cell.off(null, changeLabels);
        };
    }, []);

    const onLabelChange = (value) => {
        const graph = cell.model.graph;
        const selectedCells = graph.getSelectedCells()
            .filter(c => c.isEdge());
        graph.batchUpdate(() => {
            selectedCells.forEach((c) => {
                const currentLabel = c.getLabels()[0]?.attrs;
                c.setLabelAt(0,{
                    attrs: {
                        ...currentLabel,
                        label: {
                            ...currentLabel?.label,
                            text: value,
                        },
                    },
                });
                if(c.prop('relation')) {
                    c.prop('relation', null);
                }
            });
        });
        setLabel(value);
    };

    return <Tooltip
      force
      close
      title={<EdgeLabel
        onLabelChange={onLabelChange}
        defaultValue={label}
        />}
    >
      <span>
        <Icon type='icon-note'/>
      </span>
    </Tooltip>;
});
