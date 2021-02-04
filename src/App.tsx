import React, { useState } from 'react'
import './App.css'
import Login from './app/components/Login'
import MapDrawer from './app/components/MapDrawer'
import * as authUtils from './app/utils/auth'
import { setupRequestInterceptor, setupResponseInterceptor } from './common/API'

import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom'

setupRequestInterceptor()
setupResponseInterceptor()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!authUtils.getUserToken()
  )

  const handleLoginSuccess = (token: string) => {
    authUtils.setUserToken(token)
    setIsAuthenticated(true)
  }

  return (
    <Router>
      <Route exact path="/">
        {!isAuthenticated ? <Redirect to="/login" /> : <MapDrawer />}
      </Route>

      <Route path="/login">
        {!isAuthenticated ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Redirect to="/" />
        )}
      </Route>
    </Router>
  )
}

export default App
