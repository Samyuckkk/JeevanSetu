import { Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "../pages/auth/UserLogin";
import AmbulanceLogin from "../pages/auth/AmbulanceLogin";
import HospitalLogin from "../pages/auth/HospitalLogin";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login/user" />} />
      <Route path="/login/user" element={<UserLogin />} />
      <Route path="/login/ambulance" element={<AmbulanceLogin />} />
      <Route path="/login/hospital" element={<HospitalLogin />} />
    </Routes>
  );
};

export default AppRoutes;