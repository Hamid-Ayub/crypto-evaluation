export function caip19(chainId: string, standard: string, address: string): string {
  return `${chainId}:${standard}:${address.toLowerCase()}`;
}

