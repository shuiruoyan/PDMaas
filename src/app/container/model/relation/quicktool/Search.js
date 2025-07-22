import React, {useState} from 'react';
import {Icon, Tooltip, SearchInput} from 'components';
import {getPrefix} from '../../../../../lib/classes';
import {getNodeIcon, isEntityNode} from '../util/celltools';

export default React.memo(({getGraph}) => {
    const currentPrefix = getPrefix('container-model-relation-quicktool-search');
    const Search = ({close}) => {
        const [searchList, setSearchList] = useState([]);
        const onSearch = (e) => {
            if(e.target.value) {
                const reg = new RegExp(e.target.value, 'i');
                const graph = getGraph();
                // 获取画布上所有的节点
                const nodes = graph.getNodes();
                // 获取所有节点上的数据
                const nodesValue = nodes.map((n) => {
                    if(isEntityNode(n)) {
                        const originData = n.prop('originData');
                        return {
                            n,
                            v: '{defKey}[{defName}]'.replace(/\{(\w+)\}/g, (match, word) => {
                                return originData?.[word] || originData?.defKey || '';
                            }),
                            pass: reg.test(originData.defKey || '') ||
                                reg.test(originData.defName || '') ||
                                (originData.fields || [])
                                    .some(f => reg.test(f.defKey || '') || reg.test(f.defName || '')) ||
                                reg.test(originData.intro || '')
                            ,
                        };
                    } else {
                        const textContent = graph.findViewByCell(n).container.textContent;
                        return {
                            n,
                            v: textContent,
                            pass: reg.test(textContent),
                        };
                    }
                }).filter(s => s.pass);
                setSearchList(nodesValue);
            } else {
                setSearchList([]);
            }
        };
        const centerCell = (n) => {
            getGraph().centerCell(n);
            // 通知节点闪烁
            n.prop('twinkle', Math.uuid(), {ignore: true});
        };
        return <div className={currentPrefix}>
          <div className={`${currentPrefix}-title`}>
            <span>在当前画布中查找</span>
            <Icon onClick={() => close()} type='icon-close'/>
          </div>
          <div className={`${currentPrefix}-input`}>
            <SearchInput onChange={onSearch} placeholder='搜索内容'/>
          </div>
          <div className={`${currentPrefix}-result`}>
            <div className={`${currentPrefix}-result-title`}>搜索结果（{searchList.length}）</div>
            {searchList.length > 0 ? <div className={`${currentPrefix}-result-list`}>
              {
                      searchList.map((s) => {
                          return <div key={s.n.id} onClick={() => centerCell(s.n)}>
                            <span>
                              <Icon type={getNodeIcon(s.n)}/>
                            </span>
                            <span>{s.v}</span>
                          </div>;
                      })
                  }
            </div> : <div className={`${currentPrefix}-result-empty`}>暂无数据</div>}
          </div>
        </div>;
    };
    return <Tooltip force trigger='click' title={<Search/>}>
      <Icon type='icon-search'/>
    </Tooltip>;
});
