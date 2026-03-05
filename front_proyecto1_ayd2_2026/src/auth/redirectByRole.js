export function getDashboardPathByRole(role) {
  const r = (role || "").toUpperCase();

  switch (r) {
    case "ADMIN":
      return "/app/admin";
    case "EDITOR":
      return "/app/editor";
    case "SUSCRIPTOR":
      return "/app/suscriptor";
    case "ANUNCIANTE":
      return "/app/anunciante";
    default:
      return "/app"; // fallback
  }
}