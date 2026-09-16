import { prisma } from "@/lib/prisma";
import type { TalentDevelopmentCandidate, TalentTrack } from "./talent-development.service";

type RawEmployee = {
  personnel_number: string;
  global_personnel_number: string | null;
  employee_name: string | null;
  office_email: string | null;
  date_of_birth: Date | null;
  hiring_date: Date | null;
  join_date: Date | null;
  employee_group: string | null;
  work_contract: string | null;
  personnel_area: string | null;
  ps_level: string | null;
  position_name: string | null;
  direktorat: string | null;
  divisi: string | null;
  department: string | null;
  supervisor_name: string | null;
  faculty: string | null;
  major: string | null;
  talent_year: number | null;
  start_date_in_current_position: Date | null;
  last_rotation_date: Date | null;
  last_promotion_date: Date | null;
  performance_category: string | null;
  potential_grow_category: string | null;
  talent_class_9_box: string | null;
  talent_class_12_box: string | null;
  talent_calibration_now: string | null;
  current_roles: string | null;
  xdp_history: string | null;
  pat_2025: string | null;
  pat_2024: string | null;
  pat_2023: string | null;
  pat_2022: string | null;
  certification: string | null;
  training: string | null;
  comments_360: string | null;
  strength_360: string | null;
  weakness_360: string | null;
  aspiration: string | null;
  project_involvement: string | null;
  project_impact: string | null;
  project_contribution: string | null;
  bu_visibility: string | null;
  technical_competencies: string | null;
  soft_competencies: string | null;
  career_within_organization: string | null;
  career_outside_organization: string | null;
  development_programs: string[] | null;
  iq_score: number | string | null;
  iq_category: string | null;
  disc: string | null;
  disc_category: string | null;
  matchup_result: string | number | null;
  hsect_sid: string | null;
  mcu_status: string | null;
  mcu_description: string | null;
  simper_status: string | null;
  simper_summary: string | null;
};

/**
 * Reads the BigQuery landing zone directly.  The source rows remain in
 * bq_raw with their original BQ names; this adapter only shapes them for the
 * existing UI contract and does not invent values that BQ does not provide.
 */
