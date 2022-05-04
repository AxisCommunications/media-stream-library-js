import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import 'pepjs'

const container = document.getElementById('root')

if (container !== null) {
  createRoot(container).render(<App />)
}
