import React, { useEffect } from 'react'
import './index.css'
import Form from './pages/Form'
import Dashboard from './pages/Dashboard'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'

const App = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/users/sign_up' element={<Form isSignInPage={false} />} />
        <Route path='/users/sign_in' element={<Form isSignInPage={true} />} />
        <Route path='/' element={

          <Dashboard />

        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
