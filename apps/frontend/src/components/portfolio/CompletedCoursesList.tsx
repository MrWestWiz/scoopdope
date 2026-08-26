'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PortfolioCourse } from '@/lib/portfolioApi';

interface CompletedCoursesListProps {
  courses: PortfolioCourse[];
}

function levelVariant(level: string): 'default' | 'success' | 'warning' {
  const map: Record<string, 'default' | 'success' | 'warning'> = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'default',
  };
  return map[level.toLowerCase()] ?? 'default';
}

export function CompletedCoursesList({ courses }: CompletedCoursesListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No completed courses yet.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Completed courses">
      {courses.map((course) => (
        <li key={course.courseId}>
          <Card className="flex gap-4 p-4 h-full">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
              {course.thumbnailUrl ? (
                <Image
                  src={course.thumbnailUrl}
                  alt={`${course.title} thumbnail`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 min-w-0">
              <Link
                href={`/courses/${course.courseId}`}
                className="font-semibold text-gray-900 dark:text-white hover:underline line-clamp-2 text-sm"
              >
                {course.title}
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={levelVariant(course.level)} className="text-xs">
                  {course.level}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {course.durationHours}h
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                Completed{' '}
                <time dateTime={course.completedAt}>
                  {new Date(course.completedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
