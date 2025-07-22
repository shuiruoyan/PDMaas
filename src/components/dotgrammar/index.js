import React, {forwardRef} from 'react';
import './style/index.less';
import {getPrefix} from '../../lib/classes';

export default React.memo(forwardRef(() => {
    const currentPrefix = getPrefix('components-dotgrammar');

    return <div className={currentPrefix}>
      <div>官网：https://github.com/olado/doT</div>
      <div>语法对照：参考地址：https://tech.meituan.com/dot.html</div>
      <table>
        <tbody>
          <tr>
            <td>项目</td>
            <td>JavaScript</td>
            <td>对应语法</td>
            <td>案例</td>
          </tr>
          <tr>
            <td>输出变量</td>
            <td>=</td>
            <td>{'{{=变量名}}'}</td>
            <td>{'{{=it.name}}'}</td>
          </tr>
          <tr>
            <td>条件判断</td>
            <td>if</td>
            <td>{'{{? 条件表达式}}'}</td>
            <td>{'{{? i > 3}}...{{?}}'}</td>
          </tr>
          <tr>
            <td>条件转折</td>
            <td>else/else if</td>
            <td>{'{{??}}/{{?? 条件表达式}}'}</td>
            <td>{'{{?? i ==2}}'}</td>
          </tr>
          <tr>
            <td>循环</td>
            <td>for</td>
            <td>{'{{~ 循环变量}}'}</td>
            <td>{'{{~ it.arr:item}}...{{~}}'}</td>
          </tr>
          <tr>
            <td>执行方法</td>
            <td>funcName()</td>
            <td>{'{{= funcName() }}'}</td>
            <td>{'{{= it.sayHello() }}'}</td>
          </tr>
        </tbody>
      </table>
      <div>全局方法：可以通过it.func.方法名使用</div>
      <table>
        <tbody>
          <tr>
            <td>方法名</td>
            <td>方法功能</td>
            <td>参数介绍</td>
            <td>案例</td>
          </tr>
          <tr>
            <td>camel</td>
            <td>下划线转驼峰</td>
            <td>参数1：需要转化的字符串，参数2：首字母是否需要大写</td>
            <td>{'(\'USER_NAME\', true) => \'userName\''}</td>
          </tr>
          <tr>
            <td>underline</td>
            <td>驼峰转下划线</td>
            <td>参数1：需要转化的字符串，参数2：是否全大写</td>
            <td>{'(\'userName\', true) => \'USER_NAME\''}</td>
          </tr>
          <tr>
            <td>upperCase</td>
            <td>全大写</td>
            <td>参数1：需要转化的字符串</td>
            <td>{'(\'userName\') => \'USERNAME\''}</td>
          </tr>
          <tr>
            <td>lowerCase</td>
            <td>全小写</td>
            <td>参数1：需要转化的字符串</td>
            <td>{'(\'USERNAME\') => \'username\''}</td>
          </tr>
          <tr>
            <td>join</td>
            <td>多个字符串拼接</td>
            <td>不限参数，最后一个参数为拼接符</td>
            <td>{'(\'user\',\'name\',\'/\') => \'user/name\''}</td>
          </tr>
          <tr>
            <td>intersect</td>
            <td>两个数组交集</td>
            <td>参数1：数组1，参数2：数组2</td>
            <td>{'([\'1\', \'2\'], [\'1\', \'2\', \'3\']) => [\'1\', \'2\']'}</td>
          </tr>
          <tr>
            <td>union</td>
            <td>两个数组并集</td>
            <td>参数1：数组1，参数2：数组2</td>
            <td>{'([\'1\', \'2\'], [\'1\', \'2\', \'3\']) => [\'1\', \'2\', \'3\']'}</td>
          </tr>
          <tr>
            <td>minus</td>
            <td>两个数组差集</td>
            <td>参数1：数组1，参数2：数组2；（数组1比数组2多出的数据）</td>
            <td>{'([\'1\', \'2\', \'3\'], [\'1\', \'2\']) => [\'3\']'}</td>
          </tr>
        </tbody>
      </table>
    </div>;
}));
