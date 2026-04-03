import React from "react";
import InputField from "../../components/InputField";
import LoginCard from "../../components/LoginCard";
import { useNavigate } from "react-router-dom";

const UserRegister = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      name: e.target.name.value,
      email: e.target.email.value,
      password: e.target.password.value,
    };

    console.log("Register:", data);

    navigate("/login/user");
  };

  return (
    <LoginCard title="User Registration" onSubmit={handleSubmit}>
      <InputField label="Name" name="name" />
      <InputField label="Email" name="email" type="email" />
      <InputField label="Password" name="password" type="password" />
    </LoginCard>
  );
};

export default UserRegister;