export async function listBigQueryEmployees(personnelNumber?: string): Promise<TalentDevelopmentCandidate[]> {
  const rows = await prisma.$queryRaw<RawEmployee[]>`
    WITH current_employee AS (
      SELECT btrim(personnel_number) AS personnel_number,
        (array_agg(global_personnel_number ORDER BY data_period DESC NULLS LAST)
          FILTER (WHERE NULLIF(btrim(global_personnel_number), '') IS NOT NULL))[1] AS global_personnel_number,
        (array_agg(employee_name ORDER BY data_period DESC NULLS LAST)
          FILTER (WHERE NULLIF(btrim(employee_name), '') IS NOT NULL))[1] AS employee_name,
        (array_agg(office_email ORDER BY data_period DESC NULLS LAST)
          FILTER (WHERE NULLIF(btrim(office_email), '') IS NOT NULL))[1] AS office_email,
        (array_agg(date_of_birth ORDER BY data_period DESC NULLS LAST) FILTER (WHERE date_of_birth IS NOT NULL))[1] AS date_of_birth,
        (array_agg(hiring_date ORDER BY data_period DESC NULLS LAST) FILTER (WHERE hiring_date IS NOT NULL))[1] AS hiring_date,
        (array_agg(join_date ORDER BY data_period DESC NULLS LAST) FILTER (WHERE join_date IS NOT NULL))[1] AS join_date,
        (array_agg(employee_group ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(employee_group), '') IS NOT NULL))[1] AS employee_group,
        (array_agg(work_contract ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(work_contract), '') IS NOT NULL))[1] AS work_contract,
        (array_agg(personnel_area ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(personnel_area), '') IS NOT NULL))[1] AS personnel_area,
        (array_agg(ps_level ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(ps_level), '') IS NOT NULL))[1] AS ps_level,
        (array_agg(position_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(position_name), '') IS NOT NULL))[1] AS position_name,
        (array_agg(direktorat ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(direktorat), '') IS NOT NULL))[1] AS direktorat,
        (array_agg(divisi ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(divisi), '') IS NOT NULL))[1] AS divisi,
        (array_agg(department ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(department), '') IS NOT NULL))[1] AS department,
        (array_agg(supervisor_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(supervisor_name), '') IS NOT NULL))[1] AS supervisor_name,
        (array_agg(faculty ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(faculty), '') IS NOT NULL))[1] AS faculty,
        (array_agg(major ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(major), '') IS NOT NULL))[1] AS major
      FROM bq_raw.p_emps
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
        AND (${personnelNumber ?? null}::text IS NULL OR btrim(personnel_number) = ${personnelNumber ?? null})
      GROUP BY btrim(personnel_number)
    ),
    current_talent AS (
      SELECT btrim(personnel_number) AS personnel_number, MAX(talent_year) AS talent_year,
        (array_agg(start_date_in_current_position ORDER BY talent_year DESC NULLS LAST)
          FILTER (WHERE start_date_in_current_position > DATE '1900-12-31'))[1] AS start_date_in_current_position,
        (array_agg(last_rotation_date ORDER BY talent_year DESC NULLS LAST)
          FILTER (WHERE last_rotation_date > DATE '1900-12-31'))[1] AS last_rotation_date,
        (array_agg(last_promotion_date ORDER BY talent_year DESC NULLS LAST)
          FILTER (WHERE last_promotion_date > DATE '1900-12-31'))[1] AS last_promotion_date,
        (array_agg(performance_category ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(performance_category), '') IS NOT NULL AND btrim(performance_category) <> '-'))[1] AS performance_category,
        (array_agg(potential_grow_category ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(potential_grow_category), '') IS NOT NULL AND btrim(potential_grow_category) <> '-'))[1] AS potential_grow_category,
        (array_agg(talent_class_9_box ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(talent_class_9_box), '') IS NOT NULL AND btrim(talent_class_9_box) <> '-'))[1] AS talent_class_9_box,
        (array_agg(talent_class_12_box ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(talent_class_12_box), '') IS NOT NULL AND btrim(talent_class_12_box) <> '-'))[1] AS talent_class_12_box,
        (array_agg(talent_calibration_now ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(talent_calibration_now), '') IS NOT NULL AND btrim(talent_calibration_now) <> '-'))[1] AS talent_calibration_now,
        (array_agg(current_roles ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(current_roles), '') IS NOT NULL AND btrim(current_roles) <> '-'))[1] AS current_roles,
        (array_agg(xdp_history ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(xdp_history), '') IS NOT NULL AND btrim(xdp_history) <> '-'))[1] AS xdp_history,
        (array_agg(pat_2025 ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(pat_2025), '') IS NOT NULL AND btrim(pat_2025) <> '-'))[1] AS pat_2025,
        (array_agg(pat_2024 ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(pat_2024), '') IS NOT NULL AND btrim(pat_2024) <> '-'))[1] AS pat_2024,
        (array_agg(pat_2023 ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(pat_2023), '') IS NOT NULL AND btrim(pat_2023) <> '-'))[1] AS pat_2023,
        (array_agg(pat_2022 ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(pat_2022), '') IS NOT NULL AND btrim(pat_2022) <> '-'))[1] AS pat_2022,
        (array_agg(certification ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(certification), '') IS NOT NULL AND btrim(certification) <> '-'))[1] AS certification,
        (array_agg(training ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(training), '') IS NOT NULL AND btrim(training) <> '-'))[1] AS training,
        (array_agg("360_comments" ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim("360_comments"), '') IS NOT NULL AND btrim("360_comments") <> '-'))[1] AS comments_360,
        (array_agg("360_strength" ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim("360_strength"), '') IS NOT NULL AND btrim("360_strength") <> '-'))[1] AS strength_360,
        (array_agg("360_weakness" ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim("360_weakness"), '') IS NOT NULL AND btrim("360_weakness") <> '-'))[1] AS weakness_360,
        (array_agg(aspiration ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(aspiration), '') IS NOT NULL AND btrim(aspiration) <> '-'))[1] AS aspiration,
        (array_agg(project_involvement ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(project_involvement), '') IS NOT NULL AND btrim(project_involvement) <> '-'))[1] AS project_involvement,
        (array_agg(project_impact ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(project_impact), '') IS NOT NULL AND btrim(project_impact) <> '-'))[1] AS project_impact,
        (array_agg(project_contribution ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(project_contribution), '') IS NOT NULL AND btrim(project_contribution) <> '-'))[1] AS project_contribution,
        (array_agg(bu_visibility ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(bu_visibility), '') IS NOT NULL AND btrim(bu_visibility) <> '-'))[1] AS bu_visibility,
        (array_agg(technical_competencies ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(technical_competencies), '') IS NOT NULL AND btrim(technical_competencies) <> '-'))[1] AS technical_competencies,
        (array_agg(soft_competencies::text ORDER BY talent_year DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(soft_competencies::text), '') IS NOT NULL AND btrim(soft_competencies::text) <> '-'))[1] AS soft_competencies
      FROM bq_raw.p_talent_profile
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
        AND (${personnelNumber ?? null}::text IS NULL OR btrim(personnel_number) = ${personnelNumber ?? null})
      GROUP BY btrim(personnel_number)
    ),
    current_career AS (
      SELECT btrim(personnel_number) AS personnel_number,
        (array_agg(career_within_organization) FILTER (WHERE NULLIF(btrim(career_within_organization), '') IS NOT NULL AND btrim(career_within_organization) <> '-'))[1] AS career_within_organization,
        (array_agg(career_outside_organization) FILTER (WHERE NULLIF(btrim(career_outside_organization), '') IS NOT NULL AND btrim(career_outside_organization) <> '-'))[1] AS career_outside_organization
      FROM bq_raw.p_career_history
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
        AND (${personnelNumber ?? null}::text IS NULL OR btrim(personnel_number) = ${personnelNumber ?? null})
      GROUP BY btrim(personnel_number)
    ),
    current_assessment AS (
      SELECT btrim(personnel_number) AS personnel_number,
        (array_agg(iq_score ORDER BY assesment_date DESC NULLS LAST) FILTER (WHERE iq_score IS NOT NULL))[1] AS iq_score,
        (array_agg(iq_category ORDER BY assesment_date DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(iq_category), '') IS NOT NULL AND btrim(iq_category) <> '-'))[1] AS iq_category,
        (array_agg(disc ORDER BY assesment_date DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(disc), '') IS NOT NULL AND btrim(disc) <> '-'))[1] AS disc,
        (array_agg(disc_category ORDER BY assesment_date DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(disc_category), '') IS NOT NULL AND btrim(disc_category) NOT IN ('-', 'None')))[1] AS disc_category,
        (array_agg(matchup_result ORDER BY assesment_date DESC NULLS LAST) FILTER (WHERE matchup_result IS NOT NULL))[1] AS matchup_result
      FROM bq_raw.p_assessment_history
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
        AND (${personnelNumber ?? null}::text IS NULL OR btrim(personnel_number) = ${personnelNumber ?? null})
      GROUP BY btrim(personnel_number)
    ),
    development_program AS (
      SELECT btrim(personnel_number) AS personnel_number,
        array_agg(
          concat_ws(' - ', NULLIF(btrim(dp_program_name), ''),
            CASE WHEN dp_program_year IS NULL THEN NULL ELSE dp_program_year::text END,
            NULLIF(btrim(final_rating), ''))
          ORDER BY dp_program_year DESC NULLS LAST, start_date DESC NULLS LAST
        ) AS development_programs
      FROM bq_raw.p_dp_history
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
        AND dp_program_name IS NOT NULL AND btrim(dp_program_name) <> ''
        AND (${personnelNumber ?? null}::text IS NULL OR btrim(personnel_number) = ${personnelNumber ?? null})
      GROUP BY btrim(personnel_number)
    )
    SELECT e.*, t.talent_year, t.start_date_in_current_position,
      t.last_rotation_date, t.last_promotion_date, t.performance_category,
      t.potential_grow_category, t.talent_class_9_box, t.talent_class_12_box,
      t.talent_calibration_now, t.current_roles, t.xdp_history, t.pat_2025,
      t.pat_2024, t.pat_2023, t.pat_2022, t.certification, t.training,
      t.comments_360, t.strength_360, t.weakness_360, t.aspiration,
      t.project_involvement, t.project_impact, t.project_contribution,
      t.bu_visibility, t.technical_competencies, t.soft_competencies,
      c.career_within_organization, c.career_outside_organization,
      dp.development_programs, a.iq_score, a.iq_category, a.disc,
      a.disc_category, a.matchup_result, h.sid AS hsect_sid,
      h.mcu_status, h.mcu_description, h.simper_status, h.simper_summary
    FROM current_employee e
    LEFT JOIN current_talent t ON t.personnel_number = e.personnel_number
    LEFT JOIN current_career c ON c.personnel_number = e.personnel_number
    LEFT JOIN current_assessment a ON a.personnel_number = e.personnel_number
    LEFT JOIN development_program dp ON dp.personnel_number = e.personnel_number
    LEFT JOIN hr_employee_profiles hp ON hp.personnel_number = e.personnel_number
    LEFT JOIN hr_hsect_employee_links h ON h.employee_id = hp.id
    ORDER BY e.employee_name NULLS LAST, e.personnel_number
  `;

  return rows.map((row) => {
    const track: TalentTrack = {
      sourceFile: "BIGQUERY_RAW",
      sourceSheet: "bq_raw",
      directorate: cleanValue(row.direktorat),
      division: cleanValue(row.divisi),
      workLocation: cleanValue(row.personnel_area),
      jobLevel: cleanValue(row.ps_level),
      education: [cleanValue(row.faculty), cleanValue(row.major)].filter(Boolean).join(" - ") || undefined,
      // Preserve raw PAT scales separately for the UI. Numeric values, when
      // present, can still participate in aggregate ranking.
      performance: numericPatScores(row.pat_2025, row.pat_2024, row.pat_2023),
      patByYear: compactPatByYear(row.pat_2025, row.pat_2024, row.pat_2023),
      technical: splitValues(row.technical_competencies),
      behavioral: splitValues(row.soft_competencies),
      certifications: splitValues(row.certification),
      developmentPrograms: cleanList(row.development_programs),
      xdpHistory: splitValues(row.xdp_history),
      projects: splitValues(row.project_involvement),
      projectImpact: cleanValue(row.project_impact),
      projectContribution: cleanValue(row.project_contribution),
      buVisibility: cleanValue(row.bu_visibility),
      careerHistory: splitValues(row.career_within_organization, row.career_outside_organization),
      strength: splitValues(row.strength_360),
      weakness: splitValues(row.weakness_360),
      aspiration: cleanValue(row.aspiration),
      lastPromotionDate: asSourcedIsoDate(row.last_promotion_date),
      currentPositionDuration: durationSince(row.start_date_in_current_position),
      // p_emps does not expose a separate current_role column. position_name
      // is the current role supplied by that raw source.
      currentRole: cleanValue(row.position_name),
      workContract: cleanValue(row.work_contract),
      talentClass: cleanValue(row.talent_class_12_box) ?? cleanValue(row.talent_class_9_box),
      promotionStatus: undefined,
      nextPromotionPic: undefined,
      supervisorNotes: cleanValue(row.comments_360),
      assessment: {
        iq: finiteNumber(row.iq_score),
        iqCategory: cleanValue(row.iq_category),
        disc: cleanValue(row.disc),
        discCategory: cleanValue(row.disc_category),
        matchupResult: cleanValue(row.matchup_result),
      },
      hse: hseSummary(row),
    };

    const joinDate = row.join_date ?? row.hiring_date;
    return {
      id: row.personnel_number,
      name: text(row.employee_name, row.personnel_number),
      email: row.office_email ?? "",
      photoUrl: null,
      nik: row.personnel_number,
      department: row.department,
      currentPosition: row.position_name,
      supervisorName: row.supervisor_name,
      // BQ supplies at least one of join/hiring date for the operational feed.
      joinDate: joinDate ?? new Date(0),
      birthDate: row.date_of_birth,
      retirementAge: null,
      retirementExtendedUntil: null,
      retirementNotes: null,
      yearsOfService: yearsOfService(joinDate),
      track: { ...track, employmentStatus: cleanValue(row.employee_group) },
      dataSignals: countSignals(track),
    };
  });
}

