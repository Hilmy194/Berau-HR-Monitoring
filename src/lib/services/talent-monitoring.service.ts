import { listEmployeeDirectory, type EmployeeDirectoryItem } from "@/lib/services/employee-directory.service";
import { ALL_TALENT_RETENTION, normalizeName, type TalentRetentionItem } from "@/lib/data/talent-retention-list";

export interface TalentMonitoringEmployeeItem extends EmployeeDirectoryItem {
  retentionNo: number;
  uniqueKey: string;
  supervisor?: string;
}

export async function listTalentMonitoringEmployees(): Promise<TalentMonitoringEmployeeItem[]> {
  const directory = await listEmployeeDirectory();

  // Create lookup maps for fast matching
  const directoryByNormName = new Map<string, EmployeeDirectoryItem>();
  for (const emp of directory) {
    if (emp.name) {
      directoryByNormName.set(normalizeName(emp.name), emp);
    }
  }

  const results: TalentMonitoringEmployeeItem[] = [];

  for (const retention of ALL_TALENT_RETENTION) {
    const normRetentionName = normalizeName(retention.name);
    
    // Exact normalized match
    let matchedEmp = directoryByNormName.get(normRetentionName);

    // Fallback fuzzy match (if name in DB has partial or middle name variations)
    if (!matchedEmp) {
      for (const [normKey, emp] of directoryByNormName.entries()) {
        if (normKey.includes(normRetentionName) || normRetentionName.includes(normKey)) {
          matchedEmp = emp;
          break;
        }
      }
    }

    const uniqueKey = `ret-${retention.no}-${matchedEmp ? matchedEmp.id : "syn"}`;

    if (matchedEmp) {
      results.push({
        ...matchedEmp,
        retentionNo: retention.no,
        uniqueKey,
        supervisor: retention.supervisor,
        position: matchedEmp.position || retention.title,
        directorate: matchedEmp.directorate || retention.directorate,
        division: matchedEmp.division || retention.division,
        department: matchedEmp.department || retention.department,
      });
    } else {
      // Synthesize complete item if not found in db
      const syntheticId = `ret-${retention.no}`;
      results.push({
        id: syntheticId,
        profileId: syntheticId,
        employeeId: syntheticId,
        name: retention.name,
        email: "",
        photoUrl: null,
        nik: "-",
        position: retention.title,
        currentPosition: retention.title,
        directorate: retention.directorate,
        division: retention.division,
        department: retention.department,
        phone: "-",
        joinDate: null,
        lastPromotionDate: null,
        employmentStatus: "Talent Retention",
        workLocation: "",
        aspirationCompleted: false,
        strengthCompleted: false,
        weaknessCompleted: false,
        commentCompleted: false,
        retentionNo: retention.no,
        uniqueKey,
        supervisor: retention.supervisor,
      });
    }
  }

  return results;
}
