import React, { FormEvent, useCallback, useState } from 'react'

import { ColorResult, SketchPicker } from 'react-color'

import {
  ColorPreview,
  mainColor,
  StyledButton,
  StyledForm,
} from '../../../common/style'
import { ZoneDataType } from '../../../common/types'
import { LabelWithValueWrapper } from './style'

const ZoneForm = ({
  onSubmit,
  zoneDefaulData,
}: {
  onSubmit: (zoneData: ZoneDataType) => void
  zoneDefaulData?: ZoneDataType
}) => {
  const [color, setColor] = useState<string>(zoneDefaulData?.color || '#000')

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      onSubmit({ label: (e.target as any).label.value, color })
    },
    [color, onSubmit]
  )

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
