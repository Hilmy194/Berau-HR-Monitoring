import assert from "node:assert/strict";
import { buildOrganizationForest, type HrCoreOrgUnit } from "../src/lib/organization-forest";

const units: HrCoreOrgUnit[] = [
  { code: "BU_A", name: "Unit dengan nama sama", parentCode: "PILLAR", depth: 2, path: ["GROUP", "PILLAR", "BU_A"] },
  { code: "A_1", name: "Department", parentCode: "BU_A", depth: 3, path: ["GROUP", "PILLAR", "BU_A", "A_1"] },
  { code: "A_1_1", name: "Team", parentCode: "A_1", depth: 4, path: ["GROUP", "PILLAR", "BU_A", "A_1", "A_1_1"] },
  { code: "A_2", name: "Department", parentCode: "BU_A", depth: 3, path: ["GROUP", "PILLAR", "BU_A", "A_2"] },
  { code: "BU_B", name: "Unit dengan nama sama", parentCode: "PILLAR", depth: 2, path: ["GROUP", "PILLAR", "BU_B"] },
  { code: "B_1", name: "Department", parentCode: "BU_B", depth: 3, path: ["GROUP", "PILLAR", "BU_B", "B_1"] },
];

const forest = buildOrganizationForest(units);
assert.deepEqual(forest.map((root) => root.code), ["BU_A", "BU_B"]);
assert.equal(forest[0].depth, 2, "Original Group-relative depth must be preserved");
assert.deepEqual(forest[0].path, units[0].path);
assert.deepEqual(forest[0].children.map((child) => child.code), ["A_1", "A_2"]);
assert.equal(forest[0].children[0].children[0].code, "A_1_1");
assert.equal(forest[1].children[0].code, "B_1", "Equal names must not merge codes");
assert.deepEqual(buildOrganizationForest([]), []);
assert.equal(buildOrganizationForest([units[1]])[0].code, "A_1", "Missing scoped parent is a root");
assert.equal("children" in units[0], false, "Input rows must not be mutated");
assert.throws(() => buildOrganizationForest([units[0], units[0]]), /unique/);
assert.throws(() => buildOrganizationForest([units[1], units[0]]), /pre-order/);
assert.throws(() => buildOrganizationForest([{ ...units[0], depth: 0 }]), /path\/depth/);
assert.throws(() => buildOrganizationForest([{ ...units[0], parentCode: "BU_A" }]), /parent/);
assert.throws(() => buildOrganizationForest([{ ...units[0], path: ["BU_A", "PILLAR", "BU_A"] }]), /cycles/);
assert.throws(() => buildOrganizationForest([units[0], { ...units[1], path: ["OTHER_GROUP", "PILLAR", "BU_A", "A_1"] }]), /inconsistent/);
console.log("HR Core organization forest tests passed.");
