import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return <div className="page-container" aria-label="Memuat dashboard"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-64 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div><Skeleton className="h-40 rounded-2xl" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="col-span-2 h-24 rounded-xl lg:col-span-1" /></div><div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div></div>;
}
