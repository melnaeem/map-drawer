import React from 'react'
import ReactModal from 'react-modal'
import { ModalPropTypes } from '../../../common/types'
import { reactModalDefaultStyle } from '../../constants/reactModalStyle'
import { ModalCloseBtn } from './style'


const Modal = ({ children, isOpen, closeModal }: ModalPropTypes) => (
  <ReactModal
    isOpen={isOpen}
    onRequestClose={closeModal}
    contentLabel="App Modal"
    style={reactModalDefaultStyle}
  >
    {children}
    <ModalCloseBtn title="close modal" onClick={closeModal}>
      X
    </ModalCloseBtn>
  </ReactModal>
)

export default Modal
