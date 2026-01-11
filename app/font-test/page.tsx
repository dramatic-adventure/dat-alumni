export default function FontTestPage() {
  const countries =
    "Countries: USA · Czechia · Slovakia · Ecuador · Tanzania · Zimbabwe";

  const sampleUpper =
    "UPPERCASE: ÁÀÂÄÃÅ ĀĂĄ ÇĆČ ĎĐ ÉÈÊË ĒĔĖĘĚ ÍÌÎÏ ĪĬĮ ŁŃŇ Ñ ÓÒÔÖÕ Ø ŌŎŐ ŔŘ ŚŠ ŞȘ ŤȚ ÚÙÛÜ ŪŬŮŰŲ ÝŸ ŽŹŻ";

  const sampleLower =
    "lowercase: áàâäãå āăą çćč ďđ éèêë ēĕėęě íìîï īĭį łńň ñ óòôöõ ø ōŏő ŕř śš şș ťț úùûü ūŭůűų ýÿ žźż";

  const places =
    "Places: Čeština, Slovenský, Košice, Žilina, Bratislava, Brno, Český Krumlov, Quito, Galápagos, São Tomé, Łódź, Tanzania, Zimbabwe, Côte d’Ivoire";

  const punctuation =
    "Punctuation: “quotes” ‘apostrophes’ — em dash – en dash … ellipsis • bullets";

  // Extra stress test specifically for Anton (all-caps usage)
  const placesUpper =
    "ALL CAPS PLACES: KOŠICE · ŽILINA · BRATISLAVA · BRNO · ČESKÝ KRUMLOV · QUITO · GALÁPAGOS · SÃO TOMÉ · ŁÓDŹ · TANZANIA · ZIMBABWE · CÔTE D’IVOIRE";

  const sample = `${countries}\n${sampleUpper}\n${sampleLower}\n${places}\n${punctuation}`;

  return (
    <div style={{ padding: 32, display: "grid", gap: 18, whiteSpace: "pre-wrap" }}>
      <div style={{ fontFamily: "var(--font-dm-sans)" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>DM Sans</h1>
        <p style={{ fontSize: 18, lineHeight: 1.5 }}>{sample}</p>
      </div>

      <div style={{ fontFamily: "var(--font-space-grotesk)" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Space Grotesk</h1>
        <p style={{ fontSize: 18, lineHeight: 1.5 }}>{sample}</p>
      </div>

      <div style={{ fontFamily: "var(--font-anton)" }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Anton</h1>
        <p style={{ fontSize: 22, lineHeight: 1.35 }}>{sample}</p>
        <p style={{ fontSize: 24, lineHeight: 1.2, marginTop: 10 }}>
          {placesUpper}
        </p>
      </div>
    </div>
  );
}
