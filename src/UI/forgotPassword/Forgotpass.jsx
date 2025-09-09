import React from "react";
import { Link } from "react-router-dom";

function Forgotpass() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-2 sm:px-0">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto overflow-hidden bg-white rounded-lg shadow-md">
        {/* Optimax Logo Header */}
        <div className="flex flex-col items-center justify-center pt-8 pb-2">
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-900 text-white font-bold text-2xl sm:text-3xl">
              O
            </div>
            <span className="ml-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-900">
              PTIMAX
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-medium text-center text-purple-900">
            Forgot Password
          </h3>
          <p className="mt-1 text-center text-gray-500 text-sm sm:text-base">
            Enter your email to reset your password
          </p>
        </div>
        <div className="px-4 sm:px-6 py-4">
          <form>
            <div className="w-full mt-4">
              <input
                className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-sm sm:text-base"
                type="email"
                placeholder="Email Address"
                aria-label="Email Address"
              />
            </div>
            <button className="w-full mt-6 px-6 py-2 text-sm sm:text-base font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-purple-900 rounded-lg hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50">
              Send Reset Link
            </button>
          </form>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center py-4 text-center bg-gray-50 gap-2 sm:gap-0">
          <span className="text-sm text-gray-600">
            Remembered your password?
          </span>
          <Link
            to="/MainSignIn"
            className="mx-2 text-sm font-bold text-purple-900 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Forgotpass;
