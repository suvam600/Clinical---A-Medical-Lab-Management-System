// src/components/AuthCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const AuthCard = ({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => {
  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 md:p-10 border border-slate-100">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 mb-3 border border-blue-100">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <span className="text-xs font-medium text-blue-700 tracking-wide">
            Clinical – Medical Lab System
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children}

      {footerText && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {footerText}{" "}
          <Link
            to={footerLinkTo}
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      )}
    </div>
  );
};

export default AuthCard;
