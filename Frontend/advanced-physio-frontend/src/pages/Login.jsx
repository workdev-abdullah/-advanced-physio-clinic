import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/api";

import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const navigate = useNavigate();

  const [params] = useSearchParams();

  const redirect = params.get("redirect");

  // Store confirmation result safely
  const confirmationResultRef = useRef(null);

  // Prevent duplicate verification
  const verifyingRef = useRef(false);

  // =====================================================
  // RECAPTCHA
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const setupRecaptcha = async () => {
      try {
        // Remove old verifier if it exists
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch {
            // ignore cleanup error
          }

          window.recaptchaVerifier = null;
        }

        const verifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",

            callback: (response) => {
              if (!mounted) return;

              console.log(
                "✅ reCAPTCHA solved"
              );
            },

            "expired-callback": () => {
              console.log(
                "⚠️ reCAPTCHA expired"
              );
            },

            "error-callback": (error) => {
              console.error(
                "❌ reCAPTCHA error:",
                error
              );
            },
          }
        );

        window.recaptchaVerifier =
          verifier;

        await verifier.render();

        console.log(
          "✅ reCAPTCHA initialized"
        );
      } catch (error) {
        console.error(
          "❌ reCAPTCHA initialization failed:",
          error
        );
      }
    };

    setupRecaptcha();

    return () => {
      mounted = false;

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // ignore cleanup error
        }

        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // =====================================================
  // SEND OTP
  // =====================================================

  const sendOtp = async () => {
    if (!phone || phone.length !== 10) {
      alert(
        "Enter valid 10 digit phone number"
      );
      return;
    }

    if (!window.recaptchaVerifier) {
      alert(
        "reCAPTCHA is not ready. Please wait a moment and try again."
      );
      return;
    }

    try {
      setLoading(true);

      setStatusMessage(
        "Sending OTP..."
      );

      console.log(
        "📱 Sending OTP to:",
        `+91${phone}`
      );

      const confirmationResult =
        await signInWithPhoneNumber(
          auth,
          `+91${phone}`,
          window.recaptchaVerifier
        );

      confirmationResultRef.current =
        confirmationResult;

      // Keep backward compatibility
      window.confirmationResult =
        confirmationResult;

      console.log(
        "✅ OTP session created"
      );

      setStep(2);

      setStatusMessage(
        "OTP sent successfully."
      );
    } catch (err) {
      console.error(
        "❌ OTP Send Error:",
        err
      );

      let message =
        "Failed to send OTP.";

      if (
        err.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many attempts. Please try again later.";
      } else if (
        err.code ===
        "auth/invalid-phone-number"
      ) {
        message =
          "Invalid phone number.";
      } else if (
        err.code ===
        "auth/captcha-check-failed"
      ) {
        message =
          "reCAPTCHA verification failed. Please refresh and try again.";
      } else if (
        err.code ===
        "auth/quota-exceeded"
      ) {
        message =
          "SMS quota exceeded. Please try again later.";
      }

      setStatusMessage("");

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BACKEND LOGIN WITH RETRY
  // =====================================================

  const loginToBackend = async (
    idToken,
    attempt = 1
  ) => {
    const MAX_ATTEMPTS = 3;

    try {
      console.log(
        `📡 Backend login attempt ${attempt}/${MAX_ATTEMPTS}`
      );

      setStatusMessage(
        attempt === 1
          ? "Connecting to server..."
          : `Server is waking up... retrying (${attempt}/${MAX_ATTEMPTS})`
      );

      const response = await api.post(
        "/auth/firebase-login",
        {
          idToken,
        }
      );

      console.log(
        "✅ Backend login successful:",
        response.data
      );

      return response;
    } catch (err) {
      console.error(
        `❌ Backend login attempt ${attempt} failed:`,
        err
      );

      // -----------------------------------------------
      // Retry network / timeout / server errors
      // -----------------------------------------------

      const shouldRetry =
        err.code ===
          "ECONNABORTED" ||
        err.code === "ERR_NETWORK" ||
        !err.response ||
        err.response.status >= 500;

      if (
        shouldRetry &&
        attempt < MAX_ATTEMPTS
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 3000)
        );

        return loginToBackend(
          idToken,
          attempt + 1
        );
      }

      throw err;
    }
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      alert(
        "Enter the 6 digit OTP"
      );
      return;
    }

    // Prevent double click
    if (verifyingRef.current) {
      return;
    }

    const confirmationResult =
      confirmationResultRef.current ||
      window.confirmationResult;

    if (!confirmationResult) {
      alert(
        "OTP session missing. Please request OTP again."
      );

      setStep(1);

      return;
    }

    try {
      verifyingRef.current = true;

      setLoading(true);

      setStatusMessage(
        "Verifying OTP..."
      );

      // =================================================
      // STEP 1: FIREBASE OTP
      // =================================================

      console.log(
        "🔐 Verifying OTP..."
      );

      const result =
        await confirmationResult.confirm(
          otp
        );

      console.log(
        "✅ OTP VERIFIED SUCCESSFULLY"
      );

      console.log(
        "Firebase UID:",
        result.user.uid
      );

      // =================================================
      // STEP 2: FIREBASE ID TOKEN
      // =================================================

      setStatusMessage(
        "Preparing secure login..."
      );

      const idToken =
        await result.user.getIdToken(
          true
        );

      if (!idToken) {
        throw new Error(
          "Firebase ID token was not received."
        );
      }

      console.log(
        "✅ Firebase ID token received"
      );

      // =================================================
      // STEP 3: BACKEND LOGIN
      // =================================================

      const response =
        await loginToBackend(
          idToken
        );

      // =================================================
      // STEP 4: LOGIN SUCCESS
      // =================================================

      if (
        response?.data?.success
      ) {
        setStatusMessage(
          "Login successful. Redirecting..."
        );

        // Clear OTP session
        confirmationResultRef.current =
          null;

        window.confirmationResult =
          null;

        navigate(
          redirect || "/"
        );
      } else {
        throw new Error(
          "Backend login was not successful."
        );
      }
    } catch (err) {
      console.error(
        "❌ LOGIN ERROR"
      );

      console.error(
        "Code:",
        err?.code
      );

      console.error(
        "Message:",
        err?.message
      );

      // -----------------------------------------------
      // Firebase errors
      // -----------------------------------------------

      if (
        err?.code ===
        "auth/invalid-verification-code"
      ) {
        alert(
          "Invalid OTP. Please enter the latest OTP."
        );
      } else if (
        err?.code ===
        "auth/code-expired"
      ) {
        alert(
          "OTP expired. Please request a new OTP."
        );

        setOtp("");

        setStep(1);
      }

      // -----------------------------------------------
      // Backend timeout
      // -----------------------------------------------

      else if (
        err?.code ===
        "ECONNABORTED"
      ) {
        alert(
          "The server is taking too long to respond. Please try again."
        );
      }

      // -----------------------------------------------
      // Network error
      // -----------------------------------------------

      else if (
        err?.code === "ERR_NETWORK"
      ) {
        alert(
          "Unable to connect to the server. Please try again."
        );
      }

      // -----------------------------------------------
      // Backend 401
      // -----------------------------------------------

      else if (
        err?.response?.status === 401
      ) {
        alert(
          "Authentication failed. Please request a new OTP and try again."
        );
      }

      // -----------------------------------------------
      // Backend 500
      // -----------------------------------------------

      else if (
        err?.response?.status >= 500
      ) {
        alert(
          "Server is temporarily unavailable. Please try again in a moment."
        );
      }

      // -----------------------------------------------
      // Generic
      // -----------------------------------------------

      else {
        alert(
          `Login failed:\n${
            err?.code ||
            "unknown"
          }\n${
            err?.message ||
            ""
          }`
        );
      }

      setStatusMessage("");
    } finally {
      setLoading(false);

      verifyingRef.current = false;
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">

      <div
        className="
          w-full max-w-sm
          rounded-2xl
          bg-white dark:bg-slate-800
          border border-gray-200
          dark:border-slate-700
          shadow-xl
          p-6
        "
      >

        {/* HEADER */}

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">
          Secure Login
        </h2>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Login using your phone number
        </p>

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>

            <div className="flex items-center mb-4">

              <span
                className="
                  px-3 py-2
                  rounded-l-xl
                  bg-gray-100 dark:bg-slate-700
                  border border-r-0
                  border-gray-300
                  dark:border-slate-600
                  text-gray-700 dark:text-gray-200
                "
              >
                +91
              </span>

              <input
                type="tel"
                maxLength={10}
                className="
                  w-full
                  px-4 py-2
                  rounded-r-xl
                  border border-gray-300
                  dark:border-slate-600
                  bg-white dark:bg-slate-800
                  text-gray-900
                  dark:text-gray-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-green-500
                "
                placeholder="Enter 10 digit number"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="
                w-full py-3
                rounded-xl
                font-semibold
                transition-all
                duration-200
                bg-green-600
                text-white
                hover:bg-green-700
                active:scale-[0.98]
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading
                ? "Sending OTP..."
                : "Send OTP"}
            </button>
          </>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enter OTP
            </label>

            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="
                w-full
                px-4 py-2
                rounded-xl
                mb-4
                border border-gray-300
                dark:border-slate-600
                bg-white dark:bg-slate-800
                text-gray-900
                dark:text-gray-100
                tracking-widest
                text-center
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
              "
              placeholder="● ● ● ● ● ●"
              value={otp}
              onChange={(e) =>
                setOtp(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="
                w-full py-3
                rounded-xl
                font-semibold
                transition-all
                duration-200
                bg-green-600
                text-white
                hover:bg-green-700
                active:scale-[0.98]
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {loading
                ? "Verifying..."
                : "Verify & Login"}
            </button>

            <button
              onClick={() => {
                setStep(1);
                setOtp("");
                setStatusMessage("");

                confirmationResultRef.current =
                  null;

                window.confirmationResult =
                  null;
              }}
              disabled={loading}
              className="
                w-full
                mt-3
                text-sm
                text-gray-500
                dark:text-gray-400
                hover:underline
                disabled:opacity-50
              "
            >
              Change phone number
            </button>
          </>
        )}

        {/* =================================================
            STATUS
        ================================================= */}

        {statusMessage && (
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {statusMessage}
          </p>
        )}

        {/* =================================================
            RECAPTCHA
        ================================================= */}

        <div
          id="recaptcha-container"
          className="mt-8"
        />

      </div>
    </div>
  );
}