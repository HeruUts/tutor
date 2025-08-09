'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAchievement } from '@/lib/api/achievement';
import { Achievement, initialAchievement } from '@/types/achievements';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function CreateAchievementPage() {
  const [achievement, setAchievement] = useState<Achievement>(initialAchievement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAchievement({ ...achievement, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createAchievement(achievement);
      router.push('/achivements');
    } catch (error: any) {
      console.error('Error creating achievement:', error);
      // Handle detailed backend errors
      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = Object.values(errors).flat().join('; ');
        setError(errorMessages || 'Failed to create achievement. Please try again.');
      } else {
        setError(error.message || 'Failed to create achievement. Please log in and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create Achievement</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-center mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="title"
          placeholder="Achievement Title"
          value={achievement.title}
          onChange={handleChange}
          required
        />
        <Textarea
          name="description"
          placeholder="Description"
          value={achievement.description}
          onChange={handleChange}
          required
        />
        <Input
          type="date"
          name="date"
          placeholder="YYYY-MM-DD"
          value={achievement.date}
          onChange={handleChange}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create'}
        </Button>
      </form>
    </div>
  );
}