/** UI-compatible detail shape built only from a raw BQ record. */
export async function getBigQueryEmployeeProfile(personnelNumber: string) {
  const candidate = (await listBigQueryEmployees(personnelNumber))[0];
  if (!candidate) return null;
  return {
    id: candidate.id,
    user: { name: candidate.name, email: candidate.email },
    photoUrl: candidate.photoUrl,
    nik: candidate.nik,
    phone: null,
    cvUrl: null,
    department: candidate.department,
    position: candidate.currentPosition,
    joinDate: candidate.joinDate,
    supervisorName: candidate.supervisorName,
    talentData: candidate.track,
  };
}

function splitValues(...values: Array<string | null | undefined>) {
  return values
    .flatMap((value) => String(value ?? "").split(/\r?\n|;|\|/))
    .map((value) => value.trim())
    .filter((value) => Boolean(value) && value !== "-");
}

function asSourcedIsoDate(value: Date | null) {
  return isRealSourceDate(value) ? value.toISOString() : undefined;
}

function compactPatByYear(pat2025: string | null, pat2024: string | null, pat2023: string | null) {
  const values = {
    "2025": cleanValue(pat2025),
    "2024": cleanValue(pat2024),
    "2023": cleanValue(pat2023),
  };
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value)) as TalentTrack["patByYear"];
}

