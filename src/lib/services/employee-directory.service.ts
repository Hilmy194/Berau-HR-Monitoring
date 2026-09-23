import { prisma } from "@/lib/prisma";

type DirectoryRow = {
  personnel_number: string;
  employee_name: string | null;
  office_email: string | null;
  position_name: string | null;
  direktorat: string | null;
  divisi: string | null;
  department: string | null;
  personnel_area: string | null;
  employee_group: string | null;
  join_date: Date | null;
  last_promotion_date: Date | null;
  aspiration_completed: boolean;
  strength_completed: boolean;
  weakness_completed: boolean;
  comment_completed: boolean;
};

/** Lightweight directory read model. Full talent data is loaded only after
 * an employee is opened, keeping list/search navigation responsive. */
export async function listEmployeeDirectory() {
  const rows = await prisma.$queryRaw<DirectoryRow[]>`
    WITH employee AS (
      SELECT btrim(personnel_number) AS personnel_number,
        (array_agg(employee_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(employee_name), '') IS NOT NULL))[1] AS employee_name,
        (array_agg(office_email ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(office_email), '') IS NOT NULL))[1] AS office_email,
        (array_agg(position_name ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(position_name), '') IS NOT NULL))[1] AS position_name,
        (array_agg(direktorat ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(direktorat), '') IS NOT NULL))[1] AS direktorat,
        (array_agg(divisi ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(divisi), '') IS NOT NULL))[1] AS divisi,
        (array_agg(department ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(department), '') IS NOT NULL))[1] AS department,
        (array_agg(personnel_area ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(personnel_area), '') IS NOT NULL))[1] AS personnel_area,
        (array_agg(employee_group ORDER BY data_period DESC NULLS LAST) FILTER (WHERE NULLIF(btrim(employee_group), '') IS NOT NULL))[1] AS employee_group,
        COALESCE(
          (array_agg(join_date ORDER BY data_period DESC NULLS LAST) FILTER (WHERE join_date IS NOT NULL))[1],
          (array_agg(hiring_date ORDER BY data_period DESC NULLS LAST) FILTER (WHERE hiring_date IS NOT NULL))[1]
        ) AS join_date
      FROM bq_raw.p_emps
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
      GROUP BY btrim(personnel_number)
    ), promotion AS (
      SELECT btrim(personnel_number) AS personnel_number,
        (array_agg(last_promotion_date ORDER BY talent_year DESC NULLS LAST)
          FILTER (WHERE last_promotion_date > DATE '1900-12-31'))[1] AS last_promotion_date
      FROM bq_raw.p_talent_profile
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
      GROUP BY btrim(personnel_number)
    ), talent_completion AS (
      SELECT btrim(personnel_number) AS personnel_number,
        bool_or(NULLIF(btrim(aspiration), '') IS NOT NULL AND btrim(aspiration) <> '-') AS aspiration_completed,
        bool_or(NULLIF(btrim("360_strength"), '') IS NOT NULL AND btrim("360_strength") <> '-') AS strength_completed,
        bool_or(NULLIF(btrim("360_weakness"), '') IS NOT NULL AND btrim("360_weakness") <> '-') AS weakness_completed,
        bool_or(NULLIF(btrim("360_comments"), '') IS NOT NULL AND btrim("360_comments") <> '-') AS comment_completed
      FROM bq_raw.p_talent_profile
      WHERE personnel_number IS NOT NULL AND btrim(personnel_number) <> ''
      GROUP BY btrim(personnel_number)
    )
    SELECT employee.*, promotion.last_promotion_date,
      COALESCE(talent_completion.aspiration_completed, false) AS aspiration_completed,
      COALESCE(talent_completion.strength_completed, false) AS strength_completed,
      COALESCE(talent_completion.weakness_completed, false) AS weakness_completed,
      COALESCE(talent_completion.comment_completed, false) AS comment_completed
    FROM employee
    LEFT JOIN promotion USING (personnel_number)
    LEFT JOIN talent_completion USING (personnel_number)
    ORDER BY employee.employee_name NULLS LAST, employee.personnel_number
  `;

  return rows.map((row) => ({
    id: row.personnel_number,
    profileId: row.personnel_number,
    employeeId: row.personnel_number,
    name: clean(row.employee_name) ?? row.personnel_number,
    email: clean(row.office_email) ?? "",
    photoUrl: null,
    nik: row.personnel_number,
    position: clean(row.position_name) ?? "",
    currentPosition: clean(row.position_name) ?? "",
    directorate: clean(row.direktorat) ?? "",
    division: clean(row.divisi) ?? "",
    department: clean(row.department) ?? "",
    phone: "-",
    joinDate: row.join_date?.toISOString() ?? null,
    lastPromotionDate: row.last_promotion_date?.toISOString() ?? null,
    employmentStatus: clean(row.employee_group) ?? "",
    workLocation: clean(row.personnel_area) ?? "",
    aspirationCompleted: row.aspiration_completed,
    strengthCompleted: row.strength_completed,
    weaknessCompleted: row.weakness_completed,
    commentCompleted: row.comment_completed,
  }));
}

function clean(value: string | null) {
  const normalized = value?.trim();
  return normalized && normalized !== "-" ? normalized : null;
}

export type EmployeeDirectoryItem = Awaited<ReturnType<typeof listEmployeeDirectory>>[number];
