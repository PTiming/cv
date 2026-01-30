import { useState, useEffect, useCallback } from 'react';
import moodleService from '../services/moodleService';

/**
 * Hook for fetching Moodle data
 */
export const useMoodle = () => {
  const [siteInfo, setSiteInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSiteInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moodleService.getSiteInfo();
      setSiteInfo(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch site info');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moodleService.getMyCourses();
      setCourses(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch courses');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    siteInfo,
    courses,
    loading,
    error,
    fetchSiteInfo,
    fetchCourses
  };
};

/**
 * Hook for course details
 */
export const useCourseDetail = (courseId) => {
  const [contents, setContents] = useState([]);
  const [grades, setGrades] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContents = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await moodleService.getCourseContents(courseId);
      setContents(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch course contents');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchGrades = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await moodleService.getCourseGrades(courseId);
      setGrades(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch grades');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchCompletion = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await moodleService.getCourseCompletion(courseId);
      setCompletion(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch completion status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Intentionally not including fetchContents in dependencies to avoid re-fetching loops
  // The caller can manually call fetchContents if needed
  useEffect(() => {
    if (courseId) {
      fetchContents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return {
    contents,
    grades,
    completion,
    loading,
    error,
    fetchContents,
    fetchGrades,
    fetchCompletion
  };
};

export default useMoodle;
