// Updated file content with safe parsing and validation

import React from 'react';
import { useDispatch } from 'react-redux';
import { postRide } from '../actions/rideActions';

const PostRide = () => {
    const dispatch = useDispatch();

    const handlePostRide = (data) => {
        const safeParseInt = (value) => {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? 0 : parsed;
        };

        const { userId, rideId, distance } = data;

        // Validate and parse numeric values safely before sending them to the API
        const validatedData = {
            userId: safeParseInt(userId),
            rideId: safeParseInt(rideId),
            distance: safeParseInt(distance)
        };

        dispatch(postRide(validatedData));
    };

    return (
        <div>
            {/* UI code for posting ride */}
        </div>
    );
};

export default PostRide;