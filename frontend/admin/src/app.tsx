import { Button, Card } from "@origin-flow/ui";

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <h1 className="mb-4 text-4xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mb-8 text-lg text-slate-600">
        Manage your Origin Flow workspace.
      </p>
      <Card title="Quick Actions">
        <div className="flex gap-4">
          <Button color="primary">View Users</Button>
          <Button color="secondary">Settings</Button>
        </div>
      </Card>
    </div>
  );
}
