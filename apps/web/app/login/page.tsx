"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import {
  useIsUserLoggedIn,
  useLogin,
} from "~/hooks/api/auth";

export default function LoginPage() {
  const { isUserLoggedIn } = useIsUserLoggedIn();
  const { getGoogleAuthUrlAsync, isError, error } = useLogin();

  useEffect(() => {
    if (isUserLoggedIn) {
      window.location.replace("/dashboard");
    }
  }, [isUserLoggedIn]);

  async function handleGoogleLogin() {
    try {
      const result: any = await getGoogleAuthUrlAsync();

      const url =
        typeof result === "string"
          ? result
          : result?.url ??
            result?.authUrl ??
            result?.redirectUrl;

      if (url) {
        window.location.assign(url);
      }
    } catch {
      // The existing error message is displayed through the login hook.
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="auth-card">
        <Link href="/" className="brand-lockup auth-brand">
          <span className="brand-symbol">
            <Activity size={20} />
          </span>

          <span>
            linux<span className="brand-accent">fleet</span>
          </span>
        </Link>

        <div className="auth-icon">
          <ShieldCheck size={24} />
        </div>

        <div className="eyebrow">
          WELCOME TO YOUR CONTROL ROOM
        </div>

        <h1>Sign in to your fleet.</h1>

        <p className="auth-description">
          Access your nodes, inspect machine health and keep your Linux
          infrastructure in view.
        </p>

        <button
          type="button"
          className="button button-google"
          onClick={handleGoogleLogin}
        >
          <GoogleMark />
          <span>Continue with Google</span>
          <ArrowRight size={16} className="google-button-arrow" />
        </button>

        {isError && (
          <p className="form-error">
            {error?.message ||
              "Unable to start Google sign-in. Please try again."}
          </p>
        )}

        <div className="auth-assurance">
          <ShieldCheck size={15} />
          Secure authentication · Your fleet stays private
        </div>

        <div className="auth-divider">
          <span />
        </div>

        <p className="auth-footnote">
          New to Linux Fleet?{" "}
          <Link href="/">Explore the platform</Link>
        </p>
      </div>

      <div className="auth-bottom">
        LINUX FLEET <span>·</span> INFRASTRUCTURE VISIBILITY
      </div>

      <style jsx>{`
        .button-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          cursor: pointer;

          transition:
            transform 180ms ease,
            background-color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .button-google:hover {
          transform: translateY(-2px);
          background-color: #f1f1f1;
          border-color: #c9c9c9;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        }

        .button-google:active {
          transform: translateY(0) scale(0.97);
          background-color: #dedede;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .button-google:focus-visible {
          outline: 3px solid rgba(169, 133, 79, 0.65);
          outline-offset: 3px;
        }

        .google-button-arrow {
          margin-left: auto;
          transition: transform 180ms ease;
        }

        .button-google:hover .google-button-arrow {
          transform: translateX(4px);
        }

        @media (prefers-reduced-motion: reduce) {
          .button-google,
          .google-button-arrow {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15Z"
      />

      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"
      />

      <path
        fill="#4A90E2"
        d="M12.8 27.7a12 12 0 0 1 0-7.4v-5.2H5.9a20 20 0 0 0 0 17.8l6.9-5.2Z"
      />

      <path
        fill="#EA4335"
        d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6 29.5 4 24 4A20 20 0 0 0 5.9 15.1l6.9 5.2c1.6-4.7 6-8.2 11.2-8.2Z"
      />
    </svg>
  );
}