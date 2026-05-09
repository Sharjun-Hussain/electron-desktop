/**
 * Desktop Auth Utility
 * Handles authentication for the standalone Electron app using localStorage.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const desktopLogin = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Login failed");
    }

    const responseData = await res.json();
    const { user, auth_token, refresh_token } = responseData.data;

    // Save to localStorage
    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.profile_image,
        roles: (user.roles || []).map(r => r.name),
        permissions: (user.roles || []).flatMap(r => (r.permissions || []).map(p => p.name)),
        organization_id: user.organization_id,
        organization: user.organization || null,
        branches: user.branches || [],
        terms_accepted: user.terms_accepted,
      },
      accessToken: auth_token,
      refreshToken: refresh_token,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    localStorage.setItem('inzeedo_session', JSON.stringify(session));
    return { ok: true, session };
  } catch (error) {
    console.error("[DesktopAuth] Login Error:", error);
    return { ok: false, error: error.message };
  }
};

export const desktopLogout = () => {
  localStorage.removeItem('inzeedo_session');
  window.location.href = '/login';
};

export const getDesktopSession = () => {
  if (typeof window === 'undefined') return null;
  const sessionStr = localStorage.getItem('inzeedo_session');
  if (!sessionStr) return null;

  try {
    const session = JSON.parse(sessionStr);
    if (Date.now() > session.expires) {
      localStorage.removeItem('inzeedo_session');
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
};
