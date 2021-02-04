import React from 'react'

import { ColorPreview, mainColor, StyledButton } from '../../../common/style'
import { ZoneDataWrapper } from './style'

import { ZoneDataPropTypes } from '../../../common/types'

const ZoneData = ({ data, startZoneUpdate }: ZoneDataPropTypes) => (
  <ZoneDataWrapper>
    <span>
      <strong>Name:</strong> {data.label}
    </span>
    <br />
    <div className="color-preview">
      <strong>Color:</strong> <ColorPreview color={data.color} /> <br />
    </div>
    <strong>Color Hex:</strong> {data.color} <br />
    <StyledButton backgroundColor={mainColor} onClick={startZoneUpdate}>
      Edit zone
    </StyledButton>
  </ZoneDataWrapper>
)

export default ZoneData
