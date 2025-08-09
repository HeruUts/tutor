// components/AchievementList.tsx
'use client'
import { Trophy, BellDot, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

interface Achievement {
  id: number
  achievement_type: string
  achieved_at: string
  details: Record<string, any>
  is_new: boolean
}

interface AchievementListProps {
  achievements: Achievement[]
  onMarkAsSeen: (id: number) => void
  onDelete: (id: number) => void
}

export function AchievementList({ achievements, onMarkAsSeen, onDelete }: AchievementListProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    achievement_type: '',
    details: '',
  })

  const handleEditClick = (achievement: Achievement) => {
    setEditingId(achievement.id)
    setEditForm({
      achievement_type: achievement.achievement_type,
      details: JSON.stringify(achievement.details, null, 2),
    })
  }

  const handleEditSubmit = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/achievements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Token ${token}` : '',
        },
        body: JSON.stringify({
          achievement_type: editForm.achievement_type,
          details: JSON.parse(editForm.details),
        }),
      })

      if (!response.ok) throw new Error('Failed to update achievement')
      setEditingId(null)
      onMarkAsSeen(id) // Refresh the list
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update')
    }
  }

  return (
    <div className="space-y-4">
      {achievements.map((achievement) => (
        <div 
          key={achievement.id} 
          className={`p-4 border rounded-lg ${achievement.is_new ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          {editingId === achievement.id ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`edit-type-${achievement.id}`}>Achievement Type</Label>
                <Input
                  id={`edit-type-${achievement.id}`}
                  value={editForm.achievement_type}
                  onChange={(e) => setEditForm({...editForm, achievement_type: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor={`edit-details-${achievement.id}`}>Details (JSON)</Label>
                <Textarea
                  id={`edit-details-${achievement.id}`}
                  value={editForm.details}
                  onChange={(e) => setEditForm({...editForm, details: e.target.value})}
                  className="font-mono text-sm h-32"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleEditSubmit(achievement.id)}>
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-medium">
                    {achievement.achievement_type}
                  </h3>
                  {achievement.is_new && (
                    <span className="flex items-center text-sm text-muted-foreground">
                      <BellDot className="h-4 w-4 mr-1" /> New
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(achievement)}
                  >
                    Edit
                  </Button>
                  {achievement.is_new && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsSeen(achievement.id)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Seen
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(achievement.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Achieved on {new Date(achievement.achieved_at).toLocaleString()}
              </div>
              {Object.entries(achievement.details).length > 0 && (
                <div className="mt-2">
                  <Label>Details:</Label>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-sm font-mono">
                    {JSON.stringify(achievement.details, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}