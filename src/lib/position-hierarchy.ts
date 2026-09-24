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

export function mobilityPositionLevelRank(value: string | null | undefined) {
  const source = String(value ?? "").toLocaleLowerCase("id-ID");
  if (/\bgm\b|general manager|\bhead\b/.test(source)) return 7;
  if (/senior manager|sr\.?\s*manager|senior mgr|sr\.?\s*mgr/.test(source)) return 6;
  if (/\bmanager\b|\bmgr\b/.test(source)) return 5;
  if (/superintendent|\bsupt\b|senior specialist|sr\.?\s*specialist/.test(source)) return 4;
  if (/supervisor|specialist/.test(source)) return 3;
  if (/foreman/.test(source)) return 2;
  if (/engineer|geologist|surveyor|analyst|officer|staff|operator/.test(source)) return 1;
  return 0;
}

export function isMobilityPositionEligible(params: {
  currentPosition: string | null | undefined;
  currentLevel?: string | null;
  targetPosition: string | null | undefined;
  targetLevel?: string | null;
}) {
  const samePosition = samePositionIdentity(params.currentPosition, params.targetPosition);
  const candidateRank = mobilityPositionLevelRank(`${params.currentLevel ?? ""} ${params.currentPosition ?? ""}`);
  const targetRank = mobilityPositionLevelRank(`${params.targetLevel ?? ""} ${params.targetPosition ?? ""}`);
  const aboveTarget = Boolean(candidateRank && targetRank && candidateRank > targetRank);
  return { eligible: !samePosition && !aboveTarget, samePosition, aboveTarget, candidateRank, targetRank };
}
