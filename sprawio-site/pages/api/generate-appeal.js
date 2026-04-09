// pages/api/generate-appeal.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    full_name,
    address,
    email,
    insurer,
    case_number,
    decision_date,
    payout_amount,
    expected_amount,
    issues,
    other_description,
  } = req.body;

  /* ── walidacja podstawowa ── */
  if (!full_name || !insurer || !case_number || !decision_date || !payout_amount || !expected_amount) {
    return res.status(400).json({ error: 'Brakuje wymaganych pól.' });
  }

  /* ── mapowanie checkboxów na czytelne etykiety ── */
  const issueLabels = {
    undervalued: 'zaniżony kosztorys naprawy',
    missing:     'pominięte elementy szkody',
    labor:       'zaniżone roboczogodziny',
    refused:     'odmowa wypłaty odszkodowania',
    other:       other_description || 'inne zastrzeżenia',
  };

  const issuesList = (issues || [])
    .map((i) => `• ${issueLabels[i] || i}`)
    .join('\n');

  const diff = Math.round(Number(expected_amount) - Number(payout_amount));
  const diffFormatted = diff.toLocaleString('pl-PL');

  /* ── prompt ── */
  const systemPrompt = `Jesteś ekspertem prawnym specjalizującym się w polskim prawie ubezpieczeniowym i odwołaniach od decyzji ubezpieczycieli OC. Piszesz profesjonalne, skuteczne pisma odwoławcze po polsku. Styl: formalny, rzeczowy, konkretny. Bez zbędnych ozdobników. Pismo ma być gotowe do wysłania.`;

  const userPrompt = `Napisz odwołanie od decyzji ubezpieczyciela na podstawie poniższych danych.

DANE SPRAWY:
- Imię i nazwisko: ${full_name}
- Adres: ${address}
- Ubezpieczyciel: ${insurer}
- Numer szkody/sprawy: ${case_number}
- Data decyzji ubezpieczyciela: ${decision_date}
- Kwota wypłacona przez ubezpieczyciela: ${Number(payout_amount).toLocaleString('pl-PL')} zł
- Kwota oczekiwana: ${Number(expected_amount).toLocaleString('pl-PL')} zł
- Różnica: ${diffFormatted} zł

ZASTRZEŻENIA DO DECYZJI:
${issuesList}

WYMAGANIA DOTYCZĄCE PISMA:
1. Zacznij od miejscowości i daty (użyj aktualnej daty)
2. Dane nadawcy (imię, nazwisko, adres) — lewy górny róg
3. Adresat: ${insurer}, Dział Likwidacji Szkód
4. Temat: Odwołanie od decyzji w sprawie nr ${case_number}
5. Treść powinna zawierać:
   - formalne powołanie się na decyzję z dnia ${decision_date}
   - konkretne zarzuty odpowiadające zastrzeżeniom
   - żądanie ponownego rozpatrzenia i wypłaty kwoty ${Number(expected_amount).toLocaleString('pl-PL')} zł
   - powołanie się na art. 8 i art. 16 ustawy z dnia 22 maja 2003 r. o działalności ubezpieczeniowej oraz przepisy Kodeksu cywilnego dotyczące odpowiedzialności odszkodowawczej
6. Zakończ grzecznym, stanowczym wezwaniem do działania w terminie 30 dni
7. Miejsce na podpis

Zwróć WYŁĄCZNIE treść pisma — bez komentarzy, bez wyjaśnień, bez markdown.`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o',
        temperature: 0.3,
        max_tokens:  2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}));
      console.error('OpenAI error:', err);
      return res.status(502).json({ error: 'Błąd połączenia z OpenAI. Spróbuj ponownie.' });
    }

    const data   = await openaiRes.json();
    const appeal = data.choices?.[0]?.message?.content?.trim();

    if (!appeal) {
      return res.status(502).json({ error: 'OpenAI zwróciło pustą odpowiedź.' });
    }

    return res.status(200).json({
      appeal,
      meta: {
        full_name,
        insurer,
        case_number,
        decision_date,
        payout_amount: Number(payout_amount),
        expected_amount: Number(expected_amount),
        diff,
      },
    });

  } catch (err) {
    console.error('generate-appeal error:', err);
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera. Spróbuj ponownie.' });
  }
}
