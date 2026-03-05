import http from "../api/http";

function saveSession(loginResponse) {
  localStorage.setItem("token", loginResponse.token);

  localStorage.setItem("session", JSON.stringify(loginResponse));
}
export function getPerfil() {
  return getSession()?.usuario?.perfil ?? null;
}


export function updatePerfilInStorage(perfilUpdated) {
  const session = getSession();
  if (!session) return;

  const next = {
    ...session,
    usuario: {
      ...session.usuario,
      perfil: {
        ...session.usuario.perfil,
        ...perfilUpdated,
      },
    },
  };

  localStorage.setItem("session", JSON.stringify(next));
}
export function updateUsuarioInStorage(usuarioUpdated) {
  const session = getSession();
  if (!session) return;

  const next = {
    ...session,
    usuario: {
      ...session.usuario,
      usuario: {
        ...session.usuario.usuario,
        ...usuarioUpdated,
      },
    },
  };

  localStorage.setItem("session", JSON.stringify(next));
}

export function getSession() {
  const s = localStorage.getItem("session");
  return s ? JSON.parse(s) : null;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  return getSession()?.usuario?.usuario ?? null;
}

export function getRole() {
  return getSession()?.usuario?.rol?.nombre ?? null;
}

export function isAuthenticated() {
  return !!getToken();
}

export async function login(identificador, password) {
  const { data } = await http.post("/v1/auth/login", { identificador, password });
  saveSession(data);
  return data;
}


export function getCartera() {
  return getSession()?.usuario?.cartera ?? null;
}


export function updateCarteraInStorage(cartera) {
  const s = getSession();
  if (!s?.usuario) return;

  const next = {
    ...s,
    usuario: {
      ...s.usuario,
      cartera: cartera ?? null,
    },
  };

  localStorage.setItem("session", JSON.stringify(next));
}

export async function logout() {
  try {
    await http.post("/v1/auth/logout");
  } catch (e) {
    console.log(e)
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
    window.location.replace("/login");
  }
}