import React from "react";
import { Link, useLocation } from "react-router-dom";

const AuthFooter = () => {
  const { pathname } = useLocation();

  const isLogin = pathname.includes("login");
  const role = pathname.split("/")[2]; // user / ambulance / hospital

  return (
    <p className="text-sm text-center text-gray-600">
      {isLogin ? "New here?" : "Already registered?"}{" "}
      <Link
        to={`/login/${role}`}
        className="text-blue-600 font-medium hover:underline transition"
      >
        Login
      </Link>{" "}
      |{" "}
      <Link
        to={`/register/${role}`}
        className="text-red-500 font-medium hover:underline transition"
      >
        Register
      </Link>
    </p>
  );
};

export default AuthFooter;