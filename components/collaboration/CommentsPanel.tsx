'use client'

import { useMemo, useState } from 'react'
import { MessageSquare, Send, Loader2, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { useComments } from '@/hooks/useComments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

type Target = { objectiveId: string; keyResultId?: string | null }

export function CommentsPanel({ objectiveId, keyResults }: { objectiveId: string; keyResults: Array<{ id: string; title: string }> }) {
  const [target, setTarget] = useState<Target>({ objectiveId })
  const [content, setContent] = useState('')
  const { data: session } = useSession()
  const { comments, isLoading, addComment, deleteComment, isSaving } = useComments(target)

  const options = useMemo(
    () => [
      { id: 'objective', label: 'Objective' },
      ...keyResults.map((kr) => ({ id: kr.id, label: `KR: ${kr.title}` })),
    ],
    [keyResults]
  )

  const handleSubmit = async () => {
    if (!content.trim()) return
    await addComment({
      content: content.trim(),
      objectiveId,
      keyResultId: target.keyResultId,
    })
    setContent('')
  }

  const handleTargetChange = (value: string) => {
    if (value === 'objective') {
      setTarget({ objectiveId, keyResultId: undefined })
    } else {
      setTarget({ objectiveId, keyResultId: value })
    }
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-soft space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Discussion</h3>
            <p className="text-xs text-muted-foreground">Comments are shared with owners and show up in notifications.</p>
          </div>
        </div>
        <Select onValueChange={handleTargetChange} defaultValue="objective">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Target" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment or tag an owner with context"
          disabled={isSaving}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{comments.length} comment{comments.length === 1 ? '' : 's'}</span>
          <Button size="sm" onClick={handleSubmit} disabled={isSaving || !content.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Post
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
                    {comment.keyResultId ? 'Key Result' : 'Objective'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {(comment.user.id === session?.user?.id || session?.user?.role === 'ADMIN') && (
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm font-medium text-foreground mt-1">{comment.user.name || comment.user.email}</p>
              <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
