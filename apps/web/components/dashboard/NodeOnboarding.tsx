"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";

import { useTokenGeneration } from "~/hooks/api/tokenGeneration";

type NodeOnboardingProps = {
  onClose: () => void;
};

type OnboardingStep = "intro" | "generating" | "token";

const STORAGE_KEY = "linux-fleet-registration-token";
const EXPIRY_STORAGE_KEY = `${STORAGE_KEY}-expires-at`;
const TOKEN_VALIDITY_MS = 10 * 60 * 1000;

const setupSteps = [
  {
    title: "Clone the fleet agent",
    command: "git clone https://github.com/pratik44-god/fleet-agent.git",
  },
  {
    title: "Enter the agent directory",
    command: "cd fleet-agent",
  },
  {
    title: "Register your node",
    command: "./fleet register",
    note: "When prompted, paste the registration token shown above.",
  },
  {
    title: "Start the agent",
    command: "./fleet start",
  },
  {
    title: "Stop the agent",
    command: "./fleet stop",
  },
  {
    title: "Remove the agent",
    command: "./fleet remove"
  }
];

function getTokenFromResult(result: unknown): string | null {
  if (typeof result === "string") {
    return result;
  }

  if (!result || typeof result !== "object") {
    return null;
  }

  const value = result as Record<string, unknown>;

  if (typeof value.token === "string") {
    return value.token;
  }

  if (typeof value.registrationToken === "string") {
    return value.registrationToken;
  }

  if (typeof value.registration_token === "string") {
    return value.registration_token;
  }

  return null;
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function NodeOnboarding({
  onClose,
}: NodeOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("intro");
  const [registrationToken, setRegistrationToken] = useState<string | null>(
    null,
  );
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const {
    token,
    generateTokenAsync,
    isPending,
  } = useTokenGeneration();

  // Restore a previously generated token when the modal is reopened.
  useEffect(() => {
    const savedToken = sessionStorage.getItem(STORAGE_KEY);
    const savedExpiry = sessionStorage.getItem(EXPIRY_STORAGE_KEY);

    if (!savedToken || !savedExpiry) {
      return;
    }

    const expiry = Number(savedExpiry);

    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(EXPIRY_STORAGE_KEY);
      return;
    }

    setRegistrationToken(savedToken);
    setTokenExpiresAt(expiry);
    setStep("token");
  }, []);

  // Support hooks that expose the generated token through their token state.
  useEffect(() => {
    if (!token) {
      return;
    }

    const expiresAt = Date.now() + TOKEN_VALIDITY_MS;

    setRegistrationToken(token);
    setTokenExpiresAt(expiresAt);
    setGenerationError(null);

    sessionStorage.setItem(STORAGE_KEY, token);
    sessionStorage.setItem(EXPIRY_STORAGE_KEY, String(expiresAt));
    setStep("token");
  }, [token]);

  // Update the visible countdown and clear the token from session storage
  // when its 10-minute validity period has elapsed.
  useEffect(() => {
    if (!tokenExpiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((tokenExpiresAt - Date.now()) / 1000),
      );

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setRegistrationToken(null);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(EXPIRY_STORAGE_KEY);
        setStep("intro");
      }
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [tokenExpiresAt]);

  async function handleGenerateToken() {
    setStep("generating");
    setGenerationError(null);

    try {
      const result: unknown = await generateTokenAsync();
      const generatedToken = getTokenFromResult(result);

      if (generatedToken) {
        const expiresAt = Date.now() + TOKEN_VALIDITY_MS;

        setRegistrationToken(generatedToken);
        setTokenExpiresAt(expiresAt);
        sessionStorage.setItem(STORAGE_KEY, generatedToken);
        sessionStorage.setItem(EXPIRY_STORAGE_KEY, String(expiresAt));
        setStep("token");
      }

      // If the hook updates its `token` state instead of returning it,
      // the token effect above will handle displaying the setup steps.
    } catch (error) {
      console.error("Failed to generate registration token", error);
      setGenerationError("Token generation failed. Please try again.");
      setStep("intro");
    }
  }

  async function handleCopy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy text", error);
    }
  }

  function handleGenerateNewToken() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(EXPIRY_STORAGE_KEY);

    setRegistrationToken(null);
    setTokenExpiresAt(null);
    setRemainingSeconds(null);
    setGenerationError(null);
    setStep("intro");
  }

  const tokenIsExpired =
    remainingSeconds !== null && remainingSeconds <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Plus size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                Add a Linux node
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Connect a machine to your fleet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close onboarding"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {step === "intro" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <ShieldCheck size={20} />
                  <h3 className="font-semibold">
                    Secure node registration
                  </h3>
                </div>

                <p className="text-sm leading-6 text-blue-800 dark:text-blue-200">
                  Generate a temporary registration token, then follow the
                  commands to install and register your Linux fleet agent.
                </p>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-white/70 p-3 text-sm dark:border-blue-900 dark:bg-slate-900/50">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                  />
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    The registration token is valid for 10 minutes only.
                  </p>
                </div>
              </div>

              {generationError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                  {generationError}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateToken}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-950"
              >
                {isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating token...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Generate registration token
                  </>
                )}
              </button>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Loader2 size={28} className="animate-spin" />
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-white">
                Generating registration token
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Please wait while we securely generate your temporary
                registration token.
              </p>
            </div>
          )}

          {step === "token" && registrationToken && !tokenIsExpired && (
            <div className="space-y-6">
              {/* Generated token */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Check size={20} />
                  <h3 className="font-semibold">
                    Registration token generated
                  </h3>
                </div>

                <p className="mb-3 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
                  Copy this token and use it when registering your node.
                </p>

                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-900 dark:bg-slate-900">
                  <code className="min-w-0 flex-1 break-all text-xs text-slate-800 dark:text-slate-200">
                    {registrationToken}
                  </code>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(registrationToken, "token")
                    }
                    className="shrink-0 rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Copy registration token"
                  >
                    {copied === "token" ? (
                      <Check
                        size={16}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-emerald-800 dark:text-emerald-200">
                    Valid for 10 minutes only
                  </span>

                  {remainingSeconds !== null && (
                    <span
                      className={`font-mono font-semibold ${
                        remainingSeconds <= 60
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      Expires in {formatRemainingTime(remainingSeconds)}
                    </span>
                  )}
                </div>
              </div>

              {/* Setup commands */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Terminal
                    size={18}
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Install and register your node
                  </h3>
                </div>

                <div className="space-y-4">
                  {setupSteps.map((item, index) => (
                    <div key={item.title} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          {item.title}
                        </p>

                        <div className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5">
                          <code className="min-w-0 flex-1 break-all text-xs text-slate-100">
                            {item.command}
                          </code>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(item.command, `command-${index}`)
                            }
                            className="shrink-0 rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={`Copy ${item.title} command`}
                          >
                            {copied === `command-${index}` ? (
                              <Check
                                size={15}
                                className="text-emerald-400"
                              />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>

                        {item.note && (
                          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleGenerateNewToken}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <RefreshCw size={16} />
                  Generate new token
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}