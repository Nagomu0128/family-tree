import { SharedTreeClient } from './client'

export default async function SharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <SharedTreeClient code={code} />
}
