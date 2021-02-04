import styled from 'styled-components'
import { dangerColor } from '../../../common/style'

export const LoginWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 20px;

  .login-form__error-message {
    color: ${dangerColor};
    font-size: 14px;
    margin-top: 10px;
    font-weight: 600;
    text-align: center;
  }
`
