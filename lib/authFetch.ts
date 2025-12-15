export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("Unauthenticated")
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  // Auto logout on invalid token
  if (res.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("auth_user")
    window.location.href = "/"
    throw new Error("Session expired")
  }

  return res
}
