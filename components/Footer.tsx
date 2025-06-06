import {
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaEnvelope,
} from "react-icons/fa";

export default function Footer() {
  return (
   <footer className="relative z-10 bg-[#241123] pt-16 md:pt-24 pb-10 px-6">
  <div className="max-w-7xl mx-auto flex flex-col">

    {/* Headline */}
    <div className="w-full flex justify-end">
      <h2
        className="font-gloucester text-[#F23359] font-[400] text-[16.12vw] md:text-[12rem] tracking-[0.01em] leading-[0.85] text-right"
        style={{
          marginTop: '8vh',         // Top margin control
          marginRight: '5.9rem',
          marginBottom: '4vh',    // Right margin control
        }}
      >
        Ready to act?
      </h2>
    </div>

      {/* CTA Buttons */}
<div
  className="flex flex-col items-end"
  style={{
    marginTop: "0rem",         // 🟡 Top margin of the whole block
    marginBottom: "3rem",      // 🟡 Bottom margin of the whole block
    paddingRight: "5.9rem",    // 🟡 Aligns with headline on right
  }}
>
  <div
    className="w-[64vw] sm:w-[25.8rem] max-w-full"  // ✅ Mobile-first responsive width
  >
    <a
      href="/get-involved"
      className="block text-center transition hover:opacity-80 uppercase tracking-[0.22em]"
      style={{
        backgroundColor: "#2493A9",                // 🎨 Background color
        color: "#241123",                          // 🎨 Text color
        fontFamily: "'Space Grotesk', sans-serif", // 🔤 Font family override
        fontWeight: "200",                         // 🔡 Font weight
        fontSize: "1rem",                          // 🔡 FONT SIZE
        paddingTop: "0.2rem",                      // 🧩 Padding (top)
        paddingBottom: "0.2rem",                   // 🧩 Padding (bottom)
        paddingLeft: "2.5rem",                     // 🧩 Padding (left)
        paddingRight: "2.5rem",                    // 🧩 Padding (right)
        borderRadius: "0.375rem",                  // 🟠 Border radius
        marginBottom: "0.75rem",                   // 🔃 Space between buttons
        textDecoration: "none",                    // 🚫 No underline
      }}
    >
      Get Involved
    </a>

    <a
      href="/donate"
      className="block text-center transition hover:opacity-80 uppercase tracking-[0.22em]"
      style={{
        backgroundColor: "#2493A9",
        color: "#241123",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: "200",
        fontSize: "1rem",
        paddingTop: "0.2rem",
        paddingBottom: "0.2rem",
        paddingLeft: "2.5rem",
        paddingRight: "2.5rem",
        borderRadius: "0.375rem",
        textDecoration: "none",
      }}
    >
      Donate
    </a>
  </div>
</div>

        {/* Social Icons */}
<div
  className="flex items-center justify-center"
  style={{
    gap: "1rem",     // 🔵 Spacing between icons
    marginBottom: "0.5rem" // 🔵 Space above icon row
  }}
>
  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
    <FaFacebook size={25} color="white" style={{ display: "block" }} />
  </a>
  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
    <FaInstagram size={25} color="white" style={{ display: "block" }} />
  </a>
  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
    <FaTwitter size={25} color="white" style={{ display: "block" }} />
  </a>
  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
    <FaYoutube size={25} color="white" style={{ display: "block" }} />
  </a>
  <a href="mailto:info@yourdomain.com">
    <FaEnvelope size={25} color="white" style={{ display: "block" }} />
  </a>
</div>

        {/* EIN / Legal Text */}
        <p
  className="text-center font-grotesk"
  style={{
    fontFamily: "'DM Sans', sans-serif", // 🅰️ Font control (adjust as needed)
    color: "#A7A9BE",        // 🎨 Font color (white)
    fontSize: "0.88rem",     // 🔡 Font size (12px = text-xs)
    marginBottom: "2rem",    // ⬇️ Bottom margin
  }}
>
  Dramatic Adventure Theatre is a 501(c)(3) nonprofit organization,&nbsp;
  <a
    href="https://www.guidestar.org/profile/9883629#"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "#F23359",       // 💖 DAT Pink (EIN link color)
      textDecoration: "underline", // Optional underline
    }}
  >
    EIN 80-0178507
  </a>
  . Donations are tax-deductible.
</p>


      </div>
    </footer>
  );
}
