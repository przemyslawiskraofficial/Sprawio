# Sprawio — uruchomienie flow

## Struktura projektu

```
sprawio/
├── pages/
│   └── api/
│       └── generate-appeal.js   ← endpoint OpenAI
├── public/
│   ├── index.html
│   ├── ocena.html
│   ├── wynik.html
│   ├── formularz.html           ← zaktualizowany
│   ├── generowanie.html         ← zaktualizowany (woła API)
│   ├── gotowe.html              ← NOWY (pokazuje odwołanie)
│   ├── dziekujemy.html
│   └── favicon.png
├── .env.local                   ← klucz OpenAI (NIE commituj!)
├── next.config.js
└── package.json
```

## Kroki

### 1. Sklonuj / skopiuj pliki

Skopiuj `pages/` i `public/` do swojego katalogu projektu.
Wszystkie pliki `.html` wrzuć do `public/`.

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Dodaj klucz OpenAI

Otwórz `.env.local` i wstaw swój klucz:

```
OPENAI_API_KEY=sk-...twój_klucz...
```

Klucz znajdziesz na: https://platform.openai.com/api-keys

### 4. Uruchom lokalnie

```bash
npm run dev
```

Otwórz: http://localhost:3000/formularz.html

### 5. Flow działa tak

```
/formularz.html
  └─ submit → sessionStorage → redirect
/generowanie.html
  └─ fetch /api/generate-appeal (z danymi z sessionStorage)
  └─ po odpowiedzi → sessionStorage → redirect
/gotowe.html
  └─ odczyt z sessionStorage → wyświetla odwołanie
```

### 6. Deploy (Vercel — zalecany)

```bash
npx vercel
```

Dodaj zmienną środowiskową w panelu Vercel:
- Klucz: `OPENAI_API_KEY`
- Wartość: `sk-...`

### Uwagi

- `sessionStorage` działa w obrębie jednej karty przeglądarki
- Klucz OpenAI nigdy nie trafia do frontendu — jest tylko w API route
- Endpoint używa modelu `gpt-4o` — możesz zmienić na `gpt-4o-mini` (tańszy)
