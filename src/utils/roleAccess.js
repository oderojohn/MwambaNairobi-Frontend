export const normalizeRole = (role) => {
  if (!role) return '';

  const value = String(role).trim().toLowerCase();
  const aliases = {
    admins: 'admin',
    managers: 'manager',
    cashiers: 'cashier',
    waiters: 'waiter',
    barman: 'bartender',
    bartenders: 'bartender',
    inventory_clerk: 'storekeeper',
    inventoryclerk: 'storekeeper',
    store_keeper: 'storekeeper',
  };

  return aliases[value] || value;
};

export const POS_ACCESS_ROLES = ['admin', 'manager', 'supervisor', 'cashier', 'waiter', 'bartender'];
export const INVENTORY_ACCESS_ROLES = ['admin', 'manager'];

export const hasPosAccess = (role) => POS_ACCESS_ROLES.includes(normalizeRole(role));
export const hasInventoryAccess = (role) => INVENTORY_ACCESS_ROLES.includes(normalizeRole(role));

export const getDefaultRouteForRole = (role) =>
  hasInventoryAccess(role) ? '/inventory/dashboard' : '/';
