import React from "react";
import InputField from "../../components/InputField";
import LoginCard from "../../components/LoginCard";
import { loginHospital } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const HospitalLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      email: e.target.email.value,
      password: e.target.password.value,
    };

    const res = await loginHospital(data);
    console.log(res.data);

    navigate("/hospital/dashboard");
  };

  return (
    <LoginCard title="Hospital Login" onSubmit={handleSubmit}>
      <InputField label="Email" name="email" type="email" />
      <InputField label="Password" name="password" type="password" />
    </LoginCard>
  );
};

export default HospitalLogin;