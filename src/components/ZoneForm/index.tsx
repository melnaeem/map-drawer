import React, { FormEvent, useState } from 'react'
import { ColorResult, SketchPicker } from 'react-color'
import styled from 'styled-components'
import { ZoneData } from '../../App'
import {
  ColorPreview,
  mainColor,
  StyledButton,
  StyledForm,
} from '../shared/style'

const LabelWithValueWrapper = styled.div`
  display: flex;

  label {
    margin-inline-end: 10px;
  }
`

const ZoneForm = ({
  onSubmit,
  zoneDefaulData,
}: {
  onSubmit: (zoneData: ZoneData) => void
  zoneDefaulData?: ZoneData
}) => {
  const [color, setColor] = useState<string>(zoneDefaulData?.color || '#000')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ label: (e.target as any).label.value, color })
  }

  return (
    <StyledForm minWidth={400} onSubmit={handleSubmit}>
      <h2>{zoneDefaulData ? 'Edit' : 'Create'} Zone</h2>
      <div>
        <label htmlFor="label">Zone name</label>
        <input
          type="text"
          name="label"
          id="label"
          defaultValue={zoneDefaulData?.label}
          placeholder="Enter zone name here..."
          required
        />
      </div>
      <div>
        <LabelWithValueWrapper>
          <label>Choose color</label>
          <ColorPreview color={color} />
        </LabelWithValueWrapper>
        <SketchPicker
          color={color}
          onChange={(colorVal: ColorResult) => {
            setColor(colorVal.hex)
          }}
          width="500"
          disableAlpha={true}
        />
      </div>
      <StyledButton backgroundColor={mainColor} type="submit">
        Submit
      </StyledButton>
    </StyledForm>
  )
}

export default ZoneForm
