import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import './index.less';
import ColorPicker from '../../../color-picker';
import { useEffect, useState } from 'react';
import { Style } from 'ol/style';
import { Map } from 'ol';
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";

export default function LineModal(props: {currentLineFeature: Feature<LineString>, mapInstance: Map, update: () => void}) {
    const {currentLineFeature, mapInstance, update} = props;
    const [form] = Form.useForm();
    const [title, setTitle] = useState('未命名');

    useEffect(() => {
        if (currentLineFeature && currentLineFeature.get('modalVisible')) {
            const lineStyle: Style = currentLineFeature.get('lineStyle');
            const color = lineStyle.getStroke().getColor();
            const width = lineStyle.getStroke().getWidth();
            form.setFieldsValue({
                color, width, lineStyle: '0'
            });
        }
    }, [currentLineFeature, form, mapInstance]);

    function submit() {
        const formValue = form.getFieldsValue();
        console.log(formValue);
    }

    function changeLineStyle(e: '0' | '1') {
        currentLineFeature.set('hasArrow', e === '1');
    }

    function changeWidth(e: number) {
        const style: Style = currentLineFeature.get('lineStyle');
        style.getStroke().setWidth(e);
        currentLineFeature.changed();
    }

    function changeColor(e: string) {
        const style: Style = currentLineFeature.get('lineStyle');
        style.getStroke().setColor(e);
        currentLineFeature.changed()
    }

    function closeModal() {
        currentLineFeature.set('modalVisible', false);
        update();
    }

    return (
        <div className='line-modal'>
            <div className='header'>
                <span>标线[{title}]</span>
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
                    <Form.Item label="线条样式" name="lineStyle">
                        <Select onChange={changeLineStyle}>
                            <Select.Option value='0'>不带箭头</Select.Option>
                            <Select.Option value='1'>带箭头</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="线宽" name="width">
                        <InputNumber onChange={changeWidth} />
                    </Form.Item>
                    <Form.Item label="颜色" name="color">
                        <ColorPicker onChange={changeColor} />
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