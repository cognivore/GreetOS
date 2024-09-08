import React from 'react';

interface MediaFileListing {
    dir: string;
    files: string[];
}

interface MediaSelectorProps {
    mediaList: MediaFileListing[];
    onSelectMedia: (dir: string, file: string) => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({ mediaList, onSelectMedia }) => {
    console.log('MediaList:', mediaList);
    return (
        <div className="bg-gray-700 text-white w-full p-4">
            <h2 className="text-lg font-bold mb-4">Media Files</h2>
            {mediaList.map(({ dir, files }) => (
                <div key={dir} className="mb-4">
                    <h3 className="font-bold">{dir}</h3>
                    <ul className="space-y-2">
                        {files.map((file) => (
                            <li key={file}>
                                <button
                                    className="text-blue-400 hover:underline"
                                    onClick={() => onSelectMedia(dir, file)}
                                >
                                    {file}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default MediaSelector;
