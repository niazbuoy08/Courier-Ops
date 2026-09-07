import type { PackageStatus } from "@/types/package";

/** "8330 Birch Ln, Chicago, IL" -> "Chicago, IL" */
function cityFromAddress(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts.slice(-2).join(", ") : address;
}

/** A plausible scan location for a simulated status change. */
export function simulatedLocation(
  status: PackageStatus,
  receiverAddress: string,
): string {
  const city = cityFromAddress(receiverAddress);
  switch (status) {
    case "Pending":
      return "Awaiting pickup — origin facility";
    case "Picked up":
      return "Picked up — origin facility";
    case "In transit":
      return "In transit — regional sort hub";
    case "Out for delivery":
      return `Out for delivery — ${city} delivery station`;
    case "Delivered":
      return `Delivered — ${city}`;
    case "Delayed":
      return "Held at regional hub — delay";
  }
}
