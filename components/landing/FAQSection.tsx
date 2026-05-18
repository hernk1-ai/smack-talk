const faqs = [
  {
    question: "What is LOCKT?",
    answer: "A sports reputation platform where locked takes become receipts and your talk becomes your REP.",
  },
  {
    question: "Is this about money?",
    answer: "No. LOCKT is about REP, rivalry, receipts, and bragging rights. Rep has no cash value.",
  },
  {
    question: "What is The First Lock?",
    answer: "The founding launch era where early talkers reserve their place before the Crowd gets loud.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/10 py-12 sm:py-16">
      <div className="landing-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">FAQ</p>
          <h2 className="sports-display mt-3 text-4xl leading-none sm:text-6xl">Before the whistle.</h2>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-3xl border border-white/10 bg-black/35 p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">{faq.question}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-400">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
