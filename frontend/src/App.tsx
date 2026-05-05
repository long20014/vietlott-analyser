import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import AnalyzePage from './pages/AnalyzePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-blue-700 text-lg">Vietlott Analyser</span>
          <NavLink
            to="/analyze"
            className={({ isActive }) =>
              isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'
            }
          >
            Analyze
          </NavLink>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center h-64 text-gray-400">
                Select a page from the nav
              </div>
            }
          />
          <Route path="/analyze" element={<AnalyzePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
