import { Address, Hex, getAddress } from "viem";
import { getStorageAt, getCode, callRaw } from "./rpc";

export const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

export type Eip1967Info = { implementation?: Address | null; admin?: Address | null; isProxy: boolean; };

function hexToAddress(slotValue: Hex): Address | null {
  if (!slotValue || slotValue === "0x" || slotValue === "0x0") return null as any;
  const clean = slotValue.replace(/^0x/, "").padStart(64, "0");
  const last40 = clean.slice(-40);
  const addr = ("0x" + last40) as Address;
  if (addr.toLowerCase() === "0x0000000000000000000000000000000000000000") return null;
  return getAddress(addr);
}

export async function readEip1967(chainId: number, proxyAddress: Address): Promise<Eip1967Info> {
  const [implSlot, adminSlot] = await Promise.all([
    getStorageAt(chainId, proxyAddress, IMPLEMENTATION_SLOT as Hex),
    getStorageAt(chainId, proxyAddress, ADMIN_SLOT as Hex),
  ]);
  const implementation = hexToAddress(implSlot);
  const admin = hexToAddress(adminSlot);
  let isProxy = !!implementation;
  if (implementation) {
    const code = await getCode(chainId, implementation);
    if (!code || code === "0x") isProxy = false;
  }
  return { implementation, admin, isProxy };
}

const SELECTORS = {
  DEFAULT_ADMIN_ROLE: "0xa217fddf",
  PAUSER_ROLE: "0xe63ab1e9",
  getRoleMemberCount: "0xca15c873",
  getRoleMember: "0x9010d07c",
  owner: "0x8da5cb5b",
  paused: "0x5c975abb",
} as const;

function pad32(hex: string) { const s = hex.replace(/^0x/, "").padStart(64, "0"); return ("0x" + s) as Hex; }
function u256(n: bigint) { return pad32("0x" + n.toString(16)); }

export type AccessReport = { defaultAdmins: Address[]; pausers: Address[]; paused?: boolean; };

export async function readAccessControl(chainId: number, address: Address): Promise<AccessReport> {
  let defaultRoleId: Hex = "0x" + "00".repeat(32) as Hex;
  try { const out = await callRaw(chainId, address, SELECTORS.DEFAULT_ADMIN_ROLE as any); if (out && out !== "0x") defaultRoleId = out as Hex; } catch {}

  let pauserRoleId: Hex | undefined;
  try { const out = await callRaw(chainId, address, SELECTORS.PAUSER_ROLE as any); if (out && out !== "0x") pauserRoleId = out as Hex; } catch {}

  const [defaultAdmins, pausers] = await Promise.all([
    enumerateRole(chainId, address, defaultRoleId),
    pauserRoleId ? enumerateRole(chainId, address, pauserRoleId) : Promise.resolve([])
  ]);

  let paused: boolean | undefined = undefined;
  try { const out = await callRaw(chainId, address, SELECTORS.paused as any); if (out && out !== "0x") paused = (BigInt(out) !== BigInt(0)); } catch {}

  return { defaultAdmins, pausers, paused };
}

async function enumerateRole(chainId: number, address: Address, roleId: Hex): Promise<Address[]> {
  try {
    const countRaw = await callRaw(chainId, address, (SELECTORS.getRoleMemberCount + roleId.slice(2)) as any);
    if (!countRaw || countRaw === "0x") return [];
    const count = Number(BigInt(countRaw));
    const results: Address[] = [];
    for (let i = 0; i < count; i++) {
      const idxHex = u256(BigInt(i));
      const data = (SELECTORS.getRoleMember + roleId.slice(2) + idxHex.slice(2)) as any;
      const out = await callRaw(chainId, address, data);
      if (out && out !== "0x") {
        const clean = (out as string).replace(/^0x/, "").padStart(64, "0");
        const last40 = clean.slice(-40);
        results.push(("0x" + last40) as Address);
      }
    }
    return results;
  } catch { return []; }
}

export function computeControlRisk(eip1967: Eip1967Info, access: AccessReport): number {
  let risk = 0.1;
  if (eip1967.isProxy) risk += 0.25;
  if (eip1967.admin) risk += 0.1;
  if (access.defaultAdmins.length <= 1) risk += 0.25;
  else if (access.defaultAdmins.length <= 3) risk += 0.15;
  else risk += 0.05;
  if (access.pausers.length > 0) risk += 0.1;
  if (access.paused) risk += 0.05;
  return Math.max(0, Math.min(1, Number(risk.toFixed(3))));
}

