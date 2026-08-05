import { ok, serverError } from "@/lib/http";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getHomepageData } from "@/services/homepage-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? "ar";
  const locale: Locale = isLocale(localeParam) ? localeParam : "ar";

  try {
    const data = await getHomepageData(locale);
    return ok(data);
  } catch {
    return serverError("Unable to fetch homepage data");
  }
}
