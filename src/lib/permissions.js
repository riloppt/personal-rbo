// Admin fixo: acesso total, ignora rbo_permissions.
export const ADMIN_EMAIL = 'sergio.henriques@gmail.com';

export const isAdmin = profile => profile?.email === ADMIN_EMAIL;

export const canManagePermissoes = profile => isAdmin(profile) || !!profile?.is_supervisor;

export const checkPermission = (profile, permissions, chave) => {
  if (isAdmin(profile)) return true;
  const perm = permissions.find(p => p.chave === chave);
  if (!perm) return false;
  return profile?.is_supervisor ? !!perm.ativo_supervisor : !!perm.ativo_normal;
};
