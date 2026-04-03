import React from "react";
import InputField from "../../components/InputField";
import LoginCard from "../../components/LoginCard";

const AmbulanceRegister = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Ambulance Register");
  };

  return (
    <LoginCard title="Ambulance Registration" onSubmit={handleSubmit}>
      <InputField label="Vehicle Number" name="vehicleNumber" />
      <InputField label="Email" name="email" type="email" />
      <InputField label="Password" name="password" type="password" />
    </LoginCard>
  );
};

export default AmbulanceRegister;