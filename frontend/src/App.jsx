import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import BottomNav from './components/BottomNav.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import DestinationDetail from './pages/DestinationDetail.jsx'
import Food from './pages/Food.jsx'
import Stay from './pages/Stay.jsx'
import MapPage from './pages/MapPage.jsx'
import Planner from './pages/Planner.jsx'
import Chat from './pages/Chat.jsx'
import Saved from './pages/Saved.jsx'
import Events from './pages/Events.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/destination/:id" element={<DestinationDetail />} />
          <Route path="/food" element={<Food />} />
          <Route path="/stay" element={<Stay />} />
          <Route path="/events" element={<Events />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/saved" element={<Saved />} />
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  )
}
