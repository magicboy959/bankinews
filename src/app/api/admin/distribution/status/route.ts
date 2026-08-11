import { forbidden, ok } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { getDistributionChannelStatus } from "@/lib/social-distribution";

export async function GET() {
  const user = await requireRole("editor");
  if (!user) return forbidden();
  return ok(getDistributionChannelStatus());
}
