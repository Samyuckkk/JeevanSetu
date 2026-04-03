import React from "react";
import { Link, useLocation } from "react-router-dom";

const RoleSwitcher = () => {
  const { pathname } = useLocation();

  const roles = [
    { name: "User", path: "/login/user" },
    { name: "Ambulance", path: "/login/ambulance" },
    { name: "Hospital", path: "/login/hospital" },
  ];

  return (
    <div className="relative flex bg-gray-100 rounded-xl p-1 shadow-inner">
      {roles.map((role) => {
        const active = pathname === role.path;

        return (
          <Link
            key={role.name}
            to={role.path}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-white shadow text-blue-600 scale-105"
                : "text-gray-500 hover:text-black"
            }`}
          >
            {role.name}
          </Link>
        );
      })}
    </div>
  );
};

export default RoleSwitcher;