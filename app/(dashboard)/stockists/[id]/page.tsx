import { redirect } from 'next/navigation';

export default async function StockistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/persons/${id}`);
}
