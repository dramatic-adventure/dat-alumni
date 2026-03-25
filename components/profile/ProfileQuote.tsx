export default function ProfileQuote({
  quote,
  quoteAuthor,
}: {
  quote?: string;
  quoteAuthor?: string;
}) {
  if (!quote) return null;
  return (
    <blockquote className="border-l-4 border-pink-500 pl-4 italic my-4">
      “{quote}”
      {quoteAuthor && <footer className="mt-2 text-sm">— {quoteAuthor}</footer>}
    </blockquote>
  );
}
