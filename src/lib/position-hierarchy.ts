export function canonicalPositionIdentity(value: string | null | undefined) {
  return String(value ?? "")
    .toLocaleLowerCase("id-ID")
    .replace(/\bsr\.?\b/g, "senior")
    .replace(/\bmgr\b/g, "manager")
    .replace(/\bmining\b/g, "mine")
    .replace(/\boperations\b/g, "operation")
    .replace(/\bacting\b|\bact\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function samePositionIdentity(a: string | null | undefined, b: string | null | undefined) {
  const left = canonicalPositionIdentity(a);
  const right = canonicalPositionIdentity(b);
  return Boolean(left && right && left === right);
}

export function mobilityPositionLevelRank(
  value: string | null | undefined,
  explicitPositionName?: string | null | undefined
): number {
  const source = String(value ?? "").toLocaleLowerCase("id-ID");
  const pName = String(explicitPositionName ?? (value ?? "")).toLocaleLowerCase("id-ID");

  // Check Assistant / Staff roles first if position name explicitly indicates an assistant role
  if (/^assistant\b|\bassistant\s+to\b|\bsecretary\b|\bsekretaris\b/i.test(pName)) {
    return 1;
  }

  // 1. GM / Direksi / Division Head / Director
  if (
    /\bgm\b|general manager|\bhead\b|director|direktur|katt|deputy director/i.test(pName) ||
    /\bgm\b|general manager|director|direktur|katt|deputy director/i.test(source)
  ) {
    return 7;
  }

  // 2. Senior Manager (must be checked BEFORE Manager)
  if (
    /senior\s*manager|sr\.?\s*manager|senior\s*mgr|sr\.?\s*mgr/i.test(pName) ||
    /senior\s*manager|sr\.?\s*manager|senior\s*mgr|sr\.?\s*mgr/i.test(source)
  ) {
    return 6;
  }

  // If jobLevel was legacy "sr manager / manager", check positionName to see if it's Sr Manager or Manager
  if (/sr manager \/ manager/i.test(source)) {
    if (/senior|sr\.?\b/i.test(pName)) return 6;
    if (/\bmanager\b|\bmgr\b/i.test(pName)) return 5;
    return 5;
  }

  // 3. Manager
  if (/\bmanager\b|\bmgr\b/i.test(pName) || /\bmanager\b|\bmgr\b/i.test(source)) {
    return 5;
  }

  // 4. Superintendent / Sr Specialist
  if (
    /superintendent|\bsupt\b|senior specialist|sr\.?\s*specialist|senior engineer|sr\.?\s*engineer|senior analyst|sr\.?\s*analyst|senior geologist|sr\.?\s*geologist|senior surveyor|sr\.?\s*surveyor|senior advisor|sr\.?\s*advisor/i.test(pName) ||
    /superintendent/i.test(source)
  ) {
    return 4;
  }

  // 5. Supervisor / Specialist / Section Head
  if (
    /supervisor|\bspv\b|specialist|section head|lead engineer|lead officer|lead specialist/i.test(pName) ||
    /supervisor/i.test(source)
  ) {
    return 3;
  }

  // 6. Foreman
  if (/foreman/i.test(pName) || /foreman/i.test(source)) {
    return 2;
  }

  // 7. Engineer / Officer / Staf Profesional
  if (
    /engineer|geologist|surveyor|analyst|officer|trainer|instructor|facilitator|administrator|planner|buyer|controller|inspector|paramedic|nurse/i.test(pName) ||
    /engineer|officer/i.test(source)
  ) {
    return 2;
  }

  // 8. Operator / Helper / Staff / Pelaksana
  if (
    /operator|driver|technician|mekanik|mechanic|crew|helper|clerk|staff|assistant/i.test(pName) ||
    /operator|staff/i.test(source)
  ) {
    return 1;
  }

  return 0;
}

export function isMobilityPositionEligible(params: {
  currentPosition: string | null | undefined;
  currentLevel?: string | null;
  targetPosition: string | null | undefined;
  targetLevel?: string | null;
}) {
  const samePosition = samePositionIdentity(params.currentPosition, params.targetPosition);
  const candidateRank = mobilityPositionLevelRank(
    `${params.currentLevel ?? ""} ${params.currentPosition ?? ""}`,
    params.currentPosition
  );
  const targetRank = mobilityPositionLevelRank(
    `${params.targetLevel ?? ""} ${params.targetPosition ?? ""}`,
    params.targetPosition
  );
  const aboveTarget = Boolean(candidateRank && targetRank && candidateRank > targetRank);
  return { eligible: !samePosition && !aboveTarget, samePosition, aboveTarget, candidateRank, targetRank };
}
