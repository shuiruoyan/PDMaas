import './style/index.less';
import React, {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react';
import {getPrefix} from '../../lib/classes';
import Button from '../button';
import Table from '../table';
import IconTitle from '../icontitle';
import Message from '../message';


    const ItemEdit = React.memo(forwardRef(({ columns, value = [],
                                            close, onConfirm}, ref) => {
    const currentPrefix = getPrefix('components-itemEdit');

    const tableRef = useRef();
    const dataRef = useRef();
    const selectedRef = useRef([]);

    const [data, setData] = useState(value.map(it => ({...it, id: it.id || Math.uuid()})));
    const [selected, setSelected] = useState([]);

    console.log(value);

    dataRef.current = data;
    selectedRef.current = selected;

    const _onChange = useCallback((v, column, row) => {
        setData((p) => {
            return p.map((r) => {
                if(r.id === row) {
                    return {
                        ...r,
                        [column]: v,
                    };
                }
                return r;
            });
        });
    }, []);

    useImperativeHandle(ref, () => {
        return {
            getData: () => {
                return dataRef.current;
            },
        };
    }, []);

    const onSelect = useCallback((selectedData) => {
        setSelected(selectedData);
    }, []);

    const _onConfirm = () => {
        onConfirm && onConfirm(dataRef.current);
        close();
    };

    const _onCancel = () => {
        close();
    };

    const removeSelectedRow = useCallback(() => {
        if (selectedRef.current.length === 0) {
            Message.error({title: '请至少选择一条数据'});
            return;
        }
        setData(prevState => prevState.filter(it => !selectedRef.current.includes((it.id))));
        setSelected([]);
        tableRef.current?.resetSelected([]);
    }, []);

    const getMaxSelectedStep = () => {
        return selected.length > 0 ? Math.max(...selected.map((s) => {
            return data.findIndex(f => f.id === s);
        })) + 1 : data.length;
    };

    const addRow = () => {
        const maxStep = getMaxSelectedStep();
        setData((p) => {
            const temp = [...p];
            temp.splice(maxStep, 0, {
                itemKey: '',
                itemName: '',
                parentKey: '',
                intro: '',
                id: Math.uuid(),
            });
            return temp;
        });
    };

    return <div className={`${currentPrefix}`}>
      <div className={`${currentPrefix}-body`}>
        <Table
          ref={tableRef}
          columns={columns}
          data={data}
          onSelect={onSelect}
          onChange={_onChange}
        />
      </div>
      <div className={`${currentPrefix}-bottom`}>
        <div className={`${currentPrefix}-bottom-left`}>
          <IconTitle onClick={() => addRow()} icon='icon-oper-plus' title='添加'/>
          <IconTitle onClick={() => removeSelectedRow()} icon='icon-line-real' title='移除'/>
        </div>
        <div className={`${currentPrefix}-bottom-right`}>
          <Button onClick={() => _onCancel()}>取消</Button>
          <Button onClick={() => _onConfirm()} type='primary'>确认</Button>
        </div>
      </div>
    </div>;
}));


export default ItemEdit;
