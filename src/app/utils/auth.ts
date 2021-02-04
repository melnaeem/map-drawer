const tokenKey = 'token'

export const setUserToken = (token: string) => {
  localStorage.setItem(tokenKey, token)
}

export const getUserToken = (): string | null => {
  return localStorage.getItem(tokenKey)
}

export const logoutUser = () => {
  localStorage.removeItem(tokenKey)
}


