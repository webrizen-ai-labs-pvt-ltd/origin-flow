import { Button, Card } from "@origin-flow/ui";

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-8">
      <h1 className="mb-4 text-4xl font-bold text-slate-900">Client Portal</h1>
      <p className="mb-8 text-lg text-slate-600">
        Welcome to your Origin Flow dashboard.
      </p>
      <Card title="Your Projects">
        <p className="mb-4 text-slate-500">You have no active projects yet.</p>
        <Button color="primary">Create Project</Button>
      </Card>
    </div>
  );
}
