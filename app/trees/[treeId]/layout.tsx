import { TreeShell } from '@/components/trees/TreeShell'

export default async function TreeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ treeId: string }>
}) {
  const { treeId } = await params
  return <TreeShell treeId={treeId}>{children}</TreeShell>
}
