import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or ANON KEY is not set in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

const readBackendError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.message || payload?.error || 'Backend request failed';
  } catch (error) {
    return 'Backend request failed';
  }
};

const postToBackend = async (path, body) => {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        data: null,
        error: { message: await readBackendError(response) },
      };
    }

    return {
      data: await response.json(),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'Backend unavailable' },
    };
  }
};

const buildUsername = (firstname, lastname, email) => {
  const username = [firstname, lastname].filter(Boolean).join(' ').trim();
  if (username) {
    return username;
  }

  return email?.split('@')[0] || '';
};

const getNameParts = (user, profile = {}) => {
  const firstname = profile.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || user?.firstName || '';
  const lastname = profile.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || user?.lastName || '';
  return { firstname, lastname };
};

const isConflictError = (message) => /already exists|conflict|duplicate/i.test(message || '');

const syncBackendUser = async (user, password, profile = {}) => {
  if (!user?.email || !password) {
    return { data: null, error: null };
  }

  const { firstname, lastname } = getNameParts(user, profile);
  const role = profile.role || user?.user_metadata?.role || user?.role || 'student';

  const payload = {
    firstname,
    lastname,
    email: user.email,
    password,
    role,
  };

  const createResult = await postToBackend('/api/auth/register', payload);

  if (!createResult.error) {
    return createResult;
  }

  if (isConflictError(createResult.error.message)) {
    return postToBackend('/api/auth/login', {
      email: user.email,
      password,
    });
  }

  return createResult;
};

const syncBackendPassword = async (email, currentPassword, password) => {
  if (!email || !password) {
    return { data: null, error: null };
  }

  if (currentPassword) {
    return postToBackend('/api/auth/change-password', {
      email,
      currentPassword,
      password,
    });
  }

  return postToBackend('/api/auth/reset-password', {
    email,
    password,
  });
};

export const syncSupabaseUserToBackend = syncBackendUser;
export const syncSupabasePasswordToBackend = syncBackendPassword;
