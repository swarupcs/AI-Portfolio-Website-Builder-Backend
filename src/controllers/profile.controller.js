import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
//   console.log('userId', userId);

  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return new ApiResponse(
    200,
    { user },
    'User profile fetched successfully'
  ).send(res);
});
