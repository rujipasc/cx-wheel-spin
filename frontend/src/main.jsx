import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App'
import './App.css'
import { initTheme } from './layout/theme'

const container = document.getElementById('root')

const root = createRoot(container)
initTheme();
root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)
