import { z } from "zod";
import { requireRole } from "@/lib/auth/guard";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { distributionChannels, testDistributionChannel } from "@/lib/social-distribution";

const testSchema = z.object({ channel: z.enum(distributionChannels) });

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) return forbidden();

  try {
    const parsed = testSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("Invalid distribution channel.");
    return ok(await testDistributionChannel(parsed.data.channel));
  } catch {
    return serverError("Unable to test platform connection.");
  }
}
