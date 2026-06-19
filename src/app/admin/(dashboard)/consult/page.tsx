import { getInquiries } from "@/lib/queries/admin";
import { ConsultTable } from "./ConsultTable";

export default async function ConsultPage() {
  const rows = await getInquiries();
  return <ConsultTable rows={rows} />;
}
