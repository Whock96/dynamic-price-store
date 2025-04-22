
// Função para verificar se um usuário é administrador (por ID de tipo de usuário)
export const isAdministrador = (userTypeId: string): boolean => {
  return userTypeId === '548dae75-9f43-4dd5-a476-5996430c40b7';
};

// Função para verificar se um usuário é vendedor (por ID de tipo de usuário)
export const isVendedor = (userTypeId: string): boolean => {
  return userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
};
