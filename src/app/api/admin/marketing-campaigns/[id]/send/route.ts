import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requireRole } from "@/lib/auth/guard";
import { sendStoredMarketingCampaign } from "@/lib/marketing-campaigns";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  const { id } = await context.params;
  const campaignId = Number(id);

  if (!Number.isInteger(campaignId) || campaignId < 1) {
    return badRequest("Invalid campaign id");
  }

  try {
    const result = await sendStoredMarketingCampaign(campaignId);
    if (!result.ok) {
      return result.error;
    }

    return ok(result.data);
  } catch {
    return serverError("Unable to send campaign");
  }
}
