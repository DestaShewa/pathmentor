import React, { useEffect, useState } from 'react';
import { BookOpen, CreditCard, Calendar } from 'lucide-react';
import api from '../../../services/api';

const StudentEnrollments = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/admin/students');
      setEnrollments(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to load enrollments', err);
      setError(err?.response?.data?.message || 'Unable to load enrollment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const courseOptions = React.useMemo(() => {
    const options = new Set<string>();
    enrollments.forEach((student) => {
      const courseName = student.learningProfile?.course?.title || student.learningProfile?.skillTrack || 'Unassigned';
      options.add(courseName);
    });
    return ['All Courses', ...Array.from(options)].map((title) => ({ value: title === 'All Courses' ? 'all' : title, title }));
  }, [enrollments]);

  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((student) => {
      const courseName = student.learningProfile?.course?.title || student.learningProfile?.skillTrack || 'Unassigned';
      const status = student.onboardingCompleted ? 'active' : 'inactive';
      const matchesCourse = courseFilter === 'all' || courseName === courseFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesCourse && matchesStatus;
    });
  }, [enrollments, courseFilter, statusFilter]);

  const groupedEnrollments = React.useMemo(() => {
    return filteredEnrollments.reduce((groups: Record<string, any[]>, student) => {
      const courseName = student.learningProfile?.course?.title || student.learningProfile?.skillTrack || 'Unassigned';
      if (!groups[courseName]) {
        groups[courseName] = [];
      }
      groups[courseName].push(student);
      return groups;
    }, {} as Record<string, any[]>);
  }, [filteredEnrollments]);

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Enrollments</h1>
          <p className="text-slate-400 text-sm">View student course selections and onboarding levels.</p>
        </div>
        <div className="text-sm text-slate-400">
          {loading ? 'Refreshing enrollment data...' : `${filteredEnrollments.length} students shown`}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
        <label className="space-y-2 text-sm text-slate-200">
          Filter by course
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          Filter by status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-center text-slate-400">
            Loading enrollment information...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-center text-slate-400">
            No enrolled students match the filters.
          </div>
        ) : (
          Object.entries(groupedEnrollments).map(([courseTitle, students]) => (
            <section key={courseTitle} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{courseTitle}</h2>
                  <p className="text-slate-500 text-sm">{students.length} student{students.length === 1 ? '' : 's'} enrolled</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                  Course group
                </span>
              </div>

              <div className="grid gap-4">
                {students.map((student, idx) => {
                  const levelTitle = student.learningProfile?.courseLevel || student.learningProfile?.experienceLevel || 'No level selected';
                  return (
                    <div key={student._id || idx} className="rounded-3xl border border-white/10 bg-slate-950 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-4 items-start sm:items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 text-lg font-semibold">
                            {student.name?.[0] || 'S'}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{student.name || 'Student'}</h3>
                            <p className="text-slate-500 text-sm">{student.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-400">
                          <div className="space-y-1">
                            <span className="block text-slate-500">Status</span>
                            <span className={student.onboardingCompleted ? 'text-emerald-400' : 'text-amber-400'}>
                              {student.onboardingCompleted ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-slate-500">Level</span>
                            <span className="text-slate-200">{levelTitle}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="block text-slate-500">Joined</span>
                            <span className="text-slate-200">
                              {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentEnrollments;