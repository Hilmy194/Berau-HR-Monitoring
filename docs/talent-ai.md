# Talent AI Decision Support

## Arsitektur

Fitur AI Talent memakai alur backend:

PostgreSQL/Prisma -> perhitungan deterministik -> sanitized context -> provider AI -> validasi output -> simpan hasil -> review HR.

AI tidak dipanggil dari browser secara langsung. Browser hanya menekan tombol `Generate AI Insight`, lalu endpoint admin memvalidasi sesi HR melalui `assertAdmin`.

## Perhitungan Deterministik

Position Qualification dipakai sebagai daftar competency yang relevan untuk suatu posisi dan bobot prioritasnya:

`priority_weight = position_competency_requirements.required_level`

Catatan: nama kolom database masih `required_level` karena mengikuti migration existing, tetapi nilai dari file Position Qualification berarti prioritas kebutuhan competency untuk posisi. Skor `5` adalah paling kritikal, skor `1` adalah prioritas paling rendah.

Person Qualification nantinya dipakai sebagai nilai kompetensi aktual orang. Skill gap dihitung setelah actual level numerik tersedia:

`gap = max(target_or_expected_level - effective_employee_level, 0)`

Pada read model saat ini, level skill employee belum menyimpan validated level numerik lengkap. Karena itu `effective_employee_level` memakai:

- match pada `currentSkills`: estimasi kompetensi tersedia;
- match pada `strength`: estimasi kompetensi kuat;
- tidak ada skill: level 0.

Jika tabel operasional `talent_employee_skills.validated_level` sudah dihubungkan ke UI, precedence validated level harus dipakai terlebih dahulu.

Readiness score:

`skillScore 55% + promotionStatusSignal 25% + talentClass 20%`

Candidate ranking Mobility/Successor tetap memakai scoring existing `rankTalentCandidates`. Bobot kandidat baru dipusatkan di `TALENT_AI.rankingWeights`: skill match 45%, mandatory coverage 20%, relevant experience 15%, performance 10%, potential/readiness 10%.

## Data Yang Dikirim

Context AI hanya berisi identifier anonim, posisi saat ini, target position, department/division/directorate, career history terbatas, skill, strength/weakness, development program, deterministic score, skill gap, dan candidate ranking yang sudah dibatasi.

## Data Yang Diblokir

Context tidak menyertakan NIK, employee number asli, email, nomor telepon, alamat, tanggal lahir lengkap, gender, agama, status pernikahan, payroll, rekening, data keluarga, MCU, diagnosis, restriction detail, medical status, atau detail HSECT medical.

Certification dapat dipakai hanya jika muncul sebagai development program/requirement skill. MCU tidak dipakai untuk promosi, mobility, atau successor.

## Guardrail

- Authentication dan role HR admin.
- Feature flag `AI_FEATURE_ENABLED`.
- Candidate limit `AI_MAX_CANDIDATES`.
- Input size limit `AI_MAX_INPUT_SIZE`.
- Timeout `AI_REQUEST_TIMEOUT`.
- Duplicate request protection melalui hash context.
- Prompt injection protection: semua teks database dianggap data.
- Output divalidasi dengan Zod.
- Human review wajib.
- AI tidak mengubah promotion status, mobility, successor, employee master, atau validated skill.
- Audit trail dicatat ke `AuditLog`.

## Provider

Mock provider aktif secara default:

```env
AI_PROVIDER="mock"
```

Gemini provider:

```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="isi-api-key-dari-google-ai-studio"
GEMINI_MODEL="gemini-3.6-flash"
```

OpenAI provider:

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
OPENAI_REASONING_EFFORT="minimal"
AI_REQUEST_TIMEOUT="120000"
AI_MAX_OUTPUT_TOKENS="4000"
```

API key hanya dibaca server-side dan tidak boleh memakai prefix `NEXT_PUBLIC_`. Jika provider dipilih tetapi API key masih kosong, sistem otomatis memakai mock provider agar halaman tetap bisa dites lokal.
Untuk request Mobility dan Current Gap yang membawa context karyawan/posisi cukup besar, timeout lokal disarankan minimal 120 detik. Jika request timeout, dashboard provider bisa tetap mencatat API key sebagai `last used`, tetapi biaya dapat tetap 0 bila response tidak selesai atau penggunaan masih sangat kecil/ter-rounding.

## Penyimpanan

Hasil disimpan di tabel `talent_ai_analyses` dengan status review:

- `PENDING`
- `APPROVED_AS_REFERENCE`
- `REJECTED`
- `NEEDS_REVISION`

Approval hanya berarti hasil dapat digunakan sebagai referensi HR.

## Cara Testing

Jalankan:

```bash
npm run typecheck
npm run build
npm run db:test
```

Untuk local tanpa OpenAI, gunakan mock provider. Tombol AI di Promotion, Mobility, dan Current Gap akan tetap menghasilkan insight berbasis perhitungan deterministik.

## Limitasi

Read model Talent saat ini masih mengandalkan `Profile.talentData` untuk UI utama, sementara tabel operasional talent sudah tersedia melalui migration SQL. Integrasi produksi berikutnya sebaiknya menghubungkan halaman langsung ke tabel `employee_profiles`, `organization_positions`, `talent_position_skill_requirements`, dan `talent_employee_skills` agar validated skill precedence benar-benar berasal dari schema operasional.
