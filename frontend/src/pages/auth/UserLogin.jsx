import React from "react";
import InputField from "../../components/InputField";
import LoginCard from "../../components/LoginCard";
import { loginUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      email: e.target.email.value,
      password: e.target.password.value,
    };

    const res = await loginUser(data);
    console.log(res.data);

    navigate("/dashboard");
  };

  return (
    <LoginCard title="User Login" onSubmit={handleSubmit}>
      <InputField label="Email" name="email" type="email" />
      <InputField label="Password" name="password" type="password" />
    </LoginCard>
  );
};

export default UserLogin;