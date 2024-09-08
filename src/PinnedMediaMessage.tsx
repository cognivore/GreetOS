import React from 'react';
import { WatchZoneMediaFile, TimestampedMedia } from '../backend/server';
import { Socket } from 'socket.io-client';

interface PinnedMediaMessageProps {
    media: WatchZoneMediaFile;
    socket: Socket;
}

const PinnedMediaMessage: React.FC<PinnedMediaMessageProps> = ({ media, socket }) => {
    // useRef for the video element
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Handle playMedia and pauseMedia events
    const handlePlay = (mediaFile: WatchZoneMediaFile) => {
        console.log("Our media:", media, "Received media:", mediaFile);
        // Check that the media is the same as the pinned media
        if (mediaFile.dir === media.dir && mediaFile.file === media.file) {
            // Press play on the pinned media
            videoRef.current?.play();
        }
    };

    const handlePause = (mediaFile: WatchZoneMediaFile) => {
        console.log("|| :: Our media:", media, "Received media:", mediaFile);
        // Check that the media is the same as the pinned media
        if (mediaFile.dir === media.dir && mediaFile.file === media.file) {
            // Press pause on the pinned media
            videoRef.current?.pause();
        }
    };

    const handleSeek = ({ media: mediaFile, timestamp }: TimestampedMedia) => {
        console.log(`>>${timestamp}s :: Our media:`, media, "Received media:", mediaFile);
        // Check that the media is the same as the pinned media
        if (mediaFile.dir === media.dir && mediaFile.file === media.file) {
            // Press pause on the pinned media
            if (videoRef.current) {
                videoRef.current.currentTime = timestamp; // Set video to the new time
            }
        }
    };

    // useEffect to handle socket events
    React.useEffect(() => {
        // Listen for playMedia and pauseMedia events
        socket.on('playingNowPlay', handlePlay);
        socket.on('playingNowPause', handlePause);
        socket.on('playingNowSeek', handleSeek);
        return () => {
            // Clean up event listeners
            socket.off('playingNowPlay', handlePlay);
            socket.off('playingNowPause', handlePause);
            socket.off('playingNowSeek', handleSeek);
        };
    }, [socket, media]);

    const handlePlayEvent = () => {
        // Emit a playMedia event
        socket.emit('playMedia', media);
    };

    const handlePauseEvent = () => {
        // Emit a pauseMedia event
        socket.emit('pauseMedia', media);
    };

    const handleSeekEvent = () => {
        if (!videoRef.current) return;
        const currentTime = videoRef.current.currentTime;
        console.log(`Video seeked to: ${currentTime} seconds`);
        socket.emit('seekMedia', media, currentTime); // Emit the seekMedia event
    };

    // When the videoRef starts playing or is paused, emit playMedia and pauseMedia events, mentioning our media
    React.useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.addEventListener('play', handlePlayEvent);
            videoElement.addEventListener('pause', handlePauseEvent);
            videoElement.addEventListener('seeked', handleSeekEvent);
            return () => {
                videoElement.removeEventListener('play', handlePlayEvent);
                videoElement.removeEventListener('pause', handlePauseEvent);
                videoElement.removeEventListener('seeked', handleSeekEvent);
            };
        }
    }, [socket, media]);

    React.useEffect(() => {
        if (videoRef.current) {
            // Reload the video when the media source changes
            videoRef.current.load();
        }
    }, [media]);

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
            <video ref={videoRef} className="w-full h-auto rounded" controls>
                <source src={media.dir + '/' + media.file} type={getMediaType(media.file)} />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default React.memo(PinnedMediaMessage, (prevProps, nextProps) => {
    return prevProps.media.dir === nextProps.media.dir && prevProps.media.file === nextProps.media.file && prevProps.socket == nextProps.socket;
});
