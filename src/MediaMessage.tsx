import React from 'react';

interface MediaMessageProps {
    mediaUrl: string;
    timestamp: string;
    username: string;
}

const MediaMessage: React.FC<MediaMessageProps> = ({ mediaUrl, timestamp, username }) => {
    // Determine the media type based on file extension
    const getMediaType = (url: string) => {
        const extension = url.split('.').pop()?.toLowerCase();
        if (extension === 'mp4') {
            return 'video/mp4';
        } else if (extension === 'webm') {
            return 'video/webm';
        }
        return 'video/mp4'; // Default to mp4 if unknown
    };

    return (
        <div className="text-white w-full"> {/* Removed padding and margin around the message */}
            <div className="w-full flex justify-between">
                <span className="text-sm text-gray-400">{timestamp}</span>
                <strong className="text-blue-400">{username}</strong>
            </div>
            {/* Embed media file with padding only inside the video */}
            <div className="mt-2 p-2 bg-gray-800 rounded-md"> {/* Added minimal padding */}
                <video className="w-full" controls style={{ padding: '10px', backgroundColor: '#1c1c1c' }}>
                    <source src={mediaUrl} type={getMediaType(mediaUrl)} />
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
};

export default MediaMessage;
