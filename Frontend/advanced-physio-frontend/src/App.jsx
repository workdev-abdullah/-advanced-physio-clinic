import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import Footer from "./components/Footer";
import PageWrapper from "./components/PageWrapper";
import HomeVisitPreview from "./components/HomeVisitPreview";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Slots from "./pages/Slots";
import PatientDetails from "./pages/PatientDetails";
import Success from "./pages/Success";
import AdminDashboard from "./pages/AdminDashboard";
import HomeVisit from "./pages/HomeVisit";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Home />
            </PageWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        <Route path="/home-visit"
         element={
          <PageWrapper>

         
         <HomeVisit />  
          </PageWrapper>
         } />
<Route path="/home-visit-preview" element={
   <PageWrapper>
  <HomeVisitPreview />
  </PageWrapper>
  } />
        <Route
          path="/slots"
          element={
            <PageWrapper>
              <Slots />
            </PageWrapper>
          }
        />
        <Route
          path="/patient-details"
          element={
            <PageWrapper>
              <PatientDetails />
            </PageWrapper>
          }
        />
        <Route
          path="/success"
          element={
            <PageWrapper>
              <Success />
            </PageWrapper>
          }
        />
        <Route
          path="/profile"
          element={
            <PageWrapper>
              <Profile />
            </PageWrapper>
          }
        />
        <Route
          path="/admin"
          element={
            <PageWrapper>
              <AdminDashboard />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <AnimatedRoutes />
      <Footer />
    </BrowserRouter>
  );
}
