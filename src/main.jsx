import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'
import './firebase'
import App from './App'

createRoot(document.querySelector('#app')).render(<App />)
