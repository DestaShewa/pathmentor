import api from "./api";

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await api.put("/users/change-password", { currentPassword, newPassword });
  return res.data;
};

export default { changePassword };
