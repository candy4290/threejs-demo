import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import './index.less';
import { useState } from 'react';
import { Map } from 'ol';
import Feature from "ol/Feature";
import Point from 'ol/geom/Point';

export default function PointModal(props: {currentPointFeature: Feature<Point> | undefined, mapInstance: Map, update: () => void}) {
    const {currentPointFeature, update} = props;
    const [form] = Form.useForm();
    const [title, setTitle] = useState('未命名');

    function submit() {
        const formValue = form.getFieldsValue();
        console.log(formValue);
    }


    function closeModal() {
        currentPointFeature?.set('modalVisible', false);
        update();
    }

    return (
        <div className='line-modal'>
            <div className='header'>
                <span>标点[{title}]</span>
                <CloseOutlined style={{cursor: 'pointer'}} onClick={closeModal} />
            </div>
            <div className='content'>
                <Form name='form' autoComplete='off' form={form}>
                    <Form.Item label="名称" name="name">
                        <Input onChange={e => setTitle(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="备注" name="remark">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item label="关联路段" name="lineStyle">
                        <Select>
                            <Select.Option value='0'>路段1</Select.Option>
                            <Select.Option value='1'>路段2</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item style={{textAlign: 'center'}}>
                        <Button type="primary" style={{marginRight: 8}} onClick={submit}>
                            确定
                        </Button>
                        <Button>
                            取消
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}