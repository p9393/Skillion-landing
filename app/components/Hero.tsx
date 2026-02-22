export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-5xl font-semibold leading-tight">
        The future of <span className="text-white/70">gamified finance</span>.
      </h1>
      <p className="mt-6 max-w-2xl text-white/70">
        Turn performance into progression. A meritocratic system where learning,
        execution, and discipline are rewarded — powered by Aurion.
      </p>

      <div className="mt-8 flex gap-3">
        <a className="rounded-xl bg-white px-5 py-3 text-black" href="#waitlist">
          Join the Waitlist
        </a>
        <a className="rounded-xl bg-white/10 px-5 py-3 ring-1 ring-white/15" href="#vision">
          Explore the vision
        </a>
      </div>
    </section>
  )
}