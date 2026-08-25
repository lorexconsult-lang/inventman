import { catalogueCsvHeaders } from "@/features/catalogue/csv";
export async function GET() {
  const example = [
    "Example product",
    "",
    "1234567890123",
    "",
    "",
    "Each",
    "19.99",
    "10",
    "5",
    "STOCKED_PRODUCT",
  ];
  return new Response(
    `${catalogueCsvHeaders.join(",")}\r\n${example.join(",")}\r\n`,
    {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=catalogue-template.csv",
      },
    },
  );
}
