import {Form, Input, Textarea, Checkbox, TreeSelect, Message} from 'components';
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';
import {getPrefix} from '../../../../../lib/classes';
import './style/index.less';
import {_myLabelRender, _myValueRender, computeTo, myArray2tree} from '../../menu/tool';
import {tree2array} from '../../../../../lib/tree';

export default React.memo(forwardRef(({treeData, selectedNode, type,
                                        update = false,
                                          user}, ref) => {
  const FormItem = Form.FormItem;
  const reserveWord = user.reserveWord || [];
  const currentPrefix = getPrefix('container-model-entity-conceptual-edit');
  const [tree, setTree] = useState(
      myArray2tree(tree2array(treeData).filter(d => !d.bindSchema)) || []);
  const treeRef = useRef([]);
  treeRef.current = [...(tree || [])];
  const [to, setTo] = useState(computeTo(selectedNode, treeRef.current));

  const [defKey, setDefKey] = useState('');
  const [defName, setDefName] = useState('');
  const [intro, setIntro] = useState('');
  const [codeAsName, setCodeAsName] = useState(!update);
  const preDefKeyRef = useRef('');

  useEffect(() => {
    if(update) {
      setDefKey(selectedNode.defKey);
      setDefName(selectedNode.defName);
      setIntro(selectedNode.intro);
    }
  }, []);

  useImperativeHandle(ref, () => {
    return {
        validate: () => {
            const keyWord = reserveWord
                .find(r => r.keyWord?.toLocaleLowerCase() === defKey?.toLocaleLowerCase() ||
                    r.keyWord?.toLocaleLowerCase() === defName?.toLocaleLowerCase());
            if(keyWord) {
                const name = keyWord.keyWord?.toLocaleLowerCase() === defKey?.toLocaleLowerCase() ? 'defKey' : 'defName';
                Message.error({title: `${name === 'defName' ? '显示名称' : '代码'}[${name === 'defName' ? defName : defKey}]与数据库关键字:${keyWord.keyWord}(${keyWord.intro})冲突，请重新命名`});
                return false;
            }
            return true;
        },
      getData: () => {
          return {
              to: to === '_UNCATE' ? null : to,
              defKey,
              defName,
              intro,
              type,
          };
      },
      resetTree: (newTree) => {
        setTree(myArray2tree(tree2array(newTree).filter(d => !d.bindSchema)) || []);
      },
      restData: () => {
        setDefKey('');
        setDefName('');
        setIntro('');
      },
    };
  });

    const _onChange = (e, key) => {
        const targetValue = e.target.value;
        switch (key) {
            case 'defKey':
                setDefKey(targetValue);
                if(codeAsName) {
                    setDefName(targetValue);
                }
                break;
            case 'to':
                setTo(targetValue);
                break;
            case 'defName':
                setDefName(targetValue);
                if(codeAsName) {
                    setCodeAsName(false);
                }
                break;
            case 'intro':
                setIntro(targetValue);
                break;
            default:
                break;
        }
    };
    const _onFocus = () => {
        preDefKeyRef.current = defKey;
    };
    const _onBlur = (e) => {
        const targetValue = e.target.value;
        let tempValue = targetValue.replace(/[-—]/g, '_');
        if(tempValue === '' ||  /^[a-zA-Z_$#\u4e00-\u9fff][a-zA-Z0-9_$#.\u4e00-\u9fff]*$/.test(tempValue)) {
            setDefKey(tempValue);
            if(codeAsName) {
                setDefName(tempValue);
            }
        } else {
            setDefKey(preDefKeyRef.current);
            if(codeAsName) {
                setDefName(preDefKeyRef.current);
            }
            Message.error({title: '必须以字母，下划线，$,#，中文开头，可包含数字、字母，下划线，$,#，中文,.'});
        }
    };
    const _labelRender = useCallback((node) => {
        return _myLabelRender(node);
    }, []);

    const _valueRender = useCallback((node) => {
        return _myValueRender(node);
    }, []);
    return <div className={`${currentPrefix}`}>
      <Form >
        {
          update ||
          <FormItem label='归属分类'>
            <TreeSelect
              labelRender={_labelRender}
              valueRender={_valueRender}
              countParent
              countable
              value={to}
              options={tree}
              onChange={e => _onChange(e, 'to')}/>
          </FormItem>
      }
        <FormItem label='代码' require>
          <Input
            value={defKey}
            autoFocus
            maxLength={64}
            toggleCase
            onBlur={_onBlur}
            onFocus={_onFocus}
            onChange={e => _onChange(e, 'defKey')}
        />
        </FormItem>

        <FormItem label='显示名称'>
          <div className={`${currentPrefix}-line`}>
            <Input
              value={defName}
              maxLength={64}
              onChange={e => _onChange(e, 'defName')}
          />
            <><Checkbox
              checked={codeAsName}
              onChange={(e) => {
                const checkedValue = e.target.checked;
                setCodeAsName(checkedValue);
                if(checkedValue) {
                  setDefName(defKey);
                }
              }}
          />代码作为名称</>
          </div>
        </FormItem>
        <FormItem label='备注说明'>
          <Textarea
            value={intro}
            style={{
              resize: 'none',
              maxlength: 500,
          }}
            onChange={e => _onChange(e, 'intro')}
        />
        </FormItem>

      </Form>
    </div>;
}));
