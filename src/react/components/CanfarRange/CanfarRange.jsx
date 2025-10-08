import React, {useState} from "react";
import Form from "react-bootstrap/Form";
import './CanfarRange.css';

function CanfarRange({
    value,
    range, onChange
                     }) {
    const initialValue = range.findIndex( (el) => el === value) || 0
    const [rangePos, setRangePos] = useState(initialValue)
    const handleChange = (e) => {
        onChange(range[e.target.value])
        setRangePos(e.target.value)
    }

    React.useEffect(() => {
        if (value) {
            const newRangePos = range.findIndex( (el) => el === value || el === value + 1 || el === value - 1) || 0
            setRangePos(newRangePos)
        }

    }, [value, range, setRangePos])
    console.log('value', value, range, rangePos)

    // Calculate percentage for the gradient
    const percentage = ((rangePos) / (range.length - 1)) * 100;

    return (
        <Form.Range
            value={rangePos}
            name="range-slider"
            min={0}
            max={range.length - 1}
            step="1"
            onChange={handleChange}
            className="canfar-range"
            style={{ '--value-percent': `${percentage}%` }}
        />
    )

}

export default CanfarRange;