export default function WaitlistSection() {
  return (
    <section id="waitlist" className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="text-3xl font-semibold">Waitlist</h2>
      <p className="mt-3 text-white/70">Get early access to the first release.</p>
      <div className="mt-6 flex max-w-md gap-3">
        <input
          className="w-full rounded-xl bg-white/5 px-4 py-3 text-white ring-1 ring-white/10 outline-none"
          placeholder="you@email.com"
        />
        <button className="rounded-xl bg-white px-5 py-3 text-black">
          Join
        </button>
      </div>
    </section>
  )
}