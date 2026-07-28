ALTER TABLE "ProbationTask" ADD COLUMN "picName" TEXT;
ALTER TABLE "ProbationTask" ADD COLUMN "picEmail" TEXT;
ALTER TABLE "ProbationTask" ADD COLUMN "picScope" TEXT;

UPDATE "ProbationTask"
SET "picName" = 'PIC IT Asset',
    "picEmail" = 'it.asset@berau.co.id',
    "picScope" = 'Laptop dan perangkat kerja'
WHERE lower(coalesce("title", '') || ' ' || coalesce("description", '')) ~ 'laptop|asset|perangkat|device';

UPDATE "ProbationTask"
SET "picName" = 'PIC IT Access',
    "picEmail" = 'it.access@berau.co.id',
    "picScope" = 'Email, akun aplikasi, dan akses sistem'
WHERE lower(coalesce("title", '') || ' ' || coalesce("description", '')) ~ 'email|akun|account|akses|access|sap|oracle|hris';

UPDATE "ProbationTask"
SET "picName" = 'PIC GA Onboarding',
    "picEmail" = 'ga.onboarding@berau.co.id',
    "picScope" = 'Fasilitas kerja dan onboarding fisik'
WHERE lower(coalesce("title", '') || ' ' || coalesce("description", '')) ~ 'id card|kartu identitas|akses gedung|seragam|welcome kit|meja';

UPDATE "ProbationTask"
SET "picName" = 'PIC HSE Induction',
    "picEmail" = 'hse.induction@berau.co.id',
    "picScope" = 'Safety induction dan compliance awal'
WHERE lower(coalesce("title", '') || ' ' || coalesce("description", '')) ~ 'safety|induction';
