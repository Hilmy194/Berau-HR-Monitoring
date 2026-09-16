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

  for (const unit of units) {
    const node: HrCoreOrgNode = { ...unit, children: [] };
    nodes.set(unit.code, node);
    const parent = unit.parentCode ? nodes.get(unit.parentCode) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
