import React, { useState } from "react";
import { SketchPicker } from 'react-color';

interface ColorPickerProps {
    value?: string;
    onChange?: (value: string) => void;
}
const ColorPicker: React.FC<ColorPickerProps> = ({ value = '', onChange }) => {
    const [displayColorPicker, setDisplayColorPicker] = useState(false);

    const triggerChange = (changedValue: string) => {
        onChange?.(changedValue || value);
    }

    const onColorChange = (e: any) => {
        const newColor = e.hex;
        triggerChange(newColor);
    }

    return (
        <div>
            <div style={{
                padding: '5px',
                background: '#fff',
                borderRadius: '1px',
                boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                display: 'inline-block',
                cursor: 'pointer'
            }} onClick={() => setDisplayColorPicker(true)}>
                <div style={{
                    width: '36px',
                    height: '14px',
                    borderRadius: '2px',
                    background: value
                }} />
            </div>
            {displayColorPicker ? <div style={{
                position: 'absolute',
                zIndex: 2,
            }}>
                <div style={{
                    position: 'fixed',
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',
                }} onClick={() => setDisplayColorPicker(false)} />
                <SketchPicker color={value} onChange={onColorChange} />
            </div> : null}

        </div>
    )
}

export default ColorPicker;