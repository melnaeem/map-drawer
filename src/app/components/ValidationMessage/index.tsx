import React from 'react'
import CloseIcon from '../../../common/icons/CloseIcon'
import { dangerColor } from '../../../common/style'
import { ValidationMessageWrapper } from './style'

interface ValidationMessagePropTypes {
  content: string
}

const ValidationMessage = ({ content }: ValidationMessagePropTypes) => (
  <ValidationMessageWrapper>
    <CloseIcon color={dangerColor} />
    <p>{content}</p>
  </ValidationMessageWrapper>
)

export default ValidationMessage
