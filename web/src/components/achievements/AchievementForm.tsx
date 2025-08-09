// components/achievements/AchievementForm.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface AchievementFormProps {
  onSubmit: (data: {
    achievement_type: string
    details: Record<string, any>
    is_new: boolean
  }) => void
}

export function AchievementForm({ onSubmit }: AchievementFormProps) {
  const [type, setType] = useState('')
  const [details, setDetails] = useState('')
  const [isNew, setIsNew] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      achievement_type: type,
      details: details ? JSON.parse(details) : {},
      is_new: isNew,
    })
    setType('')
    setDetails('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="achievement_type">Achievement Type</Label>
        <Input
          id="achievement_type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="details">Details (JSON)</Label>
        <Textarea
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder='{"key": "value"}'
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_new"
          checked={isNew}
          onCheckedChange={(checked) => setIsNew(checked === true)}
        />
        <Label htmlFor="is_new">Mark as new</Label>
      </div>
      
      <Button type="submit">Add Achievement</Button>
    </form>
  )
}