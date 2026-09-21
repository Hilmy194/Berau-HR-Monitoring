export type HrCoreOrgUnit = {
  code: string;
  name: string;
  parentCode: string | null;
  depth: number;
  path: string[];
};

export type HrCoreOrgNode = HrCoreOrgUnit & {
  children: HrCoreOrgNode[];
};

/** Input is pre-order (ORDER BY path). Missing scoped parents are forest roots. */
export function buildOrganizationForest(units: HrCoreOrgUnit[]) {
  const nodes = new Map<string, HrCoreOrgNode>();
  const roots: HrCoreOrgNode[] = [];
  const codes = new Set<string>();
  for (const unit of units) {
    if (typeof unit.code !== "string" || !unit.code.trim() || codes.has(unit.code)) {
      throw new Error("Canonical org-unit codes must be non-empty and unique.");
    }
    codes.add(unit.code);
    if (!Number.isInteger(unit.depth) || unit.depth < 0 || !Array.isArray(unit.path)
      || unit.path.length !== unit.depth + 1 || unit.path.at(-1) !== unit.code
      || unit.path.some((code) => typeof code !== "string" || !code.trim())
      || new Set(unit.path).size !== unit.path.length) {
      throw new Error("Canonical org-unit path/depth must describe the Group-root path without cycles.");
    }
    if (unit.parentCode === unit.code || (unit.parentCode && unit.path.at(-2) !== unit.parentCode)) {
      throw new Error("Canonical org-unit parent must match its path.");
    }
  }

  for (const unit of units) {
    const node: HrCoreOrgNode = { ...unit, children: [] };
    const parent = unit.parentCode ? nodes.get(unit.parentCode) : undefined;
    if (!parent && unit.parentCode && codes.has(unit.parentCode)) {
      throw new Error("Canonical org-unit traversal must be pre-order; an included parent appeared after its child.");
    }
    if (parent && (parent.depth + 1 !== unit.depth || parent.path.some((code, index) => unit.path[index] !== code))) {
      throw new Error("Canonical child path/depth is inconsistent with its parent.");
    }
    nodes.set(unit.code, node);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
