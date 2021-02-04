import React, { FormEvent, useState } from 'react'
import { mainColor, StyledButton, StyledForm } from '../../../common/style'
import { LoginWrapper } from './style'

import Api from '../../../common/API'

const handleSubmit = async (
  e: FormEvent,
  onLoginSuccess: Function,
  onLoginFailure: Function
) => {
  e.preventDefault()
  onLoginFailure(null)

  const { username, password } = e.target as any

  try {
    const responseData: any = await Api.post('/login', {
      username: username.value,
      password: password.value,
    })

    onLoginFailure(null)
    onLoginSuccess(responseData.token)
  } catch (error) {
    const errorMessage = error.response.data.message
    onLoginFailure(errorMessage)
  }
}

const Login = ({ onLoginSuccess }: { onLoginSuccess: Function }) => {
  const [error, setErrorMessage] = useState('')

  return (
    <LoginWrapper>
      <StyledForm
        maxWidth={500}
        onSubmit={(e: FormEvent) =>
          handleSubmit(e, onLoginSuccess, setErrorMessage)
        }
      >
        <h2>Login</h2>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Enter username here..."
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Enter password here..."
            required
          />
        </div>

        <StyledButton backgroundColor={mainColor} type="submit">
          Submit
        </StyledButton>

        <div className="login-form__error-message"> {error}</div>
      </StyledForm>
    </LoginWrapper>
  )
}

export default Login
