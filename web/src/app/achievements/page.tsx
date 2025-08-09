'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAchievements } from '@/lib/api/achievement';
import { Achievement } from '@/types/achievements';
import { Button } from '@/components/ui/button';

export default function GetAchievementPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchAchievements() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAchievements();
        setAchievements(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch achievements. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []);

  const handleCreateNew = () => {
    router.push('/achievements/create');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Achievements</h2>
        <Button onClick={handleCreateNew}>Add New Achievement</Button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-center mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">Loading achievements...</div>
      ) : achievements.length === 0 ? (
        <div className="text-center text-gray-600">No achievements found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                
              </tr>
            </thead>
            <tbody>
              {achievements.map((achievement) => (
                <tr key={achievement.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-900">{achievement.id}</td>
                  <td className="p-3 text-sm text-gray-900">{achievement.title}</td>
                  <td className="p-3 text-sm text-gray-900">{achievement.description}</td>
                  <td className="p-3 text-sm text-gray-900">{achievement.date}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}