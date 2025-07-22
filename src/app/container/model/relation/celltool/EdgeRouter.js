import React, {useState, useEffect} from 'react';
import { Icon, Tooltip } from 'components';
import {classesMerge, getPrefix} from '../../../../../lib/classes';


const currentPrefix = getPrefix('container-model-relation-celltool');


const EdgeRouter = ({updateRouter, defaultValue, cell}) => {
    const [router, setRouter] = useState(defaultValue.router);
    const _updateRouter = ({key, value}) => {
        setRouter(key);
        updateRouter && updateRouter({key, value});
    };
    const name = cell.getConnector()?.name || cell.getConnector() || 'normal';
    const routerList = [
        {key: 'normal', label: <Icon type='icon-line-diagonal'/>, value: 'normal' },
        {key: 'rounded', label: <Icon type='icon-line-polygonal'/>, value: 'manhattan' },
        {key: 'smooth', label: <Icon type='icon-line-curve'/>, value: 'normal' }].filter((r) => {
            if(name !== 'jumpover') {
                return true;
            }
            return r.key !== 'smooth';
    });
    return <div className={`${currentPrefix}-detail-font-size`}>
      {routerList.map((s) => {
            return <span
              className={classesMerge({
                    [`${currentPrefix}-detail-font-size-active`]: router === s.key,
                })}
              key={s.key}
              onClick={() => _updateRouter(s)}
            >
              <span>
                {router === s.key && <Icon type="icon-check-solid"/>}
              </span>
              <span>
                {s.label}
              </span>
            </span>;
        })}
    </div>;
};

export default React.memo(({cell}) => {

    const getSimpleRouter = () => {
        const name = cell.getConnector()?.name || cell.getConnector() || 'normal';
        if(name === 'jumpover') {
            if(cell.getConnector().args?.radius) {
                return 'rounded';
            }
            return 'normal';
        }
        return name;
    };
    const [router, setRouter] = useState(getSimpleRouter());
    const updateRouter = ({
                              key,
                              value,
                          }) => {
        const graph = cell.model.graph;
        const selectedEdges = graph.getSelectedCells()
            .filter(c => c.isEdge());
        graph.batchUpdate(() => {
            selectedEdges.forEach((e) => {
                const name = e.getConnector()?.name || e.getConnector() || 'normal';
                if(name !== 'jumpover') {
                    e.setConnector(key);
                }
                e.setRouter(value);
            });
        });
        setRouter(key);
    };

    useEffect(() => {
        const handler = () => {
            setRouter(getSimpleRouter());
        };
        cell.on('change:connector', handler);
        return () => {
            cell.off(null, handler);
        };
    }, []);

    return <Tooltip
      force
      title={<EdgeRouter
        cell={cell}
        defaultValue={{router}}
        updateRouter={updateRouter}
      />}
    >
      <span>
        {/*eslint-disable-next-line no-nested-ternary*/}
        <Icon type={router === 'normal' ? 'icon-line-diagonal' :
              (router === 'rounded' ? 'icon-line-polygonal' : 'icon-line-curve')}/>
      </span>
    </Tooltip>;
});
