import { dbQuery, dbTransaction } from "@/lib/db/query";
import type { DbRow } from "@/lib/db/pool";
import { badRequest, created, forbidden, ok, serverError } from "@/lib/http";
import { bankSchema } from "@/lib/validation/schemas";
import { requireRole } from "@/lib/auth/guard";

type BankListRow = DbRow & {
  id: number;
  slug: string;
  logoUrl: string | null;
  officialWebsite: string | null;
  customerServiceNumbers: string | null;
  headquarters: string | null;
  swiftCode: string | null;
  showOnWebsite: number | boolean;
  name: string;
  shortDescription: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "ar";

  try {
    const rows = await dbQuery<BankListRow[]>(
      `SELECT b.id, b.slug, b.logo_url AS logoUrl, b.official_website AS officialWebsite,
              b.customer_service_numbers AS customerServiceNumbers, b.headquarters,
              b.swift_code AS swiftCode, b.show_on_website AS showOnWebsite, bt.name, bt.short_description AS shortDescription
       FROM banks b
       JOIN bank_translations bt ON bt.bank_id = b.id AND bt.locale = ?
       WHERE b.deleted_at IS NULL
       ORDER BY bt.name ASC`,
      [locale]
    );
    return ok(rows);
  } catch {
    return serverError("Unable to fetch banks");
  }
}

export async function POST(request: Request) {
  const user = await requireRole("editor");
  if (!user) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = bankSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid bank payload", parsed.error.flatten());
    }

    const bankId = await dbTransaction(async ({ execute }) => {
      const bankResult = await execute(
        `INSERT INTO banks
         (slug, official_website, headquarters, swift_code, show_on_website, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          parsed.data.slug,
          parsed.data.officialWebsite ?? null,
          parsed.data.headquarters ?? null,
          parsed.data.swiftCode ?? null,
          parsed.data.showOnWebsite ? 1 : 0,
        ]
      );

      const createdBankId = bankResult.insertId;

      await execute(
        `INSERT INTO bank_translations
         (bank_id, locale, name, short_description, created_at, updated_at)
         VALUES (?, 'ar', ?, ?, NOW(), NOW()), (?, 'en', ?, ?, NOW(), NOW())`,
        [
          createdBankId,
          parsed.data.name,
          parsed.data.shortDescription,
          createdBankId,
          parsed.data.name,
          parsed.data.shortDescription,
        ]
      );

      return createdBankId;
    });

    return created({ id: bankId });
  } catch {
    return serverError("Unable to create bank");
  }
}
