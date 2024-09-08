import React from 'react';

interface PinnedMediaMessageProps {
    mediaUrl: string;
    timestamp: string;
    username: string;
}

const PinnedMediaMessage: React.FC<PinnedMediaMessageProps> = ({ mediaUrl, timestamp, username }) => {
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
        <div className="pinned-media bg-black w-full h-full p-4">
            <div className="flex justify-between mb-2 text-white">
                <strong className="text-blue-400">{username}</strong>
                <span className="text-sm text-gray-400">{timestamp}</span>
            </div>
            <video className="w-full h-auto rounded" controls>
                <source src={mediaUrl} type={getMediaType(mediaUrl)} />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default PinnedMediaMessage;
