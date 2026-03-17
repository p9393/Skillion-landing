"use client";

import { useTranslation } from "../i18n/LanguageContext";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-5xl font-semibold leading-tight">
        {t("hero.title1")} <span className="text-white/70">{t("hero.title2")}</span>.
      </h1>
      <p className="mt-6 max-w-2xl text-white/70">
        {t("hero.description")}
      </p>
      <p className="mt-2 text-sm text-white/40">
        {t("hero.subtext")}
      </p>

      <div className="mt-8 flex gap-3">
        <a className="rounded-xl bg-white px-5 py-3 text-black font-semibold" href="#waitlist">
          {t("hero.cta_primary")}
        </a>
        <a className="rounded-xl bg-white/10 px-5 py-3 ring-1 ring-white/15" href="#system">
          {t("hero.cta_secondary")}
        </a>
      </div>
    </section>
  )
}