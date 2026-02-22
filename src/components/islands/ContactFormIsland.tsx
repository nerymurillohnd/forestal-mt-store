import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { COUNTRIES, PRIORITY_COUNTRY_CODES } from "../../data/countries";
import { CONTACT_LIMITS } from "../../lib/contact-limits";

// Turnstile global — loaded via explicit-render script in contact page head
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = "0x4AAAAAACgQlC6ggwNZCxCV";

const DESTINATION_OPTIONS = [
  { label: "Sales / Wholesale Inquiries", value: "sales" },
  { label: "Customer Support", value: "support" },
  { label: "General / Administration", value: "admin" },
] as const;

const LIMITS = CONTACT_LIMITS;

type FormState = "idle" | "submitting" | "success" | "error";

const priorityCountries = COUNTRIES.filter((c) => PRIORITY_COUNTRY_CODES.includes(c.code));
const otherCountries = COUNTRIES.filter((c) => !PRIORITY_COUNTRY_CODES.includes(c.code));

export default function ContactFormIsland() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileScriptFailed, setTurnstileScriptFailed] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry);

  // Render Turnstile widget on mount (explicit rendering for SPA/island)
  useEffect(() => {
    const renderWidget = () => {
      if (!turnstileContainerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
        execution: "render",
      });
    };

    const handleScriptError = () => {
      setTurnstileScriptFailed(true);
      setTurnstileToken("");
      setFormState("error");
      setErrorMessage(
        "Security verification failed to load. Please refresh the page and try again.",
      );
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Lazy-inject the Turnstile script on island mount (client:visible).
      // Loading here instead of <head> prevents the _cfuvid third-party cookie
      // from being set on page load — Lighthouse never sees it.
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="challenges.cloudflare.com/turnstile"]',
      );
      if (existing) {
        existing.addEventListener("load", renderWidget, { once: true });
        existing.addEventListener("error", handleScriptError, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.addEventListener("load", renderWidget, { once: true });
        script.addEventListener("error", handleScriptError, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, []);

  const validatePhone = useCallback((value: string, countryCode: string): boolean => {
    if (!value || !countryCode) return true;
    try {
      const parsed = parsePhoneNumberFromString(value, countryCode as CountryCode);
      return parsed?.isValid() ?? false;
    } catch {
      return false;
    }
  }, []);

  const handleCountryChange = (e: Event) => {
    const code = (e.target as HTMLSelectElement).value;
    setSelectedCountry(code);
    setPhoneValue("");
    setPhoneError("");
  };

  const handlePhoneChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setPhoneValue(value);
    if (phoneError && value) setPhoneError("");
  };

  const handlePhoneBlur = () => {
    if (phoneValue && selectedCountry) {
      const valid = validatePhone(phoneValue, selectedCountry);
      if (!valid) {
        setPhoneError(
          `Enter a valid phone number for ${currentCountry?.name ?? "selected country"}`,
        );
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const phone = data.get("phone") as string;
    const country = data.get("country") as string;

    if (phone && country) {
      const valid = validatePhone(phone, country);
      if (!valid) {
        setPhoneError(
          `Enter a valid phone number for ${currentCountry?.name ?? "selected country"}`,
        );
        return;
      }
    }

    if (turnstileScriptFailed) {
      setFormState("error");
      setErrorMessage(
        "Security verification service is temporarily unavailable. Please refresh and try again.",
      );
      return;
    }

    if (!turnstileToken) {
      setFormState("error");
      setErrorMessage("Security verification not ready. Please wait a moment and try again.");
      return;
    }

    setFormState("submitting");
    setErrorMessage("");

    try {
      const payload = {
        firstName: data.get("firstName"),
        lastName: data.get("lastName"),
        company: data.get("company"),
        email: data.get("email"),
        country: data.get("country"),
        phone: phone ? `${currentCountry?.dialCode} ${phone}` : "",
        subject: data.get("subject"),
        destination: data.get("destination"),
        message: data.get("message"),
        turnstileToken,
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { success: boolean; error?: string };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Submission failed. Please try again.");
      }

      setFormState("success");
    } catch (err) {
      setFormState("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      // Reset widget so user gets a fresh token for retry
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    }
  };

  if (formState === "success") {
    return (
      <div class="mt-12 rounded-[3px] border border-mint bg-white px-8 py-12 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-green/10">
          <svg
            class="h-6 w-6 text-leaf-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width={2}
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="font-[family-name:var(--font-heading)] text-[18px] font-semibold text-graphite">
          Message Sent
        </h3>
        <p class="mt-2 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-graphite/60">
          We have received your message and will respond within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form class="mt-12 space-y-6" onSubmit={handleSubmit} noValidate>
      {/* Name row */}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
          >
            First Name <span class="text-gold-dark">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            maxLength={LIMITS.firstName}
            autocomplete="given-name"
            class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
            placeholder="First name"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
          >
            Last Name <span class="text-gold-dark">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            maxLength={LIMITS.lastName}
            autocomplete="family-name"
            class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label
          htmlFor="company"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
        >
          Company <span class="normal-case tracking-normal text-graphite/40">(optional)</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          maxLength={LIMITS.company}
          autocomplete="organization"
          class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
          placeholder="Company or brand name"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
        >
          Email <span class="text-gold-dark">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          maxLength={LIMITS.email}
          autocomplete="email"
          class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
          placeholder="you@company.com"
        />
      </div>

      {/* Country + Phone row */}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Country */}
        <div>
          <label
            htmlFor="country"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
          >
            Country <span class="text-gold-dark">*</span>
          </label>
          <select
            id="country"
            name="country"
            required
            autocomplete="country"
            value={selectedCountry}
            onChange={handleCountryChange}
            class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
          >
            <option value="" disabled selected>
              Select country
            </option>
            <optgroup label="─────────────────">
              {priorityCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.dialCode})
                </option>
              ))}
            </optgroup>
            <optgroup label="─────────────────">
              {otherCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.dialCode})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
          >
            Phone <span class="text-gold-dark">*</span>
          </label>
          <div class="relative mt-2">
            {currentCountry && (
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-[family-name:var(--font-ui)] text-[14px] text-graphite/50 select-none">
                {currentCountry.dialCode}
              </span>
            )}
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              maxLength={LIMITS.phoneNational}
              autocomplete="tel-national"
              value={phoneValue}
              onInput={handlePhoneChange}
              onBlur={handlePhoneBlur}
              disabled={!selectedCountry}
              class={`w-full rounded-[3px] border bg-white py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:ring-1 ${
                phoneError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  : "border-mint focus:border-leaf-green focus:ring-leaf-green/20"
              } ${currentCountry ? "pl-[4.5rem] pr-4" : "px-4"} ${!selectedCountry ? "cursor-not-allowed opacity-50" : ""}`}
              placeholder={
                currentCountry ? currentCountry.phonePlaceholder : "Select country first"
              }
            />
          </div>
          {phoneError && (
            <p class="mt-1 font-[family-name:var(--font-ui)] text-[12px] text-red-500">
              {phoneError}
            </p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subject"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
        >
          Subject <span class="normal-case tracking-normal text-graphite/40">(optional)</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          maxLength={LIMITS.subject}
          class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
          placeholder="Brief subject line"
        />
      </div>

      {/* Destination */}
      <div>
        <label
          htmlFor="destination"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
        >
          Send To <span class="text-gold-dark">*</span>
        </label>
        <select
          id="destination"
          name="destination"
          required
          class="mt-2 w-full rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
        >
          <option value="" disabled selected>
            Select department
          </option>
          {DESTINATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-graphite"
        >
          Message <span class="text-gold-dark">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={LIMITS.message}
          class="mt-2 w-full resize-y rounded-[3px] border border-mint bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-graphite outline-none transition-colors focus:border-leaf-green focus:ring-1 focus:ring-leaf-green/20"
          placeholder="Describe your inquiry, project, or requirements."
        />
      </div>

      {/* Turnstile widget container (invisible widget — no visual output for legitimate users) */}
      <div ref={turnstileContainerRef} />

      {/* Error message */}
      {formState === "error" && (
        <div class="rounded-[3px] border border-red-200 bg-red-50 px-4 py-3">
          <p class="font-[family-name:var(--font-ui)] text-[13px] text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === "submitting"}
        class="w-full rounded-[3px] bg-leaf-green px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-grass-green hover:shadow-lg hover:shadow-leaf-green/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {formState === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
