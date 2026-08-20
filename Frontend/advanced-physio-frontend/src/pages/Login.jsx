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

  // Firebase confirmation object
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Hard guard against double-fires on "Send OTP" (ref updates are
  // synchronous, unlike the `loading` state, so this closes the small
  // race window a fast double-click/double-tap could otherwise slip
  // through before the button's `disabled` prop re-renders).
  const isSendingRef = useRef(false);

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const redirect = params.get("redirect");

  // --------------------------------------------------
  // CREATE RECAPTCHA
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const setupRecaptcha = async () => {
      try {
        // Remove old verifier if it exists
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (error) {
            console.log("Old reCAPTCHA cleanup:", error);
          }

          window.recaptchaVerifier = null;
        }

        if (!mounted) return;

        const verifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",

            callback: (response) => {
              console.log("✅ reCAPTCHA solved");
            },

            "expired-callback": () => {
              console.log("⚠️ reCAPTCHA expired");
            },
          }
        );

        window.recaptchaVerifier = verifier;

        await verifier.render();

        console.log("✅ reCAPTCHA initialized");
      } catch (error) {
        console.error("❌ reCAPTCHA setup error:", error);
      }
    };

    setupRecaptcha();

    return () => {
      mounted = false;

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (error) {
          console.log("reCAPTCHA cleanup error:", error);
        }

        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // --------------------------------------------------
  // SEND OTP
  // --------------------------------------------------

  const sendOtp = async () => {
    // Ignore re-entrant calls while a send is already in flight.
    if (isSendingRef.current) return;

    // Remove spaces just in case
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert("Enter a valid 10 digit phone number");
      return;
    }

    isSendingRef.current = true;

    try {
      setLoading(true);

      // Make sure reCAPTCHA exists
      if (!window.recaptchaVerifier) {
        alert("reCAPTCHA is not ready. Please refresh the page.");
        return;
      }

      console.log("📱 Sending OTP to:", `+91${cleanPhone}`);

      const result = await signInWithPhoneNumber(
        auth,
        `+91${cleanPhone}`,
        window.recaptchaVerifier
      );

      console.log("✅ OTP session created");
      console.log("Verification ID:", result.verificationId);

      // IMPORTANT:
      // Store Firebase confirmation result in React state
      setConfirmationResult(result);

      setOtp("");
      setStep(2);

      alert("OTP sent successfully");

    } catch (error) {
      console.error("❌ SEND OTP ERROR");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error(error);

      // Reset reCAPTCHA after failed request
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.log(e);
        }

        window.recaptchaVerifier = null;
      }

      // Try to create it again
      try {
        const verifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "normal",

            callback: () => {
              console.log("✅ reCAPTCHA solved");
            },

            "expired-callback": () => {
              console.log("⚠️ reCAPTCHA expired");
            },
          }
        );

        window.recaptchaVerifier = verifier;

        await verifier.render();
      } catch (recaptchaError) {
        console.error(
          "❌ reCAPTCHA recreation error:",
          recaptchaError
        );
      }

      if (error.code === "auth/invalid-phone-number") {
        alert("Invalid phone number.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many attempts. Please try again later.");
      } else if (error.code === "auth/captcha-check-failed") {
        alert("reCAPTCHA failed. Check your Firebase authorized domain.");
      } else if (error.code === "auth/quota-exceeded") {
        alert("Firebase SMS quota exceeded.");
      } else {
        alert(`${error.code}\n${error.message}`);
      }

    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  // --------------------------------------------------
  // VERIFY OTP
  // --------------------------------------------------

  const verifyOtp = async () => {
    const cleanOtp = otp.replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      alert("Enter the 6 digit OTP");
      return;
    }

    if (!confirmationResult) {
      alert("OTP session not found. Please request a new OTP.");
      return;
    }

    try {
      setLoading(true);

      console.log("🔐 Verifying OTP:", cleanOtp);
      console.log(
        "Verification ID:",
        confirmationResult.verificationId
      );

      // ---------------------------------------------
      // STEP 1: FIREBASE OTP VERIFICATION
      // ---------------------------------------------

      const result = await confirmationResult.confirm(cleanOtp);

      console.log("✅ OTP VERIFIED SUCCESSFULLY");
      console.log("Firebase user:", result.user);

      // ---------------------------------------------
      // STEP 2: GET FIREBASE ID TOKEN
      // ---------------------------------------------

      const idToken = await result.user.getIdToken();

      console.log("✅ Firebase ID token received");

      // ---------------------------------------------
      // STEP 3: SEND TOKEN TO MERN BACKEND
      // ---------------------------------------------

      console.log("📡 Sending Firebase token to backend...");

      const response = await api.post(
        "/auth/firebase-login",
        {
          idToken,
        }
      );

      console.log("✅ Backend login successful");
      console.log("Backend response:", response.data);

      // ---------------------------------------------
      // STEP 4: REDIRECT
      // ---------------------------------------------

      navigate(redirect || "/");

    } catch (error) {
      console.error("❌ OTP VERIFY ERROR");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error(error);

      // IMPORTANT:
      // Don't call every error "Invalid OTP".

      // A failed confirm() means this confirmationResult's sessionInfo is
      // done being useful — Firebase's identitytoolkit backend does not
      // treat a verification session as safe to keep retrying against
      // (that's exactly the brute-force path OTP systems are designed to
      // shut down). Clearing it here means the existing "OTP session not
      // found" guard above will correctly stop a second silent attempt
      // instead of the user seeing another confusing
      // auth/invalid-verification-code for a code that may actually be
      // correct.
      const sessionIsDead = [
        "auth/invalid-verification-code",
        "auth/code-expired",
        "auth/invalid-verification-id",
        "auth/too-many-requests",
      ].includes(error.code);

      if (sessionIsDead) {
        setConfirmationResult(null);
      }

      if (error.code === "auth/invalid-verification-code") {
        alert(
          "Incorrect OTP, and this OTP session is now closed. Please request a new OTP and enter it on the first try."
        );
      } else if (error.code === "auth/code-expired") {
        alert(
          "OTP expired. Please request a new OTP."
        );
      } else if (
        error.code === "auth/invalid-verification-id"
      ) {
        alert(
          "OTP session is invalid. Please request a new OTP."
        );
      } else if (error.code === "auth/too-many-requests") {
        alert(
          "Too many attempts on this number. Please wait a while, then request a new OTP."
        );
      } else if (error.code === "auth/captcha-check-failed") {
        alert(
          "reCAPTCHA verification failed. Please refresh the page and try again."
        );
      } else if (error.code === "auth/billing-not-enabled") {
        alert(
          "Phone sign-in isn't available right now. Please contact support."
        );
      } else if (
        error.response &&
        error.response.data
      ) {
        // Backend error
        console.error(
          "Backend error:",
          error.response.data
        );

        alert(
          error.response.data.message ||
          "Backend login failed."
        );
      } else {
        alert(
          `${error.code || "Login failed"}\n${
            error.message || ""
          }`
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CHANGE PHONE
  // --------------------------------------------------

  const changePhone = () => {
    setOtp("");
    setConfirmationResult(null);
    setStep(1);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-100
        dark:bg-slate-900
        px-4
      "
    >
      <div
        className="
          w-full
          max-w-sm
          rounded-2xl
          bg-white
          dark:bg-slate-800
          border
          border-gray-200
          dark:border-slate-700
          shadow-xl
          p-6
        "
      >
        {/* HEADER */}

        <h2
          className="
            text-2xl
            font-bold
            text-center
            text-gray-900
            dark:text-white
            mb-1
          "
        >
          Secure Login
        </h2>

        <p
          className="
            text-center
            text-sm
            text-gray-500
            dark:text-gray-400
            mb-6
          "
        >
          Login using your phone number
        </p>

        {/* ----------------------------------------- */}
        {/* STEP 1 - PHONE */}
        {/* ----------------------------------------- */}

        {step === 1 && (
          <>
            <label
              className="
                block
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
                mb-1
              "
            >
              Phone Number
            </label>

            <div className="flex items-center mb-4">
              <span
                className="
                  px-3
                  py-2
                  rounded-l-xl
                  bg-gray-100
                  dark:bg-slate-700
                  border
                  border-r-0
                  border-gray-300
                  dark:border-slate-600
                  text-gray-700
                  dark:text-gray-200
                "
              >
                +91
              </span>

              <input
                type="tel"
                inputMode="numeric"
                className="
                  w-full
                  px-4
                  py-2
                  rounded-r-xl
                  border
                  border-gray-300
                  dark:border-slate-600
                  bg-white
                  dark:bg-slate-800
                  text-gray-900
                  dark:text-gray-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-green-500
                "
                placeholder="Enter 10 digit number"
                value={phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");

                  // Keep the LAST 10 digits, not the first 10.
                  // `maxLength` on this element caps the RAW characters
                  // before this handler ever sees them, so pasting a
                  // Console-style number like "+91 98765 43210" (or
                  // anything typed with a leading 0) used to get
                  // truncated from the wrong end and silently turned
                  // into a different, wrong number. Removing maxLength
                  // and slicing from the end here fixes that.
                  setPhone(digitsOnly.slice(-10));
                }}
              />
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="
                w-full
                py-3
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

        {/* ----------------------------------------- */}
        {/* STEP 2 - OTP */}
        {/* ----------------------------------------- */}

        {step === 2 && (
          <>
            <p
              className="
                text-center
                text-sm
                text-gray-500
                dark:text-gray-400
                mb-4
              "
            >
              OTP sent to +91 {phone}
            </p>

            <label
              className="
                block
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
                mb-1
              "
            >
              Enter OTP
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="
                w-full
                px-4
                py-2
                rounded-xl
                mb-4
                border
                border-gray-300
                dark:border-slate-600
                bg-white
                dark:bg-slate-800
                text-gray-900
                dark:text-gray-100
                tracking-widest
                text-center
                text-lg
                focus:outline-none
                focus:ring-2
                focus:ring-green-500
              "
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setOtp(value);
              }}
            />

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="
                w-full
                py-3
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
              onClick={changePhone}
              disabled={loading}
              className="
                w-full
                mt-3
                text-sm
                text-gray-500
                dark:text-gray-400
                hover:underline
              "
            >
              Change phone number
            </button>
          </>
        )}

        {/* ----------------------------------------- */}
        {/* RECAPTCHA */}
        {/* ----------------------------------------- */}

        <div
          id="recaptcha-container"
          className="mt-8 flex justify-center"
        ></div>
      </div>
    </div>
  );
}