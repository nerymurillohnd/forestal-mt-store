import { useState, useCallback } from "preact/hooks";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { COUNTRIES, PRIORITY_COUNTRY_CODES } from "../../data/countries";

const DESTINATION_OPTIONS = [
  { label: "Sales / Wholesale Inquiries", value: "sales" },
  { label: "Customer Support", value: "support" },
  { label: "General / Administration", value: "admin" },
] as const;

type FormState = "idle" | "submitting" | "success" | "error";

const priorityCountries = COUNTRIES.filter((c) => PRIORITY_COUNTRY_CODES.includes(c.code));
const otherCountries = COUNTRIES.filter((c) => !PRIORITY_COUNTRY_CODES.includes(c.code));

export default function ContactFormIsland() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry);

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
    }
  };

  if (formState === "success") {
    return (
      <div class="mt-12 rounded-[3px] border border-[#D6E8D3] bg-white px-8 py-12 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#206D03]/10">
          <svg
            class="h-6 w-6 text-[#206D03]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width={2}
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="font-[family-name:var(--font-heading)] text-[18px] font-semibold text-[#333]">
          Message Sent
        </h3>
        <p class="mt-2 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[#333]/60">
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
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
          >
            First Name <span class="text-[#A18500]">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            autocomplete="given-name"
            class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
            placeholder="First name"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
          >
            Last Name <span class="text-[#A18500]">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            autocomplete="family-name"
            class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Company */}
      <div>
        <label
          htmlFor="company"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
        >
          Company <span class="normal-case tracking-normal text-[#333]/40">(optional)</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          autocomplete="organization"
          class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
          placeholder="Company or brand name"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
        >
          Email <span class="text-[#A18500]">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autocomplete="email"
          class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
          placeholder="you@company.com"
        />
      </div>

      {/* Country + Phone row */}
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Country */}
        <div>
          <label
            htmlFor="country"
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
          >
            Country <span class="text-[#A18500]">*</span>
          </label>
          <select
            id="country"
            name="country"
            required
            value={selectedCountry}
            onChange={handleCountryChange}
            class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
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
            class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
          >
            Phone <span class="text-[#A18500]">*</span>
          </label>
          <div class="relative mt-2">
            {currentCountry && (
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-[family-name:var(--font-ui)] text-[14px] text-[#333]/50 select-none">
                {currentCountry.dialCode}
              </span>
            )}
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              autocomplete="tel-national"
              value={phoneValue}
              onInput={handlePhoneChange}
              onBlur={handlePhoneBlur}
              disabled={!selectedCountry}
              class={`w-full rounded-[3px] border bg-white py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:ring-1 ${
                phoneError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  : "border-[#D6E8D3] focus:border-[#206D03] focus:ring-[#206D03]/20"
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
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
        >
          Subject <span class="normal-case tracking-normal text-[#333]/40">(optional)</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
          placeholder="Brief subject line"
        />
      </div>

      {/* Destination */}
      <div>
        <label
          htmlFor="destination"
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
        >
          Send To <span class="text-[#A18500]">*</span>
        </label>
        <select
          id="destination"
          name="destination"
          required
          class="mt-2 w-full rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
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
          class="block font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#333]"
        >
          Message <span class="text-[#A18500]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          class="mt-2 w-full resize-y rounded-[3px] border border-[#D6E8D3] bg-white px-4 py-3 font-[family-name:var(--font-ui)] text-[14px] text-[#333] outline-none transition-colors focus:border-[#206D03] focus:ring-1 focus:ring-[#206D03]/20"
          placeholder="Describe your inquiry, project, or requirements."
        />
      </div>

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
        class="w-full rounded-[3px] bg-[#206D03] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold tracking-wide text-white transition-all duration-300 hover:bg-[#54B006] hover:shadow-lg hover:shadow-[#206D03]/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {formState === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
