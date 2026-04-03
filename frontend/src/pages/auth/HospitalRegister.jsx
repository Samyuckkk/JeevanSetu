import React from "react";
import InputField from "../../components/InputField";
import LoginCard from "../../components/LoginCard";

const HospitalRegister = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Hospital Register");
  };

  return (
    <LoginCard title="Hospital Registration" onSubmit={handleSubmit}>
      <InputField label="Hospital Name" name="name" />
      <InputField label="Email" name="email" type="email" />
      <InputField label="Password" name="password" type="password" />
    </LoginCard>
  );
};

export default HospitalRegister;