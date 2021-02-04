import styled from 'styled-components'

export const mainColor = '#040469'
export const dangerColor = '#9f1616'

export const StyledButton = styled.button<any>`
  width: 100%;
  background: ${(props) => props.backgroundColor || '#000'};
  color: #fff;
  border: none;
  border-radius: 3px;
  font-size: 15px;
  font-weight: 600;
  padding: 15px;
  margin-top: 10px;
  text-transform: capitalize;
  cursor: pointer;
`

export const StyledForm = styled.form<any>`
  width: 100%;
  ${(props) => props.minWidth && `min-width: ${props.minWidth}px`};

  label {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 7px;
    display: block;
  }

  input {
    display: block;
    padding: 10px;
    margin: 0;
    font-size: 15px;
    width: 100%;
    margin-bottom: 15px;
  }
`
export const ColorPreview = styled.div<any>`
  ${(props) => props.color && `background-color: ${props.color}`};
  width: 20px;
  height: 20px;
  border-radius: 3px;
`
