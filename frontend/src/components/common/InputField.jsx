import React from "react";

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "form-input",
  ...props
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        className={className}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </div>
  );
}
