const faqs = [
  {
    question: "What is Smack Talk?",
    answer: "A live sports culture platform where takes get locked, judged by the scoreboard, and turned into receipts.",
  },
  {
    question: "Is this about money?",
    answer: "No. Smack Talk is about reputation, rivalry, receipts, and bragging rights.",
  },
  {
    question: "What is Season Zero?",
    answer: "The first wave of competitors who get early access, username priority, and launch perks.",
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
