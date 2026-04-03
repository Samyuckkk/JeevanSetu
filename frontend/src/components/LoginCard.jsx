import React from "react";
import RoleSwitcher from "./RoleSwitcher";
import AuthFooter from "./AuthFooter";

const LoginCard = ({ title, children, onSubmit }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-red-100">
      <form
        onSubmit={onSubmit}
        className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col gap-6"
      >
        <h2 className="text-3xl font-bold text-center">{title}</h2>

        <RoleSwitcher />

        {children}

        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-red-500 text-white py-2 rounded-xl hover:scale-[1.03] transition"
        >
          Login
        </button>

        <AuthFooter /> {/* ✅ Added here */}
      </form>
    </div>
  );
};

export default LoginCard;