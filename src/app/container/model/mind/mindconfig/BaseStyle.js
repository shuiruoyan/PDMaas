import React, { useRef, useState} from 'react';
import {Select, SimpleTab, Checkbox, Slider} from 'components';
import {getPrefix} from '../../../../../lib/classes';

import Color from './Color';
import Img from './Img';
import CustomerColor from './CustomerColor';
import RainbowLine from './RainbowLine';
import PaddingMargin from './PaddingMargin';

export default React.memo(({getMind}) => {
    const Option = Select.Option;
    const [themeConfig, setThemeConfig] = useState(() => {
        const mind = getMind();
        return mind.getThemeConfig();
    });
    const themeConfigRef = useRef();
    themeConfigRef.current = themeConfig;
    const [config] = useState(() => {
        const mind = getMind();
        return mind.getConfig();
    });
    const currentPrefix = getPrefix('container-model-mind-config-base');
    const updateThemeConfig = (data) => {
        const mind = getMind();
        const newThemeConfig = {
          ...mind.getThemeConfig(),
          ...data,
        };
        mind.setThemeConfig(newThemeConfig);
        mind.emit('theme_config_ui_change', newThemeConfig);
        setThemeConfig(p => ({...p, ...data}));
    };
    const onRainbowLineChange = (newConfig) => {
        const mind = getMind();
        mind.rainbowLines.updateRainLinesConfig(newConfig);
    };
    return <div className={currentPrefix}>
      <div>
        <div>背景</div>
        <div>
          <SimpleTab
            defaultActive={themeConfig.backgroundImage !== 'none' ? 'img' : 'color'}
            options={[
                {
                  key: 'color',
                  content: <Color
                    defaultValue={themeConfig.backgroundColor}
                    onChange={color => updateThemeConfig({backgroundColor: color})}
                  />,
                  title: '颜色',
                },
                {
                  key: 'img',
                  title: '图片',
                  content: <Img
                    defaultData={{
                        backgroundImage: themeConfig.backgroundImage,
                        backgroundRepeat: themeConfig.backgroundRepeat,
                        backgroundPosition: themeConfig.backgroundPosition,
                        backgroundSize: themeConfig.backgroundSize,
                      }}
                    onChange={data => updateThemeConfig(data)}
                  />,
                }]}
          />
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>连线</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                onChange={color => updateThemeConfig({lineColor: color})}
                defaultValue={themeConfig.lineColor}
              />
            </span>
          </span>
          <span>
            <span>粗细</span>
            <span>
              <Select
                defaultValue={themeConfig.lineWidth}
                onChange={e => updateThemeConfig({lineWidth: e.target.value})}
              >
                <Option value={0}>0</Option>
                <Option value={1}>1</Option>
                <Option value={2}>2</Option>
                <Option value={3}>3</Option>
                <Option value={4}>4</Option>
                <Option value={5}>5</Option>
                <Option value={6}>6</Option>
              </Select>
            </span>
          </span>
        </div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>风格</span>
            <span>
              <Select
                defaultValue={themeConfig.lineStyle}
                onChange={e => updateThemeConfig({lineStyle: e.target.value})}
              >
                <Option value='straight'>直线</Option>
                <Option value='curve'>曲线</Option>
                <Option value='direct'>直连</Option>
              </Select>
            </span>
          </span>
          {themeConfig.lineStyle === 'straight' && <span>
            <span>圆角</span>
            <span>
              <Select
                defaultValue={themeConfig.lineRadius}
                onChange={e => updateThemeConfig({lineRadius: e.target.value})}
              >
                <Option value={0}>0</Option>
                <Option value={2}>2</Option>
                <Option value={5}>5</Option>
                <Option value={7}>7</Option>
                <Option value={10}>10</Option>
                <Option value={12}>12</Option>
                <Option value={15}>15</Option>
              </Select>
            </span>
            </span>}
          {themeConfig.lineStyle === 'curve' && <span>
            <span>根节点</span>
            <span>
              <Select
                defaultValue={themeConfig.rootLineKeepSameInCurve}
                onChange={e => updateThemeConfig({rootLineKeepSameInCurve: e.target.value})}
              >
                <Option value={false}>括号</Option>
                <Option value>大括号</Option>
              </Select>
            </span>
            </span>}
          {themeConfig.lineStyle === 'curve' && <span>
            <span>根节点连线起始位置</span>
            <span>
              <Select
                defaultValue={themeConfig.rootLineStartPositionKeepSameInCurve}
                onChange={e => updateThemeConfig({
                    rootLineStartPositionKeepSameInCurve: e.target.value,
                  })}
              >
                <Option value={false}>中心</Option>
                <Option value>右侧</Option>
              </Select>
            </span>
            </span>}
        </div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>是否显示箭头</span>
            <span><Checkbox
              onChange={e => updateThemeConfig({
                  showLineMarker: e.target.checked,
                })}
              defaultChecked={themeConfig.showLineMarker}
            /></span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-item`}>
        <div>彩虹线条</div>
        <div>
          <RainbowLine
            defaultValue={config.rainbowLinesConfig || {}}
            onChange={onRainbowLineChange}
          />
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>概要的连线</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                onChange={color => updateThemeConfig({generalizationLineColor: color})}
                defaultValue={themeConfig.generalizationLineColor}
              />
            </span>
          </span>
          <span>
            <span>粗细</span>
            <span>
              <Select
                defaultValue={themeConfig.generalizationLineWidth}
                onChange={e => updateThemeConfig({generalizationLineWidth: e.target.value})}
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
        <div>关联线</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                onChange={color => updateThemeConfig({associativeLineColor: color})}
                defaultValue={themeConfig.associativeLineColor}
              />
            </span>
          </span>
          <span>
            <span>粗细</span>
            <span>
              <Select
                defaultValue={themeConfig.associativeLineWidth}
                onChange={e => updateThemeConfig({associativeLineWidth: e.target.value})}
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
            <span>激活颜色</span>
            <span>
              <CustomerColor
                onChange={color => updateThemeConfig({associativeLineActiveColor: color})}
                defaultValue={themeConfig.associativeLineActiveColor}
              />
            </span>
          </span>
          <span>
            <span>激活粗细</span>
            <span>
              <Select
                defaultValue={themeConfig.associativeLineActiveWidth}
                onChange={e => updateThemeConfig({associativeLineActiveWidth: e.target.value})}
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
        <div>关联线文字</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>颜色</span>
            <span>
              <CustomerColor
                onChange={color => updateThemeConfig({associativeLineTextColor: color})}
                defaultValue={themeConfig.associativeLineTextColor}
              />
            </span>
          </span>
          <span>
            <span>字号</span>
            <span>
              <Select
                defaultValue={themeConfig.associativeLineTextFontSize}
                onChange={e => updateThemeConfig({associativeLineTextFontSize: e.target.value})}
              >
                <Option value={10}>10</Option>
                <Option value={12}>12</Option>
                <Option value={14}>14</Option>
                <Option value={16}>16</Option>
                <Option value={18}>18</Option>
                <Option value={24}>24</Option>
                <Option value={32}>32</Option>
                <Option value={48}>48</Option>
              </Select>
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>节点边框风格</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>是否使用只有底边框的风格</span>
            <span>
              <Checkbox
                onChange={e => updateThemeConfig({
                    nodeUseLineStyle: e.target.checked,
                  })}
                defaultChecked={themeConfig.nodeUseLineStyle}
              />
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>节点内边距</div>
        <PaddingMargin
          defaultValue={themeConfig}
          name='padding'
          onChange={data => updateThemeConfig(data)}
        />
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>图片</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>图片最大高度</span>
            <span style={{width: 145}}>
              <Slider
                onChangeComplete={v => updateThemeConfig({
                    imgMaxHeight: v * 300,
                  })}
                defaultValue={themeConfig.imgMaxHeight / 300}
              />
            </span>
          </span>
          <span>
            <span>图片最大宽度</span>
            <span style={{width: 145}}>
              <Slider
                onChangeComplete={v => updateThemeConfig({
                    imgMaxWidth: v * 300,
                  })}
                defaultValue={themeConfig.imgMaxWidth / 300}
              />
            </span>
          </span>
        </div>
      </div>
      <div className={`${currentPrefix}-line`}>
        <div>图标</div>
        <div className={`${currentPrefix}-line-item`}>
          <span>
            <span>大小</span>
            <span style={{width: 145}}>
              <Slider
                onChangeComplete={v => updateThemeConfig({
                    iconSize: v * 50,
                  })}
                defaultValue={themeConfig.iconSize / 50}
              />
            </span>
          </span>
        </div>
      </div>
      <div>
        <div>节点外边距</div>
        <div>
          <SimpleTab
            options={[
                {
                  key: '2',
                  content: <PaddingMargin
                    max={200}
                    defaultValue={themeConfig.second}
                    name='margin'
                    onChange={data => updateThemeConfig({
                        second: {
                          ...themeConfigRef.current.second,
                          ...data,
                        },
                      })}
                  />,
                  title: '二级节点',
                },
                {
                  key: '3',
                  title: '三级及以下节点',
                  content: <PaddingMargin
                    max={200}
                    defaultValue={themeConfig.node}
                    name='margin'
                    onChange={data => updateThemeConfig({
                        node: {
                          ...themeConfigRef.current.node,
                          ...data,
                        },
                      })}
                  />,
                }]}
          />
        </div>
      </div>
      {/*<div className={`${currentPrefix}-line`}>*/}
      {/*  <div>水印</div>*/}
      {/*  <WaterMark*/}
      {/*    onChange={data => updateWatermark(data)}*/}
      {/*    defaultValue={config.watermarkConfig}/>*/}
      {/*</div>*/}
      {/*<div className={`${currentPrefix}-line`}>*/}
      {/*  <div>其他配置</div>*/}
      {/*  <Other*/}
      {/*    onChange={data => updateConfig(data)}*/}
      {/*    defaultValue={config}*/}
      {/*  />*/}
      {/*</div>*/}
    </div>;
});
