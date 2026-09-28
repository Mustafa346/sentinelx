import { requireAuth, apiSuccess } from "@/lib/authGuard";

export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  return apiSuccess({
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      riskScore: user.riskScore,
      lastLogin: user.lastLogin,
    },
  });
}
