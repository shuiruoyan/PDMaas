import React from 'react';
import Search from '../search';
import {classesMerge, getPrefix} from '../../../../lib/classes';

export default React.memo(({project, dataSource, jump, getCurrentStandard, standard}) => {
    const currentPrefix = getPrefix('container-model-center-shortcut');
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-top`}>
        <span>快速搜索</span>
        <span
          className={classesMerge({
              [`${currentPrefix}-top-active`] : true,
            })}
        >
          <Search
            dataSource={dataSource}
            standard={standard}
            getCurrentStandard={getCurrentStandard}
            offsetTop={50}
            project={project}
            jump={jump}/>
        </span>
      </div>
      <div className={`${currentPrefix}-bottom`}>
        <div>
          <span>
            操作快捷键
          </span>
          <table>
            <tbody>
              {/*<tr>*/}
              {/*  <td>双击 SHIFT</td>*/}
              {/*  <td>打开搜索器，搜索实体以及字段或属性</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+N</td>*/}
              {/*  <td>创建概念实体</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+L</td>*/}
              {/*  <td>创建逻辑实体</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+P</td>*/}
              {/*  <td>创建数据表</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+K</td>*/}
              {/*  <td>任意文本大小切换</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+l</td>*/}
              {/*  <td>在实体中添加一个新行</td>*/}
              {/*</tr>*/}
              {/*<tr>*/}
              {/*  <td>CTRL+D</td>*/}
              {/*  <td>删除实体中选中行</td>*/}
              {/*</tr>*/}
              <tr>
                <td>上下方向键</td>
                <td>
                  选中行的情况下，切换至下一选中行<br />
                  在单元格编辑情况下，则是移至上/下一行单元格
                </td>
              </tr>
              <tr>
                <td>左右方向键</td>
                <td>在单元格编辑情况下，如果是在文本开始或者末尾，则是移至上/下一列单元格</td>
              </tr>
              <tr>
                <td>CTRL+上下方向键</td>
                <td>选中行的情况下，从当前行开始，增加选择上/下一行</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          {/*<span>最近打开</span>*/}
          {/*<div>*/}
          {/*  {*/}
          {/*    tempData.map((item, i) => {*/}
          {/*      return <span*/}
          {/*        key={i}*/}
          {/*      >*/}
          {/*        <span>{i + 1}.</span>*/}
          {/*        <span>{item}</span>*/}
          {/*      </span>;*/}
          {/*    })*/}
          {/*  }*/}
          {/*</div>*/}
        </div>
      </div>
    </div>;
});
