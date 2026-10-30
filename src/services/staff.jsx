import { axiosInstance } from "./axiosInstance";

export const getStaff = async (token) => {
  const response = await axiosInstance.get("/staff", {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createStaff = async (token, staffData) => {
  const response = await axiosInstance.post("/staff", staffData, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateStaff = async (token, id, staffData) => {
  const response = await axiosInstance.put(`/staff/${id}`, staffData, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteStaff = async (token, id) => {
  const response = await axiosInstance.delete(`/staff/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.data;
};
