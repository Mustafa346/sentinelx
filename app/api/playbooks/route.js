import { connectDB } from "@/lib/db";
import { requireAuth, apiSuccess } from "@/lib/authGuard";
import Playbook from "@/models/Playbook";

export async function GET() {
  const { errorResponse } = await requireAuth(["ADMIN", "SECURITY_ANALYST"]);
  if (errorResponse) return errorResponse;

  await connectDB();
  const playbooks = await Playbook.find({}).sort({ title: 1 });
  return apiSuccess({ playbooks });
}
