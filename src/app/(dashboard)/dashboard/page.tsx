import { headers } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/core/auth/server";
import { getProjectCount } from "@/features/projects";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  const projectCount = user ? await getProjectCount(user.id) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-medium">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">User ID</dt>
                <dd className="font-mono text-sm">{user?.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Member Since</dt>
                <dd className="text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                You have {projectCount} project{projectCount === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            )}
            <a
              href="/dashboard/projects"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Manage projects &rarr;
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