function numericPatScores(...values: Array<string | null>) {
  return values
    .map((value) => Number(cleanValue(value)))
    .filter((value) => Number.isFinite(value));
}

function cleanValue(value: unknown) {
  const normalized = value === null || value === undefined ? "" : String(value).trim();
  return normalized && normalized !== "-" ? normalized : undefined;
}

function durationSince(value: Date | null) {
  if (!isRealSourceDate(value)) return undefined;
  const start = new Date(value);
  const today = new Date();
  if (Number.isNaN(start.getTime()) || start > today) return undefined;

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${years} tahun ${months} bulan ${days} hari`;
}

function isRealSourceDate(value: Date | null): value is Date {
  return Boolean(value && !Number.isNaN(value.getTime()) && value.getUTCFullYear() > 1900);
}

function finiteNumber(value: number | string | null) {
  const parsed = Number(value);
  return value !== null && Number.isFinite(parsed) ? parsed : undefined;
}

function cleanList(values: string[] | null) {
  return (values ?? []).map((value) => value.trim()).filter((value) => value && value !== "-");
}

function hseSummary(row: RawEmployee): TalentTrack["hse"] {
  const mcu = cleanValue(row.mcu_status);
  const sid = cleanValue(row.hsect_sid);
  const simper = cleanValue(row.simper_summary) ?? cleanValue(row.simper_status);
  if (!mcu && !sid && !simper) return undefined;
  return {
    mcu: row.mcu_description ? `${mcu ?? "Status belum tersedia"} - ${row.mcu_description}` : mcu,
    sid,
    simper,
    summary: [mcu && `MCU ${mcu}`, sid && `SID ${sid}`, simper && `SIMPER ${simper}`].filter(Boolean).join("; "),
  };
}

function text(value: string | null, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function yearsOfService(joinDate: Date | null) {
  if (!joinDate) return 0;
  return Number(Math.max(0, (Date.now() - joinDate.getTime()) / 31_557_600_000).toFixed(1));
}

function countSignals(track: TalentTrack) {
  return [track.jobLevel, track.performance?.length, track.technical?.length,
    track.certifications?.length, track.developmentPrograms?.length, track.projects?.length,
    track.careerHistory?.length, track.strength?.length, track.weakness?.length,
    track.aspiration].filter(Boolean).length;
}
