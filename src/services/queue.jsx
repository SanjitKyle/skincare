import { axiosInstance } from "./axiosInstance";

/**
 * 1. Issue a new queue token (Authenticated staff / reception)
 * POST /api/queue/issue
 */
export const issueQueueToken = async (tokenData, token) => {
  const config = token ? { headers: { authorization: `Bearer ${token}` } } : {};
  const response = await axiosInstance.post("/queue/issue", tokenData, config);
  return response.data;
};

/**
 * 2. Issue a token for walk-in patient (Self-service kiosk mode)
 * POST /api/queue/walk-in
 */
export const issueWalkInToken = async (tokenData) => {
  const response = await axiosInstance.post("/queue/walk-in", tokenData);
  return response.data;
};

/**
 * 3. Get doctor's live queue board (WAITING and IN_CONSULTATION tokens)
 * GET /api/queue/live/:doctorId?date=YYYY-MM-DD
 */
export const getLiveQueue = async (doctorId, date) => {
  const params = date ? { date } : {};
  const response = await axiosInstance.get(`/queue/live/${doctorId}`, { params });
  return response.data;
};

/**
 * 4. Advance or update token status
 * PATCH /api/queue/:id/status
 * Body: { status: 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED', notes }
 */
export const updateTokenStatus = async (id, statusData, token) => {
  const config = token ? { headers: { authorization: `Bearer ${token}` } } : {};
  const response = await axiosInstance.patch(`/queue/${id}/status`, statusData, config);
  return response.data;
};

/**
 * 5. List all tokens with filters (date, doctorId, status, page, limit)
 * GET /api/queue
 */
export const getQueueTokens = async (params = {}, token) => {
  const config = {
    params,
    ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
  };
  const response = await axiosInstance.get("/queue", config);
  return response.data;
};
