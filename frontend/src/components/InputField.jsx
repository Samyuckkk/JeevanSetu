import React from "react";

const InputField = ({ label, ...props }) => {
  return (
    <div className="relative">
      <input
        {...props}
        placeholder=" "
        className="peer w-full border border-gray-300 rounded-xl px-3 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white/80"
      />
      <label className="absolute left-3 top-2 text-gray-500 text-sm transition-all 
        peer-placeholder-shown:top-3.5 
        peer-placeholder-shown:text-base 
        peer-placeholder-shown:text-gray-400 
        peer-focus:top-2 
        peer-focus:text-sm 
        peer-focus:text-blue-500">
        {label}
      </label>
    </div>
  );
};

export default InputField;