import React, { useState} from 'react';
import {Checkbox, Select} from 'components';
import {getPrefix} from '../../../../../lib/classes';

import FontStyle from './FontStyle';
import CustomerColor from './CustomerColor';
import PaddingMargin from './PaddingMargin';

export default React.memo(({nodeActive}) => {
    const Option = Select.Option;
    const [nodeStyle, setNodeStyle] = useState(() => {
        return [
            'shape',
            'paddingX',
            'paddingY',
            'color',
            'fontFamily',
            'fontSize',
            'lineHeight',
            'textDecoration',
            'fontWeight',
            'fontStyle',
            'borderWidth',
            'borderColor',
            'fillColor',
            'borderDasharray',
            'borderRadius',
            'lineColor',
            'lineDasharray',
            'lineWidth',
            'lineMarkerDir',
            'gradientStyle',
            'startColor',
            'endColor',
        ].reduce((p, n) => {
            return {
                ...p,
                [n]: nodeActive[0].getStyle(n),
            };
        }, {});
    });
    const borderDasharrayList = [
        {
            name: '实线',
            value: 'none',
        },
        {
            name: '虚线1',
            value: '5,5',
        },
        {
            name: '虚线2',
            value: '10,10',
        },
        {
            name: '虚线3',
            value: '20,10,5,5,5,10',
        },
        {
            name: '虚线4',
            value: '5, 5, 1, 5',
        },
        {
            name: '虚线5',
            value: '15, 10, 5, 10, 15',
        },
        {
            name: '虚线6',
            value: '1, 5',
        },
    ];
    const shapeList = [
        {
            name: '矩形',
            value: 'rectangle',
        },
        {
            name: '菱形',
            value: 'diamond',
        },
        {
            name: '平行四边形',
            value: 'parallelogram',
        },
        {
            name: '圆角矩形',
            value: 'roundedRectangle',
        },
        {
            name: '八角矩形',
            value: 'octagonalRectangle',
        },
        {
            name: '外三角矩形',
            value: 'outerTriangularRectangle',
        },
        {
            name: '内三角矩形',
            value: 'innerTriangularRectangle',
        },
        {
            name: '椭圆',
            value: 'ellipse',
        },
        {
            name: '圆',
            value: 'circle',
        },
    ];
    const shapeListMap = {
        rectangle: 'M 4 12 L 4 3 L 56 3 L 56 21 L 4 21 L 4 12 Z',
        diamond: 'M 4 12 L 30 3 L 56 12 L 30 21 L 4 12 Z',
        parallelogram: 'M 10 3 L 56 3 L 50 21 L 4 21 L 10 3 Z',
        roundedRectangle:
            'M 13 3 L 47 3 A 9 9 0, 0 1 47 21 L 13 21 A 9 9 0, 0 1 13 3 Z',
        octagonalRectangle:
            'M 4 12 L 4 9 L 10 3 L 50 3 L 56 9 L 56 15 L 50 21 L 10 21 L 4 15 L 4 12 Z',
        outerTriangularRectangle:
            'M 4 12 L 10 3 L 50 3 L 56 12 L 50 21 L 10 21 L 4 12 Z',
        innerTriangularRectangle:
            'M 10 12 L 4 3 L 56 3 L 50 12 L 56 21 L 4 21 L 10 12 Z',
        ellipse: 'M 4 12 A 26 9 0, 1, 0 30 3 A 26 9 0, 0, 0 4 12 Z',
        circle: 'M 21 12 A 9 9 0, 1, 0 30 3 A 9 9 0, 0, 0 21 12 Z',
    };
    const currentPrefix = getPrefix('container-model-mind-config-base');
    const updateNodeStyle = (name, value) => {
        nodeActive.forEach((node) => {
            node.setStyle(name, value);
        });
        setNodeStyle((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-line`}>
        <div>文字</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>字号</span>
            <span>
              <Select
                defaultValue={nodeStyle.fontSize}
                onChange={e => updateNodeStyle('fontSize', e.target.value)}
              >
                <Option value={10}>10</Option>
                <Option value={12}>12</Option>
                <Option value={16}>16</Option>
                <Option value={18}>18</Option>
                <Option value={24}>24</Option>
                <Option value={32}>32</Option>
                <Option value={48}>48</Option>
              </Select>
            </span>
          </span>
          <span>
            <span>行高</span>
            <span>
              <Select
                defaultValue={nodeStyle.lineHeight}
                onChange={e => updateNodeStyle('lineHeight', e.target.value)}
              >
                <Option value={1}>1</Option>
                <Option value={1.5}>1.5</Option>
                <Option value={2}>2</Option>
                <Option value={2.5}>2.5</Option>
                <Option value={3}>3</Option>
              </Select>
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <FontStyle nodeStyle={nodeStyle} onChange={updateNodeStyle}/>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>边框</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                defaultValue={nodeStyle.borderColor}
                onChange={color => updateNodeStyle('borderColor', color)}
              />
            </span>
          </span>
          <span>
            <span>样式</span>
            <span>
              <Select
                valueRender={props => props.name}
                defaultValue={nodeStyle.borderDasharray}
                onChange={e => updateNodeStyle('borderDasharray', e.target.value)}
              >
                {
                    borderDasharrayList.map((l) => {
                        return <Option key={l.value} value={l.value} name={l.name}>
                          <svg width="120" height="34">
                            <line
                              x1="10"
                              y1="17"
                              x2="110"
                              y2="17"
                              strokeWidth="2"
                              stroke="#000"
                              strokeDasharray={l.value}
                                />
                          </svg>
                        </Option>;
                    })
                }
              </Select>
            </span>
          </span>
          <span>
            <span>宽度</span>
            <span>
              <Select
                defaultValue={nodeStyle.borderWidth}
                onChange={e => updateNodeStyle('borderWidth', e.target.value)}
              >
                <Option value={0}>0</Option>
                <Option value={1}>1</Option>
                <Option value={2}>2</Option>
                <Option value={3}>3</Option>
                <Option value={4}>4</Option>
                <Option value={5}>5</Option>
                <Option value={6}>6</Option>
                <Option value={7}>7</Option>
                <Option value={8}>8</Option>
                <Option value={9}>9</Option>
                <Option value={10}>10</Option>
              </Select>
            </span>
          </span>
          <span>
            <span>圆角</span>
            <span>
              <Select
                defaultValue={nodeStyle.borderRadius}
                onChange={e => updateNodeStyle('borderRadius', e.target.value)}
              >
                <Option value={0}>0</Option>
                <Option value={1}>1</Option>
                <Option value={2}>2</Option>
                <Option value={3}>3</Option>
                <Option value={4}>4</Option>
                <Option value={5}>5</Option>
                <Option value={6}>6</Option>
                <Option value={7}>7</Option>
                <Option value={8}>8</Option>
                <Option value={9}>9</Option>
                <Option value={10}>10</Option>
              </Select>
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>背景</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                defaultValue={nodeStyle.fillColor}
                onChange={color => updateNodeStyle('fillColor', color)}
              />
            </span>
          </span>
          <span>
            <span>渐变</span>
            <span>
              <Checkbox
                onChange={e => updateNodeStyle('gradientStyle', e.target.checked)}
                defaultChecked={nodeStyle.gradientStyle}
              />
            </span>
          </span>
          {
                    nodeStyle.gradientStyle ? <>
                      <span>
                        <span>颜色</span>
                        <span>
                          <CustomerColor
                            defaultValue={nodeStyle.startColor}
                            onChange={color => updateNodeStyle('startColor', color)}
                          />
                        </span>
                      </span>
                      <span>
                        <span>颜色</span>
                        <span>
                          <CustomerColor
                            defaultValue={nodeStyle.endColor}
                            onChange={color => updateNodeStyle('endColor', color)}
                          />
                        </span>
                      </span>
                    </> : null
                }
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>形状</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>形状</span>
            <span>
              <Select
                valueRender={props => props.name}
                defaultValue={nodeStyle.shape}
                onChange={e => updateNodeStyle('shape', e.target.value)}
              >
                {
                    shapeList.map((l) => {
                        return <Option key={l.value} value={l.value} name={l.name}>
                          <svg
                            width="60"
                            height="26"
                            >
                            <path
                              d={shapeListMap[l.value]}
                              fill="none"
                              stroke="#000"
                              strokeWidth="2"
                                />
                          </svg>
                        </Option>;
                    })
                }
              </Select>
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>线条</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                defaultValue={nodeStyle.lineColor}
                onChange={color => updateNodeStyle('lineColor', color)}
              />
            </span>
          </span>
          <span>
            <span>样式</span>
            <span>
              <Select
                valueRender={props => props.name}
                defaultValue={nodeStyle.lineDasharray}
                onChange={e => updateNodeStyle('lineDasharray', e.target.value)}
              >
                {
                    borderDasharrayList.map((l) => {
                        return <Option key={l.value} value={l.value} name={l.name}>
                          <svg width="120" height="34">
                            <line
                              x1="10"
                              y1="17"
                              x2="110"
                              y2="17"
                              strokeWidth="2"
                              stroke="#000"
                              strokeDasharray={l.value}
                                />
                          </svg>
                        </Option>;
                    })
                }
              </Select>
            </span>
          </span>
          <span>
            <span>宽度</span>
            <span>
              <Select
                defaultValue={nodeStyle.lineWidth}
                onChange={e => updateNodeStyle('lineWidth', e.target.value)}
              >
                <Option value={0}>0</Option>
                <Option value={1}>1</Option>
                <Option value={2}>2</Option>
                <Option value={3}>3</Option>
                <Option value={4}>4</Option>
                <Option value={5}>5</Option>
                <Option value={6}>6</Option>
                <Option value={7}>7</Option>
                <Option value={8}>8</Option>
                <Option value={9}>9</Option>
                <Option value={10}>10</Option>
              </Select>
            </span>
          </span>
          <span>
            <span>箭头位置</span>
            <span>
              <Select
                defaultValue={nodeStyle.lineMarkerDir}
                onChange={e => updateNodeStyle('lineMarkerDir', e.target.value)}
              >
                <Option value='start'>头部</Option>
                <Option value='end'>尾部</Option>
              </Select>
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>节点内边距</div>
        <PaddingMargin
          defaultValue={nodeStyle}
          name='padding'
          onChange={data => updateNodeStyle(Object.keys(data)[0], data[Object.keys(data)[0]])}
        />
      </div>
    </div>;
});
