'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Target, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useObjective, useObjectives, fetchJSON } from '@/hooks/useObjectives'
import { calculateKRProgress } from '@/lib/utils'
import { InitiativeStatus } from '@prisma/client'

type InitiativeForm = { title: string; status: InitiativeStatus }

export default function InitiativesPage() {
  const router = useRouter()
  const params = useSearchParams()
  const queryClient = useQueryClient()
  const { data } = useObjectives({ limit: 200 })

  const keyResults = useMemo(() => {
    const objs = data?.objectives ?? []
    return objs.flatMap((objective) =>
      objective.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        progress: calculateKRProgress(kr.current, kr.target),
        objectiveId: objective.id,
        objectiveTitle: objective.title,
        owner: objective.owner.name || objective.owner.email,
        initiativeCount: kr.initiatives?.length ?? 0,
      }))
    )
  }, [data])

  const defaultSelection = params.get('keyResultId') || keyResults[0]?.id
  const [selectedKrId, setSelectedKrId] = useState<string | undefined>(defaultSelection)
  const selected = keyResults.find((kr) => kr.id === selectedKrId) || keyResults[0]

  const { data: objectiveDetail } = useObjective(selected?.objectiveId)
  const detailedKr = objectiveDetail?.objective?.keyResults.find((kr) => kr.id === selected?.id)

  const [form, setForm] = useState<InitiativeForm>({ title: '', status: InitiativeStatus.TODO })

  const createInitiative = useMutation({
    mutationFn: async () =>
      fetchJSON(`/api/key-results/${selected?.id}/initiatives`, {
        method: 'POST',
        body: JSON.stringify({ title: form.title, status: form.status }),
      }),
    onSuccess: () => {
      toast.success('Initiative added')
      setForm({ title: '', status: InitiativeStatus.TODO })
      queryClient.invalidateQueries({ queryKey: ['objective', selected?.objectiveId] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to add initiative'),
  })

  const updateStatus = useMutation({
    mutationFn: async (payload: { id: string; status: InitiativeStatus }) =>
      fetchJSON(`/api/initiatives/${payload.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: payload.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective', selected?.objectiveId] })
      toast.success('Initiative updated')
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to update initiative'),
  })

  const deleteInitiative = useMutation({
    mutationFn: async (id: string) =>
      fetchJSON(`/api/initiatives/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective', selected?.objectiveId] })
      toast.success('Initiative removed')
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to remove initiative'),
  })

  const handleSelect = (id: string) => {
    setSelectedKrId(id)
    router.push(`/initiatives?keyResultId=${id}`)
  }

  if (!keyResults.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Initiatives & Tasks</h1>
        <p className="text-muted-foreground">No key results available. Create an objective with key results first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Initiatives & Tasks
          </h1>
          <p className="text-muted-foreground">
            Attach workstreams to key results so owners know what to execute next.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {keyResults.length} key results
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Key results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {keyResults.map((kr) => (
              <button
                key={kr.id}
                onClick={() => handleSelect(kr.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  selected?.id === kr.id ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{kr.title}</span>
                  <Badge variant="outline">{kr.progress}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {kr.objectiveTitle} • {kr.initiativeCount} initiatives
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selected?.title || 'Select a key result'}
            </CardTitle>
            {selected ? (
              <p className="text-xs text-muted-foreground">
                {selected.objectiveTitle} • Owner: {selected.owner}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/70 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Add initiative</p>
                  <p className="text-xs text-muted-foreground">Break down the KR into actionable tasks.</p>
                </div>
              </div>
              <Input
                placeholder="Ship new onboarding flow"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as InitiativeStatus })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To do</SelectItem>
                    <SelectItem value="DOING">In progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => createInitiative.mutate()}
                  disabled={!form.title || !selected?.id || createInitiative.isPending}
                >
                  {createInitiative.isPending ? 'Saving…' : 'Create'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Initiatives</h3>
                <Badge variant="outline">{detailedKr?.initiatives?.length ?? 0}</Badge>
              </div>
              {detailedKr?.initiatives?.length ? (
                <div className="space-y-2">
                  {detailedKr.initiatives.map((initiative) => (
                    <div
                      key={initiative.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">{initiative.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(initiative.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={initiative.status}
                          onValueChange={(value) =>
                            updateStatus.mutate({ id: initiative.id, status: value as InitiativeStatus })
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">To do</SelectItem>
                            <SelectItem value="DOING">In progress</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteInitiative.mutate(initiative.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
                  No initiatives yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
