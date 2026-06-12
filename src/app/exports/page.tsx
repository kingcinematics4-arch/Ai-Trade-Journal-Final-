import ExportPanel from "@/components/ExportPanel";
import { TradesProvider } from "@/contexts/TradesContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/AppLayout";

export default function Page() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/exports">
          <ExportPanel />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}